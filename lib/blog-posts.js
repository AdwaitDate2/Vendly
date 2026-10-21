import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getBlogResource } from './blogs';
import { slugify } from './catalog';
import { EMPTY_DOC, docToText, sanitizeRichDoc } from './rich-text';
import { getDb } from './mongodb';

const BLOG_POST_COLLECTION = 'blogPosts';
const MAX_BODY_JSON_LENGTH = 250_000;
let indexSetupPromise;

export const blogPostSchema = z.object({
  id: z.string().optional(),
  version: z.coerce.number().int().nonnegative().optional(),
  blogHandle: z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(2, 'Give the post a title.').max(160),
  handle: z.string().trim().max(100).optional().default(''),
  excerpt: z.string().trim().max(800).optional().default(''),
  body: z.string().max(MAX_BODY_JSON_LENGTH).optional().default(''),
  author: z.string().trim().max(120).optional().default(''),
  publishedAt: z.string().trim().max(40).optional().default(''),
  image: z.string().trim().max(1200).optional().default('').refine((value) => !value || (value.startsWith('/') && !value.startsWith('//')) || /^https?:\/\//i.test(value), 'Choose a valid image.'),
  imageAlt: z.string().trim().max(240).optional().default(''),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  seoTitle: z.string().trim().max(180).optional().default(''),
  seoDescription: z.string().trim().max(320).optional().default(''),
});

function asObjectId(value) {
  return typeof value === 'string' && ObjectId.isValid(value) ? new ObjectId(value) : null;
}

function sanitizeBody(value) {
  const source = String(value || '');
  if (!source) return structuredClone(EMPTY_DOC);
  if (source.length > MAX_BODY_JSON_LENGTH) throw new Error('The article body is too large.');
  let document;
  try {
    document = JSON.parse(source);
  } catch {
    throw new Error('The article body could not be read. Reopen the editor and try again.');
  }
  return sanitizeRichDoc(document);
}

function dateValue(value, fallback = null) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return fallback;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) throw new Error('Choose a valid publish date.');
  const parsed = new Date(`${trimmed}T12:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== trimmed) throw new Error('Choose a valid publish date.');
  return parsed;
}

function dateForForm(value) {
  if (!value) return '';
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : '';
}

function serializePost(post) {
  if (!post) return null;
  return {
    ...post,
    id: post._id.toString(),
    _id: undefined,
    body: sanitizeRichDoc(post.body),
    publishedAt: dateForForm(post.publishedAt),
    route: `/blogs/${post.blogHandle}/${post.handle}`,
  };
}

function serializePostSummary(post) {
  if (!post) return null;
  const { _id, ...summary } = post;
  delete summary.body;
  return {
    ...summary,
    id: _id.toString(),
    publishedAt: dateForForm(post.publishedAt),
    route: `/blogs/${post.blogHandle}/${post.handle}`,
  };
}

async function ensureIndexes(db) {
  if (!indexSetupPromise) {
    indexSetupPromise = db.collection(BLOG_POST_COLLECTION).createIndex(
      { blogHandle: 1, handle: 1 },
      { unique: true, name: 'blog_post_blog_handle_unique' },
    ).catch((error) => {
      indexSetupPromise = null;
      throw error;
    });
  }
  return indexSetupPromise;
}

function assertKnownBlog(blogHandle) {
  if (!getBlogResource(blogHandle)) throw new Error('Choose an available blog.');
}

async function uniqueHandle(db, blogHandle, base, excludeId) {
  const root = slugify(base).slice(0, 90) || 'post';
  let candidate = root;
  let suffix = 2;
  while (await db.collection(BLOG_POST_COLLECTION).findOne({
    blogHandle,
    handle: candidate,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }, { projection: { _id: 1 } })) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export async function listBlogPosts({ blogHandle = 'news', status = 'all', query = '' } = {}) {
  assertKnownBlog(blogHandle);
  const db = await getDb();
  const filter = { blogHandle, status: { $in: ['draft', 'published', 'archived'] } };
  if (['draft', 'published', 'archived'].includes(status)) filter.status = status;
  const safeQuery = String(query || '').trim().slice(0, 100);
  if (safeQuery) {
    const escapedQuery = safeQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matcher = new RegExp(escapedQuery, 'i');
    filter.$or = [{ title: matcher }, { handle: matcher }, { excerpt: matcher }, { author: matcher }];
  }
  const [documents, total] = await Promise.all([
    db.collection(BLOG_POST_COLLECTION).find(filter, { projection: { body: 0 } }).sort({ updatedAt: -1, _id: -1 }).limit(250).toArray(),
    db.collection(BLOG_POST_COLLECTION).countDocuments(filter),
  ]);
  return { items: documents.map(serializePostSummary), total };
}

export async function listPublishedBlogPosts(blogHandle) {
  try {
    assertKnownBlog(blogHandle);
    const db = await getDb();
    const now = new Date();
    const posts = await db.collection(BLOG_POST_COLLECTION)
      .find({ blogHandle, status: 'published', publishedAt: { $lte: now } })
      .project({ _id: 1, blogHandle: 1, handle: 1, title: 1, excerpt: 1, author: 1, publishedAt: 1, image: 1, imageAlt: 1 })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(100)
      .toArray();
    return posts.map((post) => ({
      id: post._id.toString(),
      blogHandle: post.blogHandle,
      handle: post.handle,
      title: post.title,
      excerpt: post.excerpt,
      description: post.excerpt,
      author: post.author,
      publishedAt: dateForForm(post.publishedAt),
      image: post.image,
      imageAlt: post.imageAlt,
      route: `/blogs/${post.blogHandle}/${post.handle}`,
    }));
  } catch {
    return [];
  }
}

export async function getPublishedBlogPost(blogHandle, handle) {
  try {
    assertKnownBlog(blogHandle);
    const db = await getDb();
    const now = new Date();
    return serializePost(await db.collection(BLOG_POST_COLLECTION).findOne({
      blogHandle,
      handle: String(handle || '').trim(),
      status: 'published',
      publishedAt: { $lte: now },
    }));
  } catch {
    return null;
  }
}

export async function getBlogPostById(id) {
  const objectId = asObjectId(id);
  if (!objectId) return null;
  const db = await getDb();
  return serializePost(await db.collection(BLOG_POST_COLLECTION).findOne({
    _id: objectId,
    status: { $ne: 'deleted' },
  }));
}

export async function createBlogPost(input, actor = 'unknown') {
  const parsed = blogPostSchema.parse(input);
  assertKnownBlog(parsed.blogHandle);
  const body = sanitizeBody(parsed.body);
  if (docToText(body).length > 100_000) throw new Error('The article body is too long.');
  if (parsed.status === 'published' && !docToText(body)) throw new Error('Add some post content before publishing.');
  const db = await getDb();
  await ensureIndexes(db);
  const now = new Date();
  const handle = await uniqueHandle(db, parsed.blogHandle, parsed.handle || parsed.title);
  const publishedAt = parsed.status === 'published' ? dateValue(parsed.publishedAt, now) : dateValue(parsed.publishedAt);
  const document = {
    blogHandle: parsed.blogHandle,
    title: parsed.title,
    handle,
    excerpt: parsed.excerpt,
    body,
    author: parsed.author,
    publishedAt,
    image: parsed.image,
    imageAlt: parsed.imageAlt,
    status: parsed.status,
    seoTitle: parsed.seoTitle,
    seoDescription: parsed.seoDescription,
    version: 1,
    createdAt: now,
    createdBy: actor,
    updatedAt: now,
    updatedBy: actor,
  };
  const result = await db.collection(BLOG_POST_COLLECTION).insertOne(document);
  return serializePost({ ...document, _id: result.insertedId });
}

export async function saveBlogPost(input, actor = 'unknown') {
  const parsed = blogPostSchema.parse(input);
  const objectId = asObjectId(parsed.id);
  if (!objectId) throw new Error('Blog post not found.');
  assertKnownBlog(parsed.blogHandle);
  const body = sanitizeBody(parsed.body);
  if (docToText(body).length > 100_000) throw new Error('The article body is too long.');
  if (parsed.status === 'published' && !docToText(body)) throw new Error('Add some post content before publishing.');

  const db = await getDb();
  await ensureIndexes(db);
  const collection = db.collection(BLOG_POST_COLLECTION);
  const previous = await collection.findOne({ _id: objectId, status: { $ne: 'deleted' } });
  if (!previous) throw new Error('Blog post not found.');
  const handle = await uniqueHandle(db, parsed.blogHandle, parsed.handle || parsed.title, objectId);
  const publishedAt = parsed.status === 'published'
    ? dateValue(parsed.publishedAt, previous.publishedAt || new Date())
    : dateValue(parsed.publishedAt, previous.publishedAt || null);
  const currentVersion = Number(previous.version || 0);
  const expectedVersion = parsed.version ?? currentVersion;
  if (expectedVersion !== currentVersion) {
    const error = new Error('This blog post changed in another session. Reload before saving.');
    error.code = 'VERSION_CONFLICT';
    throw error;
  }
  const result = await collection.updateOne({ _id: objectId, version: expectedVersion }, {
    $set: {
      blogHandle: parsed.blogHandle,
      title: parsed.title,
      handle,
      excerpt: parsed.excerpt,
      body,
      author: parsed.author,
      publishedAt,
      image: parsed.image,
      imageAlt: parsed.imageAlt,
      status: parsed.status,
      seoTitle: parsed.seoTitle,
      seoDescription: parsed.seoDescription,
      updatedAt: new Date(),
      updatedBy: actor,
    },
    $inc: { version: 1 },
  });
  if (!result.matchedCount) {
    const error = new Error('This blog post changed in another session. Reload before saving.');
    error.code = 'VERSION_CONFLICT';
    throw error;
  }
  return { post: await getBlogPostById(parsed.id), previousHandle: previous.handle };
}
