import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getDb } from './mongodb.js';

const INQUIRY_COLLECTION = 'bespokeInquiries';
const SUBSCRIBER_COLLECTION = 'newsletterSubscribers';

export const inquiryInputSchema = z.object({
  requestType: z.enum(['bespoke', 'contact', 'appointment', 'product']),
  name: z.string().trim().min(2, 'Please enter your name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(240),
  phone: z.string().trim().max(40).default(''),
  topic: z.string().trim().max(200).default(''),
  interest: z.string().trim().max(200).default(''),
  budget: z.string().trim().max(80).default(''),
  timeline: z.string().trim().max(80).default(''),
  productSlug: z.string().trim().max(180).optional().default(''),
  productTitle: z.string().trim().max(200).optional().default(''),
  preferredDate: z.string().trim().max(80).optional().default(''),
  preferredTime: z.string().trim().max(80).optional().default(''),
  message: z.string().trim().min(3, 'Please tell us a little about what you have in mind.').max(5000),
  consent: z.literal('yes', { errorMap: () => ({ message: 'Please check the consent box to proceed.' }) }),
  website: z.string().max(0).optional().default(''),
});

export function serializeInquiry(inquiry) {
  if (!inquiry) return null;
  return {
    id: inquiry._id?.toString() || inquiry.id,
    requestType: inquiry.requestType,
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone || '',
    topic: inquiry.topic || '',
    interest: inquiry.interest || '',
    budget: inquiry.budget || '',
    timeline: inquiry.timeline || '',
    productSlug: inquiry.productSlug || '',
    productTitle: inquiry.productTitle || '',
    preferredDate: inquiry.preferredDate || '',
    preferredTime: inquiry.preferredTime || '',
    message: inquiry.message,
    status: inquiry.status || 'new',
    appointmentStatus: inquiry.requestType === 'appointment' ? inquiry.appointmentStatus || 'pending' : '',
    assignee: inquiry.assignee || '',
    nextFollowUpAt: inquiry.nextFollowUpAt || null,
    version: inquiry.version || 1,
    createdAt: inquiry.createdAt || null,
    updatedAt: inquiry.updatedAt || null,
  };
}

export function serializeInquiryAdmin(inquiry) {
  if (!inquiry) return null;
  return {
    ...serializeInquiry(inquiry),
    source: inquiry.source || 'website',
    internalNotes: inquiry.internalNotes || '',
    consentAt: inquiry.consentAt || null,
    events: (inquiry.events || []).map((entry) => ({ at: entry.at, by: entry.by || '', type: entry.type, text: entry.text || '', body: entry.body || '', emailed: Boolean(entry.emailed) })),
  };
}

export async function createInquiry(input, source = 'website') {
  const parsed = inquiryInputSchema.parse(input);
  const db = await getDb();
  const now = new Date();
  const document = {
    requestType: parsed.requestType,
    name: parsed.name,
    email: parsed.email.toLowerCase(),
    phone: parsed.phone,
    topic: parsed.topic,
    interest: parsed.interest,
    budget: parsed.budget,
    timeline: parsed.timeline,
    productSlug: parsed.productSlug,
    productTitle: parsed.productTitle,
    preferredDate: parsed.preferredDate,
    preferredTime: parsed.preferredTime,
    message: parsed.message,
    source,
    status: 'new',
    consentAt: now,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  const result = await db.collection(INQUIRY_COLLECTION).insertOne(document);
  return serializeInquiry({ ...document, _id: result.insertedId });
}

export async function listInquiries({ query = '', status = 'all', type = 'all', page = 1, pageSize = 20 } = {}) {
  const db = await getDb();
  const filter = {};
  const normalizedQuery = String(query).trim().slice(0, 80);
  if (normalizedQuery) {
    const expression = new RegExp(normalizedQuery.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&'), 'i');
    filter.$or = [{ name: expression }, { email: expression }, { topic: expression }, { message: expression }];
  }
  if (['new', 'active', 'closed', 'spam'].includes(status)) filter.status = status;
  if (['appointment', 'bespoke', 'contact', 'product'].includes(type)) filter.requestType = type;
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 20));
  const [items, total] = await Promise.all([
    db.collection(INQUIRY_COLLECTION).find(filter).sort({ createdAt: -1, _id: -1 }).skip((safePage - 1) * safePageSize).limit(safePageSize).toArray(),
    db.collection(INQUIRY_COLLECTION).countDocuments(filter),
  ]);
  return { items: items.map(serializeInquiry), total, page: safePage, pages: Math.max(1, Math.ceil(total / safePageSize)) };
}

/** Request counts and the latest requests for the admin dashboard. */
export async function getInquiryOverview({ latest = 6 } = {}) {
  const db = await getDb();
  const collection = db.collection(INQUIRY_COLLECTION);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [statusCounts, typeCounts, recent, subscribers] = await Promise.all([
    collection.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray(),
    collection.aggregate([{ $match: { createdAt: { $gte: monthStart } } }, { $group: { _id: '$requestType', count: { $sum: 1 } } }]).toArray(),
    collection.find({ status: { $ne: 'spam' } }).sort({ createdAt: -1, _id: -1 }).limit(latest).toArray(),
    db.collection(SUBSCRIBER_COLLECTION).countDocuments({ status: { $ne: 'unsubscribed' } }),
  ]);
  const byStatus = Object.fromEntries(statusCounts.map((entry) => [entry._id || 'new', entry.count]));
  const thisMonth = Object.fromEntries(typeCounts.map((entry) => [entry._id || 'contact', entry.count]));
  return {
    status: { new: byStatus.new || 0, active: byStatus.active || 0, closed: byStatus.closed || 0 },
    thisMonth: { appointment: thisMonth.appointment || 0, bespoke: thisMonth.bespoke || 0, contact: thisMonth.contact || 0 },
    recent: recent.map(serializeInquiry),
    subscribers,
  };
}

export async function getInquiryById(id) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  return serializeInquiry(await db.collection(INQUIRY_COLLECTION).findOne({ _id: new ObjectId(id) }));
}

