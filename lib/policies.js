import { z } from 'zod';
import { POLICY_DEFAULTS } from '../data/policies.js';
import { getDb } from './mongodb';
import { docToText, sanitizeRichDoc, textToDoc } from './rich-text';

const COLLECTION = 'policies';
const REVISIONS = 'policyRevisions';
const KEEP_REVISIONS = 20;

/** Every policy page, in the order shown in the admin. `path` is where it lives on the website. */
export const POLICIES = [
  { key: 'privacy', path: '/privacy', eyebrow: 'Legal', legal: true, summary: 'How personal information is collected, used, and protected.' },
  { key: 'terms', path: '/terms', eyebrow: 'Legal', legal: true, summary: 'Rules for using the website and buying from byShreen.' },
  { key: 'shippingReturns', path: '/shipping-returns', eyebrow: 'Client care', summary: 'Delivery times, returns, exchanges, and final sale.' },
  { key: 'repairsCare', path: '/repairs-care', eyebrow: 'Client care', summary: 'Repairs, resizing, warranty, and caring for jewelry.' },
  { key: 'cookies', path: '/cookies', eyebrow: 'Legal', legal: true, summary: 'Which cookies the website uses and how to manage them.' },
  { key: 'privacyChoices', path: '/privacy-choices', eyebrow: 'Legal', legal: true, summary: 'Privacy rights and how to make a request.' },
  { key: 'accessibility', path: '/accessibility', eyebrow: 'Legal', summary: 'Accessibility commitment and how to report a barrier.' },
];

export const POLICY_KEYS = POLICIES.map((policy) => policy.key);

export function policyMeta(key) {
  return POLICIES.find((policy) => policy.key === key) || null;
}

const dateString = z.string().trim().refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Use a full date.').default('');

export const policyInputSchema = z.object({
  title: z.string().trim().min(2, 'Add a page title.').max(120),
  intro: z.string().trim().max(600).default(''),
  body: z.any().transform((value) => sanitizeRichDoc(value)),
  lastUpdated: dateString,
  published: z.boolean().default(true),
  seoTitle: z.string().trim().max(180).default(''),
  seoDescription: z.string().trim().max(320).default(''),
  version: z.coerce.number().int().nonnegative().default(0),
});

function defaultPolicy(key) {
  const source = POLICY_DEFAULTS[key];
  return {
    key,
    title: source.title,
    intro: source.intro,
    body: textToDoc(source.body),
    lastUpdated: source.lastUpdated || '',
    published: true,
    seoTitle: '',
    seoDescription: '',
    version: 0,
    updatedAt: null,
    updatedBy: '',
    isDefault: true,
  };
}

function serialize(document, key) {
  if (!document) return defaultPolicy(key);
  return {
    key,
    title: document.title,
    intro: document.intro || '',
    body: sanitizeRichDoc(document.body),
    lastUpdated: document.lastUpdated || '',
    published: document.published !== false,
    seoTitle: document.seoTitle || '',
    seoDescription: document.seoDescription || '',
    version: document.version || 0,
    updatedAt: document.updatedAt || null,
    updatedBy: document.updatedBy || '',
    isDefault: false,
  };
}

/** A policy as saved, or its starting content from the client copy until the first save. */
export async function getPolicy(key) {
  if (!policyMeta(key)) return null;
  try {
    const db = await getDb();
    return serialize(await db.collection(COLLECTION).findOne({ _id: key }), key);
  } catch {
    return defaultPolicy(key);
  }
}

export async function listPolicies() {
  let saved = [];
  try {
    const db = await getDb();
    saved = await db.collection(COLLECTION).find({ _id: { $in: POLICY_KEYS } }).toArray();
  } catch {
    // Show the starting content if the database is unavailable.
  }
  const byKey = new Map(saved.map((document) => [document._id, document]));
  return POLICIES.map((meta) => ({ ...meta, ...serialize(byKey.get(meta.key), meta.key) }));
}

/**
 * Saves a policy. `version` must match the stored version so two people editing at once can't
 * overwrite each other. The previous version is kept in the revision history.
 */
export async function savePolicy(key, input, actor) {
  if (!policyMeta(key)) throw new Error('Unknown policy.');
  const data = policyInputSchema.parse(input);
  if (!docToText(data.body)) throw Object.assign(new Error('The page is empty. Add some text before saving.'), { code: 'EMPTY' });
  const db = await getDb();
  const current = await db.collection(COLLECTION).findOne({ _id: key });
  if ((current?.version || 0) !== data.version) {
    throw Object.assign(new Error('Someone else saved this policy while you were editing. Reload to see their changes, then make yours again.'), { code: 'VERSION_CONFLICT' });
  }
  // Keep what was live before this save, including the client's starting text on the first save.
  const { _id, isDefault, key: _key, ...previous } = current || defaultPolicy(key);
  await db.collection(REVISIONS).insertOne({ key, ...previous, updatedBy: current ? previous.updatedBy : '', archivedAt: new Date() });
  const old = await db.collection(REVISIONS).find({ key }).sort({ archivedAt: -1 }).skip(KEEP_REVISIONS).project({ _id: 1 }).toArray();
  if (old.length) await db.collection(REVISIONS).deleteMany({ _id: { $in: old.map((row) => row._id) } });
  const { version, ...fields } = data;
  const now = new Date();
  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: key, ...(current ? { version: current.version || 0 } : {}) },
    { $set: { ...fields, updatedAt: now, updatedBy: actor }, $inc: { version: 1 } },
    { upsert: !current, returnDocument: 'after' },
  );
  if (!result) throw Object.assign(new Error('Someone else saved this policy while you were editing. Reload and try again.'), { code: 'VERSION_CONFLICT' });
  return serialize(result, key);
}

export async function listPolicyRevisions(key, limit = KEEP_REVISIONS) {
  const db = await getDb();
  const rows = await db.collection(REVISIONS).find({ key }).sort({ archivedAt: -1 }).limit(limit).toArray();
  return rows.map((row) => ({ id: row._id.toString(), title: row.title, archivedAt: row.archivedAt, updatedAt: row.updatedAt, updatedBy: row.updatedBy || '', version: row.version || 0, words: docToText(row.body).split(/\s+/).filter(Boolean).length }));
}

/** Puts an earlier version back, keeping the current one in the history. */
export async function restorePolicyRevision(key, revisionId, actor) {
  const { ObjectId } = await import('mongodb');
  if (!ObjectId.isValid(revisionId)) throw new Error('Unknown version.');
  const db = await getDb();
  const revision = await db.collection(REVISIONS).findOne({ _id: new ObjectId(revisionId), key });
  if (!revision) throw new Error('That version is no longer available.');
  const current = await db.collection(COLLECTION).findOne({ _id: key });
  return savePolicy(key, { title: revision.title, intro: revision.intro, body: revision.body, lastUpdated: revision.lastUpdated, published: revision.published !== false, seoTitle: revision.seoTitle, seoDescription: revision.seoDescription, version: current?.version || 0 }, actor);
}
