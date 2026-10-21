import { resolveAssetPath } from './asset-paths';
import { getDb } from './mongodb';
import { createStorage } from './storage';

const MEDIA_METADATA_COLLECTION = 'mediaMetadata';

/**
 * Canonicalize aliases and absolute app URLs so one file keeps the same metadata regardless of
 * whether it was selected as /images/foo.jpg or /api/assets/ast_… .
 */
export function canonicalMediaSource(source) {
  const rawSource = String(source || '').trim();
  if (!rawSource || rawSource.length > 2048) return '';

  const normalizedSource = rawSource.split(/[?#]/, 1)[0];
  const resolvedSource = resolveAssetPath(normalizedSource);
  if (resolvedSource.startsWith('/api/assets/')) {
    const assetId = resolvedSource.match(/^\/api\/assets\/(ast_[A-Za-z0-9_-]+)(?:$|[/?#])/i)?.[1];
    return assetId ? `/api/assets/${assetId}` : '';
  }

  if (resolvedSource.startsWith('/')) {
    if (resolvedSource.startsWith('//')) return '';
    const path = resolvedSource.split(/[?#]/, 1)[0];
    return path && !path.includes('\\') ? path : '';
  }

  try {
    const parsedUrl = new URL(resolvedSource);
    if (!['https:', 'http:'].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) return '';
    const assetId = parsedUrl.pathname.match(/^\/api\/assets\/(ast_[A-Za-z0-9_-]+)(?:$|\/)/i)?.[1];
    if (assetId) return `/api/assets/${assetId}`;
    parsedUrl.search = '';
    parsedUrl.hash = '';
    return parsedUrl.toString();
  } catch {
    return '';
  }
}

/** Read saved alt text keyed by each original source supplied by the picker. */
export async function getMediaAltTextBySources(sources) {
  const sourceKeys = new Map();
  for (const source of Array.isArray(sources) ? sources : []) {
    const rawSource = String(source || '').trim();
    const canonicalSource = canonicalMediaSource(rawSource);
    if (canonicalSource) sourceKeys.set(rawSource, canonicalSource);
  }
  if (!sourceKeys.size) return {};

  const db = await getDb();
  const metadata = await db.collection(MEDIA_METADATA_COLLECTION)
    .find({ _id: { $in: [...new Set(sourceKeys.values())] } }, { projection: { altText: 1 } })
    .toArray();
  const altTextByCanonicalSource = new Map(metadata.map((item) => [item._id, item.altText || '']));
  return Object.fromEntries([...sourceKeys].map(([source, key]) => [source, altTextByCanonicalSource.get(key) || '']));
}

/** Read saved video cover sources keyed by each original video source supplied by the caller. */
export async function getMediaCoverImageBySources(sources) {
  const sourceKeys = new Map();
  for (const source of Array.isArray(sources) ? sources : []) {
    const rawSource = String(source || '').trim();
    const canonicalSource = canonicalMediaSource(rawSource);
    if (canonicalSource) sourceKeys.set(rawSource, canonicalSource);
  }
  if (!sourceKeys.size) return {};

  const db = await getDb();
  const metadata = await db.collection(MEDIA_METADATA_COLLECTION)
    .find({ _id: { $in: [...new Set(sourceKeys.values())] } }, { projection: { coverImageSource: 1 } })
    .toArray();
  const coverImagesByCanonicalSource = new Map(metadata.map((item) => [item._id, item.coverImageSource || '']));
  return Object.fromEntries([...sourceKeys].map(([source, key]) => [source, coverImagesByCanonicalSource.get(key) || '']));
}

/** Read reusable focal points keyed by the caller's original image sources. */
export async function getMediaFocalPointBySources(sources) {
  const sourceKeys = new Map();
  for (const source of Array.isArray(sources) ? sources : []) {
    const rawSource = String(source || '').trim();
    const canonicalSource = canonicalMediaSource(rawSource);
    if (canonicalSource) sourceKeys.set(rawSource, canonicalSource);
  }
  if (!sourceKeys.size) return {};

  const db = await getDb();
  const metadata = await db.collection(MEDIA_METADATA_COLLECTION)
    .find({ _id: { $in: [...new Set(sourceKeys.values())] } }, { projection: { focalPoint: 1 } })
    .toArray();
  const focalPointsByCanonicalSource = new Map(metadata.map((item) => [item._id, item.focalPoint || null]));
  return Object.fromEntries([...sourceKeys].map(([source, key]) => [source, focalPointsByCanonicalSource.get(key) || null]));
}

/** Read editable display names keyed by each source supplied by the media list or picker. */
export async function getMediaDisplayNamesBySources(sources) {
  const sourceKeys = new Map();
  for (const source of Array.isArray(sources) ? sources : []) {
    const rawSource = String(source || '').trim();
    const canonicalSource = canonicalMediaSource(rawSource);
    if (canonicalSource?.startsWith('/api/assets/')) sourceKeys.set(rawSource, canonicalSource);
  }
  if (!sourceKeys.size) return {};

  const db = await getDb();
  const metadata = await db.collection(MEDIA_METADATA_COLLECTION)
    .find({ _id: { $in: [...new Set(sourceKeys.values())] } }, { projection: { displayName: 1 } })
    .toArray();
  const displayNamesByCanonicalSource = new Map(metadata.map((item) => [item._id, item.displayName || '']));
  return Object.fromEntries([...sourceKeys].map(([source, key]) => [source, displayNamesByCanonicalSource.get(key) || '']));
}

/** Resolve and validate a selected asset source without accepting arbitrary external URLs. */
async function requireMediaAsset(source, expectedKind) {
  const rawSource = String(source || '').trim();
  const canonicalSource = canonicalMediaSource(rawSource);
  const assetId = canonicalSource.match(/^\/api\/assets\/(ast_[A-Za-z0-9_-]+)$/i)?.[1];

  // Theme file aliases are accepted only when they resolve to a managed asset. All other paths
  // and arbitrary remote URLs are rejected before any storage lookup.
  if (!assetId) {
    throw new Error(`Choose an existing ${expectedKind} file.`);
  }

  const asset = await createStorage().assets.get(assetId);
  const contentType = String(asset?.contentType || '').toLowerCase().split(';', 1)[0];
  const detectedContentType = String(asset?.detectedContentType || '').toLowerCase().split(';', 1)[0];
  if (!asset || asset.status === 'deleted' || !contentType.startsWith(`${expectedKind}/`)) {
    throw new Error(`Choose an existing ${expectedKind} file.`);
  }
  if (detectedContentType && !detectedContentType.startsWith(`${expectedKind}/`)) {
    throw new Error(`Choose an existing ${expectedKind} file.`);
  }

  return canonicalSource;
}

/** Persist media metadata in MongoDB because the asset storage API does not expose custom fields. */
export async function saveMediaAltText(source, altText, actor) {
  const canonicalSource = canonicalMediaSource(source);
  if (!canonicalSource) throw new Error('Choose a valid media file before saving alt text.');
  const db = await getDb();
  const savedAltText = String(altText || '').trim();
  await db.collection(MEDIA_METADATA_COLLECTION).updateOne(
    { _id: canonicalSource },
    { $set: { source: canonicalSource, altText: savedAltText, updatedAt: new Date(), updatedBy: String(actor || '') } },
    { upsert: true },
  );
  return savedAltText;
}

export async function ensureMediaMetadataIndexes() {
  const db = await getDb();
  await db.collection(MEDIA_METADATA_COLLECTION).createIndex({ displayName: 'text', altText: 'text' }, { name: 'media_display_alt_text' }).catch(() => {});
  await db.collection(MEDIA_METADATA_COLLECTION).createIndex({ coverImageSource: 1 }, { name: 'media_cover_source' }).catch(() => {});
  await db.collection(MEDIA_METADATA_COLLECTION).createIndex({ focalPoint: 1 }, { name: 'media_focal' }).catch(() => {});
  return { mediaMetadata: MEDIA_METADATA_COLLECTION };
}

/** Indexed display-name search replacing full-scan join where possible. */
export async function searchMediaDisplayNames(query, limit = 50) {
  const q = String(query || '').trim();
  if (!q) return [];
  const db = await getDb();
  try {
    const results = await db.collection(MEDIA_METADATA_COLLECTION)
      .find({ $text: { $search: q } }, { projection: { displayName: 1, score: { $meta: 'textScore' } } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(Math.min(100, Math.max(1, limit)))
      .toArray();
    if (results.length) return results.map((r) => r._id);
  } catch {}
  // Fallback regex when text index missing
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const results = await db.collection(MEDIA_METADATA_COLLECTION)
    .find({ displayName: { $regex: escaped, $options: 'i' } }, { projection: { _id: 1 } })
    .limit(Math.min(100, Math.max(1, limit)))
    .toArray();
  return results.map((r) => r._id);
}

/** Save an editable label on an existing managed image or video without renaming its asset. */
export async function saveMediaDisplayName(source, displayName, actor) {
  const canonicalSource = canonicalMediaSource(source);
  const assetId = canonicalSource.match(/^\/api\/assets\/(ast_[A-Za-z0-9_-]+)$/i)?.[1];
  if (!assetId) throw new Error('Choose an existing uploaded image or video.');

  const asset = await createStorage().assets.get(assetId);
  const contentType = String(asset?.contentType || '').toLowerCase().split(';', 1)[0];
  const detectedContentType = String(asset?.detectedContentType || '').toLowerCase().split(';', 1)[0];
  const mediaKind = contentType.startsWith('image/') ? 'image' : contentType.startsWith('video/') ? 'video' : '';
  if (!asset || asset.status === 'deleted' || !mediaKind || (detectedContentType && !detectedContentType.startsWith(`${mediaKind}/`))) {
    throw new Error('Choose an existing uploaded image or video.');
  }

  const requestedName = String(displayName ?? '').trim();
  if (!requestedName) throw new Error('Name can’t be empty.');
  if (requestedName.length > 512) throw new Error('Name must be 512 characters or fewer.');
  if (/[\\/\u0000-\u001f\u007f]/.test(requestedName)) throw new Error('Name can’t contain slashes or control characters.');

  const originalName = String(asset.originalName || '').trim();
  const extensionMatch = originalName.match(/(\.[^.\s]+)$/);
  const extension = extensionMatch?.[1] || '';
  let normalizedName = requestedName;
  if (extension) {
    const suppliedExtension = requestedName.match(/(\.[^.\s]+)$/)?.[1] || '';
    if (suppliedExtension && suppliedExtension.toLowerCase() !== extension.toLowerCase()) {
      throw new Error(`Keep the original ${extension} file extension.`);
    }
    normalizedName = suppliedExtension
      ? `${requestedName.slice(0, -suppliedExtension.length)}${extension}`
      : `${requestedName}${extension}`;
  }
  if (normalizedName.length > 512) throw new Error('Name must be 512 characters or fewer.');

  const db = await getDb();
  await db.collection(MEDIA_METADATA_COLLECTION).updateOne(
    { _id: canonicalSource },
    { $set: { source: canonicalSource, displayName: normalizedName, updatedAt: new Date(), updatedBy: String(actor || '') } },
    { upsert: true },
  );
  return normalizedName;
}

/** Save normalized focal coordinates for an existing image without modifying its asset bytes. */
export async function saveMediaFocalPoint(source, focalPoint, actor) {
  const canonicalSource = await requireMediaAsset(source, 'image');
  if (!focalPoint || typeof focalPoint !== 'object' || Array.isArray(focalPoint)) {
    throw new Error('Choose a valid focal point.');
  }
  const { x, y } = focalPoint;
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) {
    throw new Error('Focal point coordinates must be between 0 and 1.');
  }
  const savedFocalPoint = { x: Math.round(x * 10000) / 10000, y: Math.round(y * 10000) / 10000 };
  const db = await getDb();
  await db.collection(MEDIA_METADATA_COLLECTION).updateOne(
    { _id: canonicalSource },
    { $set: { source: canonicalSource, focalPoint: savedFocalPoint, updatedAt: new Date(), updatedBy: String(actor || '') } },
    { upsert: true },
  );
  return savedFocalPoint;
}

/** Save or clear the reusable cover image associated with an existing video asset. */
export async function saveMediaCoverImage(videoSource, imageSource, actor) {
  const canonicalVideoSource = await requireMediaAsset(videoSource, 'video');
  const rawImageSource = String(imageSource ?? '').trim();
  const canonicalImageSource = rawImageSource
    ? await requireMediaAsset(rawImageSource, 'image')
    : '';

  const update = {
    $set: {
      source: canonicalVideoSource,
      updatedAt: new Date(),
      updatedBy: String(actor || ''),
    },
  };
  if (canonicalImageSource) update.$set.coverImageSource = canonicalImageSource;
  else update.$unset = { coverImageSource: '' };

  const db = await getDb();
  await db.collection(MEDIA_METADATA_COLLECTION).updateOne(
    { _id: canonicalVideoSource },
    update,
    { upsert: true },
  );
  return canonicalImageSource;
}
