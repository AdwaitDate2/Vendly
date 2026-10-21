import { deliverEmailViaKlaviyo, klaviyoConfigured } from './klaviyo';
import { getDb } from './mongodb';

const OUTBOX_COLLECTION = 'emailOutbox';

function provider() {
  // Explicit provider override if specified in environment (e.g. EMAIL_PROVIDER=resend)
  if (process.env.EMAIL_PROVIDER) return process.env.EMAIL_PROVIDER.toLowerCase();
  // Klaviyo is the store's email service; Resend/Postmark remain as direct alternatives.
  if (klaviyoConfigured()) return 'klaviyo';
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.POSTMARK_SERVER_TOKEN) return 'postmark';
  return 'none';
}

function fromAddress() {
  return process.env.EMAIL_FROM || 'byShreen <hello@byshreen.com>';
}

async function deliver({ to, subject, text, html, replyTo, tag }) {
  const kind = provider();
  if (kind === 'klaviyo') {
    await deliverEmailViaKlaviyo({ to, subject, html, text, replyTo, tag });
    return 'sent';
  }
  if (kind === 'resend') {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromAddress(), to, subject, text, html, reply_to: replyTo || undefined }),
    });
    if (!response.ok) throw new Error(`Resend responded ${response.status}: ${(await response.text()).slice(0, 200)}`);
    return 'sent';
  }
  if (kind === 'postmark') {
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: { 'X-Postmark-Server-Token': process.env.POSTMARK_SERVER_TOKEN, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ From: fromAddress(), To: to.join(','), Subject: subject, TextBody: text, HtmlBody: html, ReplyTo: replyTo || undefined, MessageStream: 'outbound' }),
    });
    if (!response.ok) throw new Error(`Postmark responded ${response.status}: ${(await response.text()).slice(0, 200)}`);
    return 'sent';
  }
  return 'logged';
}

/**
 * Sends an email through the configured provider (Klaviyo, or Resend/Postmark). Without a provider the email is
 * only recorded in the outbox. Every attempt is recorded, and failures never throw to the caller.
 */
export async function sendEmail({ to, subject, text, html, replyTo, tag = 'general' }) {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!recipients.length) return { status: 'skipped' };
  let status = 'failed';
  let error = '';
  try {
    status = await deliver({ to: recipients, subject, text, html, replyTo, tag });
  } catch (deliveryError) {
    error = deliveryError.message;
  }
  try {
    const db = await getDb();
    await db.collection(OUTBOX_COLLECTION).insertOne({ to: recipients, subject, text, tag, status, provider: provider(), error, createdAt: new Date() });
  } catch {
    // Recording the email is best-effort.
  }
  if (status === 'logged') console.info(`[email:logged] ${subject} → ${recipients.join(', ')}`);
  return { status, error };
}

export async function listOutbox({ limit = 30 } = {}) {
  const db = await getDb();
  const items = await db.collection(OUTBOX_COLLECTION).find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  return items.map((item) => ({ ...item, id: item._id.toString(), _id: undefined }));
}

export function emailProviderName() {
  return { klaviyo: 'Klaviyo', resend: 'Resend', postmark: 'Postmark', none: '' }[provider()];
}

// The layout lives in a plain module so the admin preview can use it too.
export { emailLayout, escapeHtml } from './email-layout';
