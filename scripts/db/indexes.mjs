import { MongoClient } from 'mongodb';
import { requiredEnv } from './env.mjs';

const uri = requiredEnv('MONGODB_URI');
const dbName = process.env.MONGODB_DB || 'byshreen';
const checkOnly = process.argv.includes('--check');
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
const expected = {
  products: [
    { key: { slug: 1 }, name: 'products_slug_unique', unique: true },
    { key: { status: 1, updatedAt: -1 }, name: 'products_status_updated' },
    { key: { category: 1, status: 1 }, name: 'products_category_status' },
  ],
  catalogCollections: [{ key: { slug: 1 }, name: 'collections_slug_unique', unique: true }],
  siteContent: [
    { key: { key: 1 }, name: 'site_content_key_unique', unique: true },
    { key: { status: 1, updatedAt: -1 }, name: 'site_content_status_updated' },
  ],
  contentRevisions: [{ key: { resourceKey: 1, createdAt: -1 }, name: 'content_revisions_resource_time' }],
  bespokeInquiries: [
    { key: { status: 1, createdAt: -1 }, name: 'inquiries_status_created' },
    { key: { email: 1, createdAt: -1 }, name: 'inquiries_email_created' },
  ],
  newsletterSubscribers: [
    { key: { email: 1 }, name: 'subscribers_email_unique', unique: true },
    { key: { status: 1, createdAt: -1 }, name: 'subscribers_status_created' },
  ],
  newsletterCampaigns: [
    { key: { status: 1, createdAt: -1 }, name: 'campaigns_status_created' },
    { key: { createdAt: -1 }, name: 'campaigns_created' },
  ],
  inventoryMovements: [
    { key: { productId: 1, variantId: 1, createdAt: -1 }, name: 'inventory_movements_variant_time' },
    { key: { createdAt: -1 }, name: 'inventory_movements_time' },
  ],
  orders: [
    { key: { number: 1 }, name: 'orders_number_unique', unique: true },
    { key: { paymentStatus: 1, createdAt: -1 }, name: 'orders_payment_created' },
    { key: { email: 1, createdAt: -1 }, name: 'orders_email_created' },
    { key: { 'payment.id': 1 }, name: 'orders_payment_id' },
  ],
  customers: [{ key: { email: 1 }, name: 'customers_email_unique', unique: true }],
  discounts: [{ key: { code: 1 }, name: 'discount_code_unique', unique: true }],
  activityLog: [
    { key: { createdAt: -1 }, name: 'activity_created' },
    { key: { type: 1, createdAt: -1 }, name: 'activity_type_created' },
  ],
};

try {
  await client.connect();
  const db = client.db(dbName);
  for (const [collectionName, indexes] of Object.entries(expected)) {
    const collection = db.collection(collectionName);
    let existing = [];
    try {
      existing = await collection.listIndexes().toArray();
    } catch (error) {
      if (error.codeName !== 'NamespaceNotFound') throw error;
    }
    for (const index of indexes) {
      const found = existing.find((item) => item.name === index.name);
      if (checkOnly && !found) throw new Error(`Missing index ${collectionName}.${index.name}`);
      if (!checkOnly) await collection.createIndex(index.key, { name: index.name, ...(index.unique ? { unique: true } : {}) });
    }
  }
  console.log(`${checkOnly ? 'MongoDB index check' : 'MongoDB indexes'} succeeded for database: ${dbName}`);
} finally {
  await client.close();
}
