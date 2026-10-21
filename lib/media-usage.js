import { getDb } from './mongodb';
import { ASSET_PATH_MAP, resolveAssetPath } from './asset-paths';

const CONTENT_LABELS = { home: 'Homepage', about: 'Our Story', bespoke: 'Custom jewelry page', materialsSourcing: 'Craftsmanship', appointments: 'Book an appointment', bridal: 'Bridal page', shop: 'Shop page', global: 'Site-wide text', faq: 'FAQ', clientCare: 'Client care', sizeGuide: 'Size guide' };
const LEGACY_PATHS_BY_ASSET_ID = Object.entries(ASSET_PATH_MAP).reduce((pathsById, [legacyPath, assetPath]) => {
  const assetId = assetPath.match(/ast_[A-Za-z0-9_-]+/)?.[0];
  if (!assetId) return pathsById;
  pathsById.set(assetId, [...(pathsById.get(assetId) || []), legacyPath]);
  return pathsById;
}, new Map());

/**
 * Where an uploaded file is still used, as [{ label, href }] for the admin. `src` is the file's
 * address, e.g. /api/assets/ast_123. Matches on the asset id so absolute links count too.
 */
export async function findMediaUsageBySources(sources) {
  const sourceNeedles = new Map();
  for (const value of Array.isArray(sources) ? sources : []) {
    const src = String(value || '').trim();
    if (!src) continue;
    const resolved = resolveAssetPath(src) || src;
    const id = resolved.match(/ast_[A-Za-z0-9_-]+/)?.[0] || src.match(/ast_[A-Za-z0-9_-]+/)?.[0];
    sourceNeedles.set(src, [...new Set([src, resolved, id, ...(id ? LEGACY_PATHS_BY_ASSET_ID.get(id) || [] : [])].filter(Boolean))]);
  }
  if (!sourceNeedles.size) return {};
  const indexed = await findMediaUsageBySourcesIndexed([...sourceNeedles.keys()]);
  if (indexed) return indexed;
  const db = await getDb();
  const [products, collections, content, customPages, templates, instagram] = await Promise.all([
    db.collection('products').find({ status: { $ne: 'archived' } }, { projection: { title: 1, shortTitle: 1, images: 1 } }).toArray(),
    db.collection('catalogCollections').find({}, { projection: { name: 1, image: 1 } }).toArray(),
    db.collection('siteContent').find({}, { projection: { key: 1, title: 1, publishedPayload: 1, draftPayload: 1 } }).toArray(),
    db.collection('customPages').find({ status: { $ne: 'deleted' } }, { projection: { title: 1, sections: 1 } }).toArray(),
    db.collection('resourceTemplates').find({}, { projection: { resourceType: 1, key: 1, name: 1, draft: 1, published: 1 } }).toArray(),
    db.collection('instagramFeed').findOne({ _id: 'feed' }),
  ]);
  const usageBySource = Object.fromEntries([...sourceNeedles.keys()].map((src) => [src, []]));
  const addUsage = (value, label, href, category = 'other') => {
    const text = JSON.stringify(value || '');
    for (const [src, needles] of sourceNeedles) {
      if (needles.some((needle) => text.includes(needle))) usageBySource[src].push({ label, href, category });
    }
  };
  for (const product of products) {
    const productImages = (Array.isArray(product.images) ? product.images : []).map((image) => String(image || '').trim()).filter(Boolean);
    for (const [src, needles] of sourceNeedles) {
      const referencesSource = productImages.some((image) => {
        const resolvedImage = resolveAssetPath(image) || image;
        const assetId = resolvedImage.match(/ast_[A-Za-z0-9_-]+/)?.[0] || image.match(/ast_[A-Za-z0-9_-]+/)?.[0];
        return needles.includes(image) || needles.includes(resolvedImage) || Boolean(assetId && needles.includes(assetId));
      });
      if (referencesSource) usageBySource[src].push({ productId: product._id?.toString?.() || product.id, label: `Product: ${product.shortTitle || product.title}`, href: `/admin/products/${product._id}`, category: 'product-media' });
    }
  }
  for (const collection of collections) addUsage(collection.image, `Collection: ${collection.name}`, `/admin/collections/${collection._id}`);
  for (const page of content) {
    const liveText = JSON.stringify(page.publishedPayload || '');
    const draftText = JSON.stringify(page.draftPayload || '');
    for (const [src, needles] of sourceNeedles) {
      const live = needles.some((needle) => liveText.includes(needle));
      const draft = needles.some((needle) => draftText.includes(needle));
      if (live || draft) usageBySource[src].push({ label: `${CONTENT_LABELS[page.key] || page.title || page.key}${live ? '' : ' (unpublished draft)'}`, href: `/admin/content/${page.key}`, category: 'other' });
    }
  }
  for (const page of customPages) addUsage(page.sections, `Page: ${page.title}`, `/admin/content/pages/${page._id}`);
  for (const template of templates) {
    const editorHref = `/admin/editor/templates/${template.resourceType}/${template.key}`;
    const templateName = template.name || template.key;
    addUsage(template.draft?.sections, `Template: ${templateName} (draft)`, editorHref);
    addUsage(template.published?.sections, `Template: ${templateName} (published)`, editorHref);
  }
  if (instagram) addUsage(instagram.posts, 'Instagram feed', '/admin/instagram');
  return usageBySource;
}

export async function ensureMediaUsageIndexes() {
  const db = await getDb();
  // Inverted index for cheap existence checks without JSON.stringify scan; rebuilt on demand.
  await db.collection('mediaUsage').createIndex({ assetId: 1 }, { name: 'media_usage_asset' }).catch(() => {});
  await db.collection('mediaUsage').createIndex({ 'usages.category': 1 }, { name: 'media_usage_category' }).catch(() => {});
  return { mediaUsage: 'mediaUsage' };
}

/** Try indexed mediaUsage first; fall back to JSON-stringify scan when index is empty/stale. */
export async function findMediaUsageBySourcesIndexed(sources) {
  try {
    const db = await getDb();
    const ids = [...new Set((Array.isArray(sources) ? sources : []).map((s) => {
      const raw = String(s || '').trim();
      return raw.match(/ast_[A-Za-z0-9_-]+/)?.[0] || '';
    }).filter(Boolean))];
    if (!ids.length) return null;
    const rows = await db.collection('mediaUsage').find({ assetId: { $in: ids } }).toArray();
    if (!rows.length) return null;
    const byId = new Map(rows.map((r) => [r.assetId, r.usages || []]));
    const out = {};
    for (const src of sources) {
      const id = String(src || '').match(/ast_[A-Za-z0-9_-]+/)?.[0] || '';
      out[src] = id ? (byId.get(id) || []) : [];
    }
    return out;
  } catch {
    return null;
  }
}

export async function findMediaUsage(src) {
  const usageBySource = await findMediaUsageBySources([src]);
  return usageBySource[String(src || '').trim()] || [];
}
