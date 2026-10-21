import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { categories, products as staticProducts } from '../data/products.js';
import { resolveAssetPath, resolveAssetPaths } from './asset-paths';
import { variantId, withOptions } from './product-variants';
import { getDb } from './mongodb';

const PRODUCT_COLLECTION = 'products';
const CATEGORY_COLLECTION = 'catalogCollections';

const statusSchema = z.enum(['draft', 'published', 'archived']);

export const collectionInputSchema = z.object({
  id: z.string().optional(),
  version: z.coerce.number().int().nonnegative().optional(),
  name: z.string().trim().min(2, 'Collection name must be at least 2 characters.').max(120),
  slug: z.string().trim().max(120).optional().default(''),
  image: z.string().trim().min(1, 'Add a hero image path or URL.').max(500),
  note: z.string().trim().min(4, 'Add a short collection note.').max(240),
  sortOrder: z.coerce.number().int().min(0).max(999),
  status: statusSchema,
  seoTitle: z.string().trim().max(180).optional().default(''),
  seoDescription: z.string().trim().max(320).optional().default(''),
});

export const productInputSchema = z.object({
  id: z.string().optional(),
  version: z.coerce.number().int().nonnegative().optional(),
  title: z.string().trim().min(2, 'Title must be at least 2 characters.').max(180),
  shortTitle: z.string().trim().max(120).optional(),
  slug: z.string().trim().max(180).optional().default(''),
  price: z.coerce.number().finite().nonnegative('Price cannot be negative.').max(10000000),
  category: z.string().trim().min(1, 'Choose a collection.'),
  metal: z.string().trim().min(2, 'Add a metal.').max(80),
  stone: z.string().trim().min(2, 'Add a stone.').max(120),
  caratWeight: z.string().trim().max(20).optional().default(''),
  description: z.string().trim().min(20, 'Description must be at least 20 characters.').max(3000),
  status: statusSchema,
  images: z.array(z.string().trim().min(1)).min(1, 'Add at least one image.'),
  variants: z.array(z.object({
    id: z.string().trim().max(80).optional().default(''),
    title: z.string().trim().min(1, 'Name each metal option.').max(80),
    price: z.coerce.number({ message: 'Enter a price for every metal option.' }).finite('Enter a price for every metal option.').nonnegative('Prices cannot be negative.').max(10000000),
    sku: z.string().trim().max(80).optional().default(''),
    barcode: z.string().trim().max(80).optional().default(''),
  })).min(1, 'Add at least one metal option.').max(12).optional(),
  sizeOption: z.object({ enabled: z.boolean(), label: z.string().trim().max(40).optional().default('Ring size'), values: z.array(z.string().trim().min(1).max(12)).max(60).optional().default([]) }).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  seoTitle: z.string().trim().max(180).optional(),
  seoDescription: z.string().trim().max(320).optional(),
  madeToOrder: z.boolean().optional(),
  // Optional per-product wording for the product page sections; empty uses the store-wide text.
  // 'enquire' = catalogue piece with no price: shoppers send an enquiry instead of buying.
  saleMode: z.enum(['buy', 'enquire']).optional(),
  // Product page sections hidden for this product: 'details', 'care', 'shipping'.
  hiddenSections: z.array(z.enum(['details', 'care', 'shipping'])).optional(),
  detailsExtra: z.string().trim().max(1500).optional(),
  careText: z.string().trim().max(3000).optional(),
  shippingText: z.string().trim().max(3000).optional(),
});

