import { getCollections, getProductsBySlugs, getProductsForBulkEdit, productInputSchema, saveProduct, slugify } from './catalog';

export const MAX_IMPORT_ROWS = 500;
export const MAX_BULK_EDIT_ROWS = 250;

const STATUS_WORDS = { published: 'published', active: 'published', live: 'published', draft: 'draft', archived: 'archived', archive: 'archived' };

function parsePrice(value) {
  const cleaned = String(value ?? '').replace(/[$,\s]/g, '');
  return cleaned === '' ? NaN : Number(cleaned);
}

function splitImages(value) {
  return String(value || '').split(/[|\n]+/).map((item) => item.trim()).filter(Boolean);
}

function firstIssue(error) {
  return error.issues.map((issue) => issue.message);
}

/**
 * Validates spreadsheet rows against the catalog. Rows are matched to existing products by URL slug
 * (or the slug their title would produce); matches become updates, everything else is created.
 */
export async function planProductImport(rawRows) {
  const rows = Array.isArray(rawRows) ? rawRows.slice(0, MAX_IMPORT_ROWS) : [];
  const collections = await getCollections();
  const collectionBySlug = new Map(collections.map((item) => [item.slug.toLowerCase(), item.slug]));
  const collectionByName = new Map(collections.map((item) => [String(item.name).toLowerCase(), item.slug]));

  const slugs = rows.map((row) => slugify(String(row.slug || row.title || '')));
  const existing = new Map((await getProductsBySlugs([...new Set(slugs.filter(Boolean))])).map((product) => [product.slug, product]));
  const seen = new Set();

  return rows.map((row, index) => {
    const errors = [];
    const slug = slugs[index];
    const current = existing.get(slug);
    const collectionKey = String(row.collection || '').trim().toLowerCase();
    const category = collectionKey ? collectionBySlug.get(collectionKey) || collectionByName.get(collectionKey) : current?.category;
    if (collectionKey && !category) errors.push(`Unknown collection “${row.collection}”.`);

    const statusKey = String(row.status || '').trim().toLowerCase();
    const status = statusKey ? STATUS_WORDS[statusKey] : current?.status || 'draft';
    if (statusKey && !status) errors.push(`Status must be Draft, Published, or Archived (got “${row.status}”).`);

    const priceGiven = row.price !== undefined && String(row.price).trim() !== '';
    const price = priceGiven ? parsePrice(row.price) : current?.variants?.[0]?.price ?? current?.price;
    if (Number.isNaN(price)) errors.push(`Price “${row.price}” is not a number.`);

    const images = row.images !== undefined && String(row.images).trim() !== '' ? splitImages(row.images) : current?.images || [];
    const pick = (field) => (row[field] !== undefined && String(row[field]).trim() !== '' ? String(row[field]).trim() : current?.[field] ?? '');

    const data = {
      ...(current ? { id: current.id, version: current.version } : {}),
      title: pick('title'),
      slug,
      // A non-numeric price is already reported above; 0 keeps the schema from repeating it.
      price: Number.isNaN(price) ? 0 : price,
      category: category || '',
      metal: pick('metal'),
      stone: pick('stone') || 'Natural Diamond',
      caratWeight: pick('caratWeight'),
      description: pick('description'),
      status: status || 'draft',
      images,
    };
    if (row.shortTitle !== undefined && String(row.shortTitle).trim() !== '') data.shortTitle = String(row.shortTitle).trim();
    // Without a price in the file, keep every metal option exactly as it is.
    if (!priceGiven && current) data.variants = current.variants.map(({ id, title, price: optionPrice, sku, barcode }) => ({ id, title, price: optionPrice, sku: sku || '', barcode: barcode || '' }));

    if (!slug) errors.push('Add a title.');
    else if (seen.has(slug)) errors.push('This product appears more than once in the file.');
    seen.add(slug);

    const parsed = productInputSchema.safeParse(data);
    if (!parsed.success) errors.push(...firstIssue(parsed.error).filter((issue) => !(collectionKey && !category && issue === 'Choose a collection.')));

    return {
      row: index + 2,
      title: data.title,
      slug,
      collection: category || '',
      price: Number.isFinite(price) ? price : null,
      status: data.status,
      imageCount: images.length,
      action: errors.length ? 'error' : current ? 'update' : 'create',
      errors: [...new Set(errors)],
      data: parsed.success ? parsed.data : null,
    };
  });
}

export async function commitProductImport(rawRows) {
  const plan = await planProductImport(rawRows);
  const results = [];
  for (const item of plan) {
    if (item.action === 'error') { results.push({ row: item.row, status: 'skipped', errors: item.errors }); continue; }
    try {
      await saveProduct(item.data);
      results.push({ row: item.row, status: item.action === 'update' ? 'updated' : 'created' });
    } catch (error) {
      results.push({ row: item.row, status: 'failed', errors: [error.code === 11000 ? 'A product with this URL slug already exists.' : error.message] });
    }
  }
  return {
    created: results.filter((item) => item.status === 'created').length,
    updated: results.filter((item) => item.status === 'updated').length,
    skipped: results.filter((item) => item.status === 'skipped' || item.status === 'failed').length,
    results,
  };
}

const EDITABLE_FIELDS = ['title', 'shortTitle', 'price', 'category', 'status', 'metal', 'stone', 'caratWeight', 'description', 'shippingText', 'careText', 'detailsExtra'];

/** Applies spreadsheet edits: `changes` is [{ id, version, fields: { title, price, … } }]. */
export async function saveBulkProductEdits(changes) {
  const list = (Array.isArray(changes) ? changes : []).slice(0, MAX_BULK_EDIT_ROWS);
  const currentById = new Map((await getProductsForBulkEdit(list.map((item) => item.id))).map((product) => [product.id, product]));
  const results = [];
  for (const change of list) {
    const current = currentById.get(change.id);
    if (!current) { results.push({ id: change.id, ok: false, errors: ['Product not found.'] }); continue; }
    if ((Number(change.version) || 0) !== (current.version || 0)) {
      results.push({ id: change.id, ok: false, errors: ['Someone else changed this product. Reload and try again.'] });
      continue;
    }
    const fields = Object.fromEntries(Object.entries(change.fields || {}).filter(([field]) => EDITABLE_FIELDS.includes(field)));
    const data = {
      id: current.id,
      version: current.version,
      title: current.title,
      shortTitle: current.shortTitle && current.shortTitle !== current.title ? current.shortTitle : '',
      slug: current.slug,
      price: current.price,
      category: current.category,
      metal: current.metal,
      stone: current.stone,
      caratWeight: current.caratWeight || '',
      description: current.description,
      status: current.status,
      images: current.images,
      shippingText: current.shippingText || '',
      careText: current.careText || '',
      detailsExtra: current.detailsExtra || '',
      ...fields,
    };
    // Price edits apply to the first metal option; otherwise every option is kept as it is.
    if (!('price' in fields)) {
      data.price = current.variants?.[0]?.price ?? current.price;
      data.variants = current.variants.map(({ id, title, price, sku, barcode }) => ({ id, title, price, sku: sku || '', barcode: barcode || '' }));
    }
    const parsed = productInputSchema.safeParse(data);
    if (!parsed.success) { results.push({ id: change.id, ok: false, errors: firstIssue(parsed.error) }); continue; }
    try {
      const saved = await saveProduct(parsed.data);
      results.push({ id: change.id, ok: true, version: saved.version });
    } catch (error) {
      results.push({ id: change.id, ok: false, errors: [error.message] });
    }
  }
  return results;
}
