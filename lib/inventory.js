import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getServerEnv } from './env';
import { inventoryMovementReasons } from './inventory-constants';
import { getDb, getMongoClient } from './mongodb';

const PRODUCT_COLLECTION = 'products';
const MOVEMENT_COLLECTION = 'inventoryMovements';

export const inventoryAdjustmentSchema = z.object({
  productId: z.string().refine((value) => ObjectId.isValid(value), 'Choose a valid product.'),
  variantId: z.string().trim().min(1, 'Choose a variant.').max(120),
  version: z.coerce.number().int().nonnegative(),
  // Either change the count by `delta` or set it to exactly `setTo`; the alert level can change alongside or alone.
  delta: z.coerce.number().int().min(-100000, 'Adjustment is too large.').max(100000, 'Adjustment is too large.').refine((value) => value !== 0, 'Enter a non-zero adjustment.').optional(),
  setTo: z.coerce.number().int('Use a whole number.').min(0, 'Stock cannot be negative.').max(100000, 'That number is too large.').optional(),
  lowStockThreshold: z.coerce.number().int('Use a whole number.').min(0, 'Use 0 or more.').max(10000).optional(),
  reason: z.enum(inventoryMovementReasons),
  note: z.string().trim().max(500, 'Keep the note under 500 characters.').optional().default(''),
}).refine((value) => value.delta !== undefined || value.setTo !== undefined || value.lowStockThreshold !== undefined, { message: 'Enter a quantity.', path: ['delta'] });

function asObjectId(value) {
  return typeof value === 'string' && ObjectId.isValid(value) ? new ObjectId(value) : null;
}

function serializeMovement(movement) {
  return {
    ...movement,
    id: movement._id?.toString() || movement.id,
    _id: undefined,
    productId: movement.productId?.toString?.() || movement.productId,
  };
}

function serializeInventoryItem(item) {
  return {
    ...item,
    productId: item.productId?.toString?.() || item.productId,
    quantity: Number(item.quantity || 0),
    lowStockThreshold: Number(item.lowStockThreshold || 0),
    variantId: item.variantId?.toString?.() || item.variantId,
  };
}

// Made-to-order pieces never run out, so only ready-to-ship stock can be low.
export function isLowStock(item) {
  return !item.madeToOrder && Number(item.quantity || 0) <= Number(item.lowStockThreshold || 0);
}

export async function ensureInventoryIndexes() {
  const db = await getDb();
  await db.collection(MOVEMENT_COLLECTION).createIndex({ productId: 1, variantId: 1, createdAt: -1 }, { name: 'inventory_movements_variant_time' });
  await db.collection(MOVEMENT_COLLECTION).createIndex({ createdAt: -1 }, { name: 'inventory_movements_time' });
  return { movements: MOVEMENT_COLLECTION };
}

export async function listInventory({ query = '', status = 'all', stock = 'all', page = 1, pageSize = 20 } = {}) {
  const db = await getDb();
  const productMatch = {};
  if (status !== 'all' && ['published', 'draft', 'archived'].includes(status)) productMatch.status = status;
  const normalizedQuery = String(query).trim().slice(0, 80);
  if (normalizedQuery) {
    const expression = new RegExp(normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    productMatch.$or = [{ title: expression }, { shortTitle: expression }, { slug: expression }, { category: expression }, { 'variants.sku': expression }];
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 20));
  const pipeline = [
    { $match: productMatch },
    { $unwind: '$variants' },
    { $match: { 'variants.active': { $ne: false } } },
    {
      $project: {
        productId: '$_id',
        productTitle: '$shortTitle',
        productSlug: '$slug',
        category: 1,
        productStatus: '$status',
        variantId: '$variants.id',
        variantTitle: '$variants.title',
        madeToOrder: { $ne: ['$madeToOrder', false] },
        sku: '$variants.sku',
        quantity: { $ifNull: ['$variants.quantity', 0] },
        lowStockThreshold: { $ifNull: ['$variants.lowStockThreshold', 0] },
        updatedAt: 1,
        version: 1,
      },
    },
  ];
  if (stock === 'low') pipeline.push({ $match: { madeToOrder: false, $expr: { $lte: ['$quantity', '$lowStockThreshold'] } } });
  pipeline.push({ $sort: { updatedAt: -1, productId: -1 } });
  pipeline.push({ $facet: { items: [{ $skip: (safePage - 1) * safePageSize }, { $limit: safePageSize }], total: [{ $count: 'value' }] } });
  const [result] = await db.collection(PRODUCT_COLLECTION).aggregate(pipeline).toArray();
  const items = (result?.items || []).map(serializeInventoryItem);
  const total = Number(result?.total?.[0]?.value || 0);
  return { items, total, page: safePage, pageSize: safePageSize, pages: Math.max(1, Math.ceil(total / safePageSize)) };
}

