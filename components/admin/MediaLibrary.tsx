// @ts-nocheck
'use client';

import Link from 'next/link';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  mediaAltTextBySourcesAction,
  mediaCoverImageBySourcesAction,
  queryMediaLibraryAction,
  saveMediaDisplayNameAction,
  mediaUsageAction,
  mediaUsageBySourcesAction,
  saveMediaAltTextAction,
  saveMediaCoverImageAction,
} from '@/lib/media-actions';
import { MediaLibraryModal, MediaPreview, SITE_LIBRARY, SITE_VIDEOS, labelFor, uploadMedia } from './ImagePicker';
import mediaPickerStyles from './ImagePicker.module.css';
import MediaImageEditor from './MediaImageEditor';

const TABS = [
  { key: 'uploads', label: 'Your uploads' },
  { key: 'photos', label: 'Site photos' },
  { key: 'videos', label: 'Site videos' },
];

const MEDIA_COLUMNS = [
  { key: 'alt', label: 'Alt text' },
  { key: 'createdAt', label: 'Date added' },
  { key: 'size', label: 'Size' },
  { key: 'references', label: 'References' },
  { key: 'updatedAt', label: 'Updated' },
];

const DEFAULT_MEDIA_COLUMNS = ['alt', 'createdAt', 'size', 'references'];
const MEDIA_PAGE_SIZE = 50;
const DEFAULT_LIBRARY_FILTERS = {
  fileType: 'all', fileTypeOperator: 'is', minimumSizeMb: '', maximumSizeMb: '',
  usageCategory: 'all', usageOperator: 'is', altCondition: 'all', altOperator: 'is',
};

function formatSize(bytes) {
  if (!bytes) return '';
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDimensions(item, measured) {
  const width = item.width || measured?.width;
  const height = item.height || measured?.height;
  return width && height ? `${width} × ${height} px` : '';
}

function formatDate(value, options = { dateStyle: 'medium' }) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(undefined, options).format(date);
}

