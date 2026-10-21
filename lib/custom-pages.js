import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { slugify } from './catalog';
import { contentSectionSchema } from './content';
import { createBlock } from './blocks';
import { getDb } from './mongodb';

const PAGE_COLLECTION = 'customPages';

export const customPageSchema = z.object({
  id: z.string().optional(),
  version: z.coerce.number().int().nonnegative().optional(),
  title: z.string().trim().min(2, 'Give the page a title.').max(120),
  slug: z.string().trim().max(80).optional().default(''),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  seoTitle: z.string().trim().max(180).optional().default(''),
  seoDescription: z.string().trim().max(320).optional().default(''),
  sections: z.array(contentSectionSchema).max(60).default([]),
});

function asObjectId(value) {
  return typeof value === 'string' && ObjectId.isValid(value) ? new ObjectId(value) : null;
}

function serialize(page) {
  if (!page) return null;
  return { ...page, id: page._id.toString(), _id: undefined, route: `/pages/${page.slug}` };
}

export async function listCustomPages() {
  const db = await getDb();
  const pages = await db.collection(PAGE_COLLECTION).find({ status: { $ne: 'deleted' } }).sort({ updatedAt: -1 }).toArray();
  return pages.map(serialize);
}

export async function getCustomPageById(id) {
  const objectId = asObjectId(id);
  if (!objectId) return null;
  const db = await getDb();
  return serialize(await db.collection(PAGE_COLLECTION).findOne({ _id: objectId, status: { $ne: 'deleted' } }));
}

export async function getPublishedCustomPage(slug) {
  try {
    const db = await getDb();
    return serialize(await db.collection(PAGE_COLLECTION).findOne({ slug: String(slug), status: 'published' }));
  } catch {
    return null;
  }
}

async function uniqueSlug(db, base, excludeId) {
  const root = slugify(base) || 'page';
  let candidate = root;
  for (let n = 2; await db.collection(PAGE_COLLECTION).findOne({ slug: candidate, status: { $ne: 'deleted' }, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }); n += 1) candidate = `${root}-${n}`;
  return candidate;
}

export async function createCustomPage({ title }, actor) {
  const parsed = customPageSchema.pick({ title: true }).parse({ title });
  const db = await getDb();
  const now = new Date();
  const header = { ...createBlock('pageHeader'), heading: parsed.title, eyebrow: '', body: '' };
  const text = createBlock('centeredText');
  const document = {
    title: parsed.title,
    slug: await uniqueSlug(db, parsed.title),
    status: 'draft',
    seoTitle: '',
    seoDescription: '',
    sections: [header, text].map((block) => contentSectionSchema.parse(block)),
    version: 1,
    createdAt: now,
    createdBy: actor,
    updatedAt: now,
    updatedBy: actor,
  };
  const result = await db.collection(PAGE_COLLECTION).insertOne(document);
  return serialize({ ...document, _id: result.insertedId });
}

export async function saveCustomPage(input, actor) {
  const parsed = customPageSchema.parse(input);
  const objectId = asObjectId(parsed.id);
  if (!objectId) throw new Error('Page not found.');
  const db = await getDb();
  const previous = await db.collection(PAGE_COLLECTION).findOne({ _id: objectId });
  if (!previous) throw new Error('Page not found.');
  const slug = await uniqueSlug(db, parsed.slug || parsed.title, objectId);
  const filter = { _id: objectId };
  if (typeof parsed.version === 'number') filter.version = parsed.version;
  const result = await db.collection(PAGE_COLLECTION).updateOne(filter, {
    $set: { title: parsed.title, slug, status: parsed.status, seoTitle: parsed.seoTitle, seoDescription: parsed.seoDescription, sections: parsed.sections, updatedAt: new Date(), updatedBy: actor },
    $inc: { version: 1 },
  });
  if (result.matchedCount !== 1) {
    const error = new Error('This page changed in another session. Reload before saving.');
    error.code = 'VERSION_CONFLICT';
    throw error;
  }
  return { page: await getCustomPageById(parsed.id), previousSlug: previous.slug };
}

/** Soft delete so an accidental deletion can be recovered from the database. */
export async function deleteCustomPage(id, actor) {
  const objectId = asObjectId(id);
  if (!objectId) throw new Error('Page not found.');
  const db = await getDb();
  const page = await db.collection(PAGE_COLLECTION).findOne({ _id: objectId });
  if (!page) throw new Error('Page not found.');
  await db.collection(PAGE_COLLECTION).updateOne({ _id: objectId }, { $set: { status: 'deleted', slug: `${page.slug}--deleted-${Date.now()}`, deletedAt: new Date(), deletedBy: actor } });
  return page.slug;
}