export async function adjustInventory(input, actor = 'unknown') {
  const parsed = inventoryAdjustmentSchema.parse(input);
  const productId = asObjectId(parsed.productId);
  if (!productId) throw new Error('Invalid product id.');
  const client = await getMongoClient();
  const db = client.db(getServerEnv().MONGODB_DB);
  const session = client.startSession();
  const now = new Date();

  try {
    let result;
    await session.withTransaction(async () => {
      const product = await db.collection(PRODUCT_COLLECTION).findOne({ _id: productId }, { session });
      if (!product) throw new Error('Product not found.');
      const variant = (product.variants || []).find((item) => String(item.id) === parsed.variantId);
      if (!variant) throw new Error('Variant not found.');
      const beforeQuantity = Number(variant.quantity || 0);
      const afterQuantity = parsed.setTo !== undefined ? parsed.setTo : beforeQuantity + (parsed.delta || 0);
      const delta = afterQuantity - beforeQuantity;
      const thresholdChanged = parsed.lowStockThreshold !== undefined && parsed.lowStockThreshold !== Number(variant.lowStockThreshold || 0);
      if (!delta && !thresholdChanged) {
        const error = new Error(parsed.setTo !== undefined ? `Stock is already ${afterQuantity}.` : 'Nothing to change.');
        error.code = 'NO_CHANGE';
        throw error;
      }
      if (afterQuantity < 0) {
        const error = new Error('Quantity cannot fall below zero.');
        error.code = 'INSUFFICIENT_STOCK';
        throw error;
      }
      const update = await db.collection(PRODUCT_COLLECTION).updateOne(
        { _id: productId, version: parsed.version, 'variants.id': parsed.variantId },
        { $set: { 'variants.$[variant].quantity': afterQuantity, ...(thresholdChanged ? { 'variants.$[variant].lowStockThreshold': parsed.lowStockThreshold } : {}), updatedAt: now, updatedBy: actor }, $inc: { version: 1 } },
        { arrayFilters: [{ 'variant.id': parsed.variantId }], session },
      );
      if (update.matchedCount !== 1) {
        const error = new Error('This inventory record changed in another session. Reload before adjusting.');
        error.code = 'VERSION_CONFLICT';
        throw error;
      }
      let movement = null;
      if (delta) {
        movement = { productId, variantId: parsed.variantId, sku: variant.sku || '', delta, beforeQuantity, afterQuantity, reason: parsed.reason, note: parsed.note || '', actor, createdAt: now };
        await db.collection(MOVEMENT_COLLECTION).insertOne(movement, { session });
      }
      result = { productId: parsed.productId, variantId: parsed.variantId, sku: variant.sku || '', variantTitle: variant.title || '', productTitle: product.shortTitle || product.title, beforeQuantity, afterQuantity, delta, thresholdChanged, lowStockThreshold: thresholdChanged ? parsed.lowStockThreshold : Number(variant.lowStockThreshold || 0), movement: movement ? serializeMovement(movement) : null };
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
    return result;
  } finally {
    await session.endSession();
  }
}

/** Records stock that moved because of an order (sale, or restock on cancellation). Best-effort. */
export async function recordOrderMovements(db, items, { direction, reason, note, actor = 'system' }) {
  const movements = items.filter((item) => !item.madeToOrder && ObjectId.isValid(String(item.productId))).map((item) => ({
    productId: new ObjectId(String(item.productId)), variantId: item.variantId, sku: item.sku || '', delta: direction * item.qty, reason, note, actor, createdAt: new Date(),
  }));
  if (movements.length) await db.collection(MOVEMENT_COLLECTION).insertMany(movements).catch(() => {});
}

export async function listInventoryMovements(productId, variantId = '', limit = 50) {
  const objectId = asObjectId(productId);
  if (!objectId) return [];
  const db = await getDb();
  const filter = { productId: objectId };
  if (variantId) filter.variantId = String(variantId);
  const items = await db.collection(MOVEMENT_COLLECTION).find(filter).sort({ createdAt: -1, _id: -1 }).limit(Math.min(100, Math.max(1, Number(limit) || 50))).toArray();
  return items.map(serializeMovement);
}
