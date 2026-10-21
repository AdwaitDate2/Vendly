'use server';

import { requireAdminPermission } from './admin-auth';
import { listProducts } from './catalog';
import { findMediaUsage, findMediaUsageBySources } from './media-usage';
import { getMediaAltTextBySources, getMediaCoverImageBySources, getMediaDisplayNamesBySources, getMediaFocalPointBySources, saveMediaAltText, saveMediaCoverImage, saveMediaDisplayName, saveMediaFocalPoint } from './media-metadata';
import { canonicalManagedImageSource, normalizeMediaFocalPoint } from './media-focal-points';
import { createStorage } from './storage';

const MEDIA_LIBRARY_UPLOAD_FOLDER = '/admin-uploads/';
const MEDIA_LIBRARY_ASSET_PAGE_SIZE = 200;
const MEDIA_LIBRARY_MAX_ASSETS = 5000;
const MEDIA_LIBRARY_FILE_TYPES = new Set(['image', 'video', 'model', 'other']);
const MEDIA_LIBRARY_SORT_KEYS = new Set(['fileName', 'dateAdded', 'size']);

function classifyLibraryAsset(asset) {
  const contentType = String(asset?.contentType || '').toLowerCase().split(';', 1)[0];
  const fileExtension = String(asset?.originalName || '').split('.').at(-1)?.toLowerCase();
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('model/') || contentType === 'application/vnd.usdz+zip' || ['glb', 'gltf', 'usdz'].includes(fileExtension)) return 'model';
  return 'other';
}

function parseOptionalMediaNumber(value) {
  if (value === '' || value == null) return null;
  if (typeof value !== 'string' && typeof value !== 'number') return NaN;
  const normalized = typeof value === 'string' ? value.trim() : value;
  if (normalized === '') return null;
  if (typeof normalized === 'string' && !/^\d+(?:\.\d{1,3})?$/.test(normalized)) return NaN;
  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 && number <= 1000000 ? number : NaN;
}

/**
 * Search, filter, and sort the complete uploaded-file collection before returning a 50-row page.
 * This intentionally has a hard collection bound: an incomplete scan must never masquerade as a
 * global filter result. The caller receives a clear error when the storage listing exceeds it.
 */
