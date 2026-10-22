// @ts-nocheck
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import FaqAccordion from '@/app/faq/FaqAccordion';
import BlockRenderer from '@/components/blocks/BlockRenderer';
import ContentPage from '@/components/ContentPage';
import ResourceTemplateRenderer from '@/components/blocks/ResourceTemplateRenderer';
import Footer from '@/components/Footer';
import SiteChrome from '@/components/SiteChrome';
import { toFaqCategories } from '@/lib/faq';
import { mediaFocalPointsBySourcesAction } from '@/lib/media-actions';
import { collectMediaImageSources } from '@/lib/media-focal-points';
import { BLOCK_TYPES } from '@/lib/blocks';
import { navigationPresentationFromSections } from '@/lib/header-settings';
import { SHARED_HEADER_FOCUS_ID, SHARED_HEADER_LOGO_FOCUS_ID, SHARED_HEADER_MENU_FOCUS_ID } from './PreviewPanel';

const EDITOR_SOURCE = 'byshreen-editor';
const focalPointBatchCache = new Map();

function readMediaFocalPoints(sources) {
  const cacheKey = [...sources].sort().join('|');
  if (!cacheKey) return Promise.resolve({});
  if (focalPointBatchCache.has(cacheKey)) return focalPointBatchCache.get(cacheKey);
  const pendingRead = mediaFocalPointsBySourcesAction(sources.slice(0, 500))
    .then((result) => {
      if (!result.ok) {
        focalPointBatchCache.delete(cacheKey);
        return {};
      }
      return result.focalPointBySource;
    })
    .catch(() => {
      focalPointBatchCache.delete(cacheKey);
      return {};
    });
  focalPointBatchCache.set(cacheKey, pendingRead);
  if (focalPointBatchCache.size > 24) focalPointBatchCache.delete(focalPointBatchCache.keys().next().value);
  return pendingRead;
}

function sectionMap(sections = []) {
  return Object.fromEntries(sections.map((item) => [item.id, item]));
}

