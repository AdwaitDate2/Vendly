// @ts-nocheck
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ASSET_PATH_MAP, resolveAssetPath } from '@/lib/asset-paths';
import { mediaAltTextBySourcesAction, mediaCoverImageBySourcesAction, mediaUsageBySourcesAction, queryMediaLibraryAction, saveMediaAltTextAction, saveMediaCoverImageAction, searchMediaProductsAction } from '@/lib/media-actions';
import styles from './ImagePicker.module.css';

const IMAGE_PATTERN = /\.(webp|jpe?g|png|avif)$/i;
const VIDEO_PATTERN = /\.(mp4|webm|mov)$/i;
const LIBRARY = Object.keys(ASSET_PATH_MAP).filter((path) => IMAGE_PATTERN.test(path));
const VIDEO_LIBRARY = Object.keys(ASSET_PATH_MAP).filter((path) => VIDEO_PATTERN.test(path) && !/\s/.test(path));

export const UPLOAD_FOLDER = '/admin-uploads/';
export const SITE_LIBRARY = LIBRARY;
export const SITE_VIDEOS = VIDEO_LIBRARY;

const KINDS = {
  image: { types: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'], maxMb: 20, accept: 'image/jpeg,image/png,image/webp,image/avif', typeHint: 'a JPG, PNG, WebP, or AVIF photo', noun: 'photo' },
  video: { types: ['video/mp4', 'video/webm'], maxMb: 200, accept: 'video/mp4,video/webm', typeHint: 'an MP4 or WebM video', noun: 'video' },
};

export function thumbnailUrl(src, width = 256) {
  const resolved = resolveAssetPath(src);
  if (!resolved) return '';
  if (/^https?:/i.test(resolved)) return resolved;
  return `/_next/image?url=${encodeURIComponent(resolved)}&w=${width}&q=75`;
}

export function labelFor(path) {
  return String(path).split('/').pop().replace(IMAGE_PATTERN, '').replace(VIDEO_PATTERN, '').replace(/[-_]+/g, ' ');
}

function formatImageDimensions(item) {
  return item.width && item.height ? `${item.width} × ${item.height} px` : '';
}

function formatImageOrientation(item, measuredDimensions) {
  const width = item.width || measuredDimensions?.width;
  const height = item.height || measuredDimensions?.height;
  if (!width || !height) return '';
  if (width === height) return 'Square';
  return width > height ? 'Landscape' : 'Portrait';
}

function formatMediaType(item) {
  const typeExtension = String(item.contentType || '').split('/').at(-1) || String(item.src || '').split('?')[0].split('.').at(-1);
  const normalizedExtension = String(typeExtension || '').toLowerCase();
  const labels = { jpeg: 'JPG', jpg: 'JPG', png: 'PNG', webp: 'WEBP', avif: 'AVIF', mp4: 'MP4', webm: 'WEBM', quicktime: 'MOV', mov: 'MOV' };
  return labels[normalizedExtension] || (normalizedExtension ? normalizedExtension.toUpperCase() : item.kind === 'video' ? 'Video' : 'Image');
}

function formatVideoDuration(duration) {
  if (!Number.isFinite(duration) || duration < 0) return '';
  const seconds = Math.floor(duration);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatMediaDate(createdAt, style = 'short') {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return style === 'long'
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(date)
    : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function formatRowMetadata(item, measuredDimensions) {
  const metadata = [formatMediaType(item)];
  if (item.kind === 'video') {
    if (item.id) metadata.push(formatVideoDuration(measuredDimensions?.duration));
  } else {
    metadata.push(formatImageOrientation(item, measuredDimensions));
  }
  metadata.push(formatMediaDate(item.createdAt));
  return metadata.filter(Boolean).join(' · ');
}

function formatPreviewMetadata(item, measuredDimensions) {
  const metadata = [formatMediaDate(item.createdAt, 'long') || (item.id ? 'Upload date unavailable' : 'Theme file')];
  metadata.push(formatMediaType(item));
  if (item.kind === 'video') {
    metadata.push(formatVideoDuration(measuredDimensions?.duration));
  } else {
    const dimensions = item.width && item.height
      ? `${item.width} × ${item.height}`
      : measuredDimensions?.width && measuredDimensions?.height
        ? `${measuredDimensions.width} × ${measuredDimensions.height}`
        : '';
    if (dimensions) metadata.push(dimensions);
  }
  return metadata.filter(Boolean).join(' • ');
}

function formatUploadDate(createdAt) {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function categoryForUsage(usage) {
  return usage.category || (String(usage.label || '').startsWith('Product: ') ? 'product-media' : 'other');
}

function MediaPickerIcon({ name, size = 16 }) {
  const paths = {
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4 4" /></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" strokeWidth="2.5" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4.5 4.5L19 7" />,
    eye: <><path d="M2 12s3.7-7 10-7 10 7 10 7-3.7 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    previous: <path d="m14 18-6-6 6-6" />,
    next: <path d="m10 18 6-6-6-6" />,
    chevronDown: <path d="m7 10 5 5 5-5" />,
    library: <><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m5 17 4.5-4.5 3 3L15 13l4 4" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  };

  return <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

/**
 * Uploads one photo or video to Kenmark Storage (public, in the admin uploads folder).
 * @returns {Promise<{ ok: true, src: string, id: string } | { ok: false, error: string }>}
 */
export async function uploadMedia(file, kind = 'image') {
  const rules = KINDS[kind];
  if (!file) return { ok: false, error: `Choose a ${rules.noun} first.` };
  if (!rules.types.includes(file.type)) return { ok: false, error: `${file.name}: use ${rules.typeHint}.` };
  if (file.size > rules.maxMb * 1024 * 1024) return { ok: false, error: `${file.name} is larger than ${rules.maxMb} MB. Export a smaller version and try again.` };
  try {
    const form = new FormData();
    form.append('file', file);
    form.append('visibility', 'public');
    form.append('folder', UPLOAD_FOLDER);
    const response = await fetch('/api/assets/upload', { method: 'POST', body: form });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) return { ok: false, error: 'Your session ended. Sign in again, then upload.' };
    if (response.status === 413) return { ok: false, error: `${file.name} is too large for the server to accept. Try a smaller file.` };
    if (!response.ok || !data?.urls?.public) return { ok: false, error: `${file.name}: ${data.error || 'upload failed'}.` };
    return { ok: true, src: data.urls.public, id: data.id };
  } catch {
    return { ok: false, error: `${file.name}: the upload was interrupted. Check your connection and try again.` };
  }
}

/** Kept for existing callers: uploads a photo. */
export function uploadImage(file) {
  return uploadMedia(file, 'image');
}

const ASSET_PAGE_SIZE = 200;

function assetRequestError(data, status) {
  const message = typeof data?.error === 'string' ? data.error : data?.error?.message;
  if (status === 401) return 'Your admin session ended. Sign in again to browse media.';
  return message || 'Media could not be loaded. Check your connection and try again.';
}

function mediaItemFromAsset(item) {
  const contentType = String(item.contentType || '');
  return {
    id: item.id,
    src: item.urls?.public || `/api/assets/${item.id}`,
    label: item.displayName || item.originalName || 'Uploaded file',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    kind: contentType.startsWith('video/') ? 'video' : 'image',
    contentType,
    sizeBytes: item.sizeBytes || 0,
    width: item.image?.width || null,
    height: item.image?.height || null,
  };
}

/**
 * Uploads through Kenmark Storage in cursor-based pages. Search is sent to the server so files
 * beyond the first page remain discoverable. Existing selections can stay stable while pages load.
 */
export function usePaginatedUploadedMedia(refreshKey = 0, search = '') {
  const [page, setPage] = useState({ key: '', items: [], total: 0, hasMore: false, status: 'loading', error: '', loadingMore: false, loadMoreError: '' });
  const [retryKey, setRetryKey] = useState(0);
  const requestRef = useRef({ key: '', generation: 0, cursor: null, hasMore: false, loadingMore: false });
  const normalizedSearch = String(search || '').trim().slice(0, 200);
  const requestKey = `${refreshKey}\n${normalizedSearch}\n${retryKey}`;

  useEffect(() => {
    const generation = requestRef.current.generation + 1;
    requestRef.current = { key: requestKey, generation, cursor: null, hasMore: false, loadingMore: false };
    let cancelled = false;
    const parameters = new URLSearchParams({ folder: UPLOAD_FOLDER, visibility: 'public', limit: String(ASSET_PAGE_SIZE) });
    if (normalizedSearch) parameters.set('search', normalizedSearch);
    setPage({ key: requestKey, items: [], total: 0, hasMore: false, status: 'loading', error: '', loadingMore: false, loadMoreError: '' });

    fetch(`/api/assets?${parameters.toString()}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(assetRequestError(data, response.status));
        return data;
      })
      .then((data) => {
        if (cancelled || requestRef.current.generation !== generation) return;
        const items = (data.items || [])
          .filter((item) => /^(image|video)\//.test(String(item.contentType || '')) && item.status !== 'deleted')
          .map(mediaItemFromAsset);
        requestRef.current.cursor = data.nextCursor || null;
        requestRef.current.hasMore = Boolean(data.hasMore && data.nextCursor);
        setPage({ key: requestKey, items, total: Number(data.total) || items.length, hasMore: requestRef.current.hasMore, status: 'ready', error: '', loadingMore: false, loadMoreError: '' });
      })
      .catch((error) => {
        if (cancelled || requestRef.current.generation !== generation) return;
        setPage({ key: requestKey, items: [], total: 0, hasMore: false, status: 'error', error: error.message || assetRequestError({}, 0), loadingMore: false, loadMoreError: '' });
      });

    return () => { cancelled = true; };
  }, [requestKey, normalizedSearch]);

  const loadMore = useCallback(async () => {
    const request = requestRef.current;
    if (request.key !== requestKey || !request.hasMore || !request.cursor || request.loadingMore) return;
    request.loadingMore = true;
    const { generation, cursor } = request;
    setPage((current) => current.key === requestKey ? { ...current, loadingMore: true, loadMoreError: '' } : current);
    const parameters = new URLSearchParams({ folder: UPLOAD_FOLDER, visibility: 'public', limit: String(ASSET_PAGE_SIZE), cursor });
    if (normalizedSearch) parameters.set('search', normalizedSearch);
    try {
      const response = await fetch(`/api/assets?${parameters.toString()}`, { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(assetRequestError(data, response.status));
      if (requestRef.current.generation !== generation || requestRef.current.key !== requestKey) return;
      const nextItems = (data.items || [])
        .filter((item) => /^(image|video)\//.test(String(item.contentType || '')) && item.status !== 'deleted')
        .map(mediaItemFromAsset);
      requestRef.current.cursor = data.nextCursor || null;
      requestRef.current.hasMore = Boolean(data.hasMore && data.nextCursor);
      setPage((current) => {
        if (current.key !== requestKey) return current;
        const existingIds = new Set(current.items.map((item) => item.id));
        return {
          ...current,
          items: [...current.items, ...nextItems.filter((item) => !existingIds.has(item.id))],
          total: Number(data.total) || current.total,
          hasMore: requestRef.current.hasMore,
          loadingMore: false,
          loadMoreError: '',
        };
      });
    } catch (error) {
      if (requestRef.current.generation !== generation || requestRef.current.key !== requestKey) return;
      request.loadingMore = false;
      setPage((current) => current.key === requestKey ? { ...current, loadingMore: false, loadMoreError: error.message || assetRequestError({}, 0) } : current);
    } finally {
      if (requestRef.current.generation === generation) requestRef.current.loadingMore = false;
    }
  }, [normalizedSearch, requestKey]);

  const retry = useCallback(() => setRetryKey((key) => key + 1), []);
  const isCurrentPage = page.key === requestKey;
  return {
    items: isCurrentPage ? page.items : [],
    total: isCurrentPage ? page.total : 0,
    hasMore: isCurrentPage && page.hasMore,
    status: isCurrentPage ? page.status : 'loading',
    error: isCurrentPage ? page.error : '',
    loadingMore: isCurrentPage && page.loadingMore,
    loadMoreError: isCurrentPage ? page.loadMoreError : '',
    loadMore,
    retry,
  };
}

/**
 * Page-based uploaded-file listing for the full Media Library. Kept separate from the contextual
 * picker hook so its cursor-based multi-page selection behavior remains unchanged.
 */
export function usePagedUploadedMedia(refreshKey = 0, search = '', pageNumber = 1, pageSize = 50) {
  const [result, setResult] = useState({ key: '', items: [], total: 0, totalPages: 0, status: 'loading', error: '' });
  const [retryKey, setRetryKey] = useState(0);
  const normalizedSearch = String(search || '').trim().slice(0, 200);
  const safePage = Math.max(1, Number(pageNumber) || 1);
  const requestKey = `${refreshKey}\n${normalizedSearch}\n${safePage}\n${pageSize}\n${retryKey}`;

  useEffect(() => {
    let cancelled = false;
    const parameters = new URLSearchParams({
      folder: UPLOAD_FOLDER,
      visibility: 'public',
      limit: String(pageSize),
      page: String(safePage),
    });
    if (normalizedSearch) parameters.set('search', normalizedSearch);
    setResult({ key: requestKey, items: [], total: 0, totalPages: 0, status: 'loading', error: '' });

    fetch(`/api/assets?${parameters.toString()}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(assetRequestError(data, response.status));
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        const items = (data.items || [])
          .filter((item) => /^(image|video)\//.test(String(item.contentType || '')) && item.status !== 'deleted')
          .map(mediaItemFromAsset);
        const total = Number(data.total) || items.length;
        setResult({
          key: requestKey,
          items,
          total,
          totalPages: Number(data.totalPages) || Math.ceil(total / pageSize),
          status: 'ready',
          error: '',
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setResult({ key: requestKey, items: [], total: 0, totalPages: 0, status: 'error', error: error.message || assetRequestError({}, 0) });
      });

    return () => { cancelled = true; };
  }, [normalizedSearch, pageSize, requestKey, safePage]);

  const retry = useCallback(() => setRetryKey((key) => key + 1), []);
  const isCurrentRequest = result.key === requestKey;
  return {
    items: isCurrentRequest ? result.items : [],
    total: isCurrentRequest ? result.total : 0,
    totalPages: isCurrentRequest ? result.totalPages : 0,
    status: isCurrentRequest ? result.status : 'loading',
    error: isCurrentRequest ? result.error : '',
    retry,
  };
}

/** Search/filter/sort picker uploads over the complete bounded collection, appending 50-row pages. */
export function useFilteredUploadedMedia(refreshKey = 0, search = '', kind = 'image', sortOrder = 'recent', filters = {}) {
  const [result, setResult] = useState({ key: '', items: [], total: 0, totalPages: 0, status: 'loading', error: '', loadingMore: false, loadMoreError: '' });
  const [retryKey, setRetryKey] = useState(0);
  const requestRef = useRef({ key: '', generation: 0, page: 1, loadingMore: false });
  const normalizedSearch = String(search || '').trim().slice(0, 200);
  const [debouncedSearch, setDebouncedSearch] = useState(normalizedSearch);
  const sortKey = sortOrder.startsWith('name-') ? 'fileName' : sortOrder === 'largest' || sortOrder === 'smallest' ? 'size' : 'dateAdded';
  const direction = sortOrder === 'oldest' || sortOrder === 'name-ascending' || sortOrder === 'smallest' ? 'ascending' : 'descending';
  const filterKey = JSON.stringify(filters);
  const requestKey = `${refreshKey}\n${debouncedSearch}\n${kind}\n${sortKey}\n${direction}\n${filterKey}\n${retryKey}`;

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(normalizedSearch), 220);
    return () => window.clearTimeout(timeout);
  }, [normalizedSearch]);

  useEffect(() => {
    const generation = requestRef.current.generation + 1;
    requestRef.current = { key: requestKey, generation, page: 1, loadingMore: false };
    let cancelled = false;
    setResult({ key: requestKey, items: [], total: 0, totalPages: 0, status: 'loading', error: '', loadingMore: false, loadMoreError: '' });
    queryMediaLibraryAction({ page: 1, pageSize: 50, search: debouncedSearch, sortKey, direction, filters: { ...filters, fileType: kind } })
      .then((response) => {
        if (cancelled || requestRef.current.generation !== generation) return;
        if (!response?.ok) throw new Error(response?.error || 'Could not load the complete media collection.');
        setResult({ key: requestKey, items: response.items || [], total: response.total || 0, totalPages: response.totalPages || 0, status: 'ready', error: '', loadingMore: false, loadMoreError: '' });
      })
      .catch((error) => {
        if (!cancelled && requestRef.current.generation === generation) setResult({ key: requestKey, items: [], total: 0, totalPages: 0, status: 'error', error: error.message || 'Could not load the complete media collection.', loadingMore: false, loadMoreError: '' });
      });
    return () => { cancelled = true; };
  }, [debouncedSearch, direction, filterKey, filters, kind, requestKey, sortKey]);

  const loadMore = useCallback(async () => {
    const request = requestRef.current;
    const nextPage = request.page + 1;
    if (request.key !== requestKey || request.loadingMore || nextPage > result.totalPages) return;
    request.loadingMore = true;
    const { generation } = request;
    setResult((current) => current.key === requestKey ? { ...current, loadingMore: true, loadMoreError: '' } : current);
    try {
      const response = await queryMediaLibraryAction({ page: nextPage, pageSize: 50, search: debouncedSearch, sortKey, direction, filters: { ...filters, fileType: kind } });
      if (requestRef.current.generation !== generation || requestRef.current.key !== requestKey) return;
      if (!response?.ok) throw new Error(response?.error || 'Could not load the next page.');
      requestRef.current.page = response.page || nextPage;
      setResult((current) => current.key === requestKey ? {
        ...current,
        items: [...current.items, ...(response.items || []).filter((item) => !current.items.some((existing) => existing.id === item.id))],
        total: response.total || 0,
        totalPages: response.totalPages || 0,
        loadingMore: false,
        loadMoreError: '',
      } : current);
    } catch (error) {
      if (requestRef.current.generation === generation && requestRef.current.key === requestKey) {
        setResult((current) => current.key === requestKey ? { ...current, loadingMore: false, loadMoreError: error.message || 'Could not load the next page.' } : current);
      }
    } finally {
      if (requestRef.current.generation === generation) requestRef.current.loadingMore = false;
    }
  }, [debouncedSearch, direction, filters, kind, requestKey, result.totalPages, sortKey]);

  const retry = useCallback(() => setRetryKey((key) => key + 1), []);
  const isCurrent = result.key === requestKey;
  return {
    items: isCurrent ? result.items : [],
    total: isCurrent ? result.total : 0,
    totalPages: isCurrent ? result.totalPages : 0,
    hasMore: isCurrent && requestRef.current.page < result.totalPages,
    status: isCurrent ? result.status : 'loading',
    error: isCurrent ? result.error : '',
    loadingMore: isCurrent && result.loadingMore,
    loadMoreError: isCurrent ? result.loadMoreError : '',
    loadMore,
    retry,
  };
}

/** Photos and videos uploaded through the admin (newest first), as { id, src, label, kind }. */
export function useUploadedMedia(refreshKey = 0) {
  return usePaginatedUploadedMedia(refreshKey).items;
}

/** Kept for existing callers: uploaded photos only. */
export function useUploadedImages(refreshKey = 0) {
  return useUploadedMedia(refreshKey).filter((item) => item.kind === 'image');
}

export function MediaPreview({ src, kind, poster = '', className = '', width = 256, controls = false, onMetadata }) {
  if (!src) return null;
  if (kind === 'video') return <video className={className} src={resolveAssetPath(src)} poster={poster ? resolveAssetPath(poster) : undefined} muted playsInline preload="metadata" controls={controls} aria-hidden={controls ? undefined : 'true'} onLoadedMetadata={onMetadata ? (event) => onMetadata({ duration: event.currentTarget.duration, width: event.currentTarget.videoWidth, height: event.currentTarget.videoHeight }) : undefined} />;
  // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail through the image optimizer URL
  return <img className={className} src={thumbnailUrl(src, width)} alt="" loading="lazy" onLoad={onMetadata ? (event) => onMetadata({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight }) : undefined} />;
}

/**
 * Media library popup for choosing an existing photo or video. It lists your uploads first, then the
 * site's own files, and also accepts an upload or a pasted link.
 */
export function MediaLibraryModal({ kind = 'image', value = '', title, multiple = false, onChoose, onClose }) {
  const rules = KINDS[kind];
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('recent');
  const [fileSize, setFileSize] = useState({ minimum: '', maximum: '' });
  const [usedIn, setUsedIn] = useState('all');
  const [usedProducts, setUsedProducts] = useState([]);
  const [productFilterOpen, setProductFilterOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productRetryKey, setProductRetryKey] = useState(0);
  const [productOptions, setProductOptions] = useState({ items: [], page: 0, pages: 0, status: 'idle', error: '' });
  const [detailItem, setDetailItem] = useState(null);
  const [mediaDimensionsBySource, setMediaDimensionsBySource] = useState({});
  const [viewMode, setViewMode] = useState('list');
  const initialSources = useRef(Array.isArray(value) ? value : value ? [value] : []).current;
  const [selectedSources, setSelectedSources] = useState(() => initialSources);
  const [usageBySource, setUsageBySource] = useState({});
  const [usageLoad, setUsageLoad] = useState({ key: '', status: 'idle' });
  const [altTextBySource, setAltTextBySource] = useState({});
  const [altTextLoad, setAltTextLoad] = useState({ key: '', status: 'idle' });
  const [altTextRetryKey, setAltTextRetryKey] = useState(0);
  const [altTextDraftBySource, setAltTextDraftBySource] = useState({});
  const [altTextSaving, setAltTextSaving] = useState(false);
  const [altTextMessageBySource, setAltTextMessageBySource] = useState({});
  const [coverImageBySource, setCoverImageBySource] = useState({});
  const [coverImageLoad, setCoverImageLoad] = useState({ key: '', status: 'idle' });
  const [coverImageRetryKey, setCoverImageRetryKey] = useState(0);
  const [coverImagePickerOpen, setCoverImagePickerOpen] = useState(false);
  const [coverImageSaving, setCoverImageSaving] = useState(false);
  const [coverImageMessageBySource, setCoverImageMessageBySource] = useState({});
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInput = useRef(null);
  const panel = useRef(null);
  const productFilter = useRef(null);
  const productFilterTrigger = useRef(null);
  const productSearchField = useRef(null);
  const productFilterPopover = useRef(null);
  const productOptionRefs = useRef([]);
  const productRequest = useRef(0);
  const productFilterOpenRef = useRef(false);
  const coverImagePickerOpenRef = useRef(false);
  const [productFilterPosition, setProductFilterPosition] = useState(null);
  // Read before the search box autofocuses, so focus can return to the button that opened the dialog.
  const [opener] = useState(() => (typeof document === 'undefined' ? null : document.activeElement));
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  useEffect(() => { productFilterOpenRef.current = productFilterOpen; }, [productFilterOpen]);
  useEffect(() => { coverImagePickerOpenRef.current = coverImagePickerOpen; }, [coverImagePickerOpen]);

  const focusProductFilterTrigger = useCallback(() => window.requestAnimationFrame(() => productFilterTrigger.current?.focus()), []);
  const closeProductFilter = useCallback((returnFocus = false) => {
    setProductFilterOpen(false);
    if (returnFocus) focusProductFilterTrigger();
  }, [focusProductFilterTrigger]);

  // Keep keyboard focus inside the dialog, close on Escape, and hand focus back to the opener.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (coverImagePickerOpenRef.current) return;
      if (event.key === 'Escape') {
        if (productFilterOpenRef.current) { event.preventDefault(); closeProductFilter(true); return; }
        event.preventDefault(); closeRef.current(); return;
      }
      if (event.key !== 'Tab' || !panel.current) return;
      const focusable = [...panel.current.querySelectorAll('button:not([disabled]), input:not([type="file"]):not([disabled]), [href]')];
      const productFilterFocusables = [...(productFilterPopover.current?.querySelectorAll('button:not([disabled]), input:not([type="file"]):not([disabled]), [href]') || [])];
      if (productFilterOpenRef.current && productFilterFocusables.length) {
        const activeElement = document.activeElement;
        const productTriggerIndex = focusable.indexOf(productFilterTrigger.current);
        if (event.shiftKey && activeElement === productSearchField.current) {
          event.preventDefault();
          productFilterTrigger.current?.focus();
          return;
        }
        if (activeElement === productFilterTrigger.current || (!event.shiftKey && activeElement === productFilterFocusables[productFilterFocusables.length - 1])) {
          event.preventDefault();
          const nextIndex = productTriggerIndex + (event.shiftKey ? -1 : 1);
          const nextFocus = focusable[nextIndex] || focusable[event.shiftKey ? focusable.length - 1 : 0];
          closeProductFilter();
          window.requestAnimationFrame(() => nextFocus?.focus());
          return;
        }
      }
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [closeProductFilter, opener]);

  useEffect(() => {
    if (!productFilterOpen) return undefined;
    const closeOnOutsidePointer = (event) => {
      if (!productFilter.current?.contains(event.target) && !productFilterPopover.current?.contains(event.target)) closeProductFilter();
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [closeProductFilter, productFilterOpen]);

  useEffect(() => {
    if (!productFilterOpen) {
      setProductFilterPosition(null);
      return undefined;
    }
    const updateProductFilterPosition = () => {
      const trigger = productFilterTrigger.current;
      if (!trigger || !panel.current) return;
      const triggerBounds = trigger.getBoundingClientRect();
      const modalBounds = panel.current.getBoundingClientRect();
      const popupWidth = Math.max(180, Math.min(320, window.innerWidth - 24, modalBounds.width - 16));
      const left = Math.max(modalBounds.left + 8, Math.min(triggerBounds.left, modalBounds.right - popupWidth - 8));
      const spaceBelow = modalBounds.bottom - triggerBounds.bottom - 8;
      const spaceAbove = triggerBounds.top - modalBounds.top - 8;
      if (Math.max(spaceBelow, spaceAbove) < 160) {
        setProductFilterPosition({ position: 'fixed', left, width: popupWidth, maxHeight: Math.max(120, modalBounds.height - 16), top: modalBounds.top + 8 });
        return;
      }
      const opensAbove = spaceBelow < 240 && spaceAbove > spaceBelow;
      const availableSpace = opensAbove ? spaceAbove : spaceBelow;
      const maxHeight = Math.max(120, Math.min(390, availableSpace - 8));
      setProductFilterPosition({
        position: 'fixed',
        left,
        width: popupWidth,
        maxHeight,
        ...(opensAbove ? { bottom: window.innerHeight - triggerBounds.top + 6 } : { top: triggerBounds.bottom + 6 }),
      });
    };
    updateProductFilterPosition();
    window.addEventListener('resize', updateProductFilterPosition);
    return () => {
      window.removeEventListener('resize', updateProductFilterPosition);
    };
  }, [productFilterOpen]);

  const productFilterPositionReady = Boolean(productFilterPosition);
  useEffect(() => {
    if (!productFilterOpen || !productFilterPositionReady) return undefined;
    const focusRequest = window.requestAnimationFrame(() => productSearchField.current?.focus());
    return () => window.cancelAnimationFrame(focusRequest);
  }, [productFilterOpen, productFilterPositionReady]);

  const normalizedProductSearch = productSearch.trim().slice(0, 80);
  useEffect(() => {
    if (!productFilterOpen) return undefined;
    const requestId = productRequest.current + 1;
    productRequest.current = requestId;
    const timeout = window.setTimeout(async () => {
      setProductOptions({ items: [], page: 0, pages: 0, status: 'loading', error: '' });
      try {
        const result = await searchMediaProductsAction(normalizedProductSearch, 1);
        if (productRequest.current !== requestId) return;
        if (!result.ok) throw new Error(result.error || 'Could not search products. Try again.');
        setProductOptions({ items: result.items || [], page: result.page || 1, pages: result.pages || 1, status: 'ready', error: '' });
      } catch (requestError) {
        if (productRequest.current !== requestId) return;
        setProductOptions({ items: [], page: 0, pages: 0, status: 'error', error: requestError.message || 'Could not search products. Try again.' });
      }
    }, 180);
    return () => {
      window.clearTimeout(timeout);
      if (productRequest.current === requestId) productRequest.current += 1;
    };
  }, [normalizedProductSearch, productFilterOpen, productRetryKey]);

  const pickerFilters = useMemo(() => ({
    minimumSizeMb: fileSize.minimum,
    maximumSizeMb: fileSize.maximum,
    usageCategory: usedProducts.length ? 'product' : usedIn === 'product-media' ? 'product' : usedIn === 'unused' ? 'unused' : usedIn,
    usageProductIds: usedProducts.map((product) => product.id),
  }), [fileSize.maximum, fileSize.minimum, usedIn, usedProducts]);
  const uploadLibrary = useFilteredUploadedMedia(refreshKey, query, kind, sortOrder, pickerFilters);
  const uploads = uploadLibrary.items;
  const site = useMemo(() => (kind === 'video' ? VIDEO_LIBRARY : LIBRARY).map((path) => ({ src: path, label: labelFor(path), kind })), [kind]);
  const allItems = useMemo(() => [...uploads, ...site], [uploads, site]);
  useEffect(() => {
    if (!detailItem?.id) return;
    const refreshedItem = uploads.find((item) => item.id === detailItem.id);
    if (refreshedItem && refreshedItem.label !== detailItem.label) setDetailItem(refreshedItem);
  }, [uploads, detailItem]);
  const mediaSources = useMemo(() => allItems.map((item) => item.src), [allItems]);
  const usageRequestKey = mediaSources.join('\n');
  const usageStatus = !mediaSources.length ? 'ready' : usageLoad.key === usageRequestKey ? usageLoad.status : 'loading';
  useEffect(() => {
    if (!mediaSources.length) return;
    let cancelled = false;
    const batches = [];
    for (let index = 0; index < mediaSources.length; index += 500) batches.push(mediaSources.slice(index, index + 500));
    Promise.all(batches.map((sources) => mediaUsageBySourcesAction(sources))).then((results) => {
      if (cancelled) return;
      const usageBySource = Object.assign({}, ...results.map((result) => result.usageBySource || {}));
      setUsageBySource((current) => ({ ...current, ...usageBySource }));
      setUsageLoad({ key: usageRequestKey, status: results.every((result) => result.ok) ? 'ready' : 'error' });
    }).catch(() => {
      if (!cancelled) setUsageLoad({ key: usageRequestKey, status: 'error' });
    });
    return () => { cancelled = true; };
  }, [mediaSources, usageRequestKey]);
  const selectedAltSource = selectedSources.length === 1 ? selectedSources[0] : '';
  const metadataSourceKey = useMemo(() => [...new Set([selectedAltSource, ...selectedSources, ...uploads.map((item) => item.src), ...site.map((item) => item.src)].filter(Boolean))].slice(0, 500).join('\n'), [selectedAltSource, selectedSources, uploads, site]);
  const coverImageSourceKey = kind === 'video' ? mediaSources.join('\n') : '';
  const altTextStatus = !metadataSourceKey ? 'ready' : altTextLoad.key === metadataSourceKey ? altTextLoad.status : 'loading';
  const coverImageStatus = !coverImageSourceKey ? 'ready' : coverImageLoad.key === coverImageSourceKey ? coverImageLoad.status : 'loading';
  const altTextDraft = selectedAltSource ? altTextDraftBySource[selectedAltSource] ?? altTextBySource[selectedAltSource] ?? '' : '';
  const altTextMessage = selectedAltSource ? altTextMessageBySource[selectedAltSource] || '' : '';
  const detailAltTextDraft = detailItem ? altTextDraftBySource[detailItem.src] ?? altTextBySource[detailItem.src] ?? '' : '';
  const detailAltTextMessage = detailItem ? altTextMessageBySource[detailItem.src] || '' : '';
  const waitForSelectedAltText = !multiple && selectedSources.length === 1 && altTextStatus === 'loading';
  const selectionChanged = selectedSources.length !== initialSources.length
    || initialSources.some((source) => !selectedSources.includes(source));
  const retrySelectedAltTextLoad = () => {
    setAltTextLoad({ key: metadataSourceKey, status: 'loading' });
    setAltTextRetryKey((key) => key + 1);
  };
  useEffect(() => {
    if (!metadataSourceKey) return;
    let cancelled = false;
    mediaAltTextBySourcesAction(metadataSourceKey.split('\n')).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setAltTextBySource((current) => ({ ...current, ...result.altTextBySource }));
        setAltTextLoad({ key: metadataSourceKey, status: 'ready' });
      } else setAltTextLoad({ key: metadataSourceKey, status: 'error' });
    }).catch(() => {
      if (!cancelled) setAltTextLoad({ key: metadataSourceKey, status: 'error' });
    });
    return () => { cancelled = true; };
  }, [metadataSourceKey, altTextRetryKey]);
  useEffect(() => {
    if (!coverImageSourceKey) return;
    let cancelled = false;
    mediaCoverImageBySourcesAction(coverImageSourceKey.split('\n')).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setCoverImageBySource((current) => ({ ...current, ...result.coverImageBySource }));
        setCoverImageLoad({ key: coverImageSourceKey, status: 'ready' });
      } else setCoverImageLoad({ key: coverImageSourceKey, status: 'error' });
    }).catch(() => {
      if (!cancelled) setCoverImageLoad({ key: coverImageSourceKey, status: 'error' });
    });
    return () => { cancelled = true; };
  }, [coverImageSourceKey, coverImageRetryKey]);
  const hasUsageFilter = usedIn !== 'all' || usedProducts.length > 0;
  const minimumSizeMb = fileSize.minimum === '' ? null : Number(fileSize.minimum);
  const maximumSizeMb = fileSize.maximum === '' ? null : Number(fileSize.maximum);
  const invalidFileSizeRange = (minimumSizeMb !== null && (!Number.isFinite(minimumSizeMb) || minimumSizeMb < 0))
    || (maximumSizeMb !== null && (!Number.isFinite(maximumSizeMb) || maximumSizeMb < 0))
    || (minimumSizeMb !== null && maximumSizeMb !== null && minimumSizeMb > maximumSizeMb);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const siteSearched = q ? site.filter((item) => `${item.src} ${item.label}`.toLowerCase().includes(q)) : site;
    const sizeFilteredSite = siteSearched.filter((item) => {
      if (invalidFileSizeRange) return false;
      const minimumBytes = minimumSizeMb === null ? null : Math.ceil(minimumSizeMb * 1024 * 1024);
      const maximumBytes = maximumSizeMb === null ? null : Math.floor(maximumSizeMb * 1024 * 1024);
      if (!item.sizeBytes) return minimumBytes === null && maximumBytes === null;
      return (minimumBytes === null || item.sizeBytes >= minimumBytes) && (maximumBytes === null || item.sizeBytes <= maximumBytes);
    });
    const usedFilteredSite = hasUsageFilter && usageStatus !== 'ready' ? [] : sizeFilteredSite.filter((item) => {
      if (!hasUsageFilter) return true;
      const usages = usageBySource[item.src] || [];
      const isUsed = usages.length > 0;
      if (usedIn === 'product-media' && !usages.some((usage) => categoryForUsage(usage) === 'product-media')) return false;
      if (usedIn === 'other' && !usages.some((usage) => categoryForUsage(usage) === 'other')) return false;
      if (usedIn === 'unused' && isUsed) return false;
      return !usedProducts.length || usages.some((usage) => usedProducts.some((product) => usage.productId === product.id));
    });
    const sortedSite = [...usedFilteredSite].sort((first, second) => {
      if (sortOrder === 'name-ascending') return first.label.localeCompare(second.label);
      if (sortOrder === 'name-descending') return second.label.localeCompare(first.label);
      if (sortOrder === 'largest') return (second.sizeBytes || 0) - (first.sizeBytes || 0);
      if (sortOrder === 'smallest') return (first.sizeBytes || 0) - (second.sizeBytes || 0);
      const firstDate = first.createdAt ? new Date(first.createdAt).getTime() : NaN;
      const secondDate = second.createdAt ? new Date(second.createdAt).getTime() : NaN;
      if (Number.isNaN(firstDate) && !Number.isNaN(secondDate)) return 1;
      if (!Number.isNaN(firstDate) && Number.isNaN(secondDate)) return -1;
      if (Number.isNaN(firstDate) && Number.isNaN(secondDate)) return first.label.localeCompare(second.label);
      const dateDifference = sortOrder === 'oldest' ? firstDate - secondDate : secondDate - firstDate;
      return dateDifference || first.label.localeCompare(second.label);
    });
    // Uploaded assets are already globally searched, filtered, and sorted by the server. Theme
    // assets are a complete local manifest, so their filters and sort are applied to that full set.
    return [...uploads, ...sortedSite];
  }, [query, site, uploads, sortOrder, minimumSizeMb, maximumSizeMb, invalidFileSizeRange, usedIn, usedProducts, hasUsageFilter, usageBySource, usageStatus]);
  const previewIndex = detailItem ? results.findIndex((item) => item.src === detailItem.src) : -1;

  const selectedProductLabel = usedProducts.length === 1
    ? usedProducts[0].title
    : usedProducts.length > 1 ? `${usedProducts.length} products` : 'Product';

  const toggleUsedProduct = (product) => setUsedProducts((current) => current.some((selectedProduct) => selectedProduct.id === product.id)
    ? current.filter((selectedProduct) => selectedProduct.id !== product.id)
    : [...current, { id: product.id, title: product.title }]);

  const focusProductOption = (index) => {
    const lastIndex = productOptions.items.length - 1;
    if (lastIndex >= 0) productOptionRefs.current[Math.max(0, Math.min(lastIndex, index))]?.focus();
  };

  const handleProductOptionKeyDown = (event, index) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusProductOption(index + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusProductOption(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusProductOption(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusProductOption(productOptions.items.length);
    }
  };

  const loadMoreProducts = async () => {
    if (productOptions.status !== 'ready' || productOptions.page >= productOptions.pages) return;
    const requestId = productRequest.current + 1;
    productRequest.current = requestId;
    const nextPage = productOptions.page + 1;
    setProductOptions((current) => ({ ...current, status: 'loading-more', error: '' }));
    try {
      const result = await searchMediaProductsAction(normalizedProductSearch, nextPage);
      if (productRequest.current !== requestId) return;
      if (!result.ok) throw new Error(result.error || 'Could not load more products. Try again.');
      setProductOptions((current) => ({
        items: [...current.items, ...(result.items || []).filter((product) => !current.items.some((existing) => existing.id === product.id))],
        page: result.page || nextPage,
        pages: result.pages || current.pages,
        status: 'ready',
        error: '',
      }));
    } catch (requestError) {
      if (productRequest.current !== requestId) return;
      setProductOptions((current) => ({ ...current, status: 'ready', error: requestError.message || 'Could not load more products. Try again.' }));
    }
  };

  const uploadFiles = async (files) => {
    const compatibleFiles = [...files].filter((file) => file.type.startsWith(`${kind}/`));
    const filesToUpload = multiple ? compatibleFiles : compatibleFiles.slice(0, 1);
    if (!filesToUpload.length) {
      if ([...files].length) setError(`Choose ${rules.typeHint} to upload.`);
      return;
    }
    setUploading(true);
    setError('');
    const successfulSources = [];
    const uploadErrors = [];
    for (const file of filesToUpload) {
      const result = await uploadMedia(file, kind);
      if (result.ok) successfulSources.push(result.src);
      else uploadErrors.push(result.error);
    }
    setUploading(false);
    if (successfulSources.length) {
      setRefreshKey((key) => key + 1);
      setSelectedSources((current) => multiple ? [...new Set([...current, ...successfulSources])] : [successfulSources[0]]);
    }
    if (uploadErrors.length) setError(uploadErrors.join(' '));
  };

  const formatFileSize = (sizeBytes) => {
    if (!sizeBytes) return '';
    return sizeBytes < 1024 * 1024 ? `${Math.max(1, Math.round(sizeBytes / 1024))} KB` : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const recordMediaDimensions = (src, dimensions) => {
    if (!dimensions || !Number.isFinite(dimensions.width) || !Number.isFinite(dimensions.height)) return;
    setMediaDimensionsBySource((current) => {
      const existing = current[src];
      if (existing?.width === dimensions.width && existing?.height === dimensions.height && existing?.duration === dimensions.duration) return current;
      return { ...current, [src]: dimensions };
    });
  };

  const chooseDroppedFiles = (event) => {
    event.preventDefault();
    setDragging(false);
    const files = [...(event.dataTransfer?.files || [])];
    if (files.length) uploadFiles(files);
  };

  const selectSource = (src) => setSelectedSources((current) => {
    if (!multiple) return [src];
    return current.includes(src) ? current.filter((selectedSource) => selectedSource !== src) : [...current, src];
  });

  const chooseFiles = () => {
    if (multiple) {
      onChoose?.(selectedSources);
      return;
    }
    const selectedSource = selectedSources[0];
    if (kind === 'image') {
      const selectedImageAltText = altTextDraftBySource[selectedSource] ?? altTextBySource[selectedSource] ?? '';
      onChoose?.(selectedSource, selectedImageAltText);
      return;
    }
    onChoose?.(selectedSource);
  };

  const saveAltText = async (source, text) => {
    if (!source) return;
    setAltTextSaving(true);
    const result = await saveMediaAltTextAction(source, text);
    setAltTextSaving(false);
    if (result.ok) {
      setAltTextBySource((current) => ({ ...current, [source]: result.altText }));
      setAltTextDraftBySource((current) => ({ ...current, [source]: result.altText }));
      setAltTextMessageBySource((current) => ({ ...current, [source]: 'Saved' }));
    } else setAltTextMessageBySource((current) => ({ ...current, [source]: result.error || 'Could not save' }));
  };

  const saveSelectedAltText = () => saveAltText(selectedAltSource, altTextDraft);
  const saveDetailAltText = () => saveAltText(detailItem?.src, detailAltTextDraft);

  const saveSelectedCoverImage = async (imageSource) => {
    if (detailItem?.kind !== 'video') return;
    const videoSource = detailItem.src;
    setCoverImageSaving(true);
    setCoverImageMessageBySource((current) => ({ ...current, [videoSource]: '' }));
    try {
      const result = await saveMediaCoverImageAction(videoSource, imageSource);
      if (result.ok) {
        setCoverImageBySource((current) => ({ ...current, [videoSource]: result.coverImageSource }));
        setCoverImageMessageBySource((current) => ({ ...current, [videoSource]: 'Saved' }));
      } else {
        setCoverImageMessageBySource((current) => ({ ...current, [videoSource]: result.error || 'Could not save cover image' }));
      }
    } catch {
      setCoverImageMessageBySource((current) => ({ ...current, [videoSource]: 'Could not save cover image. Try again.' }));
    } finally {
      setCoverImageSaving(false);
    }
  };

  return (
    <div className="admin-modal shopify-media-picker" role="dialog" aria-modal="true" aria-label={title || `Choose a ${rules.noun}`} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="admin-modal__panel shopify-media-picker__panel" ref={panel}>
        <div className="admin-modal__head">
          <h2>{title || `Select ${kind === 'video' ? 'video' : 'image'}`}</h2>
          <button type="button" className="shopify-media-picker__close" aria-label="Close media picker" onClick={onClose}><MediaPickerIcon name="close" size={18} /></button>
        </div>
        <div className="admin-modal__toolbar">
          <label className="shopify-media-picker__search"><MediaPickerIcon name="search" size={16} /><input type="search" aria-label="Search files" placeholder="Search files" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus /></label>
          <label className="shopify-media-picker__sort"><span>Sort</span><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label="Sort files"><option value="recent">Newest</option><option value="oldest">Oldest</option><option value="name-ascending">Name A–Z</option><option value="name-descending">Name Z–A</option><option value="largest">Largest</option><option value="smallest">Smallest</option></select></label>
          <div className="shopify-media-picker__view" role="group" aria-label="File view">
            <button type="button" className={viewMode === 'grid' ? 'is-active' : ''} aria-label="Grid view" aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')}><MediaPickerIcon name="grid" size={15} /></button>
            <button type="button" className={viewMode === 'list' ? 'is-active' : ''} aria-label="List view" aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')}><MediaPickerIcon name="list" size={15} /></button>
          </div>
          <input ref={fileInput} type="file" accept={rules.accept} multiple={multiple} hidden onChange={(event) => { uploadFiles(event.target.files || []); event.target.value = ''; }} />
        </div>
        <div className="shopify-media-picker__filters">
          <div className={styles.sizeRange} aria-label="Filter by file size in MB">
            <span>File size</span>
            <label><span className={styles.visuallyHidden}>Minimum file size in MB</span><input type="number" min="0" step="0.1" inputMode="decimal" value={fileSize.minimum} placeholder="Min MB" aria-label="Minimum file size in MB" onChange={(event) => setFileSize((current) => ({ ...current, minimum: event.target.value }))} /></label>
            <span aria-hidden="true">–</span>
            <label><span className={styles.visuallyHidden}>Maximum file size in MB</span><input type="number" min="0" step="0.1" inputMode="decimal" value={fileSize.maximum} placeholder="Max MB" aria-label="Maximum file size in MB" onChange={(event) => setFileSize((current) => ({ ...current, maximum: event.target.value }))} /></label>
          </div>
          <label><span>Used in</span><select value={usedIn} onChange={(event) => setUsedIn(event.target.value)} aria-label="Filter by file usage"><option value="all">All files</option><option value="product-media">Product media</option><option value="other">Other</option><option value="unused">Unused</option></select></label>
          <div className={styles.productFilter} ref={productFilter}>
            <button type="button" className={styles.productFilterTrigger} ref={productFilterTrigger} aria-label={`Filter by product: ${selectedProductLabel}`} aria-expanded={productFilterOpen} aria-controls="media-product-options" onClick={() => setProductFilterOpen((open) => !open)}>
              <span>{selectedProductLabel}</span><MediaPickerIcon name="chevronDown" size={13} />
            </button>
          </div>
          {productFilterOpen && productFilterPosition && typeof document !== 'undefined' && panel.current?.parentElement ? createPortal(<div className={styles.productFilterPopover} ref={productFilterPopover} style={productFilterPosition}>
            <label className={styles.productSearch}><MediaPickerIcon name="search" size={14} /><input ref={productSearchField} type="search" value={productSearch} placeholder="Search products" aria-label="Search products" onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); productOptionRefs.current[0]?.focus(); } }} onChange={(event) => { setProductSearch(event.target.value); setProductOptions({ items: [], page: 0, pages: 0, status: 'loading', error: '' }); }} /></label>
            <div className={styles.productOptions} id="media-product-options" role="group" aria-label="Products">
              {productOptions.items.map((product, index) => <label className={styles.productOption} key={product.id} title={product.title}>
                <input type="checkbox" ref={(element) => { productOptionRefs.current[index] = element; }} checked={usedProducts.some((selectedProduct) => selectedProduct.id === product.id)} aria-label={product.title} onKeyDown={(event) => handleProductOptionKeyDown(event, index)} onChange={() => toggleUsedProduct(product)} />
                <span className={styles.productCheckbox} aria-hidden="true">{usedProducts.some((selectedProduct) => selectedProduct.id === product.id) ? <MediaPickerIcon name="check" size={12} /> : null}</span>
                <span className={styles.productOptionName}>{product.title}</span>
              </label>)}
              {productOptions.status === 'loading' ? <span className={styles.productFilterMessage} role="status">Loading products…</span> : null}
              {productOptions.status === 'ready' && !productOptions.items.length ? <span className={styles.productFilterMessage}>No products found.</span> : null}
              {productOptions.error ? <div className={styles.productFilterError} role="alert"><span>{productOptions.error}</span><button type="button" onClick={() => productOptions.page ? loadMoreProducts() : setProductRetryKey((key) => key + 1)}>Retry</button></div> : null}
            </div>
            <div className={styles.productFilterFooter}>
              <button type="button" className={styles.clearProducts} disabled={!usedProducts.length} onClick={() => setUsedProducts([])}>Clear</button>
              {(productOptions.status === 'ready' || productOptions.status === 'loading-more') && productOptions.page < productOptions.pages ? <button type="button" className={styles.showMoreProducts} disabled={productOptions.status === 'loading-more'} onClick={loadMoreProducts}>{productOptions.status === 'loading-more' ? 'Loading products…' : 'Show more products'}</button> : null}
            </div>
          </div>, panel.current.parentElement) : null}
          <span className="shopify-media-picker__filter-note" role={invalidFileSizeRange ? 'alert' : 'status'} aria-live="polite">{invalidFileSizeRange ? 'Enter non-negative sizes; minimum must not exceed maximum.' : uploadLibrary.status === 'loading' ? 'Loading files…' : uploadLibrary.status === 'error' ? 'Uploaded file results are unavailable.' : hasUsageFilter && usageStatus === 'loading' ? 'Checking theme file usage…' : hasUsageFilter && usageStatus === 'error' ? 'Theme file usage filter unavailable' : `Uploads: ${uploads.length} loaded of ${uploadLibrary.total} matching · Theme files: ${results.length - uploads.length} matching`}</span>
        </div>
        {kind === 'image' && selectedAltSource ? <div className={styles.altTextEditor}>
          <label className={styles.altTextField}><span>Alt text for selected {kind}</span><input aria-label="Selected file alt text" maxLength={500} value={altTextDraft} placeholder={altTextStatus === 'loading' ? 'Loading saved alt text…' : `Describe this ${kind}`} onChange={(event) => { setAltTextDraftBySource((current) => ({ ...current, [selectedAltSource]: event.target.value })); setAltTextMessageBySource((current) => ({ ...current, [selectedAltSource]: '' })); }} /></label>
          <button type="button" className="shopify-media-picker__add" disabled={altTextSaving || altTextStatus === 'loading' || altTextStatus === 'error'} onClick={saveSelectedAltText}>{altTextSaving ? 'Saving…' : 'Save alt text'}</button>
          {altTextStatus === 'error' ? <><span className={styles.altTextStatus} role="alert">Saved alt text could not be loaded. You can still select this file: it will use the text shown here, or clear the section description if left blank.</span><button type="button" className="shopify-media-picker__cancel" onClick={retrySelectedAltTextLoad}>Retry</button></> : null}
          {altTextMessage ? <span className={styles.altTextStatus} role="status">{altTextMessage}</span> : null}
          <span className={styles.altTextCount}>{altTextDraft.length}/500</span>
        </div> : null}
        {error ? <div className="admin-form-message" role="alert">{error}</div> : null}
        {uploadLibrary.status === 'error' ? <div className="shopify-media-picker__pagination-error" role="alert"><span>{uploadLibrary.error}</span><button type="button" className="shopify-media-picker__cancel" onClick={uploadLibrary.retry}>Retry</button></div> : null}
        <div className={`${styles.libraryContent}${detailItem ? ` ${styles.libraryContentPreviewOpen}` : ''}`}>
          <div className={styles.libraryListPane}>
            <div className={`shopify-media-picker__dropzone${dragging ? ' is-dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }} onDrop={chooseDroppedFiles}>
              <span>{uploading ? 'Uploading file…' : `Drag and drop ${kind === 'video' ? 'videos' : 'images'}`}</span><button type="button" disabled={uploading} onClick={() => fileInput.current?.click()}>Add files</button>
            </div>
            <div className={`admin-image-grid shopify-media-picker__files shopify-media-picker__files--${viewMode}${kind === 'video' ? ' admin-image-grid--video' : ''}`}>
              {results.map((item) => (
                <article key={item.src} className={`${styles.fileCard}${selectedSources.includes(item.src) ? ` ${styles.fileCardSelected}` : ''}`}>
                  {viewMode === 'list' ? <>
                    <button type="button" className={styles.rowSelectToggle} onClick={() => selectSource(item.src)} aria-label={`${selectedSources.includes(item.src) ? 'Deselect' : 'Select'} ${item.label}`} aria-pressed={selectedSources.includes(item.src)} title={`${selectedSources.includes(item.src) ? 'Deselect' : 'Select'} file`}>
                      <span className={`${styles.rowCheckbox}${selectedSources.includes(item.src) ? ` ${styles.rowCheckboxSelected}` : ''}`}>{selectedSources.includes(item.src) ? <MediaPickerIcon name="check" size={12} /> : null}</span>
                    </button>
                    <div className={styles.rowThumbnail}><MediaPreview src={item.src} kind={kind} poster={coverImageBySource[item.src]} onMetadata={(dimensions) => recordMediaDimensions(item.src, dimensions)} /></div>
                    <button type="button" className={styles.rowFileName} onClick={() => selectSource(item.src)} title={item.label} aria-pressed={selectedSources.includes(item.src)}>{item.label}</button>
                    <button type="button" className={`${styles.rowPreviewToggle}${detailItem?.src === item.src ? ` ${styles.rowPreviewToggleActive}` : ''}`} onClick={() => setDetailItem((current) => current?.src === item.src ? null : item)} aria-label={`${detailItem?.src === item.src ? 'Hide' : 'Show'} preview for ${item.label}`} aria-pressed={detailItem?.src === item.src} title={`${detailItem?.src === item.src ? 'Hide' : 'Show'} preview`}><MediaPickerIcon name="eye" size={16} /></button>
                    <span className={styles.rowMetadata}>{formatRowMetadata(item, mediaDimensionsBySource[item.src])}</span>
                  </> : <button type="button" className={styles.fileSelect} onClick={() => selectSource(item.src)} title={item.label} aria-label={`${selectedSources.includes(item.src) ? 'Deselect' : 'Select'} ${item.label}`} aria-pressed={selectedSources.includes(item.src)}>
                    <MediaPreview src={item.src} kind={kind} poster={coverImageBySource[item.src]} onMetadata={(dimensions) => recordMediaDimensions(item.src, dimensions)} />
                    <span className={styles.fileInfo}>
                      <span className="shopify-media-picker__file-name">{item.label}</span>
                      <small className={styles.fileMetadata}>{[formatFileSize(item.sizeBytes), kind === 'image' ? formatImageDimensions(item) : ''].filter(Boolean).join(' · ') || (kind === 'video' ? 'Video file' : 'Image file')}</small>
                      {kind === 'image' ? <small className={styles.altSummary} title={altTextBySource[item.src] || (altTextStatus === 'loading' ? 'Loading saved alt text' : 'No alt text saved')}>{altTextStatus === 'loading' && altTextBySource[item.src] === undefined ? 'Loading alt text…' : altTextBySource[item.src] ? `Alt: ${altTextBySource[item.src]}` : 'No alt text'}</small> : null}
                    </span>
                    {selectedSources.includes(item.src) ? <span className="shopify-media-picker__check" aria-label="Selected"><MediaPickerIcon name="check" size={12} /></span> : null}
                  </button>}
                </article>
              ))}
              {!results.length && uploadLibrary.status !== 'error' ? <p className="admin-field-help">{uploadLibrary.status === 'loading' ? 'Loading files…' : hasUsageFilter && usageStatus === 'loading' ? 'Checking file usage…' : hasUsageFilter && usageStatus === 'error' ? 'File usage could not be loaded. Clear the usage filters and try again.' : `No ${rules.noun}s match your filters.`}</p> : null}
            </div>
          </div>
          {detailItem ? <aside className={styles.detailsPanel} aria-label={`Preview for ${detailItem.label}`}>
            <div className={styles.detailsHeading}><h3>Preview</h3><button type="button" className="shopify-media-picker__close" aria-label="Close preview" onClick={() => setDetailItem(null)}><MediaPickerIcon name="close" size={16} /></button></div>
            <div className={`${styles.detailsPreviewStage}${detailItem.kind === 'video' ? ` ${styles.detailsPreviewStageVideo}` : ''}`}>
              <button type="button" className={styles.previewNavigation} aria-label="Previous file preview" title="Previous file" disabled={previewIndex <= 0} onClick={() => setDetailItem(results[previewIndex - 1])}><MediaPickerIcon name="previous" size={14} /></button>
              <div className={`${styles.detailsPreview}${detailItem.kind === 'video' ? ` ${styles.detailsPreviewVideo}` : ''}`}><MediaPreview src={detailItem.src} kind={detailItem.kind} poster={coverImageBySource[detailItem.src]} width={1024} className={styles.detailsMedia} controls={detailItem.kind === 'video'} onMetadata={(dimensions) => recordMediaDimensions(detailItem.src, dimensions)} /></div>
              <button type="button" className={styles.previewNavigation} aria-label="Next file preview" title="Next file" disabled={previewIndex < 0 || previewIndex >= results.length - 1} onClick={() => setDetailItem(results[previewIndex + 1])}><MediaPickerIcon name="next" size={14} /></button>
            </div>
            <strong className={styles.detailsName} title={detailItem.label}>{detailItem.label}</strong>
            <p className={styles.detailsMetadataLine}>{formatPreviewMetadata(detailItem, mediaDimensionsBySource[detailItem.src])}</p>
            {detailItem.kind === 'video' ? <section className={styles.coverImageSection} aria-label="Video cover image">
              <h4>Thumbnail</h4>
              <div className={styles.coverImageRow}>
                <div className={styles.coverImageThumb} aria-label={coverImageBySource[detailItem.src] ? 'Current cover image' : 'No cover image selected'}>
                  {coverImageBySource[detailItem.src] ? <MediaPreview src={coverImageBySource[detailItem.src]} kind="image" width={120} /> : <span>No image</span>}
                </div>
                <div className={styles.coverImageDetails}>
                  <button type="button" className={styles.coverImageChange} disabled={coverImageSaving || coverImageStatus === 'loading'} aria-label={coverImageBySource[detailItem.src] ? 'Change cover image' : 'Upload image'} onClick={() => { closeProductFilter(); setCoverImagePickerOpen(true); }}>
                    {coverImageBySource[detailItem.src] ? 'Change image' : 'Upload image'}
                  </button>
                </div>
              </div>
              {coverImageStatus === 'loading' ? <span className={styles.coverImageMessage} role="status">Loading cover image…</span> : null}
              {coverImageStatus === 'error' ? <span className={styles.coverImageMessage} role="alert">Cover image could not be loaded. <button type="button" onClick={() => { setCoverImageLoad({ key: coverImageSourceKey, status: 'loading' }); setCoverImageRetryKey((key) => key + 1); }}>Retry</button></span> : null}
              {coverImageMessageBySource[detailItem.src] ? <span className={styles.coverImageMessage} role={coverImageMessageBySource[detailItem.src] === 'Saved' ? 'status' : 'alert'}>{coverImageMessageBySource[detailItem.src]}</span> : null}
            </section> : null}
            <details className={styles.detailsMore} open={detailItem.kind === 'video'}>
              <summary>File details</summary>
              <dl className={styles.detailsMetadata}>
                <div><dt>File size</dt><dd>{detailItem.sizeBytes ? formatFileSize(detailItem.sizeBytes) : detailItem.id ? 'Size unavailable for this upload' : 'Not available for theme files'}</dd></div>
                {detailItem.kind === 'image' ? <div><dt>Dimensions</dt><dd>{formatImageDimensions(detailItem) || (mediaDimensionsBySource[detailItem.src]?.width && mediaDimensionsBySource[detailItem.src]?.height ? `${mediaDimensionsBySource[detailItem.src].width} × ${mediaDimensionsBySource[detailItem.src].height} px` : 'Not available')}</dd></div> : <div><dt>Duration</dt><dd>{formatVideoDuration(mediaDimensionsBySource[detailItem.src]?.duration) || 'Not available'}</dd></div>}
                <div><dt>Uploaded</dt><dd>{formatUploadDate(detailItem.createdAt) || (detailItem.id ? 'Upload date unavailable' : 'Date unavailable for theme files')}</dd></div>
                {detailItem.kind === 'image' ? <div><dt>Alt text</dt><dd>{altTextBySource[detailItem.src] || (altTextStatus === 'loading' ? 'Loading…' : 'No alt text saved')}</dd></div> : null}
              </dl>
              {detailItem.kind === 'video' ? <div className={styles.detailsAltText}>
                <label className={styles.detailsAltTextField}>
                  <span>Alt text</span>
                  <input aria-label={`Alt text for ${detailItem.label}`} maxLength={500} value={detailAltTextDraft} placeholder={altTextStatus === 'loading' ? 'Loading saved alt text…' : 'Describe this video'} onChange={(event) => { setAltTextDraftBySource((current) => ({ ...current, [detailItem.src]: event.target.value })); setAltTextMessageBySource((current) => ({ ...current, [detailItem.src]: '' })); }} />
                </label>
                <div className={styles.detailsAltTextActions}>
                  <button type="button" className={styles.detailsAltTextSave} disabled={altTextSaving || altTextStatus === 'loading' || altTextStatus === 'error'} onClick={saveDetailAltText}>Save alt text</button>
                  <span className={styles.altTextCount}>{detailAltTextDraft.length}/500</span>
                </div>
                {altTextStatus === 'error' ? <div className={styles.detailsAltTextError} role="alert"><span>Saved alt text could not be loaded. Retry before saving changes.</span><button type="button" className={styles.detailsAltTextRetry} onClick={retrySelectedAltTextLoad}>Retry</button></div> : null}
                {detailAltTextMessage ? <span className={styles.detailsAltTextMessage} role="status">{detailAltTextMessage}</span> : null}
              </div> : null}
              <h4>Used in</h4>
              {usageStatus === 'error' ? <p className={styles.detailsEmpty}>Usage information is unavailable.</p> : usageStatus === 'loading' ? <p className={styles.detailsEmpty}>Checking file usage…</p> : (usageBySource[detailItem.src] || []).length ? <ul className={styles.detailsUsage}>{usageBySource[detailItem.src].map((usage) => <li key={`${usage.href}:${usage.label}`}><span>{categoryForUsage(usage) === 'product-media' ? 'Product media' : 'Other'}</span><a href={usage.href}>{usage.label.replace(/^Product: /, '')}</a></li>)}</ul> : <p className={styles.detailsEmpty}>Not currently used.</p>}
            </details>
          </aside> : null}
        </div>
        {uploadLibrary.status === 'ready' && uploadLibrary.hasMore ? <div className="shopify-media-picker__pagination" aria-live="polite">
          {uploadLibrary.loadMoreError ? <span role="alert">{uploadLibrary.loadMoreError}</span> : <span>{uploads.length} of {uploadLibrary.total} matching uploaded files loaded · theme files are listed separately</span>}
          <button type="button" className="shopify-media-picker__cancel" disabled={uploadLibrary.loadingMore} onClick={uploadLibrary.loadMore}>{uploadLibrary.loadingMore ? 'Loading more files…' : uploadLibrary.loadMoreError ? 'Retry loading more' : 'Load more files'}</button>
        </div> : null}
        <div className="shopify-media-picker__footer">
          <div><button type="button" className="shopify-media-picker__cancel" onClick={onClose}>Cancel</button><button type="button" className="shopify-media-picker__done" disabled={!selectedSources.length || !selectionChanged || waitForSelectedAltText} onClick={chooseFiles}>Done{multiple && selectedSources.length ? ` · ${selectedSources.length}` : ''}</button></div>
        </div>
      </div>
      {coverImagePickerOpen && detailItem?.kind === 'video' ? <MediaLibraryModal
        kind="image"
        title="Select cover image"
        value={coverImageBySource[detailItem.src] || ''}
        onChoose={(imageSource) => { setCoverImagePickerOpen(false); saveSelectedCoverImage(imageSource); }}
        onClose={() => setCoverImagePickerOpen(false)}
      /> : null}
    </div>
  );
}

/** Kept for existing callers: the library popup for photos. */
export function ImageLibraryModal(props) {
  return <MediaLibraryModal {...props} kind="image" />;
}

/**
 * A photo or video field: shows the current file with two ways to replace it — upload a new file
 * from the computer, or choose one already in Media — and a Remove button.
 */
export function MediaField({ kind = 'image', value, onChange, allowRemove = true, guide = null, compact = false, showGuide = true }) {
  const rules = KINDS[kind];
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);
  const actionsMenu = useRef(null);

  const removeSelection = () => {
    if (kind === 'image') onChange('', '');
    else onChange('');
  };

  const openUpload = () => {
    if (actionsMenu.current) actionsMenu.current.open = false;
    fileInput.current?.click();
  };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError('');
    const result = await uploadMedia(file, kind);
    setUploading(false);
    if (result.ok) {
      if (kind === 'image') onChange(result.src, '');
      else onChange(result.src);
    } else setError(result.error);
  };

  return (
    <div className={['admin-image-field', `admin-image-field--${kind}`, compact ? 'admin-image-field--compact' : ''].filter(Boolean).join(' ')}>
      {compact && value ? (
        <div className="admin-image-field__selected">
          <span className="admin-image-field__frame" aria-hidden="true">
            <MediaPreview src={value} kind={kind} />
          </span>
          <span className="admin-image-field__name" title={value}>{labelFor(value)}</span>
          <button type="button" className="admin-image-field__replace" aria-label="Choose a replacement from Media" title="Choose a replacement from Media" disabled={uploading} onClick={() => setOpen(true)}>
            <MediaPickerIcon name="library" size={14} />
            <span>Replace</span>
          </button>
          <details ref={actionsMenu} className="admin-image-field__menu">
            <summary aria-label="More media actions" title="More media actions"><MediaPickerIcon name="more" size={16} /></summary>
            <div className="admin-image-field__menu-items">
              <button type="button" disabled={uploading} onClick={openUpload}>{uploading ? 'Uploading…' : 'Upload from computer'}</button>
              {allowRemove ? <button type="button" disabled={uploading} onClick={() => { actionsMenu.current.open = false; removeSelection(); }}>Remove</button> : null}
            </div>
          </details>
          <input ref={fileInput} type="file" accept={rules.accept} hidden onChange={(event) => { upload(event.target.files?.[0]); event.target.value = ''; }} />
        </div>
      ) : (
        <div className="admin-image-field__current">
          <span className="admin-image-field__frame" style={guide && !compact ? { aspectRatio: String(guide.aspect) } : undefined} title={guide && !compact ? `Preview cropped to ${guide.ratio}` : undefined}>
            {value ? <MediaPreview src={value} kind={kind} /> : <span className="admin-image-field__empty">No {rules.noun}</span>}
          </span>
          <div className="admin-image-field__actions">
            <button type="button" className="admin-button admin-button--ghost" aria-label="Upload from computer" title="Upload from computer" disabled={uploading} onClick={() => fileInput.current?.click()}>{uploading ? 'Uploading…' : compact ? 'Upload' : 'Upload from computer'}</button>
            <button type="button" className="admin-button admin-button--ghost" aria-label="Choose from Media" title="Choose from Media" disabled={uploading} onClick={() => setOpen(true)}>{compact ? <><MediaPickerIcon name="library" size={13} />Select</> : 'Choose from Media'}</button>
            <input ref={fileInput} type="file" accept={rules.accept} hidden onChange={(event) => { upload(event.target.files?.[0]); event.target.value = ''; }} />
          </div>
        </div>
      )}
      {value && !compact ? <span className="admin-image-field__name" title={value}>{labelFor(value)}</span> : null}
      {guide && showGuide ? <span className="admin-image-field__guide"><strong>Best size:</strong> {guide.ratio}, {guide.size} px or larger.{guide.note ? ` ${guide.note}` : ''}</span> : null}
      {uploading ? <span className="admin-field-help" role="status">Uploading to Kenmark Storage{kind === 'video' ? ' — large videos can take a minute' : ''}…</span> : null}
      {error ? <span className="admin-field-error" role="alert">{error}</span> : null}
      {open ? <MediaLibraryModal kind={kind} value={value} onChoose={(src, altText) => { if (kind === 'image') onChange(src, altText ?? ''); else onChange(src); setOpen(false); }} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}

export function VideoPicker(props) {
  return <MediaField {...props} kind="video" />;
}

export default function ImagePicker(props) {
  return <MediaField {...props} kind="image" />;
}
