import { createHmac, timingSafeEqual } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { getDb } from './mongodb';
import { sendEmail } from './email';
import { sanitizeRichDoc } from './rich-text';
import { getStoreSettings } from './settings';
import { siteUrl } from './site-url';
import { logActivity } from './activity';
import {
  newsletterCampaignSchema,
  richDocToEmailHtml,
  buildNewsletterEmail,
} from './newsletter-render';

export {
  newsletterCampaignSchema,
  richDocToEmailHtml,
  buildNewsletterEmail,
};

const CAMPAIGN_COLLECTION = 'newsletterCampaigns';
const SUBSCRIBER_COLLECTION = 'newsletterSubscribers';

function getSigningSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || 'byshreen-newsletter-secret';
}

/**
 * Creates a tamper-proof unsubscribe token for a given email address.
 */
export function createUnsubscribeToken(email) {
  const normalized = String(email || '').trim().toLowerCase();
  return createHmac('sha256', getSigningSecret()).update(normalized).digest('hex');
}

/**
 * Verifies that the unsubscribe token matches the given email.
 */
export function verifyUnsubscribeToken(email, token) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || !token) return false;
  const expected = createUnsubscribeToken(normalized);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(token), 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Generates an unsubscribe URL for the recipient.
 */
export function generateUnsubscribeUrl(email) {
  const token = createUnsubscribeToken(email);
  return siteUrl(`/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`);
}

/**
 * Retrieves all active, consented subscribers.
 */
export async function getActiveSubscribers() {
  const db = await getDb();
  const list = await db.collection(SUBSCRIBER_COLLECTION)
    .find({ status: 'subscribed' })
    .project({ email: 1, consentAt: 1, source: 1, createdAt: 1 })
    .toArray();
  return list.map((sub) => ({ id: sub._id.toString(), email: sub.email.toLowerCase(), consentAt: sub.consentAt, source: sub.source }));
}

/**
 * Counts subscribers by status.
 */
export async function getSubscriberStats() {
  const db = await getDb();
  const counts = await db.collection(SUBSCRIBER_COLLECTION).aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]).toArray();
  const stats = { subscribed: 0, unsubscribed: 0, bounced: 0, total: 0 };
  for (const entry of counts) {
    const key = entry._id || 'subscribed';
    stats[key] = entry.count;
    stats.total += entry.count;
  }
  return stats;
}

/**
 * Saves a newsletter campaign draft or updates an existing one.
 */
export async function saveNewsletterCampaign(data, actor = '') {
  const parsed = newsletterCampaignSchema.parse(data);
  const db = await getDb();
  const now = new Date();
  const sanitizedDoc = sanitizeRichDoc(parsed.richDoc);

  const docToSave = {
    title: parsed.title || parsed.subject,
    subject: parsed.subject,
    preheader: parsed.preheader,
    heading: parsed.heading,
    buttonLabel: parsed.buttonLabel,
    buttonUrl: parsed.buttonUrl,
    richDoc: sanitizedDoc,
    status: 'draft',
    updatedAt: now,
    updatedBy: actor,
  };

  if (parsed.id && ObjectId.isValid(parsed.id)) {
    await db.collection(CAMPAIGN_COLLECTION).updateOne(
      { _id: new ObjectId(parsed.id) },
      { $set: docToSave },
    );
    return { id: parsed.id, ...docToSave };
  }

  docToSave.createdAt = now;
  docToSave.createdBy = actor;
  const result = await db.collection(CAMPAIGN_COLLECTION).insertOne(docToSave);
  return { id: result.insertedId.toString(), ...docToSave };
}

/**
 * Lists newsletter campaigns history with pagination.
 */
export async function listNewsletterCampaigns({ page = 1, pageSize = 20 } = {}) {
  const db = await getDb();
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.min(50, Math.max(1, Number(pageSize) || 20));

  const [items, total] = await Promise.all([
    db.collection(CAMPAIGN_COLLECTION).find({}).sort({ createdAt: -1, _id: -1 }).skip((safePage - 1) * safeSize).limit(safeSize).toArray(),
    db.collection(CAMPAIGN_COLLECTION).countDocuments({}),
  ]);

  return {
    items: items.map((item) => ({
      id: item._id.toString(),
      title: item.title || item.subject,
      subject: item.subject,
      preheader: item.preheader || '',
      heading: item.heading,
      buttonLabel: item.buttonLabel || '',
      buttonUrl: item.buttonUrl || '',
      richDoc: item.richDoc,
      status: item.status || 'draft',
      recipientsCount: item.recipientsCount || 0,
      deliverySummary: item.deliverySummary || null,
      sentAt: item.sentAt || null,
      sentBy: item.sentBy || '',
      createdAt: item.createdAt || null,
      updatedAt: item.updatedAt || null,
    })),
    total,
    page: safePage,
    pages: Math.max(1, Math.ceil(total / safeSize)),
  };
}

/**
 * Retrieves a single newsletter campaign by id.
 */
