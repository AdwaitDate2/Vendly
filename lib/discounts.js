import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getDb } from './mongodb';

const DISCOUNT_COLLECTION = 'discounts';

const optionalDate = z.preprocess((value) => (value === '' || value == null ? null : value), z.coerce.date().nullable());

export const discountInputSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().toUpperCase().min(3, 'Codes need at least 3 characters.').max(40).regex(/^[A-Z0-9_-]+$/, 'Use letters, numbers, dashes, or underscores only.'),
  type: z.enum(['percent', 'fixed']),
  value: z.coerce.number().positive('Enter a discount amount.'),
  minSubtotal: z.coerce.number().min(0).max(10000000).default(0),
  usageLimit: z.coerce.number().int().min(0).max(1000000).default(0),
  startsAt: optionalDate.default(null),
  endsAt: optionalDate.default(null),
  active: z.boolean().default(true),
}).superRefine((value, context) => {
  if (value.type === 'percent' && value.value > 100) context.addIssue({ code: 'custom', path: ['value'], message: 'A percentage cannot be more than 100.' });
  if (value.startsAt && value.endsAt && value.endsAt <= value.startsAt) context.addIssue({ code: 'custom', path: ['endsAt'], message: 'The end date must be after the start date.' });
});

function serializeDiscount(discount) {
  if (!discount) return null;
  return {
    id: discount._id.toString(),
    code: discount.code,
    type: discount.type,
    value: discount.value,
    minSubtotalCents: discount.minSubtotalCents || 0,
    usageLimit: discount.usageLimit || 0,
    usedCount: discount.usedCount || 0,
    startsAt: discount.startsAt || null,
    endsAt: discount.endsAt || null,
    active: discount.active !== false,
    createdAt: discount.createdAt,
  };
}

export function describeDiscount(discount) {
  const amount = discount.type === 'percent' ? `${discount.value}% off` : `$${Number(discount.value).toLocaleString('en-US')} off`;
  return discount.minSubtotalCents ? `${amount} orders over $${(discount.minSubtotalCents / 100).toLocaleString('en-US')}` : amount;
}

/** Status shown in the admin: active, scheduled, expired, used up, or off. */
export function discountStatus(discount, now = new Date()) {
  if (!discount.active) return 'off';
  if (discount.usageLimit && discount.usedCount >= discount.usageLimit) return 'used-up';
  if (discount.endsAt && new Date(discount.endsAt) < now) return 'expired';
  if (discount.startsAt && new Date(discount.startsAt) > now) return 'scheduled';
  return 'active';
}

export async function ensureDiscountIndexes() {
  const db = await getDb();
  await db.collection(DISCOUNT_COLLECTION).createIndex({ code: 1 }, { unique: true, name: 'discount_code_unique' });
}

export async function listDiscounts() {
  const db = await getDb();
  const items = await db.collection(DISCOUNT_COLLECTION).find({ deletedAt: null }).sort({ createdAt: -1 }).limit(200).toArray();
  return items.map(serializeDiscount);
}

export async function getDiscount(id) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  return serializeDiscount(await db.collection(DISCOUNT_COLLECTION).findOne({ _id: new ObjectId(id), deletedAt: null }));
}

export async function saveDiscount(input, actor) {
  const data = discountInputSchema.parse(input);
  const db = await getDb();
  const fields = {
    code: data.code,
    type: data.type,
    value: data.value,
    minSubtotalCents: Math.round(data.minSubtotal * 100),
    usageLimit: data.usageLimit,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    active: data.active,
    updatedAt: new Date(),
    updatedBy: actor,
  };
  const clash = await db.collection(DISCOUNT_COLLECTION).findOne({ code: data.code, deletedAt: null, ...(data.id && ObjectId.isValid(data.id) ? { _id: { $ne: new ObjectId(data.id) } } : {}) });
  if (clash) {
    const error = new Error(`The code ${data.code} already exists.`);
    error.code = 'DUPLICATE';
    throw error;
  }
  if (data.id && ObjectId.isValid(data.id)) {
    await db.collection(DISCOUNT_COLLECTION).updateOne({ _id: new ObjectId(data.id) }, { $set: fields });
    return getDiscount(data.id);
  }
  const result = await db.collection(DISCOUNT_COLLECTION).insertOne({ ...fields, usedCount: 0, deletedAt: null, createdAt: new Date(), createdBy: actor });
  return getDiscount(result.insertedId.toString());
}

export async function deleteDiscount(id, actor) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const discount = await db.collection(DISCOUNT_COLLECTION).findOne({ _id: new ObjectId(id), deletedAt: null });
  if (!discount) return null;
  // Free the code for reuse while keeping the record for past orders.
  await db.collection(DISCOUNT_COLLECTION).updateOne({ _id: discount._id }, { $set: { deletedAt: new Date(), deletedBy: actor, code: `${discount.code}~${discount._id}` } });
  return serializeDiscount(discount);
}

/**
 * Checks a code against a subtotal. Returns the discount and the amount off, or a shopper-facing error.
 * @returns {Promise<{ discount: object, amountCents: number } | { error: string }>}
 */
export async function evaluateDiscountCode(code, subtotalCents) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return { error: '' };
  const db = await getDb();
  const discount = serializeDiscount(await db.collection(DISCOUNT_COLLECTION).findOne({ code: normalized, deletedAt: null }));
  if (!discount || discountStatus(discount) !== 'active') return { error: 'That code is not valid.' };
  if (subtotalCents < discount.minSubtotalCents) return { error: `That code applies to orders over $${(discount.minSubtotalCents / 100).toLocaleString('en-US')}.` };
  const amountCents = discount.type === 'percent' ? Math.round((subtotalCents * discount.value) / 100) : Math.round(discount.value * 100);
  return { discount, amountCents: Math.min(amountCents, subtotalCents) };
}

/** Counts one use of a code once an order is paid. Returns false if the code ran out in the meantime. */
export async function redeemDiscount(discountId) {
  if (!discountId || !ObjectId.isValid(discountId)) return true;
  const db = await getDb();
  const discount = await db.collection(DISCOUNT_COLLECTION).findOne({ _id: new ObjectId(discountId) });
  if (!discount) return false;
  const filter = { _id: discount._id, ...(discount.usageLimit ? { usedCount: { $lt: discount.usageLimit } } : {}) };
  const result = await db.collection(DISCOUNT_COLLECTION).updateOne(filter, { $inc: { usedCount: 1 } });
  return result.modifiedCount === 1;
}
