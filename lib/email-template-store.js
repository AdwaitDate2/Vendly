import { z } from 'zod';
import { sendEmail } from './email';
import { EDITABLE_FIELDS, EMAIL_TEMPLATES, buildEmail, emailTemplateMeta } from './email-templates';
import { getDb } from './mongodb';
import { siteUrl } from './site-url';
import { getStoreSettings } from './settings';

const COLLECTION = 'emailTemplates';

const wordingSchema = z.object({
  subject: z.string().trim().min(1, 'Add a subject line.').max(200),
  heading: z.string().trim().min(1, 'Add a heading.').max(200),
  message: z.string().trim().max(3000).default(''),
  buttonLabel: z.string().trim().max(60).default(''),
  footer: z.string().trim().max(500).default(''),
  enabled: z.boolean().default(true),
  // "code" sends the owner's own HTML (from Edit code) instead of the simple layout.
  mode: z.enum(['simple', 'code']).default('simple'),
  html: z.string().max(60000).default(''),
}).superRefine((value, context) => {
  if (value.mode === 'code' && !value.html.trim()) context.addIssue({ code: 'custom', path: ['html'], message: 'Add the email HTML, or switch back to the simple editor.' });
});

/** Saved wording merged over the defaults, plus whether the email is switched on and customized. */
export async function getEmailTemplate(key) {
  const meta = emailTemplateMeta(key);
  if (!meta) return null;
  let saved = null;
  try {
    const db = await getDb();
    saved = await db.collection(COLLECTION).findOne({ _id: key });
  } catch {
    // Fall back to the default wording.
  }
  const wording = Object.fromEntries(EDITABLE_FIELDS.map((field) => [field, saved?.[field] ?? meta.defaults[field]]));
  const customized = Boolean(saved) && EDITABLE_FIELDS.some((field) => (saved[field] ?? meta.defaults[field]) !== meta.defaults[field]);
  const mode = saved?.mode === 'code' ? 'code' : 'simple';
  return { key, ...wording, mode, html: saved?.html || '', enabled: saved?.enabled !== false, customized: customized || mode === 'code', updatedAt: saved?.updatedAt || null, updatedBy: saved?.updatedBy || '' };
}

export async function listEmailTemplates() {
  let saved = [];
  try {
    const db = await getDb();
    saved = await db.collection(COLLECTION).find({}).toArray();
  } catch {
    // Show defaults.
  }
  const byKey = new Map(saved.map((row) => [row._id, row]));
  return EMAIL_TEMPLATES.map((meta) => {
    const row = byKey.get(meta.key);
    return {
      key: meta.key, label: meta.label, audience: meta.audience, when: meta.when, setting: meta.setting,
      subject: row?.subject ?? meta.defaults.subject,
      enabled: row?.enabled !== false,
      customized: Boolean(row) && (row.mode === 'code' || EDITABLE_FIELDS.some((field) => (row[field] ?? meta.defaults[field]) !== meta.defaults[field])),
      mode: row?.mode === 'code' ? 'code' : 'simple',
      updatedAt: row?.updatedAt || null,
    };
  });
}

export async function saveEmailTemplate(key, input, actor) {
  if (!emailTemplateMeta(key)) throw new Error('Unknown email.');
  const data = wordingSchema.parse(input);
  const db = await getDb();
  await db.collection(COLLECTION).updateOne({ _id: key }, { $set: { ...data, updatedAt: new Date(), updatedBy: actor } }, { upsert: true });
  return getEmailTemplate(key);
}

/** Back to the original wording; the on/off switch is kept. */
export async function resetEmailTemplate(key, actor) {
  const meta = emailTemplateMeta(key);
  if (!meta) throw new Error('Unknown email.');
  const db = await getDb();
  const current = await db.collection(COLLECTION).findOne({ _id: key });
  await db.collection(COLLECTION).updateOne({ _id: key }, { $set: { ...meta.defaults, mode: 'simple', html: '', enabled: current?.enabled !== false, updatedAt: new Date(), updatedBy: actor } }, { upsert: true });
  return getEmailTemplate(key);
}

/**
 * Sends one of the site's emails using its saved wording. Skips quietly when the email is switched off
 * here or under Settings → Notifications. Never throws: emails must not break orders or forms.
 */
export async function sendTemplateEmail(key, data, { to } = {}) {
  try {
    const meta = emailTemplateMeta(key);
    const settings = await getStoreSettings();
    if (meta.setting && !settings.notifications[meta.setting]) return { status: 'off' };
    const template = await getEmailTemplate(key);
    if (!template.enabled) return { status: 'off' };
    const email = buildEmail(key, { wording: template, data, settings, siteUrl });
    return await sendEmail({
      to: to || meta.to(data, settings),
      subject: email.subject,
      text: email.text,
      html: email.html,
      replyTo: meta.replyTo ? meta.replyTo(data) : settings.contactEmail,
      tag: key,
    });
  } catch {
    return { status: 'failed' };
  }
}