export async function getNewsletterCampaignById(id) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getDb();
  const item = await db.collection(CAMPAIGN_COLLECTION).findOne({ _id: new ObjectId(id) });
  if (!item) return null;
  return {
    id: item._id.toString(),
    title: item.title || item.subject,
    subject: item.subject,
    preheader: item.preheader || '',
    heading: item.heading,
    buttonLabel: item.buttonLabel || '',
    buttonUrl: item.buttonUrl || '',
    richDoc: item.richDoc,
    status: item.status || 'draft',
    recipientsCount: item.recipientsCount || 0,
    deliverySummary: item.deliverySummary || null,
    sentAt: item.sentAt || null,
    sentBy: item.sentBy || '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

/**
 * Sends a single test newsletter email to the specified address.
 */
export async function sendTestNewsletter({ testEmail, subject, preheader, heading, richDoc, buttonLabel, buttonUrl, actor = '' }) {
  const recipient = String(testEmail || '').trim().toLowerCase();
  if (!recipient || !recipient.includes('@')) {
    throw new Error('Please enter a valid recipient email for the test.');
  }

  const settings = await getStoreSettings();
  const unsubscribeUrl = generateUnsubscribeUrl(recipient);
  const emailPayload = buildNewsletterEmail({
    subject: `[TEST] ${subject}`,
    preheader,
    heading,
    richDoc,
    buttonLabel,
    buttonUrl,
    footerNote: 'This is a test preview of your newsletter before sending to subscribers.',
    recipientEmail: recipient,
    unsubscribeUrl,
    settings,
  });

  const result = await sendEmail({
    to: recipient,
    subject: emailPayload.subject,
    html: emailPayload.html,
    text: emailPayload.text,
    tag: 'newsletter-test',
  });

  if (actor) {
    await logActivity({
      actor,
      type: 'newsletter',
      action: `Sent test newsletter "${subject}" to ${recipient}`,
    });
  }

  return { success: result.status === 'sent' || result.status === 'logged', status: result.status, error: result.error };
}

/**
 * Sends a newsletter campaign broadcast to all active subscribers.
 */
export async function sendNewsletterBroadcast({
  campaignId,
  subject,
  preheader,
  heading,
  richDoc,
  buttonLabel,
  buttonUrl,
  actor = '',
}) {
  const subscribers = await getActiveSubscribers();
  if (!subscribers.length) {
    throw new Error('There are no active subscribers on the list to send to.');
  }

  const settings = await getStoreSettings();
  const now = new Date();
  const db = await getDb();

  const results = { sent: 0, logged: 0, failed: 0, total: subscribers.length };

  // Dispatch in parallel batches of 10 to maintain high throughput without exhausting sockets
  const BATCH_SIZE = 10;
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (subscriber) => {
        try {
          const unsubscribeUrl = generateUnsubscribeUrl(subscriber.email);
          const emailData = buildNewsletterEmail({
            subject,
            preheader,
            heading,
            richDoc,
            buttonLabel,
            buttonUrl,
            recipientEmail: subscriber.email,
            unsubscribeUrl,
            settings,
          });

          const sendResult = await sendEmail({
            to: subscriber.email,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
            tag: 'newsletter',
          });

          if (sendResult.status === 'sent') results.sent += 1;
          else if (sendResult.status === 'logged') results.logged += 1;
          else results.failed += 1;
        } catch {
          results.failed += 1;
        }
      })
    );
  }

  const campaignRecord = {
    title: subject,
    subject,
    preheader: preheader || '',
    heading,
    buttonLabel: buttonLabel || '',
    buttonUrl: buttonUrl || '',
    richDoc: sanitizeRichDoc(richDoc),
    status: 'sent',
    recipientsCount: subscribers.length,
    deliverySummary: results,
    sentAt: now,
    sentBy: actor,
    updatedAt: now,
  };

  let savedId = campaignId;
  if (campaignId && ObjectId.isValid(campaignId)) {
    await db.collection(CAMPAIGN_COLLECTION).updateOne(
      { _id: new ObjectId(campaignId) },
      { $set: campaignRecord }
    );
  } else {
    campaignRecord.createdAt = now;
    campaignRecord.createdBy = actor;
    const insert = await db.collection(CAMPAIGN_COLLECTION).insertOne(campaignRecord);
    savedId = insert.insertedId.toString();
  }

  await logActivity({
    actor: actor || 'Admin',
    type: 'newsletter',
    action: `Sent newsletter broadcast "${subject}" to ${subscribers.length} subscriber(s)`,
  });

  return { id: savedId, ...campaignRecord, results };
}

/**
 * Handles unsubscribe request by email and token.
 */
export async function unsubscribeByToken(email, token) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!verifyUnsubscribeToken(normalized, token)) {
    return { success: false, message: 'Invalid or expired unsubscribe link.' };
  }

  const db = await getDb();
  const now = new Date();
  const result = await db.collection(SUBSCRIBER_COLLECTION).updateOne(
    { email: normalized },
    { $set: { status: 'unsubscribed', unsubscribedAt: now, updatedAt: now } }
  );

  if (result.matchedCount === 0) {
    return { success: false, message: 'Subscriber record not found.' };
  }

  return { success: true, message: 'You have been successfully unsubscribed from the byShreen newsletter.' };
}

/**
 * Allows a subscriber to re-subscribe if they unsubscribed by mistake.
 */
export async function resubscribeByToken(email, token) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!verifyUnsubscribeToken(normalized, token)) {
    return { success: false, message: 'Invalid token.' };
  }

  const db = await getDb();
  const now = new Date();
  await db.collection(SUBSCRIBER_COLLECTION).updateOne(
    { email: normalized },
    { $set: { status: 'subscribed', consentAt: now, updatedAt: now }, $unset: { unsubscribedAt: '' } },
    { upsert: true }
  );

  return { success: true, message: 'You are subscribed to the byShreen newsletter.' };
}