export function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function asObjectId(value) {
  return typeof value === 'string' && ObjectId.isValid(value) ? new ObjectId(value) : null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function serializeProduct(product) {
  if (!product) return null;

  return withOptions({
    ...product,
    id: product._id?.toString() || product.id,
    _id: undefined,
    price: Number(product.priceCents || 0) / 100,
    priceCents: product.priceCents || 0,
    images: resolveAssetPaths(product.images),
    variants: (product.variants || []).map((variant) => ({
      ...variant,
      id: variant.id?.toString?.() || variant.id,
    })),
  });
}

/**
 * Merges submitted metal options with stored ones, keeping each option's stock. Without submitted
 * options (bulk edit, import), the first option takes the submitted price.
 */
function mergeVariants(existing, submitted, price, slug) {
  const current = existing?.length ? existing : [];
  if (!submitted) {
    if (!current.length) return [{ id: '14kt', title: '14kt Gold', sku: `${slug.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-14K`, barcode: '', priceCents: Math.round(price * 100), quantity: 0, lowStockThreshold: 1, active: true }];
    return current.map((variant, index) => (index === 0 ? { ...variant, priceCents: Math.round(price * 100) } : variant));
  }
  const used = new Set();
  return submitted.map((variant) => {
    let id = variant.id || variantId(variant.title);
    while (used.has(id)) id = `${id}-2`;
    used.add(id);
    const previous = current.find((item) => item.id === id) || {};
    return {
      id,
      title: variant.title,
      sku: variant.sku,
      barcode: variant.barcode,
      priceCents: Math.round(variant.price * 100),
      quantity: Number(previous.quantity || 0),
      lowStockThreshold: Number(previous.lowStockThreshold ?? 1),
      active: true,
    };
  });
}

export function serializeCollection(collection) {
  if (!collection) return null;
  return {
    ...collection,
    id: collection._id?.toString() || collection.id,
    _id: undefined,
    image: resolveAssetPath(collection.image),
  };
}

export async function ensureCatalogIndexes() {
  const db = await getDb();
  await db.collection(PRODUCT_COLLECTION).createIndex({ slug: 1 }, { unique: true, name: 'products_slug_unique' });
  await db.collection(PRODUCT_COLLECTION).createIndex({ status: 1, updatedAt: -1 }, { name: 'products_status_updated' });
  await db.collection(PRODUCT_COLLECTION).createIndex({ category: 1, status: 1 }, { name: 'products_category_status' });
  await db.collection(CATEGORY_COLLECTION).createIndex({ slug: 1 }, { unique: true, name: 'collections_slug_unique' });
  return { products: PRODUCT_COLLECTION, collections: CATEGORY_COLLECTION };
}

export async function getCatalogStats() {
  const db = await getDb();
  const collection = db.collection(PRODUCT_COLLECTION);
  const [total, published, drafts, archived, collections] = await Promise.all([
    collection.countDocuments(),
    collection.countDocuments({ status: 'published' }),
    collection.countDocuments({ status: 'draft' }),
    collection.countDocuments({ status: 'archived' }),
    db.collection(CATEGORY_COLLECTION).countDocuments(),
  ]);
  return { total, published, drafts, archived, collections };
}

export async function listProducts({ query = '', status = 'all', category = '', page = 1, pageSize = 20 } = {}) {
  const db = await getDb();
  const filter = {};
  if (category) filter.category = String(category).trim().slice(0, 120);
  const normalizedQuery = String(query).trim();

  if (normalizedQuery) {
    const expression = new RegExp(escapeRegExp(normalizedQuery), 'i');
    filter.$or = [{ title: expression }, { slug: expression }, { metal: expression }, { stone: expression }, { tags: expression }, { 'variants.sku': expression }];
  }

  if (status !== 'all' && statusSchema.safeParse(status).success) filter.status = status;

  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 20));
  const [items, total] = await Promise.all([
    db.collection(PRODUCT_COLLECTION)
      .find(filter)
      .sort({ updatedAt: -1, _id: -1 })
      .skip((safePage - 1) * safePageSize)
      .limit(safePageSize)
      .toArray(),
    db.collection(PRODUCT_COLLECTION).countDocuments(filter),
  ]);

  return {
    items: items.map(serializeProduct),
    total,
    page: safePage,
    pageSize: safePageSize,
    pages: Math.max(1, Math.ceil(total / safePageSize)),
  };
}

