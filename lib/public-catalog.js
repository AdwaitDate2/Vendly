import { categories as staticCategories, products as rawStaticProducts } from '../data/products.js';
import { withOptions } from './product-variants.js';

const staticProducts = rawStaticProducts.map(withOptions);
import { getDb } from './mongodb';
import { listProducts, serializeProduct } from './catalog';

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function usesMongoCatalog() {
  return process.env.CATALOG_SOURCE === 'mongodb' || Boolean(process.env.MONGODB_URI);
}

function staticProductsFor({ query = '', category = '' } = {}) {
  const normalizedQuery = String(query).trim().toLowerCase();
  const normalizedCategory = String(category).trim().toLowerCase();
  return staticProducts.filter((product) => {
    if (normalizedCategory && product.category !== normalizedCategory) return false;
    if (!normalizedQuery) return true;
    return [product.title, product.shortTitle, product.category, product.metal, product.stone, product.description]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);
  });
}

function staticCollectionsFor(query = '') {
  const normalizedQuery = String(query).trim().toLowerCase();
  return staticCategories.filter((collection) => !normalizedQuery || [collection.name, collection.slug, collection.note].join(' ').toLowerCase().includes(normalizedQuery));
}

export async function getPublicCollections() {
  if (!usesMongoCatalog()) return staticCategories;
  try {
    const db = await getDb();
    const collections = await db.collection('catalogCollections').find({ status: 'published' }).sort({ sortOrder: 1, name: 1 }).limit(100).toArray();
    return collections.map((collection) => ({ slug: collection.slug, name: collection.name, image: collection.image, note: collection.note }));
  } catch {
    return staticCategories;
  }
}

export async function getPublicProducts({ query = '', category = '' } = {}) {
  if (!usesMongoCatalog()) return { products: staticProductsFor({ query, category }), categories: staticCategories };
  try {
    const db = await getDb();
    const filter = { status: 'published' };
    const normalizedQuery = String(query).trim().slice(0, 80);
    if (category) filter.category = String(category).trim().slice(0, 80);
    if (normalizedQuery) {
      const expression = new RegExp(escapeRegExp(normalizedQuery), 'i');
      filter.$or = [{ title: expression }, { shortTitle: expression }, { slug: expression }, { metal: expression }, { stone: expression }, { description: expression }];
    }
    const [products, collections] = await Promise.all([
      db.collection('products').find(filter).sort({ featured: -1, updatedAt: -1, _id: -1 }).limit(100).toArray(),
      getPublicCollections(),
    ]);
    return { products: products.map(serializeProduct), categories: collections };
  } catch {
    return { products: staticProductsFor({ query, category }), categories: staticCategories };
  }
}

export async function searchPublicCatalog(query) {
  const normalizedQuery = String(query || '').trim().slice(0, 80);
  if (!normalizedQuery) return { products: [], collections: [] };
  if (!usesMongoCatalog()) return { products: staticProductsFor({ query: normalizedQuery }), collections: staticCollectionsFor(normalizedQuery) };
  try {
    const db = await getDb();
    const expression = new RegExp(escapeRegExp(normalizedQuery), 'i');
    const [products, collections] = await Promise.all([
      db.collection('products').find({ status: 'published', $or: [{ title: expression }, { shortTitle: expression }, { slug: expression }, { metal: expression }, { stone: expression }, { description: expression }] }).sort({ featured: -1, updatedAt: -1, _id: -1 }).limit(50).toArray(),
      db.collection('catalogCollections').find({ status: 'published', $or: [{ name: expression }, { slug: expression }, { note: expression }] }).sort({ sortOrder: 1, name: 1 }).limit(20).toArray(),
    ]);
    return {
      products: products.map(serializeProduct),
      collections: collections.map((collection) => ({ slug: collection.slug, name: collection.name, image: collection.image, note: collection.note })),
    };
  } catch {
    return { products: staticProductsFor({ query: normalizedQuery }), collections: staticCollectionsFor(normalizedQuery) };
  }
}

export async function getPublicCatalog() {
  if (!usesMongoCatalog()) return { categories: staticCategories, products: staticProducts };

  try {
    const db = await getDb();
    const [collections, productResult] = await Promise.all([
      db.collection('catalogCollections').find({ status: 'published' }).sort({ sortOrder: 1, name: 1 }).toArray(),
      listProducts({ status: 'published', pageSize: 100 }),
    ]);

    return {
      categories: collections.map((collection) => ({ slug: collection.slug, name: collection.name, image: collection.image, note: collection.note })),
      products: productResult.items,
    };
  } catch {
    return { categories: staticCategories, products: staticProducts };
  }
}

export async function getPublicCollection(slug) {
  const getStatic = () => {
    const category = staticCategories.find((item) => item.slug === slug);
    if (!category) return null;
    let products = staticProducts.filter((item) => item.category === slug);
    if (slug === 'traditional-reimagined' && products.length === 0) {
      products = staticProducts.filter((item) => item.slug.includes('art-deco') || item.slug.includes('choker') || item.slug.includes('drop') || item.slug.includes('cascade'));
    } else if (slug === 'everyday-diamonds' && products.length === 0) {
      products = staticProducts.filter((item) => item.slug.includes('stud') || item.slug.includes('bypass') || item.slug.includes('eternity') || item.slug.includes('petite') || item.slug.includes('station'));
    }
    return { category, products };
  };

  if (!usesMongoCatalog()) return getStatic();

  try {
    const db = await getDb();
    const category = await db.collection('catalogCollections').findOne({ slug, status: 'published' });
    if (!category) return getStatic();
    const products = await db.collection('products').find({ category: slug, status: 'published' }).sort({ updatedAt: -1 }).toArray();
    const staticFallback = staticCategories.find((item) => item.slug === slug);
    return {
      category: {
        slug: category.slug,
        name: category.name,
        image: category.image || staticFallback?.image,
        note: category.note || staticFallback?.note,
        description: category.description || staticFallback?.description,
        heroPosition: category.heroPosition || staticFallback?.heroPosition,
      },
      products: products.map(serializeProduct),
    };
  } catch {
    return getStatic();
  }
}

/**
 * The product a shopper can buy right now, or null. Unlike page rendering, this never falls back to the
 * static catalog when the database is the source, so unpublished products cannot be bought.
 */
export async function getPurchasableProduct(slug) {
  if (!usesMongoCatalog()) return staticProducts.find((item) => item.slug === slug) || null;
  const db = await getDb();
  const product = await db.collection('products').findOne({ slug: String(slug), status: 'published' });
  return product ? serializeProduct(product) : null;
}

export async function getPublicProduct(slug) {
  const getStatic = () => {
    const product = staticProducts.find((item) => item.slug === slug);
    return product ? { product, related: staticProducts.filter((item) => item.slug !== slug).slice(0, 3) } : null;
  };

  if (!usesMongoCatalog()) return getStatic();

  try {
    const db = await getDb();
    const product = await db.collection('products').findOne({ slug, status: 'published' });
    if (!product) return getStatic();
    const related = await db.collection('products').find({ slug: { $ne: slug }, status: 'published' }).sort({ updatedAt: -1 }).limit(3).toArray();
    return { product: serializeProduct(product), related: related.map(serializeProduct) };
  } catch {
    return getStatic();
  }
}
