import { getDb } from './mongodb';

const ACTIVITY_COLLECTION = 'activityLog';

export const ACTIVITY_TYPES = {
  auth: 'Sign-in',
  product: 'Products',
  collection: 'Collections',
  inventory: 'Inventory',
  content: 'Pages & content',
  inquiry: 'Requests',
  team: 'Team',
  order: 'Orders',
  settings: 'Settings',
};

/**
 * Records an admin action. Logging must never block the action itself, so failures are swallowed.
 * @param {{ actor: string, type: keyof ACTIVITY_TYPES, action: string, label?: string, href?: string, details?: string }} entry
 */
export async function logActivity(entry) {
  try {
    const db = await getDb();
    await db.collection(ACTIVITY_COLLECTION).insertOne({
      actor: String(entry.actor || 'unknown'),
      type: entry.type,
      action: String(entry.action).slice(0, 200),
      label: String(entry.label || '').slice(0, 200),
      href: entry.href || '',
      details: String(entry.details || '').slice(0, 1000),
      createdAt: new Date(),
    });
  } catch {
    // The activity log is best-effort.
  }
}

export async function listActivity({ type = 'all', actor = '', page = 1, pageSize = 50 } = {}) {
  const db = await getDb();
  const filter = {};
  if (type !== 'all' && ACTIVITY_TYPES[type]) filter.type = type;
  if (actor) filter.actor = String(actor);
  const safePage = Math.max(1, Number(page) || 1);
  const [items, total, actors] = await Promise.all([
    db.collection(ACTIVITY_COLLECTION).find(filter).sort({ createdAt: -1, _id: -1 }).skip((safePage - 1) * pageSize).limit(pageSize).toArray(),
    db.collection(ACTIVITY_COLLECTION).countDocuments(filter),
    db.collection(ACTIVITY_COLLECTION).distinct('actor'),
  ]);
  return {
    items: items.map((item) => ({ ...item, id: item._id.toString(), _id: undefined })),
    total,
    page: safePage,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    actors: actors.sort(),
  };
}

export async function ensureActivityIndexes() {
  const db = await getDb();
  await db.collection(ACTIVITY_COLLECTION).createIndex({ createdAt: -1 }, { name: 'activity_created' });
  await db.collection(ACTIVITY_COLLECTION).createIndex({ type: 1, createdAt: -1 }, { name: 'activity_type_created' });
}
