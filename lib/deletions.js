import { ObjectId } from 'mongodb';
import { getDb } from './mongodb';

// Permanent deletes copy the record into `deletedRecords` first, so a mistake can be undone from
// Admin → Recently deleted. Copies are kept for 90 days.
const TRASH = 'deletedRecords';
const KEEP_DAYS = 90;

export const DELETABLE = {
  product: { collection: 'products', label: (doc) => doc.shortTitle || doc.title, adminHref: (id) => `/admin/products/${id}`, noun: 'Product' },
  collection: { collection: 'catalogCollections', label: (doc) => doc.name, adminHref: (id) => `/admin/collections/${id}`, noun: 'Collection' },
  inquiry: { collection: 'bespokeInquiries', label: (doc) => `${doc.name} (${doc.email})`, adminHref: (id) => `/admin/inquiries/${id}`, noun: 'Request' },
  subscriber: { collection: 'newsletterSubscribers', label: (doc) => doc.email, adminHref: () => '/admin/subscribers', noun: 'Subscriber' },
  customer: { collection: 'customers', label: (doc) => doc.name ? `${doc.name} (${doc.email})` : doc.email, adminHref: (id) => `/admin/customers/${id}`, noun: 'Customer' },
};

function toIds(ids) {
  return (Array.isArray(ids) ? ids : [ids]).map((id) => (typeof id === 'string' && ObjectId.isValid(id) ? new ObjectId(id) : null)).filter(Boolean);
}

async function moveToTrash(db, kind, documents, actor, related = {}) {
  if (!documents.length) return;
  const now = new Date();
  await db.collection(TRASH).insertMany(documents.map((document) => ({
    kind,
    recordId: document._id,
    label: DELETABLE[kind].label(document),
    data: document,
    related: related[document._id.toString()] || {},
    deletedAt: now,
    deletedBy: actor,
    expiresAt: new Date(now.getTime() + KEEP_DAYS * 86400000),
  })));
}

/** Deletes products (and their stock history). Orders keep their own copy of what was bought. */
export async function deleteProducts(ids, actor) {
  const objectIds = toIds(ids);
  if (!objectIds.length) return [];
  const db = await getDb();
  const products = await db.collection('products').find({ _id: { $in: objectIds } }).toArray();
  const movements = await db.collection('inventoryMovements').find({ productId: { $in: objectIds } }).toArray();
  const related = Object.fromEntries(products.map((product) => [product._id.toString(), { inventoryMovements: movements.filter((row) => row.productId.equals(product._id)) }]));
  await moveToTrash(db, 'product', products, actor, related);
  await db.collection('products').deleteMany({ _id: { $in: products.map((product) => product._id) } });
  await db.collection('inventoryMovements').deleteMany({ productId: { $in: products.map((product) => product._id) } });
  return products.map((product) => DELETABLE.product.label(product));
}

/** Deletes a collection. Refuses while products still belong to it, so none are left orphaned. */
export async function deleteCollection(id, actor) {
  const [objectId] = toIds(id);
  if (!objectId) throw new Error('Unknown collection.');
  const db = await getDb();
  const collection = await db.collection('catalogCollections').findOne({ _id: objectId });
  if (!collection) throw new Error('This collection was already deleted.');
  const products = await db.collection('products').countDocuments({ category: collection.slug });
  if (products) {
    throw Object.assign(new Error(`${products} product${products === 1 ? ' is' : 's are'} still in “${collection.name}”. Move ${products === 1 ? 'it' : 'them'} to another collection (or delete ${products === 1 ? 'it' : 'them'}) first.`), { code: 'IN_USE', slug: collection.slug, products });
  }
  await moveToTrash(db, 'collection', [collection], actor);
  await db.collection('catalogCollections').deleteOne({ _id: objectId });
  return collection.name;
}

/** Deletes a single record of a simple kind: a request, a subscriber, or a customer profile. */
export async function deleteRecord(kind, id, actor) {
  if (!['inquiry', 'subscriber', 'customer'].includes(kind)) throw new Error('This item can’t be deleted.');
  const [objectId] = toIds(id);
  if (!objectId) throw new Error('Unknown item.');
  const db = await getDb();
  const name = DELETABLE[kind].collection;
  const document = await db.collection(name).findOne({ _id: objectId });
  if (!document) throw new Error('This item was already deleted.');
  await moveToTrash(db, kind, [document], actor);
  await db.collection(name).deleteOne({ _id: objectId });
  return DELETABLE[kind].label(document);
}

export async function listDeletedRecords({ limit = 100 } = {}) {
  const db = await getDb();
  await db.collection(TRASH).deleteMany({ expiresAt: { $lt: new Date() } });
  const rows = await db.collection(TRASH).find({}, { projection: { data: 0, related: 0 } }).sort({ deletedAt: -1 }).limit(limit).toArray();
  return rows.map((row) => ({ id: row._id.toString(), kind: row.kind, noun: DELETABLE[row.kind]?.noun || row.kind, label: row.label, deletedAt: row.deletedAt, deletedBy: row.deletedBy, expiresAt: row.expiresAt }));
}

/** Puts a deleted record back exactly as it was. */
export async function restoreDeletedRecord(trashId, actor) {
  const [objectId] = toIds(trashId);
  if (!objectId) throw new Error('Unknown item.');
  const db = await getDb();
  const row = await db.collection(TRASH).findOne({ _id: objectId });
  if (!row) throw new Error('This item is no longer in Recently deleted.');
  const kind = DELETABLE[row.kind];
  if (row.kind === 'product' || row.kind === 'collection') {
    const clash = await db.collection(kind.collection).findOne({ slug: row.data.slug });
    if (clash) throw new Error(`Another ${kind.noun.toLowerCase()} now uses the web address “${row.data.slug}”. Rename it first, then restore.`);
  }
  if (row.kind === 'subscriber' || row.kind === 'customer') {
    const clash = await db.collection(kind.collection).findOne({ email: row.data.email });
    if (clash) throw new Error(`${row.data.email} has been added again since it was deleted, so there is nothing to restore.`);
  }
  await db.collection(kind.collection).insertOne({ ...row.data, restoredAt: new Date(), restoredBy: actor });
  if (row.related?.inventoryMovements?.length) await db.collection('inventoryMovements').insertMany(row.related.inventoryMovements).catch(() => {});
  await db.collection(TRASH).deleteOne({ _id: objectId });
  return { kind: row.kind, label: row.label, href: kind.adminHref(row.recordId.toString()) };
}