export async function queryMediaLibraryAction(input = {}) {
  await requireAdminPermission('content:write');

  const page = input?.page ?? 1;
  const pageSize = input?.pageSize ?? 50;
  const search = typeof input?.search === 'string' ? input.search.trim().slice(0, 200).toLocaleLowerCase() : '';
  const sortKey = MEDIA_LIBRARY_SORT_KEYS.has(input?.sortKey) ? input.sortKey : 'dateAdded';
  const direction = input?.direction === 'ascending' ? 'ascending' : 'descending';
  const filters = input?.filters && typeof input.filters === 'object' ? input.filters : {};
  const fileType = MEDIA_LIBRARY_FILE_TYPES.has(filters.fileType) ? filters.fileType : 'all';
  const fileTypeOperator = filters.fileTypeOperator === 'is-not' ? 'is-not' : 'is';
  const minimumSizeMb = parseOptionalMediaNumber(filters.minimumSizeMb);
  const maximumSizeMb = parseOptionalMediaNumber(filters.maximumSizeMb);
  const usageCategory = ['product', 'other', 'unused'].includes(filters.usageCategory) ? filters.usageCategory : 'all';
  const usageOperator = filters.usageOperator === 'is-not' ? 'is-not' : 'is';
  const usageProductIds = Array.isArray(filters.usageProductIds)
    ? [...new Set(filters.usageProductIds.filter((id) => typeof id === 'string' && id.length <= 128))].slice(0, 100)
    : [];
  const altCondition = ['filled', 'empty'].includes(filters.altCondition) ? filters.altCondition : 'all';
  const altOperator = filters.altOperator === 'is-not' ? 'is-not' : 'is';

  if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || !Number.isSafeInteger(pageSize) || pageSize !== 50
    || Number.isNaN(minimumSizeMb) || Number.isNaN(maximumSizeMb)
    || (minimumSizeMb !== null && maximumSizeMb !== null && minimumSizeMb > maximumSizeMb)) {
    return { ok: false, error: 'Check the page and filter values, then try again.' };
  }

  try {
    // Fast path: when search is over originalName only, try server pushdown first.
    // Display-name search requires sidecar join (below); we fall back to scan then.
    const needsDisplayNameSearch = Boolean(search);
    const hasComplexFilters = fileType !== 'all' || minimumSizeMb !== null || maximumSizeMb !== null
      || usageCategory !== 'all' || altCondition !== 'all';
    if (!needsDisplayNameSearch && !hasComplexFilters && (sortKey === 'dateAdded' || sortKey === 'fileName')) {
      try {
        const storage = createStorage();
        const directionParam = direction === 'ascending' ? 'asc' : 'desc';
        const sortParam = sortKey === 'fileName' ? 'originalName' : 'createdAt';
        const listing = await storage.assets.list({
          folder: MEDIA_LIBRARY_UPLOAD_FOLDER,
          visibility: 'public',
          limit: 50,
          page,
          search: search || undefined,
          sortBy: sortParam,
          sortOrder: directionParam,
        });
        const items = (listing.items || []).filter((a) => a?.status !== 'deleted');
        if (Array.isArray(items) && typeof listing.total === 'number') {
          const sources = items.map((asset) => `/api/assets/${asset.id}`);
          const [displayNameBySource, altTextBySource, usageBySource] = await Promise.all([
            getMediaDisplayNamesBySources(sources),
            getMediaAltTextBySources(sources),
            findMediaUsageBySources(sources),
          ]);
          const decorated = items.map((asset, index) => {
            const source = sources[index];
            return {
              id: asset.id, src: source,
              label: displayNameBySource[source] || asset.originalName || 'Uploaded file',
              createdAt: asset.createdAt || null, updatedAt: asset.updatedAt || null,
              kind: classifyLibraryAsset(asset), originalName: asset.originalName || '',
              contentType: asset.contentType || '', sizeBytes: Number(asset.sizeBytes) || 0,
              width: asset.image?.width || null, height: asset.image?.height || null,
              altText: altTextBySource[source] || '', usage: usageBySource[source] || [],
            };
          });
          return { ok: true, items: decorated, total: listing.total, totalPages: listing.totalPages ?? Math.ceil(listing.total / 50), page, pageSize, scanned: listing.total, capped: false };
        }
      } catch {
        // Fall through to full scan
      }
    }
    const storage = createStorage();
    const assets = [];
    const seenCursors = new Set();
    let cursor;
    let hasMore = true;

    while (hasMore) {
      const listing = await storage.assets.list({
        folder: MEDIA_LIBRARY_UPLOAD_FOLDER,
        visibility: 'public',
        limit: MEDIA_LIBRARY_ASSET_PAGE_SIZE,
        ...(cursor ? { cursor } : {}),
      });
      for (const asset of listing.items || []) {
        if (asset?.status !== 'deleted') assets.push(asset);
      }
      hasMore = Boolean(listing.hasMore);
      const nextCursor = listing.nextCursor;
      if (!hasMore) break;
      if (typeof nextCursor !== 'string' || !nextCursor || seenCursors.has(nextCursor)) {
        return { ok: false, error: 'The storage listing did not return a complete page sequence. Retry the filters.' };
      }
      seenCursors.add(nextCursor);
      cursor = nextCursor;
      if (assets.length > MEDIA_LIBRARY_MAX_ASSETS || seenCursors.size >= Math.ceil(MEDIA_LIBRARY_MAX_ASSETS / MEDIA_LIBRARY_ASSET_PAGE_SIZE)) {
        return { ok: false, error: `Global filters are temporarily limited to ${MEDIA_LIBRARY_MAX_ASSETS.toLocaleString()} uploads. No partial results were shown.` };
      }
    }

    if (assets.length > MEDIA_LIBRARY_MAX_ASSETS) {
      return { ok: false, error: `Global filters are temporarily limited to ${MEDIA_LIBRARY_MAX_ASSETS.toLocaleString()} uploads. No partial results were shown.` };
    }

    const sources = assets.map((asset) => `/api/assets/${asset.id}`);
    const [displayNameBySource, altTextBySource, usageBySource] = await Promise.all([
      getMediaDisplayNamesBySources(sources),
      getMediaAltTextBySources(sources),
      findMediaUsageBySources(sources),
    ]);
    const decorated = assets.map((asset, index) => {
      const source = sources[index];
      const kind = classifyLibraryAsset(asset);
      const usage = usageBySource[source] || [];
      return {
        id: asset.id,
        src: source,
        label: displayNameBySource[source] || asset.originalName || 'Uploaded file',
        createdAt: asset.createdAt || null,
        updatedAt: asset.updatedAt || null,
        kind,
        originalName: asset.originalName || '',
        contentType: asset.contentType || '',
        sizeBytes: Number(asset.sizeBytes) || 0,
        width: asset.image?.width || null,
        height: asset.image?.height || null,
        altText: altTextBySource[source] || '',
        usage,
      };
    });

    const matchingAssets = decorated.filter((asset) => {
      if (search && !`${asset.label} ${asset.originalName}`.toLocaleLowerCase().includes(search)) return false;
      if (fileType !== 'all' && (fileTypeOperator === 'is' ? asset.kind !== fileType : asset.kind === fileType)) return false;
      if ((minimumSizeMb !== null || maximumSizeMb !== null) && !asset.sizeBytes) return false;
      const sizeMb = asset.sizeBytes / (1024 * 1024);
      if (minimumSizeMb !== null && sizeMb < minimumSizeMb) return false;
      if (maximumSizeMb !== null && sizeMb > maximumSizeMb) return false;
      if (usageCategory !== 'all') {
        const matchesUsage = usageCategory === 'unused'
          ? asset.usage.length === 0
          : asset.usage.some((reference) => usageCategory === 'product'
            ? reference.category === 'product-media' && (!usageProductIds.length || usageProductIds.includes(String(reference.productId || '')))
            : reference.category !== 'product-media');
        if (usageOperator === 'is' ? !matchesUsage : matchesUsage) return false;
      }
      if (altCondition !== 'all') {
        const isFilled = Boolean(asset.altText.trim());
        const matchesAlt = altCondition === 'filled' ? isFilled : !isFilled;
        if (altOperator === 'is' ? !matchesAlt : matchesAlt) return false;
      }
      return true;
    });

    matchingAssets.sort((first, second) => {
      let comparison = 0;
      if (sortKey === 'fileName') comparison = first.label.localeCompare(second.label, undefined, { sensitivity: 'base' });
      else if (sortKey === 'size') comparison = first.sizeBytes - second.sizeBytes;
      else comparison = new Date(first.createdAt || 0).getTime() - new Date(second.createdAt || 0).getTime();
      if (!comparison) comparison = first.id.localeCompare(second.id);
      return direction === 'ascending' ? comparison : -comparison;
    });

    const total = matchingAssets.length;
    const totalPages = Math.ceil(total / pageSize);
    const safePage = totalPages ? Math.min(page, totalPages) : 1;
    return {
      ok: true,
      items: matchingAssets.slice((safePage - 1) * pageSize, safePage * pageSize),
      total,
      totalPages,
      page: safePage,
      pageSize,
      scanned: assets.length,
      capped: false,
    };
  } catch {
    return { ok: false, error: 'Could not load the complete file collection for global filtering. Retry the request.' };
  }
}