export async function getProductById(id) {
  const objectId = asObjectId(id);
  if (!objectId) return null;
  const db = await getDb();
  return serializeProduct(await db.collection(PRODUCT_COLLECTION).findOne({ _id: objectId }));
}

/** Products for the bulk editor: the given ids, or every non-archived product when none are given. */
export async function getProductsForBulkEdit(ids = []) {
  const db = await getDb();
  const objectIds = ids.map(asObjectId).filter(Boolean);
  const filter = objectIds.length ? { _id: { $in: objectIds } } : { status: { $ne: 'archived' } };
  const items = await db.collection(PRODUCT_COLLECTION).find(filter).sort({ updatedAt: -1, _id: -1 }).limit(250).toArray();
  return items.map(serializeProduct);
}

export async function getProductsBySlugs(slugs) {
  if (!slugs.length) return [];
  const db = await getDb();
  const items = await db.collection(PRODUCT_COLLECTION).find({ slug: { $in: slugs } }).toArray();
  return items.map(serializeProduct);
}

export async function getCollections() {
  const db = await getDb();
  const items = await db.collection(CATEGORY_COLLECTION).find({ status: { $ne: 'archived' } }).sort({ sortOrder: 1, name: 1 }).toArray();
  return items.map(serializeCollection);
}

/** Products per collection slug: { [slug]: { total, published } }, ignoring archived products. */
export async function countProductsByCollection(slugs = [], { includeArchived = false } = {}) {
  if (!slugs.length) return {};
  const db = await getDb();
  const rows = await db.collection(PRODUCT_COLLECTION).aggregate([
    { $match: { category: { $in: slugs }, ...(includeArchived ? {} : { status: { $ne: 'archived' } }) } },
    { $group: { _id: '$category', total: { $sum: 1 }, published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } } } },
  ]).toArray();
  return Object.fromEntries(rows.map((row) => [row._id, { total: row.total, published: row.published }]));
}

export async function listCollections({ query = '', status = 'all', page = 1, pageSize = 20 } = {}) {
  const db = await getDb();
  const filter = {};
  const normalizedQuery = String(query).trim();
  if (normalizedQuery) {
    const expression = new RegExp(escapeRegExp(normalizedQuery), 'i');
    filter.$or = [{ name: expression }, { slug: expression }, { note: expression }];
  }
  if (status !== 'all' && statusSchema.safeParse(status).success) filter.status = status;

  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 20));
  const [items, total] = await Promise.all([
    db.collection(CATEGORY_COLLECTION).find(filter).sort({ sortOrder: 1, updatedAt: -1, _id: -1 }).skip((safePage - 1) * safePageSize).limit(safePageSize).toArray(),
    db.collection(CATEGORY_COLLECTION).countDocuments(filter),
  ]);

  return {
    items: items.map(serializeCollection),
    total,
    page: safePage,
    pageSize: safePageSize,
    pages: Math.max(1, Math.ceil(total / safePageSize)),
  };
}

export async function getCollectionById(id) {
  const objectId = asObjectId(id);
  if (!objectId) return null;
  const db = await getDb();
  return serializeCollection(await db.collection(CATEGORY_COLLECTION).findOne({ _id: objectId }));
}