export async function getInquiryForAdmin(id) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  return serializeInquiryAdmin(await db.collection(INQUIRY_COLLECTION).findOne({ _id: new ObjectId(id) }));
}

export async function updateInquiry(id, input) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid inquiry id.');
  const values = z.object({
    status: z.enum(['new', 'active', 'closed', 'spam']),
    assignee: z.string().trim().max(160).default(''),
    nextFollowUpAt: z.string().trim().max(40).default(''),
    internalNotes: z.string().trim().max(5000).default(''),
    version: z.coerce.number().int().nonnegative(),
  }).parse(input);
  const db = await getDb();
  const result = await db.collection(INQUIRY_COLLECTION).updateOne(
    { _id: new ObjectId(id), version: values.version },
    { $set: { status: values.status, assignee: values.assignee, nextFollowUpAt: values.nextFollowUpAt || null, internalNotes: values.internalNotes, updatedAt: new Date() }, $inc: { version: 1 } },
  );
  if (result.matchedCount !== 1) {
    const error = new Error('This inquiry changed in another session. Reload before saving.');
    error.code = 'VERSION_CONFLICT';
    throw error;
  }
}

export const newsletterInputSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(240),
  consent: z.literal('yes', { errorMap: () => ({ message: 'Consent is required.' }) }),
  source: z.string().trim().max(80).default('footer'),
});

export async function subscribeNewsletter(input) {
  const parsed = newsletterInputSchema.parse(input);
  const db = await getDb();
  const now = new Date();
  await db.collection(SUBSCRIBER_COLLECTION).updateOne(
    { email: parsed.email.toLowerCase() },
    { $set: { email: parsed.email.toLowerCase(), status: 'subscribed', consentAt: now, source: parsed.source, updatedAt: now }, $setOnInsert: { createdAt: now, version: 1 } },
    { upsert: true },
  );
}

export function serializeSubscriber(subscriber) {
  if (!subscriber) return null;
  return { id: subscriber._id?.toString() || subscriber.id, email: subscriber.email, status: subscriber.status || 'subscribed', source: subscriber.source || 'unknown', consentAt: subscriber.consentAt || null, createdAt: subscriber.createdAt || null };
}

export async function listSubscribers({ query = '', status = 'all', page = 1, pageSize = 20 } = {}) {
  const db = await getDb();
  const filter = {};
  const normalizedQuery = String(query).trim().slice(0, 80);
  if (normalizedQuery) filter.email = new RegExp(normalizedQuery.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&'), 'i');
  if (['subscribed', 'unsubscribed', 'bounced'].includes(status)) filter.status = status;
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 20));
  const [items, total] = await Promise.all([
    db.collection(SUBSCRIBER_COLLECTION).find(filter).sort({ createdAt: -1, _id: -1 }).skip((safePage - 1) * safePageSize).limit(safePageSize).toArray(),
    db.collection(SUBSCRIBER_COLLECTION).countDocuments(filter),
  ]);
  return { items: items.map(serializeSubscriber), total, page: safePage, pages: Math.max(1, Math.ceil(total / safePageSize)) };
}

export async function ensureLeadIndexes() {
  const db = await getDb();
  await db.collection(INQUIRY_COLLECTION).createIndex({ status: 1, createdAt: -1 }, { name: 'inquiries_status_created' });
  await db.collection(INQUIRY_COLLECTION).createIndex({ email: 1, createdAt: -1 }, { name: 'inquiries_email_created' });
  await db.collection(SUBSCRIBER_COLLECTION).createIndex({ email: 1 }, { unique: true, name: 'subscribers_email_unique' });
  await db.collection(SUBSCRIBER_COLLECTION).createIndex({ status: 1, createdAt: -1 }, { name: 'subscribers_status_created' });
  return { inquiries: INQUIRY_COLLECTION, subscribers: SUBSCRIBER_COLLECTION };
}