/** Where an uploaded file is used, so the admin can warn before deleting it. */
export async function mediaUsageAction(src) {
  await requireAdminPermission('content:write');
  try {
    return { ok: true, usage: await findMediaUsage(String(src || '')) };
  } catch {
    return { ok: false, usage: [] };
  }
}

/** Resolve usage for a page of picker files in one set of catalog/content reads. */
export async function mediaUsageBySourcesAction(sources) {
  await requireAdminPermission('content:write');
  try {
    const uniqueSources = [...new Set((Array.isArray(sources) ? sources : []).map((source) => String(source || '').trim()).filter(Boolean))].slice(0, 500);
    return { ok: true, usageBySource: await findMediaUsageBySources(uniqueSources) };
  } catch {
    return { ok: false, usageBySource: {} };
  }
}

/** Search the catalog independently of the currently loaded media page for the picker filter. */
export async function searchMediaProductsAction(query = '', page = 1) {
  await requireAdminPermission('content:write');

  const validQuery = typeof query === 'string' || query == null;
  const normalizedQuery = validQuery ? String(query || '').trim().slice(0, 80) : '';
  const numericPage = typeof page === 'number' ? page : typeof page === 'string' && /^\d+$/.test(page) ? Number(page) : NaN;
  if (!validQuery || !Number.isSafeInteger(numericPage) || numericPage < 1 || numericPage > 10000) {
    return { ok: false, error: 'Invalid product search.' };
  }

  try {
    const result = await listProducts({ query: normalizedQuery, status: 'all', page: numericPage, pageSize: 30 });
    return {
      ok: true,
      items: result.items.map((product) => ({
        id: product.id,
        title: product.title,
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      pages: result.pages,
    };
  } catch {
    return { ok: false, error: 'Could not search products. Try again.' };
  }
}

/** Read saved alt text for media library cards and the selected file inspector. */
export async function mediaAltTextBySourcesAction(sources) {
  await requireAdminPermission('content:write');
  try {
    const uniqueSources = [...new Set((Array.isArray(sources) ? sources : []).map((source) => String(source || '').trim()).filter(Boolean))].slice(0, 500);
    return { ok: true, altTextBySource: await getMediaAltTextBySources(uniqueSources) };
  } catch {
    return { ok: false, altTextBySource: {} };
  }
}

/** Save alt text to durable media metadata without changing the existing asset URL. */
export async function saveMediaAltTextAction(source, altText) {
  const session = await requireAdminPermission('content:write');
  const safeAltText = String(altText ?? '').trim();
  if (safeAltText.length > 500) return { ok: false, error: 'Alt text must be 500 characters or fewer.' };
  try {
    const savedAltText = await saveMediaAltText(source, safeAltText, session.email);
    return { ok: true, altText: savedAltText };
  } catch {
    return { ok: false, error: 'Could not save alt text. Try again.' };
  }
}

/** Save an editable display name without changing the storage provider's original filename. */
export async function saveMediaDisplayNameAction(source, displayName) {
  const session = await requireAdminPermission('content:write');
  if (typeof displayName !== 'string' || displayName.length > 2048) {
    return { ok: false, error: 'Name must be 512 characters or fewer.' };
  }
  try {
    const savedDisplayName = await saveMediaDisplayName(source, displayName, session.email);
    return { ok: true, displayName: savedDisplayName };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Could not save name. Try again.' };
  }
}

/** Read reusable cover images for a page of video sources. */
export async function mediaCoverImageBySourcesAction(sources) {
  await requireAdminPermission('content:write');
  try {
    const uniqueSources = [...new Set((Array.isArray(sources) ? sources : []).map((source) => String(source || '').trim()).filter(Boolean))].slice(0, 500);
    return { ok: true, coverImageBySource: await getMediaCoverImageBySources(uniqueSources) };
  } catch {
    return { ok: false, coverImageBySource: {} };
  }
}

/** Save or clear a video's reusable media-library cover image. */
export async function saveMediaCoverImageAction(videoSource, imageSource) {
  const session = await requireAdminPermission('content:write');
  try {
    const coverImageSource = await saveMediaCoverImage(videoSource, imageSource, session.email);
    return { ok: true, coverImageSource };
  } catch {
    return { ok: false, coverImageSource: '', error: 'Choose an existing video and image file, then try again.' };
  }
}

/** Read a reusable focal point for the full-screen image editor. */
export async function mediaFocalPointBySourceAction(source) {
  await requireAdminPermission('content:write');
  const normalizedSource = typeof source === 'string' ? source.trim() : '';
  if (!normalizedSource || normalizedSource.length > 2048) {
    return { ok: false, focalPoint: null, error: 'Choose a valid image file.' };
  }
  try {
    const focalPoints = await getMediaFocalPointBySources([normalizedSource]);
    const focalPoint = focalPoints[normalizedSource];
    if (!focalPoint || !Number.isFinite(focalPoint.x) || !Number.isFinite(focalPoint.y)
      || focalPoint.x < 0 || focalPoint.x > 1 || focalPoint.y < 0 || focalPoint.y > 1) {
      return { ok: true, focalPoint: null };
    }
    return { ok: true, focalPoint: { x: focalPoint.x, y: focalPoint.y } };
  } catch {
    return { ok: false, focalPoint: null, error: 'Could not load the saved focal point.' };
  }
}

/** Read focal metadata for a preview's current managed image sources in one permission-checked batch. */
export async function mediaFocalPointsBySourcesAction(sources) {
  await requireAdminPermission('content:write');
  if (!Array.isArray(sources) || sources.length > 500) {
    return { ok: false, focalPointBySource: {}, error: 'Invalid image source list.' };
  }
  const canonicalSources = [...new Set(sources
    .filter((source) => typeof source === 'string' && source.length <= 2048)
    .map(canonicalManagedImageSource)
    .filter(Boolean))];
  if (!canonicalSources.length) return { ok: true, focalPointBySource: {} };
  try {
    const focalPoints = await getMediaFocalPointBySources(canonicalSources);
    const focalPointBySource = Object.fromEntries(canonicalSources.flatMap((source) => {
      const focalPoint = normalizeMediaFocalPoint(focalPoints[source]);
      return focalPoint ? [[source, focalPoint]] : [];
    }));
    return { ok: true, focalPointBySource };
  } catch {
    return { ok: false, focalPointBySource: {}, error: 'Could not load image focal points.' };
  }
}

/** Public storefront read for cart images; only public, existing image assets are eligible. */
export async function publicMediaFocalPointsBySourcesAction(sources) {
  if (!Array.isArray(sources) || sources.length > 50) {
    return { ok: false, focalPointBySource: {}, error: 'Invalid image source list.' };
  }
  const canonicalSources = [...new Set(sources
    .filter((source) => typeof source === 'string' && source.length <= 2048)
    .map(canonicalManagedImageSource)
    .filter(Boolean))];
  if (!canonicalSources.length) return { ok: true, focalPointBySource: {} };

  try {
    const storage = createStorage();
    const publicImageSources = await Promise.all(canonicalSources.map(async (source) => {
      const assetId = source.slice('/api/assets/'.length);
      try {
        const asset = await storage.assets.get(assetId);
        const contentType = String(asset?.contentType || '').toLowerCase().split(';', 1)[0];
        const detectedContentType = String(asset?.detectedContentType || '').toLowerCase().split(';', 1)[0];
        return asset && asset.status !== 'deleted' && asset.visibility === 'public'
          && contentType.startsWith('image/')
          && (!detectedContentType || detectedContentType.startsWith('image/'))
          ? source
          : '';
      } catch {
        return '';
      }
    }));
    const validSources = publicImageSources.filter(Boolean);
    if (!validSources.length) return { ok: true, focalPointBySource: {} };
    const focalPoints = await getMediaFocalPointBySources(validSources);
    const focalPointBySource = Object.fromEntries(validSources.flatMap((source) => {
      const focalPoint = normalizeMediaFocalPoint(focalPoints[source]);
      return focalPoint ? [[source, focalPoint]] : [];
    }));
    return { ok: true, focalPointBySource };
  } catch {
    return { ok: false, focalPointBySource: {}, error: 'Could not load image focal points.' };
  }
}

/** Persist normalized focal coordinates on the canonical existing image asset. */
export async function saveMediaFocalPointAction(source, focalPoint) {
  const session = await requireAdminPermission('content:write');
  if (!focalPoint || typeof focalPoint !== 'object' || Array.isArray(focalPoint)
    || !Number.isFinite(focalPoint.x) || !Number.isFinite(focalPoint.y)
    || focalPoint.x < 0 || focalPoint.x > 1 || focalPoint.y < 0 || focalPoint.y > 1) {
    return { ok: false, focalPoint: null, error: 'Focal point coordinates must be between 0 and 1.' };
  }
  try {
    const savedFocalPoint = await saveMediaFocalPoint(source, focalPoint, session.email);
    return { ok: true, focalPoint: savedFocalPoint };
  } catch {
    return { ok: false, focalPoint: null, error: 'Could not save the focal point. Check the selected image and try again.' };
  }
}