export async function saveCollection(input) {
  const parsed = collectionInputSchema.parse(input);
  const db = await getDb();
  const collection = db.collection(CATEGORY_COLLECTION);
  const now = new Date();
  const slug = slugify(parsed.slug || parsed.name);
  const base = {
    type: 'category',
    name: parsed.name,
    slug,
    image: parsed.image,
    note: parsed.note,
    sortOrder: parsed.sortOrder,
    status: parsed.status,
    seoTitle: parsed.seoTitle || '',
    seoDescription: parsed.seoDescription || '',
    updatedAt: now,
    updatedBy: 'local-preview',
  };

  if (!parsed.id) {
    const document = { ...base, version: 1, createdAt: now, createdBy: 'local-preview' };
    const result = await collection.insertOne(document);
    return serializeCollection({ ...document, _id: result.insertedId });
  }

  const objectId = asObjectId(parsed.id);
  if (!objectId) throw new Error('Invalid collection id.');
  const existing = await collection.findOne({ _id: objectId });
  if (!existing) throw new Error('Collection not found.');
  if (existing.slug !== slug) {
    const productCount = await db.collection(PRODUCT_COLLECTION).countDocuments({ category: existing.slug });
    if (productCount > 0) {
      const error = new Error('This collection has products. Keep its URL slug stable or move those products first.');
      error.code = 'COLLECTION_SLUG_LOCKED';
      throw error;
    }
  }

  const filter = { _id: objectId };
  if (typeof parsed.version === 'number') filter.version = parsed.version;
  const result = await collection.updateOne(filter, { $set: base, $inc: { version: 1 } });
  if (result.matchedCount !== 1) {
    const error = new Error('This collection changed in another session. Reload before saving.');
    error.code = 'VERSION_CONFLICT';
    throw error;
  }
  return getCollectionById(parsed.id);
}

export async function archiveCollection(id, version) {
  const objectId = asObjectId(id);
  if (!objectId) throw new Error('Invalid collection id.');
  const db = await getDb();
  const filter = { _id: objectId };
  if (typeof version === 'number') filter.version = version;
  const result = await db.collection(CATEGORY_COLLECTION).updateOne(filter, {
    $set: { status: 'archived', updatedAt: new Date(), updatedBy: 'local-preview', archiveReason: 'Archived from admin preview.' },
    $inc: { version: 1 },
  });
  if (result.matchedCount !== 1) {
    const error = new Error('This collection changed in another session. Reload before archiving.');
    error.code = 'VERSION_CONFLICT';
    throw error;
  }
}

export async function saveProduct(input) {
  const parsed = productInputSchema.parse(input);
  const db = await getDb();
  const now = new Date();
  const slug = slugify(parsed.slug || parsed.title);
  const collection = db.collection(PRODUCT_COLLECTION);
  const stored = parsed.id && asObjectId(parsed.id) ? await collection.findOne({ _id: asObjectId(parsed.id) }) : null;
  const existingVariants = stored ? serializeProduct(stored).variants : [];
  const variants = mergeVariants(existingVariants, parsed.variants, parsed.price, slug);
  const base = {
    title: parsed.title,
    slug,
    priceCents: Math.min(...variants.map((variant) => variant.priceCents)),
    variants,
    currency: 'USD',
    category: parsed.category,
    collectionIds: [parsed.category],
    metal: parsed.metal,
    stone: parsed.stone,
    caratWeight: parsed.caratWeight,
    description: parsed.description,
    status: parsed.status,
    images: parsed.images,
    updatedAt: now,
    updatedBy: 'local-preview',
  };
  // Updates keep the existing featured flag and tags; the card title only changes when the caller sends one
  // (an empty card title means "use the full title").
  if (parsed.shortTitle !== undefined) base.shortTitle = parsed.shortTitle || parsed.title;
  for (const field of ['sizeOption', 'tags', 'seoTitle', 'seoDescription', 'madeToOrder', 'detailsExtra', 'careText', 'shippingText', 'hiddenSections', 'saleMode']) {
    if (parsed[field] !== undefined) base[field] = parsed[field];
  }

  if (!parsed.id) {
    const document = {
      featured: false,
      tags: [],
      madeToOrder: true,
      ...base,
      shortTitle: parsed.shortTitle || parsed.title,
      version: 1,
      createdAt: now,
      createdBy: 'local-preview',
      publishedAt: parsed.status === 'published' ? now : null,
    };
    const result = await collection.insertOne(document);
    return serializeProduct({ ...document, _id: result.insertedId });
  }

  const objectId = asObjectId(parsed.id);
  if (!objectId) throw new Error('Invalid product id.');
  const filter = { _id: objectId };
  if (typeof parsed.version === 'number') filter.version = parsed.version;
  const update = { $set: base, $inc: { version: 1 } };
  if (parsed.status === 'published') update.$set.publishedAt = now;
  const result = await collection.updateOne(filter, update);
  if (result.matchedCount !== 1) {
    const error = new Error('This product changed in another session. Reload before saving.');
    error.code = 'VERSION_CONFLICT';
    throw error;
  }
  return getProductById(parsed.id);
}

