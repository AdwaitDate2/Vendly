import { randomBytes, timingSafeEqual } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { redeemDiscount } from './discounts';
import { recordOrderMovements } from './inventory';
import { getDb } from './mongodb';
import { FULFILLMENT_STATUSES, PAYMENT_STATUSES } from './order-statuses';

const ORDER_COLLECTION = 'orders';
const CUSTOMER_COLLECTION = 'customers';
const COUNTER_COLLECTION = 'counters';

export { FULFILLMENT_STATUSES, PAYMENT_STATUSES };

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function asObjectId(value) {
  return typeof value === 'string' && ObjectId.isValid(value) ? new ObjectId(value) : null;
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

function event(type, message, actor = 'system') {
  return { id: randomBytes(6).toString('hex'), type, message, actor, at: new Date() };
}

export function serializeOrder(order) {
  if (!order) return null;
  const { _id, checkoutToken, ...rest } = order;
  return {
    ...rest,
    id: _id.toString(),
    name: `#${order.number}`,
    refundedCents: order.refundedCents || 0,
    notes: order.notes || [],
    timeline: [...(order.timeline || [])].sort((a, b) => new Date(b.at) - new Date(a.at)),
  };
}

async function nextOrderNumber(db) {
  const counter = await db.collection(COUNTER_COLLECTION).findOneAndUpdate({ _id: 'orderNumber' }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' });
  return 1000 + Number(counter?.seq || 1);
}

export async function ensureOrderIndexes() {
  const db = await getDb();
  await db.collection(ORDER_COLLECTION).createIndex({ number: 1 }, { unique: true, name: 'orders_number_unique' });
  await db.collection(ORDER_COLLECTION).createIndex({ paymentStatus: 1, createdAt: -1 }, { name: 'orders_payment_created' });
  await db.collection(ORDER_COLLECTION).createIndex({ email: 1, createdAt: -1 }, { name: 'orders_email_created' });
  await db.collection(ORDER_COLLECTION).createIndex({ 'payment.id': 1 }, { name: 'orders_payment_id' });
  await db.collection(CUSTOMER_COLLECTION).createIndex({ email: 1 }, { unique: true, name: 'customers_email_unique' });
}

/**
 * Creates an order awaiting payment from a server-priced bag, or refreshes the caller's own pending order
 * when `existing` ({ id, token }) still matches one.
 */
export async function upsertPendingOrder({ existing, checkout, priced, test }) {
  const db = await getDb();
  const now = new Date();
  const fields = {
    items: priced.items,
    currency: priced.currency,
    subtotalCents: priced.subtotalCents,
    discount: priced.discount,
    discountCents: priced.discountCents,
    shipping: priced.shipping,
    shippingCents: priced.shippingCents,
    tax: priced.tax,
    taxCents: priced.taxCents,
    totalCents: priced.totalCents,
    email: checkout.email,
    phone: checkout.phone,
    shippingAddress: checkout.address,
    customerNote: checkout.note,
    marketingOptIn: checkout.marketingOptIn,
    test: Boolean(test),
    updatedAt: now,
  };

  const existingId = asObjectId(existing?.id);
  if (existingId) {
    const current = await db.collection(ORDER_COLLECTION).findOne({ _id: existingId, paymentStatus: 'pending', status: 'open' });
    if (current && safeEqual(current.checkoutToken, existing.token)) {
      await db.collection(ORDER_COLLECTION).updateOne({ _id: existingId, paymentStatus: 'pending' }, { $set: fields });
      return { order: serializeOrder({ ...current, ...fields }), token: current.checkoutToken, created: false };
    }
  }

  const token = randomBytes(24).toString('base64url');
  const document = {
    ...fields,
    number: await nextOrderNumber(db),
    status: 'open',
    paymentStatus: 'pending',
    fulfillmentStatus: 'unfulfilled',
    payment: null,
    refundedCents: 0,
    refunds: [],
    tracking: null,
    notes: [],
    timeline: [event('checkout', 'Checkout started', checkout.email)],
    checkoutToken: token,
    createdAt: now,
  };
  const result = await db.collection(ORDER_COLLECTION).insertOne(document);
  return { order: serializeOrder({ ...document, _id: result.insertedId }), token, created: true };
}

export async function attachPayment(orderId, payment) {
  const db = await getDb();
  await db.collection(ORDER_COLLECTION).updateOne({ _id: new ObjectId(orderId), paymentStatus: 'pending' }, { $set: { payment, updatedAt: new Date() } });
}

/** The order for a shopper holding its checkout token (confirmation page, payment return). */
export async function getOrderForShopper(id, token) {
  const orderId = asObjectId(id);
  if (!orderId || !token) return null;
  const db = await getDb();
  const order = await db.collection(ORDER_COLLECTION).findOne({ _id: orderId });
  return order && safeEqual(order.checkoutToken, token) ? serializeOrder(order) : null;
}

export async function getOrder(id) {
  const orderId = asObjectId(id);
  if (!orderId) return null;
  const db = await getDb();
  return serializeOrder(await db.collection(ORDER_COLLECTION).findOne({ _id: orderId }));
}

export async function getOrderByPaymentId(paymentId) {
  const db = await getDb();
  return serializeOrder(await db.collection(ORDER_COLLECTION).findOne({ 'payment.id': String(paymentId) }));
}

async function upsertCustomer(db, order) {
  const now = new Date();
  await db.collection(CUSTOMER_COLLECTION).updateOne(
    { email: order.email },
    {
      $set: { name: order.shippingAddress?.name || '', phone: order.phone || '', lastAddress: order.shippingAddress, lastOrderAt: now, updatedAt: now, ...(order.marketingOptIn ? { marketingOptIn: true } : {}) },
      $inc: { orderCount: 1, totalSpentCents: order.totalCents },
      $setOnInsert: { email: order.email, firstOrderAt: now, createdAt: now, notes: '', tags: [], ...(order.marketingOptIn ? {} : { marketingOptIn: false }) },
    },
    { upsert: true },
  );
}

async function adjustStock(db, items, direction, order) {
  if (process.env.CATALOG_SOURCE !== 'mongodb') return;
  for (const item of items) {
    if (item.madeToOrder) continue;
    await db.collection('products').updateOne({ slug: item.slug, 'variants.id': item.variantId }, { $inc: { 'variants.$.quantity': direction * item.qty, version: 1 }, $set: { updatedAt: new Date() } });
  }
  // Shows up in Inventory → History next to manual adjustments.
  await recordOrderMovements(db, items, { direction, reason: direction < 0 ? 'sale' : 'return', note: `Order #${order.number}${direction < 0 ? '' : ' cancelled'}` });
}

/**
 * Marks an order paid exactly once, whichever of the webhook, the return page, or the mock button gets
 * there first. Returns the paid order only for the call that made the change, so side effects run once.
 */
export async function markOrderPaid(orderId, { amountCents, source }) {
  const db = await getDb();
  const now = new Date();
  const order = await db.collection(ORDER_COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(orderId), paymentStatus: 'pending', status: 'open' },
    { $set: { paymentStatus: 'paid', paidAt: now, updatedAt: now, amountPaidCents: amountCents }, $push: { timeline: event('payment', `Payment of $${(amountCents / 100).toFixed(2)} received (${source})`) } },
    { returnDocument: 'after' },
  );
  if (!order) return null;
  await adjustStock(db, order.items, -1, order);
  if (order.discount?.id) await redeemDiscount(order.discount.id);
  await upsertCustomer(db, order);
  return serializeOrder(order);
}

export async function markOrderPaymentFailed(orderId, message) {
  const db = await getDb();
  await db.collection(ORDER_COLLECTION).updateOne({ _id: new ObjectId(orderId), paymentStatus: 'pending' }, { $push: { timeline: event('payment', `Payment attempt failed: ${String(message).slice(0, 200)}`) }, $set: { updatedAt: new Date() } });
}

export async function listOrders({ query = '', view = 'orders', payment = 'all', fulfillment = 'all', page = 1, pageSize = 25 } = {}) {
  const db = await getDb();
  const filter = view === 'abandoned' ? { paymentStatus: 'pending', status: 'open' } : { paymentStatus: { $ne: 'pending' } };
  if (view !== 'abandoned' && PAYMENT_STATUSES[payment]) filter.paymentStatus = payment;
  if (FULFILLMENT_STATUSES[fulfillment]) filter.fulfillmentStatus = fulfillment;
  const normalized = String(query).trim().replace(/^#/, '').slice(0, 80);
  if (normalized) {
    const expression = new RegExp(escapeRegExp(normalized), 'i');
    filter.$or = [{ email: expression }, { 'shippingAddress.name': expression }, { 'items.title': expression }, { 'items.sku': expression }, ...(/^\d+$/.test(normalized) ? [{ number: Number(normalized) }] : [])];
  }
  const safePage = Math.max(1, Number(page) || 1);
  const [items, total] = await Promise.all([
    db.collection(ORDER_COLLECTION).find(filter).sort({ createdAt: -1, _id: -1 }).skip((safePage - 1) * pageSize).limit(pageSize).toArray(),
    db.collection(ORDER_COLLECTION).countDocuments(filter),
  ]);
  return { items: items.map(serializeOrder), total, page: safePage, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

async function updateOrder(id, filter, update, actor, message, type = 'update') {
  const db = await getDb();
  const order = await db.collection(ORDER_COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(id), ...filter },
    { ...update, $set: { ...(update.$set || {}), updatedAt: new Date() }, $push: { ...(update.$push || {}), timeline: event(type, message, actor) } },
    { returnDocument: 'after' },
  );
  if (!order) {
    const error = new Error('This order changed or cannot be updated that way. Reload and try again.');
    error.code = 'ORDER_CONFLICT';
    throw error;
  }
  return serializeOrder(order);
}

export const trackingSchema = z.object({
  carrier: z.string().trim().max(60).default(''),
  number: z.string().trim().max(80).default(''),
  url: z.string().trim().max(500).refine((value) => !value || /^https:\/\//.test(value), 'Tracking links must start with https://').default(''),
});

export async function setFulfillmentStatus(id, status, actor) {
  if (!FULFILLMENT_STATUSES[status]) throw new Error('Unknown fulfillment status.');
  return updateOrder(id, { status: 'open', paymentStatus: { $in: ['paid', 'partially_refunded'] } }, { $set: { fulfillmentStatus: status, ...(status === 'delivered' ? { deliveredAt: new Date() } : {}) } }, actor, `Marked ${FULFILLMENT_STATUSES[status].toLowerCase()}`, 'fulfillment');
}

export async function markShipped(id, tracking, actor) {
  const values = trackingSchema.parse(tracking);
  const summary = [values.carrier, values.number].filter(Boolean).join(' ');
  return updateOrder(id, { status: 'open', paymentStatus: { $in: ['paid', 'partially_refunded'] } }, { $set: { fulfillmentStatus: 'shipped', shippedAt: new Date(), tracking: values } }, actor, `Shipped${summary ? ` · ${summary}` : ''}`, 'fulfillment');
}

export async function addOrderNote(id, body, actor) {
  const text = z.string().trim().min(1, 'Write a note first.').max(2000).parse(body);
  return updateOrder(id, {}, { $push: { notes: { id: randomBytes(6).toString('hex'), body: text, author: actor, createdAt: new Date() } } }, actor, 'Added a note', 'note');
}

/** Records a refund already made with the payment provider. */
export async function recordRefund(id, { amountCents, reason, refundId }, actor) {
  const db = await getDb();
  const order = await db.collection(ORDER_COLLECTION).findOne({ _id: new ObjectId(id) });
  const refunded = (order.refundedCents || 0) + amountCents;
  const paymentStatus = refunded >= order.totalCents ? 'refunded' : 'partially_refunded';
  return updateOrder(
    id,
    { paymentStatus: { $in: ['paid', 'partially_refunded'] }, refundedCents: order.refundedCents || 0 },
    { $set: { paymentStatus, refundedCents: refunded }, $push: { refunds: { id: refundId, amountCents, reason, actor, at: new Date() } } },
    actor,
    `Refunded $${(amountCents / 100).toFixed(2)}${reason ? ` · ${reason}` : ''}`,
    'refund',
  );
}

export async function cancelOrder(id, { reason, restock }, actor) {
  const db = await getDb();
  const current = await db.collection(ORDER_COLLECTION).findOne({ _id: new ObjectId(id), status: 'open' });
  if (!current) throw Object.assign(new Error('This order is already cancelled.'), { code: 'ORDER_CONFLICT' });
  const order = await updateOrder(
    id,
    { status: 'open' },
    { $set: { status: 'cancelled', cancelledAt: new Date(), cancelReason: reason, ...(current.paymentStatus === 'pending' ? { paymentStatus: 'voided' } : {}) } },
    actor,
    `Cancelled${reason ? ` · ${reason}` : ''}`,
    'cancel',
  );
  if (restock && ['paid', 'partially_refunded', 'refunded'].includes(current.paymentStatus)) await adjustStock(db, current.items, 1, current);
  return order;
}

/** Sales for the dashboard: paid orders in the last `days` days, in New York time. */
export async function getSalesSummary({ days = 30 } = {}) {
  const db = await getDb();
  const asOf = Date.now();
  const since = new Date(asOf - days * 24 * 60 * 60 * 1000);
  const paid = { paymentStatus: { $in: ['paid', 'partially_refunded', 'refunded'] }, test: { $ne: true } };
  const [totals, byDay, toFulfill, recent, abandoned] = await Promise.all([
    db.collection(ORDER_COLLECTION).aggregate([{ $match: { ...paid, paidAt: { $gte: since } } }, { $group: { _id: null, revenueCents: { $sum: { $subtract: ['$totalCents', { $ifNull: ['$refundedCents', 0] }] } }, orders: { $sum: 1 } } }]).toArray(),
    db.collection(ORDER_COLLECTION).aggregate([
      { $match: { ...paid, paidAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt', timezone: 'America/New_York' } }, revenueCents: { $sum: { $subtract: ['$totalCents', { $ifNull: ['$refundedCents', 0] }] } }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]).toArray(),
    db.collection(ORDER_COLLECTION).countDocuments({ status: 'open', paymentStatus: { $in: ['paid', 'partially_refunded'] }, fulfillmentStatus: { $in: ['unfulfilled', 'in_production'] } }),
    db.collection(ORDER_COLLECTION).find({ paymentStatus: { $ne: 'pending' } }).sort({ createdAt: -1 }).limit(5).toArray(),
    db.collection(ORDER_COLLECTION).countDocuments({ paymentStatus: 'pending', status: 'open', createdAt: { $gte: since } }),
  ]);
  const total = totals[0] || { revenueCents: 0, orders: 0 };
  return {
    days,
    asOf,
    revenueCents: total.revenueCents,
    orders: total.orders,
    averageCents: total.orders ? Math.round(total.revenueCents / total.orders) : 0,
    byDay: byDay.map((day) => ({ date: day._id, revenueCents: day.revenueCents, orders: day.orders })),
    toFulfill,
    abandoned,
    recent: recent.map(serializeOrder),
  };
}

export function serializeCustomer(customer) {
  if (!customer) return null;
  const { _id, ...rest } = customer;
  return { ...rest, id: _id.toString(), orderCount: customer.orderCount || 0, totalSpentCents: customer.totalSpentCents || 0 };
}

export async function listCustomers({ query = '', page = 1, pageSize = 25 } = {}) {
  const db = await getDb();
  const filter = {};
  const normalized = String(query).trim().slice(0, 80);
  if (normalized) {
    const expression = new RegExp(escapeRegExp(normalized), 'i');
    filter.$or = [{ email: expression }, { name: expression }, { phone: expression }];
  }
  const safePage = Math.max(1, Number(page) || 1);
  const [items, total] = await Promise.all([
    db.collection(CUSTOMER_COLLECTION).find(filter).sort({ lastOrderAt: -1, _id: -1 }).skip((safePage - 1) * pageSize).limit(pageSize).toArray(),
    db.collection(CUSTOMER_COLLECTION).countDocuments(filter),
  ]);
  return { items: items.map(serializeCustomer), total, page: safePage, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getCustomer(id) {
  const customerId = asObjectId(id);
  if (!customerId) return null;
  const db = await getDb();
  const customer = await db.collection(CUSTOMER_COLLECTION).findOne({ _id: customerId });
  if (!customer) return null;
  const orders = await db.collection(ORDER_COLLECTION).find({ email: customer.email, paymentStatus: { $ne: 'pending' } }).sort({ createdAt: -1 }).limit(50).toArray();
  return { ...serializeCustomer(customer), orders: orders.map(serializeOrder) };
}

export async function getCustomerIdByEmail(email) {
  const db = await getDb();
  const customer = await db.collection(CUSTOMER_COLLECTION).findOne({ email: String(email).toLowerCase() }, { projection: { _id: 1 } });
  return customer?._id.toString() || null;
}

export async function saveCustomerNotes(id, { notes, tags }, actor) {
  const customerId = asObjectId(id);
  if (!customerId) throw new Error('Unknown customer.');
  const values = z.object({ notes: z.string().trim().max(5000).default(''), tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]) }).parse({ notes, tags });
  const db = await getDb();
  await db.collection(CUSTOMER_COLLECTION).updateOne({ _id: customerId }, { $set: { ...values, updatedAt: new Date(), updatedBy: actor } });
}
