'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BLOCK_TYPES } from '@/lib/blocks';
import { themeCssVariableMap } from '@/lib/theme';

const DEVICES = { desktop: 1280, tablet: 820, mobile: 390 };
const PREVIEW_LOAD_TIMEOUT_MS = 20000;
const PREVIEW_READY_TIMEOUT_MS = 12000;
export const PREVIEW_SOURCE = 'byshreen-editor';
export const SHARED_HEADER_FOCUS_ID = 'shared-header';
export const SHARED_HEADER_LOGO_FOCUS_ID = 'shared-header-logo';
export const SHARED_HEADER_MENU_FOCUS_ID = 'shared-header-menu';

function SectionActionIcon({ name }) {
  const paths = {
    duplicate: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
    hide: <><path d="M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Z" /><circle cx="12" cy="12" r="2.5" /><path d="m4 4 16 16" /></>,
    remove: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  };

  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

/** Live page preview in a scaled iframe; `payload` is posted to the page on every change. */
export default function PreviewPanel({ contentKey, payload, sharedPayload = null, focusId, publicRoute, fullScreen = false, onSelectBlock, onSectionAction, onRequestAddSection, moveTargets = [], canEditCode = false, showSectionTools = true, showPreviewSelectionActions = true, showBar = true, deviceValue, onDeviceChange, inspectorEnabled = true, themeColors = null }) {
  const frame = useRef(null);
  const box = useRef(null);
  const stage = useRef(null);
  const [localDevice, setLocalDevice] = useState('desktop');
  const [boxWidth, setBoxWidth] = useState(600);
  const [ready, setReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [previewFailure, setPreviewFailure] = useState(null);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectionBounds, setSelectionBounds] = useState(null);
  const [hoverBounds, setHoverBounds] = useState(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [boxHeight, setBoxHeight] = useState(0);
  const [stageHeight, setStageHeight] = useState(0);
  const latest = useRef(payload);
  const latestShared = useRef(sharedPayload);
  const device = deviceValue || localDevice;
  const setDevice = onDeviceChange || setLocalDevice;
  useEffect(() => { latest.current = payload; }, [payload]);
  useEffect(() => { latestShared.current = sharedPayload; }, [sharedPayload]);

  const send = useCallback((message) => {
    frame.current?.contentWindow?.postMessage({ source: PREVIEW_SOURCE, ...message }, window.location.origin);
  }, []);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow || event.data?.source !== 'byshreen-preview') return;
      if (event.data.type === 'ready') {
        setReady(true);
        setTimedOut(false);
        setPreviewFailure(null);
        setPasswordDialogOpen(false);
        send({ type: 'content', payload: latest.current });
        if (latestShared.current) send({ type: 'shared-content', payload: latestShared.current });
        send({ type: 'inspector', enabled: inspectorEnabled });
      }
      if (event.data.type === 'preview-status' && ['auth-required', 'not-found', 'render-error'].includes(event.data.status)) {
        setPreviewFailure(event.data.status);
        setTimedOut(false);
      }
      if (event.data.type === 'select' && typeof event.data.id === 'string') onSelectBlock?.(event.data.id);
      if (event.data.type === 'password-dialog' && event.source === frame.current?.contentWindow) setPasswordDialogOpen(Boolean(event.data.open));
      if (event.data.type === 'selection-clear' && event.data.id === focusId) setSelectionBounds(null);
      if (event.data.type === 'selection-bounds' && event.data.id === focusId && event.data.rect) {
        const expectedViewportWidth = DEVICES[device];
        if (typeof event.data.viewportWidth === 'number' && Math.abs(event.data.viewportWidth - expectedViewportWidth) > 2) return;
        setSelectionBounds({ id: event.data.id, label: event.data.label || 'Section', rect: event.data.rect, viewportWidth: event.data.viewportWidth });
      }
      if (event.data.type === 'hover-clear' && event.source === frame.current?.contentWindow) {
        setHoverBounds((current) => current?.id === event.data.id ? null : current);
      }
      if (event.data.type === 'hover-bounds' && event.source === frame.current?.contentWindow && event.data.rect) {
        const expectedViewportWidth = DEVICES[device];
        if (typeof event.data.viewportWidth === 'number' && Math.abs(event.data.viewportWidth - expectedViewportWidth) > 2) return;
        setHoverBounds({ id: event.data.id, label: event.data.label || 'Section', rect: event.data.rect, viewportWidth: event.data.viewportWidth });
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [device, focusId, inspectorEnabled, onSelectBlock, send]);

  useEffect(() => {
    if (ready || previewFailure) return undefined;
    const timeout = setTimeout(() => setTimedOut(true), frameLoaded ? PREVIEW_READY_TIMEOUT_MS : PREVIEW_LOAD_TIMEOUT_MS);
    const handshake = setInterval(() => send({ type: 'handshake' }), 500);
    send({ type: 'handshake' });
    return () => {
      clearTimeout(timeout);
      clearInterval(handshake);
    };
  }, [frameLoaded, ready, previewFailure, reloadKey, send]);

  const retryPreview = () => {
    setReady(false);
    setTimedOut(false);
    setPreviewFailure(null);
    setFrameLoaded(false);
    setSelectionBounds(null);
    setHoverBounds(null);
    setReloadKey((value) => value + 1);
  };

  const handleFrameLoad = (event) => {
    if (event.currentTarget !== frame.current) return;
    try {
      const loadedLocation = event.currentTarget.contentWindow.location;
      if (loadedLocation.origin !== window.location.origin) return;
      const loadedPath = loadedLocation.pathname.replace(/\/+$/, '') || '/';
      if (loadedPath === '/admin/login') {
        setPreviewFailure('auth-required');
        setTimedOut(false);
      } else if (loadedPath.startsWith('/preview/')) {
        setFrameLoaded(true);
        setTimedOut(false);
      }
    } catch {
      // A cross-origin navigation cannot be classified safely; the ready handshake remains authoritative.
    }
  };

  const handleFrameError = (event) => {
    if (event.currentTarget !== frame.current) return;
    setPreviewFailure('load-error');
  };

  useEffect(() => {
    if (!ready) return undefined;
    const timer = setTimeout(() => send({ type: 'content', payload }), 120);
    return () => clearTimeout(timer);
  }, [payload, ready, send]);

  useEffect(() => {
    if (ready && sharedPayload) send({ type: 'shared-content', payload: sharedPayload });
  }, [ready, sharedPayload, send]);

  useEffect(() => {
    if (!ready || !themeColors) return;
    const root = frame.current?.contentDocument?.documentElement;
    if (!root) return;
    Object.entries(themeCssVariableMap(themeColors)).forEach(([cssVariable, value]) => root.style.setProperty(cssVariable, value));
  }, [ready, themeColors, reloadKey]);

  useEffect(() => {
    if (ready) send({ type: 'inspector', enabled: inspectorEnabled });
  }, [inspectorEnabled, ready, send]);

  useEffect(() => {
    if (ready) send(focusId && inspectorEnabled ? { type: 'focus', id: focusId } : { type: 'clear-focus' });
  }, [focusId, inspectorEnabled, ready, send]);

  useLayoutEffect(() => {
    if (!box.current) return undefined;
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === box.current) {
          setBoxWidth(entry.contentRect.width);
          setBoxHeight(entry.contentRect.height);
        }
        if (entry.target === stage.current) setStageHeight(entry.contentRect.height);
      });
    });
    observer.observe(box.current);
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);

  const width = DEVICES[device];
  const scale = Math.min(1, boxWidth > 0 ? boxWidth / width : 1);
  const selectedSection = payload.sections?.find((section) => section.id === focusId);
  const previewSelection = ready && selectionBounds && selectionBounds.id === focusId
    && selectionBounds.rect.top < stageHeight / scale
    && selectionBounds.rect.top + selectionBounds.rect.height > 0
    && (typeof selectionBounds.viewportWidth !== 'number' || Math.abs(selectionBounds.viewportWidth - width) <= 2)
    ? selectionBounds
    : null;
  const previewHover = ready && hoverBounds && hoverBounds.id !== focusId
    && (typeof hoverBounds?.viewportWidth !== 'number' || Math.abs(hoverBounds.viewportWidth - width) <= 2)
    ? hoverBounds
    : null;
  const selectedIndex = payload.sections?.findIndex((section) => section.id === focusId) ?? -1;
  const selectionKindClass = focusId === SHARED_HEADER_LOGO_FOCUS_ID
    ? ' shopify-editor-selection-overlay--logo'
    : focusId === SHARED_HEADER_MENU_FOCUS_ID
      ? ' shopify-editor-selection-overlay--menu'
      : '';
  const selectionIsCompact = Boolean(previewSelection && previewSelection.rect.height * scale < 300);
  const actionToolbarTop = previewSelection && stageHeight
    ? selectionIsCompact
      ? Math.max(4, Math.min((previewSelection.rect.top + previewSelection.rect.height) * scale + 6, stageHeight - 42))
      : Math.max(4, Math.min((previewSelection.rect.top + previewSelection.rect.height) * scale - 42, stageHeight - 42))
    : 4;
  const layoutOptions = selectedSection?.type
    ? BLOCK_TYPES[selectedSection.type]?.layouts || []
    : contentKey === 'faq' ? [] : [['columns', 'Side by side'], ['stacked', 'Stacked'], ['centered', 'Centered']];
  const sectionAction = (action, details = {}) => onSectionAction?.({ id: focusId, action, ...details });

  return (
    <div className={`admin-preview${fullScreen ? ' admin-preview--fullscreen' : ''}`}>
      {showBar ? <div className="admin-preview__bar">
        <strong>Live preview</strong>
        <span className="admin-preview__hint">Updates as you type · not live until you save</span>
        <div className="admin-preview__devices" role="group" aria-label="Preview size">
          {Object.keys(DEVICES).map((name) => (
            <button type="button" key={name} aria-pressed={device === name} className={device === name ? 'is-active' : ''} onClick={() => setDevice(name)}>{name === 'desktop' ? 'Desktop' : name === 'tablet' ? 'Tablet' : 'Phone'}</button>
          ))}
        </div>
        {publicRoute ? <a href={publicRoute} target="_blank" rel="noreferrer" className="admin-text-button">Open live page ↗</a> : null}
      </div> : null}
      {selectedSection && showSectionTools ? (
        <div className="admin-preview__section-tools" role="toolbar" aria-label="Selected section controls">
          <div className="admin-preview__section-identity">
            <span>Selected section</span>
            <strong title={BLOCK_TYPES[selectedSection.type]?.label || selectedSection.type || 'Section'}>{BLOCK_TYPES[selectedSection.type]?.label || selectedSection.type || 'Selected section'}</strong>
          </div>
          <div className="admin-preview__section-actions" role="group" aria-label="Section actions">
            <button type="button" onClick={() => sectionAction('move-up')} disabled={selectedIndex <= 0} aria-label={`Move section ${selectedIndex + 1} up`}>Move up</button>
            <button type="button" onClick={() => sectionAction('move-down')} disabled={selectedIndex < 0 || selectedIndex >= payload.sections.length - 1} aria-label={`Move section ${selectedIndex + 1} down`}>Move down</button>
            <button type="button" onClick={() => sectionAction('duplicate')} disabled={selectedSection.type === 'customHtml' && !canEditCode}>Duplicate</button>
            <button type="button" className="admin-preview__delete" onClick={() => { if (window.confirm('Delete this section? You can undo before saving.')) sectionAction('delete'); }}>Delete</button>
          </div>
          <div className="admin-preview__section-settings">
            {layoutOptions.length ? <label><span>Layout</span><select aria-label="Section layout" value={selectedSection.layout || layoutOptions[0][0]} onChange={(event) => sectionAction('layout', { value: event.target.value })}>{layoutOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label> : null}
            {moveTargets.length ? <label><span>Move to page</span><select aria-label="Move section to another page" value="" onChange={(event) => { if (event.target.value) sectionAction('move-to-page', { targetKey: event.target.value }); }}><option value="">Choose page…</option>{moveTargets.map((page) => <option key={page.key} value={page.key}>{page.title}</option>)}</select></label> : null}
          </div>
        </div>
      ) : null}
      <div className="admin-preview__viewport" ref={box}>
        <div className="admin-preview__stage" ref={stage} style={{ width: width * scale, height: fullScreen && boxHeight ? boxHeight : fullScreen ? 'calc(100dvh - 220px)' : 'calc(100vh - 170px)' }}>
          <iframe
            key={reloadKey}
            ref={frame}
            title="Page preview"
            src={`/preview/${contentKey}`}
            onLoad={handleFrameLoad}
            onError={handleFrameError}
            onPointerLeave={() => setHoverBounds(null)}
            style={{ width, height: fullScreen ? `${(boxHeight || 550) / scale}px` : `calc((100vh - 170px) / ${scale})`, transform: `scale(${scale})` }}
          />
          {previewHover && inspectorEnabled && !passwordDialogOpen ? <div className="shopify-editor-hover-overlay" aria-hidden="true" style={{ top: previewHover.rect.top * scale, left: previewHover.rect.left * scale, width: previewHover.rect.width * scale, height: previewHover.rect.height * scale }}><span style={{ top: Math.max(-26, -previewHover.rect.top * scale) }}>{previewHover.label}</span></div> : null}
          {previewSelection && inspectorEnabled && !passwordDialogOpen ? <>
            <div className={`shopify-editor-selection-overlay${selectionKindClass}`} aria-hidden="true" style={{ top: previewSelection.rect.top * scale, left: previewSelection.rect.left * scale, width: previewSelection.rect.width * scale, height: previewSelection.rect.height * scale }}><span style={{ top: Math.max(-26, -previewSelection.rect.top * scale) }}>{previewSelection.label}</span></div>
            {onRequestAddSection && selectedIndex >= 0 ? <div className="shopify-editor-selection-insertions" aria-label="Add a section around the selected section" style={{ top: previewSelection.rect.top * scale, left: previewSelection.rect.left * scale, width: previewSelection.rect.width * scale, height: previewSelection.rect.height * scale }}>
              <button type="button" className={`shopify-editor-selection-insertion shopify-editor-selection-insertion--before${selectedIndex === 0 ? ' shopify-editor-selection-insertion--before-first' : ''}`} onClick={() => onRequestAddSection(selectedIndex)} aria-label={`Add section before ${previewSelection.label}`}><span aria-hidden="true">＋</span> Add section</button>
              <button type="button" className="shopify-editor-selection-insertion shopify-editor-selection-insertion--after" style={{ top: '100%', bottom: 'auto' }} onClick={() => onRequestAddSection(selectedIndex + 1)} aria-label={`Add section after ${previewSelection.label}`}><span aria-hidden="true">＋</span> Add section</button>
            </div> : null}
            {showPreviewSelectionActions && selectedIndex >= 0 ? <div className={`shopify-editor-selection-actions${selectionIsCompact ? ' shopify-editor-selection-actions--compact' : ''}`} role="toolbar" aria-label="Selected section actions" style={{ top: actionToolbarTop, left: (selectionIsCompact ? previewSelection.rect.left + previewSelection.rect.width - 8 : previewSelection.rect.left + previewSelection.rect.width / 2) * scale }}>
              <button type="button" title="Duplicate" aria-label="Duplicate section" onClick={() => sectionAction('duplicate')}><SectionActionIcon name="duplicate" /></button>
              <button type="button" title="Hide" aria-label="Hide section" onClick={() => sectionAction('hide')}><SectionActionIcon name="hide" /></button>
              <button type="button" title="Remove" aria-label="Remove section" onClick={() => { if (window.confirm('Remove this section? You can undo before saving.')) sectionAction('delete'); }}><SectionActionIcon name="remove" /></button>
            </div> : null}
          </> : null}
        </div>
        {!ready && !timedOut && !previewFailure ? <div className="admin-preview__loading" role="status" aria-live="polite">Loading preview…</div> : null}
        {!ready && (timedOut || previewFailure) ? (
          <div className="admin-preview__error" role="alert">
            <strong>{previewFailure === 'auth-required'
              ? 'Sign in to load this preview.'
              : previewFailure === 'not-found'
                ? 'This preview page could not be found.'
                : previewFailure === 'render-error'
                  ? 'The preview could not be rendered.'
                  : previewFailure === 'load-error'
                    ? 'The preview frame could not be loaded.'
                    : 'The preview did not become ready.'}</strong>
            <span>{previewFailure === 'auth-required'
              ? 'Your editor changes are still here. Sign in to the admin, then retry the preview.'
              : previewFailure === 'not-found'
                ? 'The requested preview page is unavailable. Your editor changes are still here.'
                : previewFailure === 'render-error'
                  ? 'The preview encountered a rendering problem. Your editor changes are still here; retry to reload it.'
                  : previewFailure === 'load-error'
                    ? 'The preview frame reported a loading error. Your editor changes are still here; retry to reload it.'
                    : frameLoaded
                      ? 'The preview frame loaded but did not signal readiness. Your edits are still here; retry the preview or open the live page.'
                      : 'The preview did not finish loading or signal readiness. Your edits are still here; retry the preview or open the live page.'}</span>
            <button type="button" className="admin-button admin-button--ghost" onClick={retryPreview}>Retry preview</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
