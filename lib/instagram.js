import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { getDb } from './mongodb';
import { createStorage } from './storage';
import { putOriginalToSession } from './storage-proxy';
import { DEFAULT_FEED } from './instagram-defaults';

export { DEFAULT_FEED };

const COLLECTION = 'instagramFeed';
const FEED_ID = 'feed';
const MAX_POSTS = 24;
const COVER_FOLDER = '/instagram/';

// Instagram only returns link-preview tags (cover image, caption) to crawler user agents.
const PREVIEW_USER_AGENT = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';

const instagramUrl = z.string().trim().url('Paste a full Instagram link.').refine((value) => /^https:\/\/(www\.)?instagram\.com\//i.test(value), 'Links must start with https://www.instagram.com/');

export const feedSchema = z.object({
  eyebrow: z.string().trim().max(60).default(''),
  heading: z.string().trim().min(1, 'Add a heading.').max(120),
  profileUrl: instagramUrl,
  posts: z.array(z.object({
    id: z.string().trim().min(1).max(40),
    url: instagramUrl,
    image: z.string().trim().min(1, 'Every post needs a cover image.').max(500),
    alt: z.string().trim().max(200).default(''),
    isVideo: z.boolean().default(false),
    hidden: z.boolean().default(false),
  })).max(MAX_POSTS, `Keep the feed to ${MAX_POSTS} posts or fewer.`),
});

/** The saved feed, or the original eight posts until one is saved. */
export async function getInstagramFeed() {
  try {
    const db = await getDb();
    const saved = await db.collection(COLLECTION).findOne({ _id: FEED_ID });
    if (!saved) return DEFAULT_FEED;
    const parsed = feedSchema.safeParse(saved);
    return parsed.success ? parsed.data : DEFAULT_FEED;
  } catch {
    return DEFAULT_FEED;
  }
}

export async function saveInstagramFeed(input, actor) {
  const feed = feedSchema.parse(input);
  const db = await getDb();
  await db.collection(COLLECTION).updateOne({ _id: FEED_ID }, { $set: { ...feed, updatedAt: new Date(), updatedBy: actor } }, { upsert: true });
  return feed;
}

/** Normalises a pasted post/reel link and says whether it is a video. Returns null for anything else. */
export function parsePostUrl(value) {
  let url;
  try {
    url = new URL(String(value || '').trim());
  } catch {
    return null;
  }
  if (!/^(www\.)?instagram\.com$/i.test(url.hostname)) return null;
  const match = url.pathname.match(/^\/(?:[A-Za-z0-9._]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);
  if (!match) return null;
  const kind = match[1] === 'p' ? 'p' : 'reel';
  return { url: `https://www.instagram.com/${kind}/${match[2]}/`, shortcode: match[2], isVideo: kind !== 'p' };
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function metaTag(html, property) {
  const match = html.match(new RegExp(`<meta[^>]+property="${property}"[^>]+content="([^"]*)"`, 'i'));
  return match ? decodeEntities(match[1]) : '';
}

/** The caption text from og:title, e.g. `Name on Instagram: "caption…"` → `caption…`. */
function captionFrom(title) {
  const quoted = title.match(/on Instagram:\s*"([\s\S]*)/i);
  const text = (quoted ? quoted[1] : title).replace(/"\s*$/, '').replace(/\s+/g, ' ').trim();
  return text.length > 140 ? `${text.slice(0, 137).trimEnd()}…` : text;
}

async function copyCoverToStorage(imageUrl, shortcode) {
  const response = await fetch(imageUrl, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok || !contentType.startsWith('image/')) throw new Error('cover download failed');
  const body = await response.arrayBuffer();
  const storage = createStorage();
  const session = await storage.uploads.create({ filename: `instagram-${shortcode}.jpg`, contentType: contentType.split(';')[0], sizeBytes: body.byteLength, visibility: 'public', folder: COVER_FOLDER });
  const put = await putOriginalToSession(session, body);
  if (!put.ok) throw new Error('cover upload failed');
  const asset = await put.json();
  return `/api/assets/${asset.id}`;
}

/**
 * Reads a post or reel link and saves its cover to Kenmark Storage (Instagram image links expire).
 * Always returns a post; `image` is empty and `warning` is set when the cover could not be fetched.
 */
export async function buildPostFromLink(link) {
  const parsed = parsePostUrl(link);
  if (!parsed) return { error: 'Paste a link to an Instagram post or reel, e.g. https://www.instagram.com/reel/…' };
  const post = { id: `ig-${randomBytes(4).toString('hex')}`, url: parsed.url, image: '', alt: parsed.isVideo ? 'byShreen Reel on Instagram' : 'byShreen on Instagram', isVideo: parsed.isVideo, hidden: false };
  try {
    const response = await fetch(parsed.url, { headers: { 'User-Agent': PREVIEW_USER_AGENT, 'Accept-Language': 'en-US' }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
    const html = response.ok ? await response.text() : '';
    const image = metaTag(html, 'og:image');
    const caption = captionFrom(metaTag(html, 'og:title'));
    if (caption) post.alt = caption;
    if (metaTag(html, 'og:video') || /\/reel\//.test(metaTag(html, 'og:url'))) post.isVideo = true;
    if (!image) return { post, warning: 'Instagram didn’t share a cover for this link (it may be private or removed). Upload a cover image instead.' };
    post.image = await copyCoverToStorage(image, parsed.shortcode);
    return { post };
  } catch {
    return { post, warning: 'We couldn’t fetch the cover from Instagram right now. Upload a cover image, or try again in a minute.' };
  }
}