function formatFileType(item) {
  const type = String(item.contentType || '').split('/').at(-1) || String(item.src || '').split('?')[0].split('.').at(-1);
  const normalized = String(type || '').toLowerCase();
  const names = { jpeg: 'JPG', jpg: 'JPG', png: 'PNG', webp: 'WEBP', avif: 'AVIF', mp4: 'MP4', webm: 'WEBM', quicktime: 'MOV', mov: 'MOV' };
  return names[normalized] || (normalized ? normalized.toUpperCase() : item.kind === 'video' ? 'Video' : 'Image');
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '';
  const totalSeconds = Math.floor(seconds);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function formatUsageCategory(usage) {
  return usage.category || (String(usage.label || '').startsWith('Product: ') ? 'Product media' : 'Other');
}

function LibraryMediaPreview({ item, poster = '', onMetadata }) {
  if (item.kind === 'image' || item.kind === 'video') {
    return <MediaPreview src={item.src} kind={item.kind} poster={poster} onMetadata={onMetadata} />;
  }
  return <span className="admin-media-library__generic-preview" aria-label={item.kind === 'model' ? '3D model file' : 'Other file'} style={{ display: 'grid', width: '100%', height: '100%', placeItems: 'center', background: '#f1f1f1', color: '#616161', fontSize: 11, fontWeight: 600 }}>{item.kind === 'model' ? '3D' : 'FILE'}</span>;
}

function TrashIcon() {
  return <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2M6 6l.8 10.2a1 1 0 0 0 1 .8h4.4a1 1 0 0 0 1-.8L14 6M8.5 9v5M11.5 9v5" /></svg>;
}

function MoreActionsIcon() {
  return <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden="true"><circle cx="4" cy="10" r="1.4" /><circle cx="10" cy="10" r="1.4" /><circle cx="16" cy="10" r="1.4" /></svg>;
}

export default function MediaLibrary() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [tab, setTab] = useState('uploads');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_LIBRARY_FILTERS);
  const [queryRetryKey, setQueryRetryKey] = useState(0);
  const [viewMode, setViewMode] = useState('list');
  const [visibleColumns, setVisibleColumns] = useState(() => new Set(DEFAULT_MEDIA_COLUMNS));
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [uploadLibrary, setUploadLibrary] = useState({ items: [], total: 0, totalPages: 0, status: 'loading', error: '' });
  const uploads = uploadLibrary.items;
  const [uploading, setUploading] = useState(null);
  const [notice, setNotice] = useState('');
  const [problems, setProblems] = useState([]);
  const [deleting, setDeleting] = useState('');
  const [blocked, setBlocked] = useState(null);
  const [picked, setPicked] = useState(() => new Set());
  const [knownUploadsById, setKnownUploadsById] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [expandedReferencesSource, setExpandedReferencesSource] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [sort, setSort] = useState({ key: 'dateAdded', direction: 'descending' });
  const [altTextBySource, setAltTextBySource] = useState({});
  const [altTextDraft, setAltTextDraft] = useState('');
  const [altTextStatus, setAltTextStatus] = useState('idle');
  const [altTextMessage, setAltTextMessage] = useState('');
  const [savingAltText, setSavingAltText] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState('');
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [displayNameMessage, setDisplayNameMessage] = useState('');
  const [coverImageBySource, setCoverImageBySource] = useState({});
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [savingCoverImage, setSavingCoverImage] = useState(false);
  const [coverImageMessage, setCoverImageMessage] = useState('');
  const [replacementOpen, setReplacementOpen] = useState(false);
  const [replacementFile, setReplacementFile] = useState(null);
  const [replacingFile, setReplacingFile] = useState(false);
  const [usageBySource, setUsageBySource] = useState({});
  const [usageStatus, setUsageStatus] = useState('idle');
  const [usageStatusBySource, setUsageStatusBySource] = useState({});
  const [measuredBySource, setMeasuredBySource] = useState({});
  const input = useRef(null);
  const replacementInput = useRef(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim().slice(0, 200)), 220);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (tab !== 'uploads') return undefined;
    let cancelled = false;
    setUploadLibrary((current) => ({ ...current, status: 'loading', error: '' }));
    queryMediaLibraryAction({
      page: pageNumber,
      pageSize: MEDIA_PAGE_SIZE,
      search: debouncedQuery,
      sortKey: sort.key,
      direction: sort.direction,
      filters,
    }).then((result) => {
      if (cancelled) return;
      if (!result?.ok) {
        setUploadLibrary({ items: [], total: 0, totalPages: 0, status: 'error', error: result?.error || 'Could not load uploaded files.' });
        return;
      }
      const items = (result.items || []).map((item) => ({ ...item, contentType: String(item.contentType || '') }));
      setUploadLibrary({ items, total: result.total, totalPages: result.totalPages, status: 'ready', error: '' });
      setAltTextBySource((current) => ({ ...current, ...Object.fromEntries(items.map((item) => [item.src, item.altText || ''])) }));
      setUsageBySource((current) => ({ ...current, ...Object.fromEntries(items.map((item) => [item.src, item.usage || []])) }));
      setUsageStatusBySource((current) => ({ ...current, ...Object.fromEntries(items.map((item) => [item.src, 'ready'])) }));
    }).catch(() => {
      if (!cancelled) setUploadLibrary({ items: [], total: 0, totalPages: 0, status: 'error', error: 'Could not load the complete file collection for global filtering. Retry the request.' });
    });
    return () => { cancelled = true; };
  }, [debouncedQuery, filters, pageNumber, queryRetryKey, refreshKey, sort.direction, sort.key, tab]);

  useEffect(() => {
    if (tab !== 'uploads' || uploadLibrary.status !== 'ready') return;
    if (!uploadLibrary.totalPages && pageNumber !== 1) setPageNumber(1);
    else if (uploadLibrary.totalPages && pageNumber > uploadLibrary.totalPages) setPageNumber(uploadLibrary.totalPages);
  }, [pageNumber, tab, uploadLibrary.status, uploadLibrary.totalPages]);

  useEffect(() => {
    if (!uploads.length) return;
    setKnownUploadsById((current) => ({ ...current, ...Object.fromEntries(uploads.map((item) => [item.id, item])) }));
  }, [uploads]);

  const lists = {
    uploads,
    photos: SITE_LIBRARY.map((src) => ({ src, label: labelFor(src), kind: 'image' })),
    videos: SITE_VIDEOS.map((src) => ({ src, label: labelFor(src), kind: 'video' })),
  };
  const items = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const currentList = lists[tab];
    return normalizedQuery && tab !== 'uploads'
      ? currentList.filter((item) => `${item.src} ${item.label}`.toLowerCase().includes(normalizedQuery))
      : currentList;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lists is derived from uploads
  }, [tab, uploads, query]);
  useEffect(() => {
    if (tab === 'uploads') return;
    const totalPages = Math.max(1, Math.ceil(items.length / MEDIA_PAGE_SIZE));
    if (pageNumber > totalPages) setPageNumber(totalPages);
  }, [items.length, pageNumber, tab]);
  const sortedItems = useMemo(() => tab === 'uploads' ? items : [...items].sort((first, second) => {
    let comparison = 0;
    if (sort.key === 'fileName' || sort.key === 'name') comparison = first.label.localeCompare(second.label);
    else if (sort.key === 'size') comparison = (first.sizeBytes || 0) - (second.sizeBytes || 0);
    else comparison = new Date(first.createdAt || 0).getTime() - new Date(second.createdAt || 0).getTime();
    return sort.direction === 'ascending' ? comparison : -comparison;
  }), [items, sort, tab]);
  const visibleItems = tab === 'uploads' ? sortedItems : sortedItems.slice((pageNumber - 1) * MEDIA_PAGE_SIZE, pageNumber * MEDIA_PAGE_SIZE);
  const totalItemCount = tab === 'uploads' ? uploadLibrary.total : sortedItems.length;
  const totalPageCount = tab === 'uploads' ? uploadLibrary.totalPages : Math.ceil(sortedItems.length / MEDIA_PAGE_SIZE);

  const visibleUploadsById = Object.fromEntries(uploads.map((item) => [item.id, item]));
  const selectedUploads = [...picked].map((id) => knownUploadsById[id] || visibleUploadsById[id]).filter(Boolean);
  const allLoadedUploadsPicked = uploads.length > 0 && uploads.every((item) => picked.has(item.id));
  const selectedItemCurrent = selectedItem ? items.find((item) => item.src === selectedItem.src) || selectedItem : null;

  useEffect(() => {
    setDisplayNameDraft(selectedItemCurrent?.label || '');
    setDisplayNameMessage('');
  }, [selectedItemCurrent?.src, selectedItemCurrent?.label]);

  useEffect(() => {
    if (!selectedItem?.id) return;
    const refreshedItem = uploads.find((item) => item.id === selectedItem.id);
    if (refreshedItem && refreshedItem.label !== selectedItem.label) setSelectedItem(refreshedItem);
  }, [uploads, selectedItem]);

  useEffect(() => {
    if (!selectedItemCurrent) return;
    let cancelled = false;
    setAltTextStatus('loading');
    setAltTextMessage('');
    setUsageStatus('loading');
    Promise.all([
      mediaAltTextBySourcesAction([selectedItemCurrent.src]),
      mediaUsageAction(selectedItemCurrent.src),
      selectedItemCurrent.kind === 'video' ? mediaCoverImageBySourcesAction([selectedItemCurrent.src]) : Promise.resolve({ ok: true, coverImageBySource: {} }),
    ]).then(([altResult, usageResult, coverResult]) => {
      if (cancelled) return;
      if (altResult.ok) {
        const altText = altResult.altTextBySource?.[selectedItemCurrent.src] || '';
        setAltTextBySource((current) => ({ ...current, [selectedItemCurrent.src]: altText }));
        setAltTextDraft(altText);
        setAltTextStatus('ready');
      } else setAltTextStatus('error');
      setUsageBySource((current) => ({ ...current, [selectedItemCurrent.src]: usageResult.usage || [] }));
      setUsageStatus(usageResult.ok ? 'ready' : 'error');
      setUsageStatusBySource((current) => ({ ...current, [selectedItemCurrent.src]: usageResult.ok ? 'ready' : 'error' }));
      if (coverResult.ok) setCoverImageBySource((current) => ({ ...current, ...coverResult.coverImageBySource }));
    }).catch(() => {
      if (!cancelled) {
        setAltTextStatus('error');
        setUsageStatus('error');
      }
    });
    return () => { cancelled = true; };
  }, [selectedItemCurrent]);

  useEffect(() => {
    const sources = items.map((item) => item.src).filter(Boolean);
    if (!sources.length) return;
    let cancelled = false;
    const loadRows = async () => {
      for (let index = 0; index < sources.length; index += 500) {
        const sourceBatch = sources.slice(index, index + 500);
        setUsageStatusBySource((current) => ({ ...current, ...Object.fromEntries(sourceBatch.map((source) => [source, 'loading'])) }));
        const [usageResult, altResult, coverResult] = await Promise.all([
          mediaUsageBySourcesAction(sourceBatch),
          mediaAltTextBySourcesAction(sourceBatch),
          sourceBatch.some((source) => items.find((item) => item.src === source)?.kind === 'video')
            ? mediaCoverImageBySourcesAction(sourceBatch.filter((source) => items.find((item) => item.src === source)?.kind === 'video'))
            : Promise.resolve({ ok: true, coverImageBySource: {} }),
        ]);
        if (cancelled) return;
        if (usageResult.ok) {
          setUsageBySource((current) => ({ ...current, ...usageResult.usageBySource }));
          setUsageStatusBySource((current) => ({ ...current, ...Object.fromEntries(sourceBatch.map((source) => [source, 'ready'])) }));
        } else setUsageStatusBySource((current) => ({ ...current, ...Object.fromEntries(sourceBatch.map((source) => [source, 'error'])) }));
        if (altResult.ok) setAltTextBySource((current) => ({ ...current, ...altResult.altTextBySource }));
        if (coverResult.ok) setCoverImageBySource((current) => ({ ...current, ...coverResult.coverImageBySource }));
      }
    };
    loadRows().catch(() => {
      if (!cancelled) setUsageStatusBySource((current) => ({ ...current, ...Object.fromEntries(sources.map((source) => [source, 'error'])) }));
    });
    return () => { cancelled = true; };
  }, [items]);

  const upload = async (files) => {
    const fileList = [...(files || [])];
    if (!fileList.length) return;
    setNotice('');
    setProblems([]);
    setBlocked(null);
    let done = 0;
    const failed = [];
    for (const [index, file] of fileList.entries()) {
      setUploading({ done: index, total: fileList.length });
      const result = await uploadMedia(file, file.type.startsWith('video/') ? 'video' : 'image');
      if (result.ok) done += 1;
      else failed.push(result.error);
    }
    setUploading(null);
    setNotice(done ? `${done} file${done === 1 ? '' : 's'} uploaded to Kenmark Storage.` : '');
    setProblems(failed);
    setTab('uploads');
    setPageNumber(1);
    setRefreshKey((key) => key + 1);
  };

  const uploadReplacement = async () => {
    if (!selectedItemCurrent?.id || !replacementFile || replacingFile) return;
    setReplacingFile(true);
    setNotice('');
    setProblems([]);
    const uploaded = await uploadMedia(replacementFile, selectedItemCurrent.kind);
    if (!uploaded.ok) {
      setReplacingFile(false);
      setProblems([uploaded.error || 'The replacement file could not be uploaded. The original file is unchanged.']);
      return;
    }

    let altTextCopied = true;
    const originalAltText = altTextBySource[selectedItemCurrent.src] || '';
    if (originalAltText) {
      const altResult = await saveMediaAltTextAction(uploaded.src, originalAltText);
      altTextCopied = Boolean(altResult.ok);
    }

    setReplacingFile(false);
    setReplacementOpen(false);
    setReplacementFile(null);
    setPageNumber(1);
    setRefreshKey((key) => key + 1);
    setNotice(altTextCopied
      ? `Uploaded “${replacementFile.name}” as a new file. The original and its ${usageBySource[selectedItemCurrent.src]?.length || 0} references are unchanged.`
      : `Uploaded “${replacementFile.name}” as a new file, but its alt text could not be copied. The original and its references are unchanged.`);
  };

  const remove = async (item) => {
    setDeleting(item.id);
    setNotice('');
    setProblems([]);
    setBlocked(null);
    let usageResult;
    try { usageResult = await mediaUsageAction(item.src); } catch { usageResult = { ok: false, usage: [] }; }
    if (!usageResult.ok) {
      setDeleting('');
      setProblems([`Could not verify where “${item.label}” is used. Try again before deleting it.`]);
      return;
    }
    const { usage = [] } = usageResult;
    if (usage.length) {
      setDeleting('');
      setBlocked({ item, usage });
      return;
    }
    if (!window.confirm(`Delete “${item.label}”? It isn’t used anywhere on the website.`)) { setDeleting(''); return; }
    await deleteNow(item);
  };

  const deleteNow = async (item) => {
    setDeleting(item.id);
    let response = null;
    let responseBody = {};
    try {
      response = await fetch(`/api/assets/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
      responseBody = await response.json().catch(() => ({}));
    } catch { response = null; }
    setDeleting('');
    setBlocked(null);
    setProblems(response?.ok ? [] : [responseBody?.error || `Could not delete ${item.label}. Try again.`]);
    setNotice(response?.ok ? `Deleted “${item.label}”.` : '');
    if (response?.ok) {
      setPicked((current) => { const next = new Set(current); next.delete(item.id); return next; });
      setKnownUploadsById((current) => { const next = { ...current }; delete next[item.id]; return next; });
      if (selectedItem?.id === item.id) setSelectedItem(null);
    }
    setPageNumber(1);
    setRefreshKey((key) => key + 1);
  };

  const togglePick = (id) => setPicked((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  // Deletes selected uploads only after usage checks; files still in use are kept and explained.
  const removePicked = async () => {
    const chosen = selectedUploads;
    if (!chosen.length) return;
    setNotice('');
    setProblems([]);
    setBlocked(null);
    setDeleting('bulk');
    let checks;
    try {
      checks = await Promise.all(chosen.map(async (item) => {
        const result = await mediaUsageAction(item.src);
        return { item, ok: result.ok, usage: result.usage || [] };
      }));
    } catch {
      setDeleting('');
      setProblems(['Could not verify where the selected files are used. No files were deleted; try again.']);
      return;
    }
    const failedChecks = checks.filter((check) => !check.ok);
    if (failedChecks.length) {
      setDeleting('');
      setProblems(failedChecks.map(({ item }) => `Could not verify where “${item.label}” is used. No files were deleted; try again.`));
      return;
    }
    const inUse = checks.filter((check) => check.usage.length);
    const free = checks.filter((check) => !check.usage.length).map((check) => check.item);
    if (!free.length) {
      setDeleting('');
      setProblems(inUse.map(({ item, usage }) => `“${item.label}” is still used on: ${usage.map((place) => place.label).join(', ')}. Replace it there first.`));
      return;
    }
    if (!window.confirm(`Delete ${free.length} file${free.length === 1 ? '' : 's'}?${inUse.length ? ` ${inUse.length} still in use will be kept.` : ''}`)) { setDeleting(''); return; }
    let done = 0;
    const deleteErrors = [];
    for (const item of free) {
      try {
        const response = await fetch(`/api/assets/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
        const body = response.ok ? null : await response.json().catch(() => ({}));
        if (response.ok) done += 1;
        else deleteErrors.push(body?.error || `Could not delete “${item.label}”.`);
      } catch {
        deleteErrors.push(`Could not confirm deletion of “${item.label}”. Check Files before retrying.`);
      }
    }
    setDeleting('');
    setPicked(new Set());
    setNotice(done ? `Deleted ${done} file${done === 1 ? '' : 's'}.` : 'No files were deleted.');
    setProblems([
      ...inUse.map(({ item, usage }) => `Kept “${item.label}” — still used on: ${usage.map((place) => place.label).join(', ')}.`),
      ...deleteErrors,
    ]);
    setPageNumber(1);
    setRefreshKey((key) => key + 1);
  };

  const copy = async (src) => {
    const link = new URL(src, window.location.origin).toString();
    try { await navigator.clipboard.writeText(link); setNotice('Link copied.'); } catch { setNotice(link); }
  };

  const saveAltText = async () => {
    if (!selectedItemCurrent) return;
    setSavingAltText(true);
    setAltTextMessage('');
    const result = await saveMediaAltTextAction(selectedItemCurrent.src, altTextDraft);
    setSavingAltText(false);
    if (!result.ok) { setAltTextMessage(result.error || 'Could not save alt text.'); return; }
    setAltTextBySource((current) => ({ ...current, [selectedItemCurrent.src]: result.altText }));
    setAltTextDraft(result.altText);
    setAltTextMessage('Saved');
  };

  const saveDisplayName = async () => {
    if (!selectedItemCurrent?.id) return;
    const source = selectedItemCurrent.src;
    setSavingDisplayName(true);
    setDisplayNameMessage('');
    const result = await saveMediaDisplayNameAction(source, displayNameDraft);
    setSavingDisplayName(false);
    if (!result.ok) {
      setDisplayNameMessage(result.error || 'Could not save the name.');
      return;
    }
    const updatedItem = { ...selectedItemCurrent, label: result.displayName };
    setDisplayNameDraft(result.displayName);
    setSelectedItem(updatedItem);
    setKnownUploadsById((current) => ({ ...current, [updatedItem.id]: updatedItem }));
    setDisplayNameMessage('Saved');
    setRefreshKey((key) => key + 1);
  };

  const saveCoverImage = async (imageSource) => {
    if (!selectedItemCurrent) return;
    setSavingCoverImage(true);
    setCoverImageMessage('');
    const result = await saveMediaCoverImageAction(selectedItemCurrent.src, imageSource);
    setSavingCoverImage(false);
    if (result.ok) setCoverImageBySource((current) => ({ ...current, [selectedItemCurrent.src]: result.coverImageSource }));
    else setCoverImageMessage(result.error || 'Could not save the thumbnail image. Try again.');
  };

  const openReplacement = (item) => {
    setSelectedItem(item);
    setReplacementFile(null);
    setReplacementOpen(true);
  };

  const changeSort = (key) => setSort((current) => current.key === key
    ? { key, direction: current.direction === 'ascending' ? 'descending' : 'ascending' }
    : { key, direction: key === 'name' || key === 'fileName' ? 'ascending' : 'descending' });

  const updateFilters = (changes) => {
    setFilters((current) => ({ ...current, ...changes }));
    setPageNumber(1);
  };
  const activeFilterCount = Number(filters.fileType !== 'all')
    + Number(filters.minimumSizeMb !== '' || filters.maximumSizeMb !== '')
    + Number(filters.usageCategory !== 'all')
    + Number(filters.altCondition !== 'all');
  const resetMediaFilters = () => { setFilters(DEFAULT_LIBRARY_FILTERS); setPageNumber(1); };

  return (
    <div className="admin-media-library">
      <div className="admin-card admin-media-library__toolbar">
        <div className="admin-view-tabs" role="tablist" aria-label="Media source">
          {TABS.map((item) => <button key={item.key} type="button" role="tab" aria-selected={tab === item.key} className={tab === item.key ? 'is-active' : ''} onClick={() => { setTab(item.key); setPageNumber(1); setSelectedItem(null); }}>{item.label} <small>{item.key === 'uploads' ? uploadLibrary.total : lists[item.key].length}</small></button>)}
        </div>
        <input type="search" placeholder="Search files" value={query} onChange={(event) => { setQuery(event.target.value); setPageNumber(1); }} aria-label="Search files" />
        <div className="admin-media-library__view-controls" role="group" aria-label="File display options">
          {tab === 'uploads' ? <label className="admin-field" style={{ minWidth: 190, margin: 0, fontSize: 12 }}><span>Sort by</span><select value={`${sort.key}:${sort.direction}`} onChange={(event) => { const [key, direction] = event.target.value.split(':'); setSort({ key, direction }); setPageNumber(1); }} aria-label="Sort uploaded files">
            <option value="dateAdded:descending">Date added · newest</option><option value="dateAdded:ascending">Date added · oldest</option>
            <option value="fileName:ascending">File name · A–Z</option><option value="fileName:descending">File name · Z–A</option>
            <option value="size:ascending">Size · smallest</option><option value="size:descending">Size · largest</option>
          </select></label> : null}
          <div className="admin-media-library__view-toggle" role="group" aria-label="View files as">
            <button type="button" aria-pressed={viewMode === 'grid'} aria-label="Grid view" title="Grid view" className={viewMode === 'grid' ? 'is-active' : ''} onClick={() => setViewMode('grid')}><span aria-hidden="true">▦</span></button>
            <button type="button" aria-pressed={viewMode === 'list'} aria-label="List view" title="List view" className={viewMode === 'list' ? 'is-active' : ''} onClick={() => setViewMode('list')}><span aria-hidden="true">☷</span></button>
          </div>
          {viewMode === 'list' ? <div className="admin-media-library__columns-control">
            <button type="button" className="admin-button admin-button--ghost" aria-expanded={columnsOpen} aria-controls="media-library-columns" onClick={() => setColumnsOpen((open) => !open)}>Columns</button>
            {columnsOpen ? <div className="admin-media-library__columns-menu" id="media-library-columns" role="group" aria-label="Visible file columns">
              {MEDIA_COLUMNS.map((column) => <label key={column.key}><input type="checkbox" checked={visibleColumns.has(column.key)} onChange={(event) => setVisibleColumns((current) => { const next = new Set(current); if (event.target.checked) next.add(column.key); else next.delete(column.key); return next; })} />{column.label}</label>)}
            </div> : null}
          </div> : null}
        </div>
        <button type="button" className="admin-button" disabled={Boolean(uploading)} onClick={() => input.current?.click()}>{uploading ? `Uploading ${uploading.done + 1} of ${uploading.total}…` : 'Upload files'}</button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" multiple hidden onChange={(event) => { upload(event.target.files); event.target.value = ''; }} />
      </div>
      {tab === 'uploads' ? <details className="admin-card admin-media-library__filters" open={filtersOpen} onToggle={(event) => setFiltersOpen(event.currentTarget.open)}>
        <summary className="admin-button admin-button--ghost">Search and filter{activeFilterCount ? ` · ${activeFilterCount} active` : ''}</summary>
        <div className="admin-field-row admin-media-library__filter-fields" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 14 }}>
          <label className="admin-field" style={{ fontSize: 12 }}><span>File type</span><select style={{ minHeight: 34, padding: '6px 9px', borderRadius: 6, fontSize: 13 }} value={filters.fileType} onChange={(event) => updateFilters({ fileType: event.target.value })}>
            <option value="all">All types</option><option value="image">Image</option><option value="video">Video</option><option value="model">3D model</option><option value="other">Other</option>
          </select></label>
          <label className="admin-field" style={{ fontSize: 12 }}><span>Type match</span><select style={{ minHeight: 34, padding: '6px 9px', borderRadius: 6, fontSize: 13 }} value={filters.fileTypeOperator} disabled={filters.fileType === 'all'} onChange={(event) => updateFilters({ fileTypeOperator: event.target.value })}><option value="is">Is</option><option value="is-not">Is not</option></select></label>
          <label className="admin-field" style={{ fontSize: 12 }}><span>File size · minimum MB</span><input style={{ minHeight: 34, padding: '6px 9px', borderRadius: 6, fontSize: 13 }} type="number" min="0" step="0.1" value={filters.minimumSizeMb} onChange={(event) => updateFilters({ minimumSizeMb: event.target.value })} /></label>
          <label className="admin-field" style={{ fontSize: 12 }}><span>File size · maximum MB</span><input style={{ minHeight: 34, padding: '6px 9px', borderRadius: 6, fontSize: 13 }} type="number" min="0" step="0.1" value={filters.maximumSizeMb} onChange={(event) => updateFilters({ maximumSizeMb: event.target.value })} /></label>
          <label className="admin-field" style={{ fontSize: 12 }}><span>Used in</span><select style={{ minHeight: 34, padding: '6px 9px', borderRadius: 6, fontSize: 13 }} value={filters.usageCategory} onChange={(event) => updateFilters({ usageCategory: event.target.value })}><option value="all">Any usage</option><option value="product">Product</option><option value="other">Other</option></select></label>
          <label className="admin-field" style={{ fontSize: 12 }}><span>Usage match</span><select style={{ minHeight: 34, padding: '6px 9px', borderRadius: 6, fontSize: 13 }} value={filters.usageOperator} disabled={filters.usageCategory === 'all'} onChange={(event) => updateFilters({ usageOperator: event.target.value })}><option value="is">Is</option><option value="is-not">Is not</option></select></label>
          <label className="admin-field" style={{ fontSize: 12 }}><span>Alt text</span><select style={{ minHeight: 34, padding: '6px 9px', borderRadius: 6, fontSize: 13 }} value={filters.altCondition} onChange={(event) => updateFilters({ altCondition: event.target.value })}><option value="all">Any alt text</option><option value="filled">Filled</option><option value="empty">Empty</option></select></label>
          <label className="admin-field" style={{ fontSize: 12 }}><span>Alt text match</span><select style={{ minHeight: 34, padding: '6px 9px', borderRadius: 6, fontSize: 13 }} value={filters.altOperator} disabled={filters.altCondition === 'all'} onChange={(event) => updateFilters({ altOperator: event.target.value })}><option value="is">Is</option><option value="is-not">Is not</option></select></label>
          <div className="admin-media-library__filter-reset"><button type="button" className="admin-button admin-button--ghost" disabled={!activeFilterCount} onClick={resetMediaFilters}>Clear filters</button></div>
        </div>
        <p className="admin-field-help">External video links are not uploaded assets in this library. 3D model files are filtered when present in storage.</p>
      </details> : null}
      {notice ? <div className="admin-alert" role="status">{notice}</div> : null}
      {tab === 'uploads' && uploadLibrary.status === 'error' ? <div className="admin-form-message admin-media-library__load-error" role="alert"><span>{uploadLibrary.error}</span><button type="button" className="admin-button admin-button--ghost" onClick={() => setQueryRetryKey((key) => key + 1)}>Retry</button></div> : null}
      {problems.length ? <div className="admin-form-message" role="alert">{problems.map((problem) => <p key={problem}>{problem}</p>)}</div> : null}
      {blocked ? (
        <div className="admin-form-message admin-media-library__inuse" role="alert">
          <p><strong>“{blocked.item.label}” is still used on the website:</strong></p>
          <ul>{blocked.usage.map((place) => <li key={place.href + place.label}><Link href={place.href}>{place.label}</Link></li>)}</ul>
          <p>This file cannot be deleted until its references are removed. Keep it here while you update those places.</p>
          <div className="admin-media-library__inuse-actions"><button type="button" className="admin-button admin-button--ghost" onClick={() => setBlocked(null)}>Keep it</button></div>
        </div>
      ) : null}
      {tab === 'uploads' && uploads.length ? (
        <div className="admin-media-library__bulk">
          <label className="admin-check"><input type="checkbox" checked={allLoadedUploadsPicked} aria-label="Select all files on this page" onChange={(event) => setPicked((current) => { const next = new Set(current); for (const item of uploads) { if (event.target.checked) next.add(item.id); else next.delete(item.id); } return next; })} /><span>{picked.size ? `${picked.size} selected` : 'Select files on this page'}</span></label>
          {picked.size ? <div className="admin-media-library__bulk-actions"><button type="button" className="admin-text-button" onClick={() => setPicked(new Set())}>Clear selection</button><button type="button" className="admin-button admin-button--danger" disabled={deleting === 'bulk' || !selectedUploads.length} onClick={removePicked}>{deleting === 'bulk' ? 'Deleting…' : `Delete ${selectedUploads.length} selected`}</button></div> : null}
        </div>
      ) : null}
      {tab !== 'uploads' ? <p className="admin-field-help admin-media-library__note">These {tab === 'videos' ? 'videos' : 'photos'} are built into the website’s design, so they can’t be deleted here.</p> : null}
      <div className={`admin-media-library__workspace${selectedItemCurrent ? ' has-selection' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); upload(event.dataTransfer.files); }}>
        <div className={`admin-card admin-media-library__table-wrap${viewMode === 'grid' ? ' is-grid' : ''}`}>
          {visibleItems.length && viewMode === 'grid' ? <div className="admin-media-library__file-grid">
            {visibleItems.map((item) => {
              const fileUsage = usageBySource[item.src] || [];
              const usageState = usageStatusBySource[item.src];
              const altText = altTextBySource[item.src];
              return <article key={item.src} className={`admin-media-library__grid-item${selectedItemCurrent?.src === item.src ? ' is-selected' : ''}${item.id && picked.has(item.id) ? ' is-picked' : ''}`}>
                <button type="button" className="admin-media-library__grid-preview" onClick={() => { setSelectedItem(item); if (item.kind === 'image') setEditingItem(item); }} aria-label={`${item.kind === 'image' ? 'Edit' : 'View details for'} ${item.label}`}><LibraryMediaPreview item={item} poster={coverImageBySource[item.src]} /></button>
                <div className="admin-media-library__grid-copy"><strong title={item.label}>{item.label}</strong><small>{formatFileType(item)}{formatDimensions(item, measuredBySource[item.src]) ? ` · ${formatDimensions(item, measuredBySource[item.src])}` : ''}</small></div>
              <div className="admin-media-library__grid-meta"><span>{formatSize(item.sizeBytes) || '—'}</span><span>{usageState === 'loading' || !usageState ? '…' : usageState === 'error' ? 'Unavailable' : fileUsage.length ? <button type="button" className="admin-text-button" aria-expanded={expandedReferencesSource === item.src} onClick={() => setExpandedReferencesSource((current) => current === item.src ? '' : item.src)}>{fileUsage.length} references</button> : '0 references'}</span></div>
                {expandedReferencesSource === item.src && fileUsage.length ? <div className="admin-media-library__grid-references"><strong>View file references</strong><ul>{fileUsage.map((usage) => <li key={`${usage.href}:${usage.label}`}><span>{formatUsageCategory(usage)}</span><Link href={usage.href}>{usage.label.replace(/^Product: /, '')}</Link></li>)}</ul></div> : null}
                <div className="admin-media-library__grid-actions">{item.id ? <label className="admin-media-library__grid-select"><input type="checkbox" checked={picked.has(item.id)} onChange={() => togglePick(item.id)} aria-label={`Select ${item.label}`} /><span>{picked.has(item.id) ? 'Selected' : 'Select'}</span></label> : <span />}
                  <button type="button" className="admin-text-button" onClick={() => copy(item.src)}>Copy link</button>
                  {item.id ? <button type="button" className="admin-text-button" disabled={usageState !== 'ready'} onClick={() => openReplacement(item)} title={usageState !== 'ready' ? 'Wait for file references to load.' : undefined}>Replace</button> : null}
                  {item.id ? <details className="admin-media-library__actions-menu"><summary aria-label={`More actions for ${item.label}`}><MoreActionsIcon /></summary><div><button type="button" disabled={deleting === item.id} onClick={() => remove(item)}>{deleting === item.id ? 'Checking…' : 'Delete file'}</button></div></details> : null}
                </div>
                {altText ? <p className="admin-media-library__grid-alt" title={altText}>{altText}</p> : null}
              </article>;
            })}
          </div> : visibleItems.length ? <table className="admin-media-library__table">
            <thead><tr>
              <th className="admin-media-library__select-column"><span className="admin-visually-hidden">Select</span></th>
              <th aria-sort={(tab === 'uploads' ? sort.key === 'fileName' : sort.key === 'name') ? sort.direction : 'none'}><button type="button" onClick={() => { changeSort(tab === 'uploads' ? 'fileName' : 'name'); setPageNumber(1); }}>File <span aria-hidden="true">↕</span></button></th>
              {visibleColumns.has('alt') ? <th>Alt text</th> : null}
              {visibleColumns.has('createdAt') ? <th aria-sort={(tab === 'uploads' ? sort.key === 'dateAdded' : sort.key === 'createdAt') ? sort.direction : 'none'}><button type="button" onClick={() => { changeSort(tab === 'uploads' ? 'dateAdded' : 'createdAt'); setPageNumber(1); }}>Date added <span aria-hidden="true">↕</span></button></th> : null}
              {visibleColumns.has('size') ? <th aria-sort={sort.key === 'size' ? sort.direction : 'none'}><button type="button" onClick={() => { changeSort('size'); setPageNumber(1); }}>Size <span aria-hidden="true">↕</span></button></th> : null}
              {visibleColumns.has('references') ? <th>References</th> : null}
              {visibleColumns.has('updatedAt') ? <th>Updated</th> : null}
              <th><span className="admin-visually-hidden">Actions</span></th>
            </tr></thead>
            <tbody>{visibleItems.map((item) => {
              const fileUsage = usageBySource[item.src] || [];
              const usageState = usageStatusBySource[item.src];
              const usageLabel = usageState === 'loading' || !usageState ? '…' : usageState === 'error' ? 'Unavailable' : String(fileUsage.length);
              const altText = altTextBySource[item.src];
              return <Fragment key={item.src}><tr className={`${selectedItemCurrent?.src === item.src ? 'is-selected' : ''}${item.id && picked.has(item.id) ? ' is-picked' : ''}`}>
                <td className="admin-media-library__select-column" data-label="Select">{item.id ? <input type="checkbox" checked={picked.has(item.id)} onChange={() => togglePick(item.id)} aria-label={`Select ${item.label}`} /> : null}</td>
                <td data-label="File"><button type="button" className="admin-media-library__file" onClick={() => { setSelectedItem(item); if (item.kind === 'image') setEditingItem(item); }} aria-label={`${item.kind === 'image' ? 'Edit' : 'View details for'} ${item.label}`}>
                  <span className="admin-media-library__thumbnail"><LibraryMediaPreview item={item} poster={coverImageBySource[item.src]} /></span>
                  <span className="admin-media-library__file-copy"><strong title={item.label}>{item.label}</strong><small>{formatFileType(item)}{formatDimensions(item, measuredBySource[item.src]) ? ` · ${formatDimensions(item, measuredBySource[item.src])}` : ''}</small></span>
                </button></td>
                {visibleColumns.has('alt') ? <td className="admin-media-library__alt" data-label="Alt text" title={altText || 'No alt text saved'}>{altText === undefined ? '—' : altText || 'No alt text'}</td> : null}
                {visibleColumns.has('createdAt') ? <td data-label="Date added">{formatDate(item.createdAt) || '—'}</td> : null}
                {visibleColumns.has('size') ? <td data-label="Size">{formatSize(item.sizeBytes) || '—'}</td> : null}
                {visibleColumns.has('references') ? <td data-label="References">{fileUsage.length && usageState === 'ready' ? <button type="button" className="admin-text-button" aria-expanded={expandedReferencesSource === item.src} onClick={() => setExpandedReferencesSource((current) => current === item.src ? '' : item.src)}>{usageLabel}</button> : usageLabel}</td> : null}
                {visibleColumns.has('updatedAt') ? <td data-label="Updated">{formatDate(item.updatedAt) || '—'}</td> : null}
                <td className="admin-media-library__row-actions" data-label="Actions"><button type="button" className="admin-text-button" onClick={() => copy(item.src)}>Copy link</button>{item.id ? <button type="button" className="admin-text-button" disabled={usageState !== 'ready'} onClick={() => openReplacement(item)} title={usageState !== 'ready' ? 'Wait for file references to load.' : undefined}>Replace</button> : null}{item.id ? <details className="admin-media-library__actions-menu"><summary aria-label={`More actions for ${item.label}`}><MoreActionsIcon /></summary><div><button type="button" disabled={deleting === item.id} onClick={() => remove(item)}>{deleting === item.id ? 'Checking…' : 'Delete file'}</button></div></details> : null}</td>
              </tr>{expandedReferencesSource === item.src && fileUsage.length ? <tr className="admin-media-library__reference-row"><td colSpan={3 + MEDIA_COLUMNS.filter((column) => visibleColumns.has(column.key)).length}><strong>View file references</strong><ul>{fileUsage.map((usage) => <li key={`${usage.href}:${usage.label}`}><span>{formatUsageCategory(usage)}</span><Link href={usage.href}>{usage.label.replace(/^Product: /, '')}</Link></li>)}</ul></td></tr> : null}</Fragment>;
            })}</tbody>
          </table> : tab === 'uploads' && uploadLibrary.status === 'error' ? null : <div className="admin-media-library__empty">{tab === 'uploads' && uploadLibrary.status === 'loading' ? 'Loading uploaded files…' : tab === 'uploads' ? 'No uploads match your search. Click “Upload files” or drop files here.' : 'Nothing matches your search.'}</div>}
        </div>
        {selectedItemCurrent ? <aside className="admin-card admin-media-library__details" aria-label={`File information for ${selectedItemCurrent.label}`}>
          <div className="admin-media-library__details-heading"><h2>File information</h2><button type="button" className="admin-media-library__close" aria-label="Close file information" onClick={() => setSelectedItem(null)}>×</button></div>
          <div className={`admin-media-library__preview${selectedItemCurrent.kind === 'video' ? ' is-video' : ''}`}><LibraryMediaPreview item={selectedItemCurrent} poster={coverImageBySource[selectedItemCurrent.src]} onMetadata={(metadata) => setMeasuredBySource((current) => ({ ...current, [selectedItemCurrent.src]: metadata }))} /></div>
          <section className="admin-media-library__detail-section"><h3>Name</h3>
            {selectedItemCurrent.id ? <>
              <label className={mediaPickerStyles.detailsAltTextField}><span className="admin-visually-hidden">Name for {selectedItemCurrent.label}</span><input type="text" maxLength={512} value={displayNameDraft} onChange={(event) => { setDisplayNameDraft(event.target.value); setDisplayNameMessage(''); }} /></label>
              <div className={mediaPickerStyles.detailsAltTextActions}><button type="button" className={mediaPickerStyles.detailsAltTextSave} disabled={savingDisplayName || !displayNameDraft.trim() || displayNameDraft.trim() === selectedItemCurrent.label} onClick={saveDisplayName}>{savingDisplayName ? 'Saving…' : 'Save name'}</button><span className={mediaPickerStyles.altTextCount}>{displayNameDraft.length}/512</span></div>
              {displayNameMessage ? <p className={mediaPickerStyles.detailsAltTextMessage} role={displayNameMessage === 'Saved' ? 'status' : 'alert'}>{displayNameMessage}</p> : null}
            </> : <p title={selectedItemCurrent.label}>{selectedItemCurrent.label}</p>}
          </section>
          <section className="admin-media-library__detail-section"><h3>Details</h3><dl>
            <div><dt>File type</dt><dd>{formatFileType(selectedItemCurrent)}</dd></div>
            <div><dt>File size</dt><dd>{formatSize(selectedItemCurrent.sizeBytes) || (selectedItemCurrent.id ? 'Size unavailable' : 'Not available for theme files')}</dd></div>
            {selectedItemCurrent.kind === 'image' || selectedItemCurrent.kind === 'model' ? <div><dt>{selectedItemCurrent.kind === 'model' ? 'Dimensions' : 'Dimensions'}</dt><dd>{formatDimensions(selectedItemCurrent, measuredBySource[selectedItemCurrent.src]) || 'Not available'}</dd></div> : selectedItemCurrent.kind === 'video' ? <div><dt>Duration</dt><dd>{formatDuration(measuredBySource[selectedItemCurrent.src]?.duration) || 'Loading video details…'}</dd></div> : null}
            <div><dt>Date added</dt><dd>{formatDate(selectedItemCurrent.createdAt) || (selectedItemCurrent.id ? 'Date unavailable' : 'Theme file')}</dd></div>
          </dl></section>
          {selectedItemCurrent.kind === 'video' ? <section className="admin-media-library__detail-section"><h3>Thumbnail</h3><div className="admin-media-library__cover-row">{coverImageBySource[selectedItemCurrent.src] ? <MediaPreview src={coverImageBySource[selectedItemCurrent.src]} kind="image" /> : <span>No image</span>}<button type="button" className="admin-button admin-button--ghost" disabled={savingCoverImage} onClick={() => { setCoverImageMessage(''); setCoverPickerOpen(true); }}>{coverImageBySource[selectedItemCurrent.src] ? 'Change image' : 'Choose image'}</button></div>{coverImageMessage ? <p className="admin-media-library__detail-message" role="alert">{coverImageMessage}</p> : null}</section> : null}
          <section className="admin-media-library__detail-section"><h3>Alt text</h3><label className="admin-media-library__alt-field"><span className="admin-visually-hidden">Alt text for {selectedItemCurrent.label}</span><textarea maxLength={500} value={altTextDraft} disabled={altTextStatus === 'loading'} placeholder={altTextStatus === 'loading' ? 'Loading saved alt text…' : 'Describe this file'} onChange={(event) => { setAltTextDraft(event.target.value); setAltTextMessage(''); }} /></label>
            <div className="admin-media-library__alt-actions"><button type="button" className="admin-button" disabled={savingAltText || altTextStatus !== 'ready' || altTextDraft === (altTextBySource[selectedItemCurrent.src] || '')} onClick={saveAltText}>{savingAltText ? 'Saving…' : 'Save alt text'}</button><span>{altTextDraft.length}/500</span></div>
            {altTextStatus === 'error' ? <p className="admin-media-library__detail-message" role="alert">Alt text couldn’t be loaded. Close and reopen the file to retry.</p> : null}
            {altTextMessage ? <p className="admin-media-library__detail-message" role={altTextMessage === 'Saved' ? 'status' : 'alert'}>{altTextMessage}</p> : null}
          </section>
          <section className="admin-media-library__detail-section"><h3>Used in</h3>{usageStatus === 'loading' ? <p>Checking references…</p> : usageStatus === 'error' ? <p role="alert">Reference information is unavailable.</p> : (usageBySource[selectedItemCurrent.src] || []).length ? <ul className="admin-media-library__usage">{usageBySource[selectedItemCurrent.src].map((usage) => <li key={`${usage.href}:${usage.label}`}><span>{formatUsageCategory(usage)}</span><Link href={usage.href}>{usage.label.replace(/^Product: /, '')}</Link></li>)}</ul> : <p>Not currently used.</p>}</section>
          <div className="admin-media-library__details-actions">{selectedItemCurrent.kind === 'image' ? <button type="button" className="admin-button" onClick={() => setEditingItem(selectedItemCurrent)}>Edit image</button> : null}{selectedItemCurrent.id ? <button type="button" className="admin-button admin-button--ghost" onClick={() => openReplacement(selectedItemCurrent)} disabled={usageStatus !== 'ready'} title={usageStatus !== 'ready' ? 'Wait for file references to load before uploading a replacement.' : undefined}>Upload replacement</button> : null}<button type="button" className="admin-button admin-button--ghost" onClick={() => copy(selectedItemCurrent.src)}>Copy link</button>{selectedItemCurrent.id ? <button type="button" className="admin-button admin-button--danger" onClick={() => remove(selectedItemCurrent)} disabled={deleting === selectedItemCurrent.id}>{deleting === selectedItemCurrent.id ? 'Checking…' : 'Delete file'}</button> : null}</div>
        </aside> : null}
      </div>
      {(tab === 'uploads' ? uploadLibrary.status === 'ready' : true) && totalItemCount > 0 ? <div className="admin-media-library__pagination" aria-live="polite">
        <span>Showing {(pageNumber - 1) * MEDIA_PAGE_SIZE + 1}–{Math.min(pageNumber * MEDIA_PAGE_SIZE, totalItemCount)} of {totalItemCount} files</span>
        <div className="admin-media-library__pagination-actions"><button type="button" className="admin-button admin-button--ghost" disabled={pageNumber <= 1} onClick={() => setPageNumber((current) => Math.max(1, current - 1))}>Previous</button><span>Page {pageNumber} of {totalPageCount || 1}</span><button type="button" className="admin-button admin-button--ghost" disabled={pageNumber >= totalPageCount} onClick={() => setPageNumber((current) => Math.min(totalPageCount, current + 1))}>Next</button></div>
      </div> : null}
      {coverPickerOpen ? <MediaLibraryModal kind="image" value={coverImageBySource[selectedItemCurrent?.src] || ''} title="Choose a video thumbnail" onChoose={(src) => { setCoverPickerOpen(false); saveCoverImage(src); }} onClose={() => setCoverPickerOpen(false)} /> : null}
      {replacementOpen && selectedItemCurrent?.id ? <div className="admin-media-library__replacement-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !replacingFile) { setReplacementOpen(false); setReplacementFile(null); } }}>
        <section className="admin-card admin-media-library__replacement-dialog" role="dialog" aria-modal="true" aria-labelledby="media-replacement-title">
          <h2 id="media-replacement-title">Upload a replacement file</h2>
          <p>Kenmark Storage assigns every upload a new URL and cannot overwrite this asset in place. Existing references will continue to use <strong>{selectedItemCurrent.label}</strong> until you update each one.</p>
          {replacementFile ? <p className="admin-media-library__replacement-file">Selected: <strong>{replacementFile.name}</strong> · {formatSize(replacementFile.size)}</p> : <p>Choose a {selectedItemCurrent.kind} file to upload as a separate asset.</p>}
          {(usageBySource[selectedItemCurrent.src] || []).length ? <div className="admin-media-library__replacement-usage"><strong>References that will remain on the original</strong><ul>{usageBySource[selectedItemCurrent.src].map((usage) => <li key={`${usage.href}:${usage.label}`}><Link href={usage.href}>{usage.label.replace(/^Product: /, '')}</Link></li>)}</ul><p>Keep the original file until all of these places use the new file.</p></div> : <p className="admin-field-help">No current references were found. The uploaded replacement will still have a new URL.</p>}
          <input ref={replacementInput} type="file" accept={selectedItemCurrent.kind === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp,image/avif'} hidden onChange={(event) => { const file = event.target.files?.[0] || null; setReplacementFile(file); event.target.value = ''; }} />
          <div className="admin-media-library__replacement-actions"><button type="button" className="admin-button admin-button--ghost" disabled={replacingFile} onClick={() => { setReplacementOpen(false); setReplacementFile(null); }}>Cancel</button><button type="button" className="admin-button admin-button--ghost" disabled={replacingFile} onClick={() => replacementInput.current?.click()}>{replacementFile ? 'Choose another file' : 'Choose file'}</button><button type="button" className="admin-button" disabled={!replacementFile || replacingFile} onClick={uploadReplacement}>{replacingFile ? 'Uploading…' : 'Confirm upload'}</button></div>
        </section>
      </div> : null}
      {editingItem ? <MediaImageEditor item={editingItem} altText={altTextBySource[editingItem.src] || ''} onClose={() => setEditingItem(null)} onSaved={() => { setNotice('Edited image saved as a new file. The original image and references are unchanged.'); setRefreshKey((key) => key + 1); }} /> : null}
    </div>
  );
}