export async function bulkSetProductStatus(ids, status) {
  if (!statusSchema.safeParse(status).success) throw new Error('Invalid status.');
  const objectIds = (Array.isArray(ids) ? ids : []).map(asObjectId).filter(Boolean);
  if (!objectIds.length) return { matched: 0 };
  const db = await getDb();
  const now = new Date();
  const set = { status, updatedAt: now, updatedBy: 'local-preview' };
  if (status === 'published') set.publishedAt = now;
  const result = await db.collection(PRODUCT_COLLECTION).updateMany(
    { _id: { $in: objectIds } },
    { $set: set, $inc: { version: 1 } }
  );
  return { matched: result.matchedCount };
}

export async function archiveProduct(id, version) {
  const objectId = asObjectId(id);
  if (!objectId) throw new Error('Invalid product id.');
  const db = await getDb();
  const filter = { _id: objectId };
  if (typeof version === 'number') filter.version = version;
  const result = await db.collection(PRODUCT_COLLECTION).updateOne(filter, {
    $set: { status: 'archived', updatedAt: new Date(), updatedBy: 'local-preview', archiveReason: 'Archived from admin preview.' },
    $inc: { version: 1 },
  });
  if (result.matchedCount !== 1) {
    const error = new Error('This product changed in another session. Reload before archiving.');
    error.code = 'VERSION_CONFLICT';
    throw error;
  }
}

export async function seedCatalog({ dryRun = false } = {}) {
  const now = new Date();
  const operations = [];

  for (const category of categories) {
    operations.push({
      updateOne: {
        filter: { slug: category.slug },
        update: {
          $set: { ...category, type: 'category', status: 'published', updatedAt: now },
          $setOnInsert: { createdAt: now, version: 1 },
        },
        upsert: true,
      },
    });
  }

  for (const product of staticProducts) {
    const slug = slugify(product.slug);
    operations.push({
      updateOne: {
        filter: { slug },
        update: {
          $set: {
            title: product.title,
            shortTitle: product.shortTitle,
            slug,
            priceCents: Math.round(product.price * 100),
            currency: 'USD',
            category: product.category,
            collectionIds: [product.category],
            metal: product.metal,
            stone: product.stone,
            images: product.images,
            description: product.description,
            status: 'published',
            source: 'static-seed',
            updatedAt: now,
            publishedAt: now,
          },
          $setOnInsert: {
            variants: [{ id: 'default', sku: `${slug.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-DEFAULT`, priceCents: Math.round(product.price * 100), quantity: 0, lowStockThreshold: 1, active: true }],
            version: 1,
            createdAt: now,
            createdBy: 'seed',
          },
        },
        upsert: true,
      },
    });
  }

  if (dryRun) return { dryRun: true, operations: operations.length, products: staticProducts.length, collections: categories.length };
  const db = await getDb();
  const result = await db.collection(PRODUCT_COLLECTION).bulkWrite(operations.slice(categories.length), { ordered: false });
  await db.collection(CATEGORY_COLLECTION).bulkWrite(operations.slice(0, categories.length), { ordered: false });
  return { dryRun: false, operations: operations.length, products: staticProducts.length, collections: categories.length, upserted: result.upsertedCount };
}