export default function LivePreview({ kind, mainClass, initial, products, collections = [], instagram = null, proposals = null, testimonials = null, blogPosts = null, site, navigation, focalPointBySource: initialFocalPointBySource, countryOptions = [], initialCountry = '', resourceType = '', resource = null, relatedProducts = [], productInfo = {}, contactEmail = '' }) {
  const [content, setContent] = useState(initial);
  const [sharedSite, setSharedSite] = useState(site || {});
  const [sharedNavigation, setSharedNavigation] = useState(navigation || { main: [], footer: [], social: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [isInspectorActive, setIsInspectorActive] = useState(true);
  const [focalPointBySource, setFocalPointBySource] = useState(initialFocalPointBySource || {});
  const latestContent = useRef(content);
  const latestSharedNavigation = useRef(sharedNavigation);
  const inspectorEnabled = useRef(true);
  const latestSelectedId = useRef(selectedId);
  const refreshHover = useRef(null);
  const focalSources = useMemo(() => collectMediaImageSources([
    content, sharedSite, sharedNavigation, products, collections, instagram, proposals,
    testimonials, blogPosts, resource, relatedProducts, productInfo,
  ]).slice(0, 500), [content, sharedSite, sharedNavigation, products, collections, instagram, proposals, testimonials, blogPosts, resource, relatedProducts, productInfo]);
  const focalSourceSignature = focalSources.join('|');
  const lastFocalSourceSignature = useRef(initialFocalPointBySource ? focalSourceSignature : '');

  useEffect(() => {
    if (focalSourceSignature === lastFocalSourceSignature.current) return undefined;
    lastFocalSourceSignature.current = focalSourceSignature;
    let active = true;
    if (!focalSources.length) {
      setFocalPointBySource({});
      return () => { active = false; };
    }
    readMediaFocalPoints(focalSources).then((nextFocalPointBySource) => {
      if (active) setFocalPointBySource(nextFocalPointBySource);
    });
    return () => { active = false; };
  }, [focalSourceSignature, focalSources]);

  useEffect(() => { latestContent.current = content; }, [content]);
  useEffect(() => { latestSharedNavigation.current = sharedNavigation; }, [sharedNavigation]);
  useEffect(() => { latestSelectedId.current = selectedId; }, [selectedId]);

  useEffect(() => {
    let hoveredPreviewElement = null;
    let hoveredPreviewId = null;
    let pointerPosition = null;
    let hoverFrame = null;
    let previousHoverReport = '';
    const hoverResizeObserver = new ResizeObserver(() => scheduleHover());

    const clearHoveredBlock = () => {
      if (hoveredPreviewId) {
        hoveredPreviewElement?.removeAttribute('data-editor-hovered');
        window.parent?.postMessage({ source: 'byshreen-preview', type: 'hover-clear', id: hoveredPreviewId }, window.location.origin);
      }
      if (hoveredPreviewElement) hoverResizeObserver.unobserve(hoveredPreviewElement);
      hoveredPreviewElement = null;
      hoveredPreviewId = null;
      previousHoverReport = '';
    };

    const reportHover = () => {
      hoverFrame = null;
      if (!inspectorEnabled.current || !pointerPosition) {
        clearHoveredBlock();
        return;
      }
      // Hit-test the current viewport, including after scrolling under a stationary pointer.
      const target = document.elementFromPoint(pointerPosition.x, pointerPosition.y);
      const anchor = previewAnchorForTarget(target);
      const id = previewIdForAnchor(anchor);
      const hoveredElement = previewElementForAnchor(anchor);
      const bounds = previewElementBounds(hoveredElement);
      if (!id || !bounds || id === latestSelectedId.current) {
        clearHoveredBlock();
        return;
      }
      if (hoveredElement !== hoveredPreviewElement) {
        if (hoveredPreviewElement) {
          hoveredPreviewElement.removeAttribute('data-editor-hovered');
          hoverResizeObserver.unobserve(hoveredPreviewElement);
        }
        hoveredPreviewElement = hoveredElement;
        hoveredElement.setAttribute('data-editor-hovered', 'true');
        hoverResizeObserver.observe(hoveredElement);
      }
      hoveredPreviewId = id;
      const selectionSections = [...(latestContent.current.sections || []), ...themeGroupSections(latestSharedNavigation.current.themeSectionGroups)];
      const section = findSectionById(selectionSections, id);
      const report = {
        source: 'byshreen-preview', type: 'hover-bounds', id,
        label: selectedLabel(id, section, selectionSections),
        viewportWidth: document.documentElement.clientWidth,
        rect: bounds,
      };
      const signature = JSON.stringify(report);
      if (signature !== previousHoverReport) {
        window.parent?.postMessage(report, window.location.origin);
        previousHoverReport = signature;
      }
    };
    const scheduleHover = () => {
      if (hoverFrame === null) hoverFrame = window.requestAnimationFrame(reportHover);
    };
    const hoverBlock = (event) => {
      if (event.pointerType === 'touch') {
        leavePreview();
        return;
      }
      pointerPosition = { x: event.clientX, y: event.clientY };
      scheduleHover();
    };
    const leavePreview = () => {
      pointerPosition = null;
      if (hoverFrame !== null) window.cancelAnimationFrame(hoverFrame);
      hoverFrame = null;
      clearHoveredBlock();
    };
    const clearHoverWhenPointerLeaves = (event) => {
      // Child/sibling transitions are resolved once per frame without clearing the outline.
      if (!event.relatedTarget) leavePreview();
    };
    hoverResizeObserver.observe(document.body);
    refreshHover.current = scheduleHover;
    document.documentElement.dataset.editorInspector = 'true';

    const onMessage = (event) => {
      if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.source !== EDITOR_SOURCE) return;
      if (event.data.type === 'handshake') {
        window.parent?.postMessage({ source: 'byshreen-preview', type: 'ready' }, window.location.origin);
      }
      if (event.data.type === 'content' && event.data.payload) setContent(event.data.payload);
      if (event.data.type === 'shared-content' && event.data.payload) {
        setSharedSite(sectionMap(event.data.payload.globalSections || []));
        const nextNavigation = navigationPresentationFromSections(event.data.payload.navigationSections || []);
        setSharedNavigation((currentNavigation) => ({
          ...nextNavigation,
          themeSectionGroups: event.data.payload.themeSectionGroups || currentNavigation?.themeSectionGroups,
        }));
      }
      if (event.data.type === 'inspector' && typeof event.data.enabled === 'boolean') {
        inspectorEnabled.current = event.data.enabled;
        document.documentElement.dataset.editorInspector = String(event.data.enabled);
        setIsInspectorActive(event.data.enabled);
        if (!event.data.enabled) {
          clearSelectedBlock();
          clearHoveredBlock();
        }
        else if (latestSelectedId.current) {
          const selectedAnchor = previewAnchorForId(latestSelectedId.current);
          const selectionSections = [...(latestContent.current.sections || []), ...themeGroupSections(latestSharedNavigation.current.themeSectionGroups)];
          const selectedSection = findSectionById(selectionSections, latestSelectedId.current);
          markSelectedBlock(selectedAnchor, selectedLabel(latestSelectedId.current, selectedSection, selectionSections));
        }
      }
      if (event.data.type === 'clear-focus') {
        latestSelectedId.current = null;
        setSelectedId(null);
        clearSelectedBlock();
      }
      if (event.data.type === 'focus' && event.data.id) {
        const selectionChanged = latestSelectedId.current !== event.data.id;
        latestSelectedId.current = event.data.id;
        setSelectedId(event.data.id);
        const anchor = previewAnchorForId(event.data.id);
        const selectedElement = previewElementForAnchor(anchor);
        const bounds = previewElementBounds(selectedElement);
        const viewportHeight = window.innerHeight;
        const stickyHeaderBottom = document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0;
        const visibleTop = Math.max(stickyHeaderBottom + 12, 12);
        const isSharedHeaderFocus = [SHARED_HEADER_FOCUS_ID, SHARED_HEADER_LOGO_FOCUS_ID, SHARED_HEADER_MENU_FOCUS_ID].includes(event.data.id);
        if (bounds && selectionChanged && !isSharedHeaderFocus) {
          const scrollDistance = bounds.top < visibleTop
            ? bounds.top - visibleTop
            : bounds.top >= viewportHeight - 16
              ? bounds.top - visibleTop
              : bounds.height < viewportHeight - visibleTop - 16 && bounds.top + bounds.height > viewportHeight - 16
                ? bounds.top + bounds.height - viewportHeight + 16
                : 0;
          if (scrollDistance) window.scrollBy({ top: scrollDistance, behavior: 'smooth' });
        }
        const selectionSections = [...(latestContent.current.sections || []), ...themeGroupSections(latestSharedNavigation.current.themeSectionGroups)];
        const section = findSectionById(selectionSections, event.data.id);
        if (inspectorEnabled.current) markSelectedBlock(anchor, selectedLabel(event.data.id, section, selectionSections));
        else clearSelectedBlock();
      }
    };
    // Links would navigate the preview away from the page being edited.
    const blockLinks = (event) => { if (event.target.closest?.('a')) event.preventDefault(); };
    const selectBlock = (event) => {
      if (!inspectorEnabled.current) return;
      if (event.target.closest?.('[data-editor-toolbar]')) return;
      const anchor = previewAnchorForTarget(event.target);
      const id = previewIdForAnchor(anchor);
      if (!id) return;
      // Inspector clicks select content instead of triggering cart, media, or form actions.
      event.preventDefault();
      event.stopPropagation();
      const selectionSections = [...(latestContent.current.sections || []), ...themeGroupSections(latestSharedNavigation.current.themeSectionGroups)];
      const section = findSectionById(selectionSections, id);
      markSelectedBlock(anchor, selectedLabel(id, section, selectionSections));
      latestSelectedId.current = id;
      setSelectedId(id);
      scheduleHover();
      window.parent?.postMessage({ source: 'byshreen-preview', type: 'select', id }, window.location.origin);
    };
    window.addEventListener('message', onMessage);
    document.addEventListener('click', blockLinks, true);
    document.addEventListener('click', selectBlock, true);
    document.addEventListener('pointerover', hoverBlock);
    document.addEventListener('pointermove', hoverBlock);
    window.addEventListener('scroll', scheduleHover, true);
    window.addEventListener('resize', scheduleHover);
    document.addEventListener('load', scheduleHover, true);
    window.addEventListener('blur', leavePreview);
    document.addEventListener('pointerout', clearHoverWhenPointerLeaves);
    document.addEventListener('pointercancel', leavePreview);
    window.parent?.postMessage({ source: 'byshreen-preview', type: 'ready' }, window.location.origin);
    return () => {
      window.removeEventListener('message', onMessage);
      document.removeEventListener('click', blockLinks, true);
      document.removeEventListener('click', selectBlock, true);
      document.removeEventListener('pointerover', hoverBlock);
      document.removeEventListener('pointermove', hoverBlock);
      window.removeEventListener('scroll', scheduleHover, true);
      window.removeEventListener('resize', scheduleHover);
      document.removeEventListener('load', scheduleHover, true);
      window.removeEventListener('blur', leavePreview);
      hoverResizeObserver.disconnect();
      refreshHover.current = null;
      delete document.documentElement.dataset.editorInspector;
      document.removeEventListener('pointerout', clearHoverWhenPointerLeaves);
      document.removeEventListener('pointercancel', leavePreview);
      leavePreview();
    };
  }, []);

  useEffect(() => { refreshHover.current?.(); }, [content, sharedSite, sharedNavigation, focalPointBySource, selectedId]);

  useEffect(() => {
    if (!selectedId || !isInspectorActive) {
      clearSelectedBlock();
      return;
    }
    const anchor = previewAnchorForId(selectedId);
    const selectionSections = [...(content.sections || []), ...themeGroupSections(sharedNavigation.themeSectionGroups)];
    const section = findSectionById(selectionSections, selectedId);
    const sectionIndex = content.sections?.findIndex((item) => item.id === selectedId) ?? -1;
    const label = selectedLabel(selectedId, section, selectionSections);
    const selectedElement = markSelectedBlock(anchor, label);
    if (!selectedElement) {
      window.parent?.postMessage({ source: 'byshreen-preview', type: 'selection-clear', id: selectedId }, window.location.origin);
      return undefined;
    }

    let selectionFrame = null;
    const reportSelection = () => {
      if (selectionFrame !== null) return;
      selectionFrame = window.requestAnimationFrame(() => {
        selectionFrame = null;
        const bounds = previewElementBounds(previewElementForAnchor(previewAnchorForId(selectedId)));
        if (!bounds) {
          window.parent?.postMessage({ source: 'byshreen-preview', type: 'selection-clear', id: selectedId }, window.location.origin);
          return;
        }
        const headerBottom = selectedId !== SHARED_HEADER_FOCUS_ID && section?.type === 'pageHeader' && sectionIndex === 0
          ? document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0
          : bounds.top;
        const selectionTop = Math.max(bounds.top, headerBottom);
        window.parent?.postMessage({
          source: 'byshreen-preview', type: 'selection-bounds', id: selectedId, label,
          viewportWidth: document.documentElement.clientWidth,
          rect: { ...bounds, top: selectionTop, height: Math.max(0, bounds.top + bounds.height - selectionTop) },
        }, window.location.origin);
      });
    };
    const resizeObserver = new ResizeObserver(reportSelection);
    resizeObserver.observe(document.body);
    resizeObserver.observe(selectedElement);
    reportSelection();
    window.addEventListener('scroll', reportSelection, true);
    window.addEventListener('resize', reportSelection);
    document.addEventListener('load', reportSelection, true);
    return () => {
      window.removeEventListener('scroll', reportSelection, true);
      window.removeEventListener('resize', reportSelection);
      document.removeEventListener('load', reportSelection, true);
      resizeObserver.disconnect();
      if (selectionFrame !== null) window.cancelAnimationFrame(selectionFrame);
    };
  }, [content, isInspectorActive, selectedId, sharedNavigation]);

  const sections = content.sections || [];
  const wrapWithStorefront = (children, text = sharedSite, nav = sharedNavigation) => (
    <SiteChrome announcement={text.announcement?.body} links={nav.main} headerSettings={nav.headerSettings} logoSettings={nav.logoSettings} menuSettings={nav.menuSettings} headerEnabled={nav.headerEnabled} logoEnabled={nav.logoEnabled} menuEnabled={nav.menuEnabled} countryOptions={countryOptions} initialCountry={initialCountry} themeSectionGroups={nav.themeSectionGroups} focalPointBySource={focalPointBySource} blankCanvas={content.blankCanvas === true} preview>
      {children}
      <Footer newsletter={text.newsletter || {}} footer={text.footer || {}} navigation={nav} themeSectionGroups={nav.themeSectionGroups} focalPointBySource={focalPointBySource} preview />
    </SiteChrome>
  );

  if (kind === 'blocks') {
    return wrapWithStorefront(<main className={mainClass}><BlockRenderer blocks={sections.filter((item) => item.type)} products={products} collections={collections} instagram={instagram} proposals={proposals} testimonials={testimonials} blogPosts={blogPosts} focalPointBySource={focalPointBySource} preview /></main>);
  }

  if (kind === 'resource') {
    const page = <main className={mainClass}><ResourceTemplateRenderer resourceType={resourceType} resource={resource} sections={sections.filter((item) => item.type)} products={products} relatedProducts={relatedProducts} productInfo={productInfo} focalPointBySource={focalPointBySource} contactEmail={contactEmail} preview /></main>;
    return ['password', 'gift-card'].includes(resourceType) ? page : wrapWithStorefront(page);
  }

  if (kind === 'faq') {
    return wrapWithStorefront(
      <main className="content-page">
        <section className="content-page__hero section section--ivory">
          <span className="eyebrow">FAQ</span>
          <h1>{content.title}</h1>
          <p>{content.intro}</p>
        </section>
        <FaqAccordion key={JSON.stringify(sections.map((item) => item.id))} categories={toFaqCategories(sections)} />
      </main>
    );
  }

  if (kind === 'global' || kind === 'navigation') {
    const text = kind === 'global' ? sectionMap(sections) : sharedSite;
    const nav = kind === 'navigation'
      ? { ...navigationPresentationFromSections(sections), themeSectionGroups: sharedNavigation.themeSectionGroups }
      : sharedNavigation;
    return (
      <SiteChrome announcement={text.announcement?.body} links={nav.main} headerSettings={nav.headerSettings} logoSettings={nav.logoSettings} menuSettings={nav.menuSettings} headerEnabled={nav.headerEnabled} logoEnabled={nav.logoEnabled} menuEnabled={nav.menuEnabled} countryOptions={countryOptions} initialCountry={initialCountry} themeSectionGroups={nav.themeSectionGroups} focalPointBySource={focalPointBySource} preview>
        <main style={{ minHeight: 420, display: 'grid', placeItems: 'center', paddingTop: 140, color: 'rgba(106,107,68,.6)' }}>
          <p>Page content appears here. The header and footer are shared by every page.</p>
        </main>
        <Footer newsletter={text.newsletter || {}} footer={text.footer || {}} navigation={nav} themeSectionGroups={nav.themeSectionGroups} focalPointBySource={focalPointBySource} preview />
      </SiteChrome>
    );
  }

  return wrapWithStorefront(<ContentPage content={content} />);
}

// Legacy slots use a zero-height sibling anchor. Resolve only within the target's
// ancestors, never by document order across unrelated sections.
function previewAnchorForTarget(target) {
  if (!(target instanceof Element) || target.closest('[data-editor-toolbar]')) return null;
  for (let element = target; element; element = element.parentElement) {
    if (element.matches('[data-block-anchor], [data-editor-header-logo], [data-editor-header-menu], [data-editor-header-section]')) return element;
    let previousSibling = element.previousElementSibling;
    while (previousSibling?.matches('style, script')) previousSibling = previousSibling.previousElementSibling;
    if (previousSibling?.matches('.block-anchor[data-block-anchor]')) return previousSibling;
  }
  return null;
}

function previewIdForAnchor(anchor) {
  if (anchor?.matches('[data-editor-header-logo]')) return SHARED_HEADER_LOGO_FOCUS_ID;
  if (anchor?.matches('[data-editor-header-menu]')) return SHARED_HEADER_MENU_FOCUS_ID;
  if (anchor?.matches('[data-editor-header-section]')) return SHARED_HEADER_FOCUS_ID;
  return anchor?.dataset.blockAnchor || null;
}

function previewElementForAnchor(anchor) {
  if (!anchor?.matches('.block-anchor')) return anchor;
  let element = anchor.nextElementSibling;
  while (element?.matches('style, script')) element = element.nextElementSibling;
  return element;
}

function previewElementBounds(element) {
  if (!element?.isConnected) return null;
  const bounds = element.getBoundingClientRect();
  if (bounds.width && bounds.height) return { top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height };
  // Section Custom CSS uses display:contents, whose own bounding box is empty.
  if (window.getComputedStyle(element).display !== 'contents') return null;
  const childBounds = [...element.children].map(previewElementBounds).filter(Boolean);
  if (!childBounds.length) return null;
  const top = Math.min(...childBounds.map((child) => child.top));
  const left = Math.min(...childBounds.map((child) => child.left));
  const right = Math.max(...childBounds.map((child) => child.left + child.width));
  const bottom = Math.max(...childBounds.map((child) => child.top + child.height));
  return { top, left, width: right - left, height: bottom - top };
}

function markSelectedBlock(anchor, label) {
  const selectedElement = previewElementForAnchor(anchor);
  if (document.querySelector('[data-editor-selected="true"]') !== selectedElement) clearSelectedBlock();
  if (!selectedElement) return null;
  selectedElement.setAttribute('data-editor-selected', 'true');
  selectedElement.setAttribute('data-editor-label', label);
  return selectedElement;
}

function clearSelectedBlock() {
  document.querySelectorAll('[data-editor-selected="true"]').forEach((element) => {
    element.removeAttribute('data-editor-selected');
    element.removeAttribute('data-editor-label');
  });
}

function previewAnchorForId(id) {
  if (id === SHARED_HEADER_FOCUS_ID) return document.querySelector('[data-editor-header-section="true"]');
  if (id === SHARED_HEADER_LOGO_FOCUS_ID) return document.querySelector('[data-editor-header-logo="true"]');
  if (id === SHARED_HEADER_MENU_FOCUS_ID) return document.querySelector('[data-editor-header-menu="true"]');
  const selector = `[data-block-anchor="${CSS.escape(id)}"]`;
  return document.querySelector(`main ${selector}`) || document.querySelector(selector);
}

function selectedLabel(id, section, sections = []) {
  if (id === SHARED_HEADER_FOCUS_ID) return 'Header';
  if (id === SHARED_HEADER_LOGO_FOCUS_ID) return 'Logo';
  if (id === SHARED_HEADER_MENU_FOCUS_ID) return 'Menu';
  const selectedNestedBlock = findNestedBlock(sections, id);
  if (selectedNestedBlock) {
    return selectedNestedBlock.label || BLOCK_TYPES[selectedNestedBlock.type]?.label || selectedNestedBlock.heading || 'Block';
  }
  return sectionLabel(section);
}

function findNestedBlock(sections, targetId) {
  for (const section of sections || []) {
    const nestedBlocks = [...(section.blocks || []), ...(section.cards || [])];
    const pending = [...nestedBlocks];
    while (pending.length) {
      const block = pending.shift();
      if (block.id === targetId) return block;
      pending.push(...(block.blocks || []));
    }
  }
  return null;
}

function sectionLabel(section) {
  const blockTypeLabel = BLOCK_TYPES[section?.type]?.label;
  return section?.label || blockTypeLabel?.split(' — ')[0] || section?.type || 'Section';
}

function themeGroupSections(themeSectionGroups) {
  const headerSections = Array.isArray(themeSectionGroups?.header) ? themeSectionGroups.header : [];
  const footerSections = Array.isArray(themeSectionGroups?.footer) ? themeSectionGroups.footer : [];
  return [...headerSections, ...footerSections];
}

function findSectionById(sections, targetId) {
  return sections.find((section) => section.id === targetId) || null;
}
