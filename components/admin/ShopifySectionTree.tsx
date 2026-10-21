// @ts-nocheck
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SortableList from './SortableList';
import { BLOCK_TYPES, FIELD_DEFS, blockSummary, createBlock, duplicateBlockTree } from '@/lib/blocks';

function EditorIcon({ name = 'section', size = 16 }) {
  // Shopify Polaris parity: 24x24 viewBox, strokeWidth 1.5 (not 1.7), round caps/joins
  // Evidence: E-SHOP-ICON-20261015-001 (local audit, browser capture unavailable - see findings)
  const sharedProps = {
    'aria-hidden': true,
    focusable: 'false',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  const icons = {
    section: <><rect x="4" y="4.5" width="16" height="15" rx="2" /><path d="M4 9h16M8 9v10.5" /></>,
    media: <><rect x="3.5" y="4" width="17" height="16" rx="2" /><circle cx="9" cy="9" r="1.5" /><path d="m4.5 17 5-5 3.2 3.2 2.2-2.2 4.6 4.5" /></>,
    video: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="m10 9 5 3-5 3z" /></>,
    grid: <><rect x="4" y="4" width="7" height="7" rx="1.2" /><rect x="13" y="4" width="7" height="7" rx="1.2" /><rect x="4" y="13" width="7" height="7" rx="1.2" /><rect x="13" y="13" width="7" height="7" rx="1.2" /></>,
    text: <><path d="M5 6h14M5 11h14M5 16h10" /></>,
    quote: <><path d="M10 11H5V6h6v6a5 5 0 0 1-5 5M21 11h-5V6h6v6a5 5 0 0 1-5 5" /></>,
    document: <><path d="M7 3.5h7l4 4V20H7a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z" /><path d="M14 3.5v4h4M8.5 12h7M8.5 15.5h7" /></>,
    shoppingBag: <><path d="M5 8h14l1 12H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    mail: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="m4.5 7 7.5 6 7.5-6" /></>,
    camera: <><rect x="3.5" y="5.5" width="17" height="14" rx="3" /><circle cx="12" cy="12.5" r="3.5" /><path d="M8 5.5 9 3.8h6l1 1.7" /></>,
    announcement: <><path d="M4 14V9h4l10-4v13L8 14H4Z" /><path d="m8 14 1.5 5h3M21 9v5" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r=".8" /><circle cx="4.5" cy="12" r=".8" /><circle cx="4.5" cy="18" r=".8" /></>,
    storefront: <><path d="M4 10v10h16V10M3 9l2-5h14l2 5" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-6h6v6" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4 4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    chevronDown: <><path d="m6 9 6 6 6-6" /></>,
    chevronRight: <><path d="m9 6 6 6-6 6" /></>,
    arrowRight: <><path d="M4 12h15M13 6l6 6-6 6" /></>,
    arrowLeft: <><path d="M20 12H5M11 6 5 12l6 6" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    drag: <><circle cx="8" cy="6" r="1" /><circle cx="16" cy="6" r="1" /><circle cx="8" cy="12" r="1" /><circle cx="16" cy="12" r="1" /><circle cx="8" cy="18" r="1" /><circle cx="16" cy="18" r="1" /></>,
    branch: <><path d="M7 4v10a4 4 0 0 0 4 4h6" /><path d="m14 14 4 4-4 4" /></>,
    eye: <><path d="M2.5 12s3.4-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.4 6.5-9.5 6.5S2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    eyeOff: <><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.7A9.8 9.8 0 0 1 12 5.5c6.1 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.8M6.2 6.2C3.9 7.8 2.5 12 2.5 12s3.4 6.5 9.5 6.5c1.3 0 2.4-.3 3.4-.8" /></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 13h11l1-13M9 7V4h6v3" /></>,
    duplicate: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
    generate: <><path d="M12 3 13.5 9.2 20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-.8L12 3Z" /><path d="M18.5 4.5 19.4 7 22 7.8 19.4 8.7 18.5 11 17.6 8.7 15 7.8 17.6 7 18.5 4.5Z" /><path d="M5.5 14 6.3 16.5 9 17.3 6.3 18.2 5.5 20.5 4.7 18.2 2 17.3 4.7 16.5 5.5 14Z" /></>,
    appBlock: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><path d="M16.5 13v7M13 16.5h7" /></>,
  };

  return <svg {...sharedProps}>{icons[name] || icons.section}</svg>;
}

function SectionRowQuickActions({ label, enabled = true, onToggle, onRemove }) {
  if (!onToggle && !onRemove) return null;
  return <span className="shopify-editor-section__quick-actions">
    {onToggle ? <button type="button" className="shopify-editor-section__quick-action" aria-label={`${enabled ? 'Hide' : 'Show'} ${label}`} aria-pressed={enabled} title={`${enabled ? 'Hide' : 'Show'} ${label}`} onClick={(event) => { event.stopPropagation(); onToggle(); }}>
      <EditorIcon name={enabled ? 'eye' : 'eyeOff'} size={13} />
    </button> : null}
    {onRemove ? <button type="button" className="shopify-editor-section__quick-action" aria-label={`Remove ${label}`} title={`Remove ${label}`} onClick={(event) => { event.stopPropagation(); onRemove(); }}>
      <EditorIcon name="trash" size={13} />
    </button> : null}
  </span>;
}

function sectionIconName(type = '') {
  const normalizedType = String(type).toLocaleLowerCase();
  if (/announcement|promo/.test(normalizedType)) return 'announcement';
  if (/newsletter|email|mail/.test(normalizedType)) return 'mail';
  if (/instagram|social/.test(normalizedType)) return 'camera';
  if (/quote|testimonial/.test(normalizedType)) return 'quote';
  if (/video/.test(normalizedType)) return 'video';
  if (/product|collection|featured|shop|cart/.test(normalizedType)) return 'shoppingBag';
  if (/letter|article|blog|pageheader|listingheader/.test(normalizedType)) return 'document';
  if (/values|standard|steps|timeline|process/.test(normalizedType)) return 'list';
  if (/hero|banner|image|photo|media|gallery/.test(normalizedType)) return 'media';
  if (/header|footer|navigation/.test(normalizedType)) return 'storefront';
  if (/text|story|cta|editorial|content|form/.test(normalizedType)) return 'text';
  return 'section';
}

function SharedSectionRow({ label, description, href, identifier, onSelectSharedSection, onToggleSharedBlock, onToggleSharedSection, sectionEnabled = true, selected = false, childBlocks = [], selectedBlockId = null, onRemove, onMoveUp, onMoveDown, isFirst = false, isLast = false }) {
  const rowContents = <>
    <span className="shopify-editor-link-row__icon"><EditorIcon name={sectionIconName(identifier || label)} /></span>
    <span><strong>{label}</strong><small className="sr-only">{description}</small></span>
    <span className="shopify-editor-link-row__chevron"><EditorIcon name="chevronRight" size={14} /></span>
  </>;

  if (!onSelectSharedSection) {
    return <Link href={href} className="shopify-editor-link-row">{rowContents}</Link>;
  }

  return <div className="shopify-editor-link-group">
    <div className={`shopify-editor-link-parent-row${selected ? ' is-selected' : ''}`} data-tree-selected-row={selected && !selectedBlockId ? '' : undefined}>
      <button
        type="button"
        className={`shopify-editor-link-row${selected ? ' is-selected' : ''}${sectionEnabled === false ? ' is-hidden' : ''}`}
        style={{ border: 0, flex: '1 1 auto', minWidth: 0, width: 'auto', textAlign: 'left', font: 'inherit', cursor: 'pointer' }}
        onClick={() => onSelectSharedSection(identifier)}
      >
        {rowContents}
      </button>
      {onToggleSharedSection ? <button type="button" className={`shopify-editor-link-child-visibility shopify-editor-link-section-visibility${sectionEnabled === false ? ' is-hidden' : ''}`} aria-label={`${sectionEnabled === false ? 'Show' : 'Hide'} ${label} section`} aria-pressed={sectionEnabled !== false} title={`${sectionEnabled === false ? 'Show' : 'Hide'} ${label} section`} onClick={onToggleSharedSection}>
        <EditorIcon name={sectionEnabled === false ? 'eyeOff' : 'eye'} size={14} />
      </button> : null}
      {onRemove ? <button type="button" className="shopify-editor-link-child-visibility shopify-editor-link-section-remove" aria-label={`Remove ${label} section`} title={`Remove ${label} section`} onClick={onRemove}>
        <EditorIcon name="trash" size={13} />
      </button> : null}
      {onRemove ? <details className="shopify-editor-section__menu">
        <summary aria-label={`More actions for ${label}`}><EditorIcon name="more" size={15} /></summary>
        <div className="shopify-editor-section__menu-items">
          <button type="button" disabled>Duplicate</button>
          {onMoveUp ? <button type="button" onClick={(event) => { onMoveUp(); event.currentTarget.closest('details')?.removeAttribute('open'); }} disabled={isFirst}>Move up</button> : null}
          {onMoveDown ? <button type="button" onClick={(event) => { onMoveDown(); event.currentTarget.closest('details')?.removeAttribute('open'); }} disabled={isLast}>Move down</button> : null}
        </div>
      </details> : null}
    </div>
    {childBlocks.length ? <div className="shopify-editor-link-children">
      {childBlocks.map((block) => <div className={`shopify-editor-link-child-row${selectedBlockId === block.id ? ' is-selected' : ''}`} data-tree-selected-row={selectedBlockId === block.id ? '' : undefined} key={block.id}>
        <button type="button" className={`shopify-editor-link-child${selectedBlockId === block.id ? ' is-selected' : ''}${block.enabled === false ? ' is-hidden' : ''}`} aria-pressed={selectedBlockId === block.id} onClick={() => onSelectSharedSection(identifier, block.id)}>
          <EditorIcon name="branch" size={13} /><span>{block.label}</span>
        </button>
        {onToggleSharedBlock ? <button type="button" className={`shopify-editor-link-child-visibility${block.enabled === false ? ' is-hidden' : ''}`} aria-label={`${block.enabled === false ? 'Show' : 'Hide'} ${block.label}`} aria-pressed={block.enabled !== false} title={`${block.enabled === false ? 'Show' : 'Hide'} ${block.label}`} onClick={() => onToggleSharedBlock(block.id)}>
          <EditorIcon name={block.enabled === false ? 'eyeOff' : 'eye'} size={14} />
        </button> : null}
      </div>)}
    </div> : null}
  </div>;
}

function sectionDisplayName(config) {
  return config.label.replace(/\s+—\s+/g, ' ');
}

function scrollTreeRowIntoView(scrollContainer, selectedRow) {
  if (!scrollContainer || !selectedRow) return;

  const containerBounds = scrollContainer.getBoundingClientRect();
  const stickyHeading = scrollContainer.querySelector('.shopify-editor-panel__page-heading');
  const pageHeadingBounds = stickyHeading?.getBoundingClientRect();
  const stickyGroupHeading = selectedRow.closest('.shopify-editor-group')?.querySelector('h2');
  const groupHeadingBounds = stickyGroupHeading?.getBoundingClientRect();
  const selectedSection = selectedRow.closest('.shopify-editor-section--parent-of-selected');
  const selectedSectionRow = selectedSection?.querySelector(':scope > .shopify-editor-section__row');
  const selectedSectionRowBounds = selectedSectionRow?.getBoundingClientRect();
  const rowBounds = selectedRow.getBoundingClientRect();
  const pageHeadingBottom = Math.max(containerBounds.top, pageHeadingBounds?.bottom || containerBounds.top);
  const groupHeadingOverlapsRow = groupHeadingBounds
    && groupHeadingBounds.top < rowBounds.bottom
    && groupHeadingBounds.bottom > rowBounds.top;
  const selectedSectionOverlapsRow = selectedSectionRowBounds
    && selectedSectionRowBounds.top < rowBounds.bottom
    && selectedSectionRowBounds.bottom > rowBounds.top;
  const visibleTop = Math.max(
    pageHeadingBottom,
    groupHeadingOverlapsRow ? groupHeadingBounds.bottom : containerBounds.top,
    selectedSectionOverlapsRow ? selectedSectionRowBounds.bottom : containerBounds.top,
  ) + 6;
  const visibleBottom = containerBounds.bottom - 6;
  let scrollAdjustment = 0;

  if (rowBounds.top < visibleTop) {
    scrollAdjustment = rowBounds.top - visibleTop;
  } else if (rowBounds.bottom > visibleBottom) {
    scrollAdjustment = rowBounds.bottom - visibleBottom;
  }

  if (scrollAdjustment) scrollContainer.scrollTop += scrollAdjustment;
}

function SectionPreviewArt({ type, blogPostPickerSamples = [] }) {
  const previewKind = sectionIconName(type);
  const normalizedType = String(type || '').toLocaleLowerCase();
  const blogLayout = normalizedType.match(/^blogposts:(grid|carousel|editorial)$/)?.[1];
  const isHero = normalizedType.includes('hero') || normalizedType.includes('banner');
  const isVideo = normalizedType.includes('video');

  if (blogLayout) {
    const sampleArticles = blogPostPickerSamples.slice(0, 3);
    const articleCard = (article, articleIndex) => {
      const publishedDate = article.publishedAt ? new Date(`${String(article.publishedAt).slice(0, 10)}T12:00:00.000Z`) : null;
      const dateLabel = publishedDate && Number.isFinite(publishedDate.getTime())
        ? publishedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';
      const editorialPosition = articleIndex % 3 === 0 ? 'left' : articleIndex % 3 === 1 ? 'right' : 'wide';
      return <article key={article.id || article.handle || articleIndex} className={`shopify-section-picker__blog-card${blogLayout === 'editorial' ? ` shopify-section-picker__blog-card--${editorialPosition}` : ''}`}>
        {article.image ? <div className="shopify-section-picker__blog-card-image"><Image src={article.image} alt={article.imageAlt || article.title || ''} fill sizes="160px" unoptimized /></div> : <div className="shopify-section-picker__blog-card-image shopify-section-picker__blog-card-image--empty">No image</div>}
        <div className="shopify-section-picker__blog-card-copy">
          <strong>{article.title}</strong>
          {dateLabel || article.author ? <span>{[dateLabel, article.author].filter(Boolean).join(' · ')}</span> : null}
          {article.excerpt ? <p>{article.excerpt}</p> : null}
        </div>
      </article>;
    };
    const layoutStyles = {
      grid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', alignItems: 'start', gap: 8 },
      carousel: { display: 'grid', gridTemplateColumns: '1fr auto', gridTemplateRows: '1fr auto', alignItems: 'start', gap: 5, overflow: 'hidden' },
      editorial: { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto', alignItems: 'start', gap: 8 },
    }[blogLayout];
    return <div className={`shopify-section-picker__preview-art shopify-section-picker__preview-art--blog-posts-${blogLayout}`} aria-hidden="true">
      <div className="shopify-section-picker__preview-toolbar"><i /><i /><i /></div>
      <div className="shopify-section-picker__preview-canvas" style={layoutStyles}>
        {sampleArticles.length
          ? blogLayout === 'carousel' ? <div className="shopify-section-picker__blog-preview-track">{sampleArticles.map(articleCard)}</div> : sampleArticles.map(articleCard)
          : blogLayout === 'carousel' ? <div className="shopify-section-picker__blog-empty-track"><i /><i /><i /></div>
            : <div className={`shopify-section-picker__blog-empty-layout shopify-section-picker__blog-empty-layout--${blogLayout}`}><i /><i /><i /></div>}
        {blogLayout === 'carousel' ? <button type="button" className="shopify-section-picker__blog-next">Next slide</button> : null}
      </div>
    </div>;
  }

  return <div className={`shopify-section-picker__preview-art shopify-section-picker__preview-art--${previewKind}${isHero ? ' shopify-section-picker__preview-art--hero' : ''}${isVideo ? ' shopify-section-picker__preview-art--video' : ''}`} aria-hidden="true">
    <div className="shopify-section-picker__preview-toolbar"><i /><i /><i /></div>
    <div className="shopify-section-picker__preview-canvas">
      {previewKind === 'media' ? <>
        <div className={`shopify-section-picker__preview-image${isHero ? ' shopify-section-picker__preview-image--hero' : ''}`}>
          {isVideo ? <span className="shopify-section-picker__preview-play" /> : <EditorIcon name="media" size={19} />}
        </div>
        <div className="shopify-section-picker__preview-copy"><i /><i /><i /><b /></div>
      </> : null}
      {previewKind === 'grid' ? <>
        <div className="shopify-section-picker__preview-copy"><i /><i /></div>
        <div className="shopify-section-picker__preview-grid"><i /><i /><i /></div>
      </> : null}
      {previewKind === 'text' ? <div className="shopify-section-picker__preview-copy shopify-section-picker__preview-copy--center"><i /><i /><i /><i /><b /></div> : null}
      {previewKind === 'section' ? <>
        <div className="shopify-section-picker__preview-copy"><i /><i /><i /><b /></div>
        <div className="shopify-section-picker__preview-image shopify-section-picker__preview-image--small"><EditorIcon name="section" size={20} /></div>
      </> : null}
    </div>
  </div>;
}

function SectionPicker({ index, pickerId, canEditCode, templateContext, allowedSectionTypes = null, existingSections = [], blogPostPickerSamples = [], onAdd, onClose, anchorRef }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('sections');
  const [highlightedType, setHighlightedType] = useState(null);
  const pickerRef = useRef(null);
  const query = search.trim().toLocaleLowerCase();
  const groupedSections = useMemo(() => {
    const available = Object.entries(BLOCK_TYPES).filter(([type, config]) => !config.childOnly && (canEditCode || !config.ownerOnly)
      && (!allowedSectionTypes || allowedSectionTypes.includes(type))
      && (!config.unique || !existingSections.some((section) => section.type === type))
      && (!config.templateTypes || config.templateTypes.includes(templateContext)))
      .flatMap(([type, config]) => config.sectionPresets?.length
        ? config.sectionPresets.map((preset) => [`${type}:${preset.key}`, { ...config, label: preset.label, description: preset.description, presetLayout: preset.key }])
        : [[type, config]]);
    const filtered = available.filter(([type, config]) => `${config.label} ${config.description} ${config.category || 'Content'} ${type}`.toLocaleLowerCase().includes(query));
    const groups = new Map();
    filtered.forEach((entry) => {
      const category = entry[1].category || 'Content';
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(entry);
    });
    return [...groups.entries()]
      .sort(([leftCategory], [rightCategory]) => leftCategory.localeCompare(rightCategory))
      .map(([name, sections]) => ({ name, sections }));
  }, [allowedSectionTypes, canEditCode, existingSections, query, templateContext]);
  const availableSections = useMemo(() => groupedSections.flatMap((group) => group.sections), [groupedSections]);
  const highlightedSection = availableSections.find(([type]) => type === highlightedType) || availableSections[0] || null;

  useLayoutEffect(() => {
    const picker = pickerRef.current;
    if (!picker) return undefined;

    const updatePosition = () => {
      const panel = document.querySelector('.shopify-editor-panel--tree');
      const currentAnchorMatches = anchorRef?.current?.isConnected
        && (pickerId
          ? anchorRef.current.dataset.sectionPickerId === pickerId
          : anchorRef.current.dataset.sectionPickerIndex === String(index));
      const anchor = currentAnchorMatches
        ? anchorRef.current
        : pickerId
          ? document.querySelector(`[data-section-picker-id="${pickerId}"]`)
          : document.querySelector(`[data-section-picker-index="${index}"]`);
      if (!panel || !anchor) return;

      const anchorBounds = anchor.getBoundingClientRect();
      const pickerBounds = picker.getBoundingClientRect();
      const preferredLeft = anchorBounds.right + 8;
      let left = preferredLeft;
      if (left + pickerBounds.width > window.innerWidth - 12) {
        const leftOfAnchor = anchorBounds.left - pickerBounds.width - 8;
        left = leftOfAnchor >= 12 ? leftOfAnchor : window.innerWidth - pickerBounds.width - 12;
      }
      const preferredTop = anchorBounds.top;
      const top = Math.min(Math.max(12, preferredTop), Math.max(12, window.innerHeight - pickerBounds.height - 12));

      picker.style.left = `${Math.max(12, left)}px`;
      picker.style.top = `${top}px`;
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef, index, pickerId]);

  useEffect(() => {
    if (highlightedType && availableSections.some(([type]) => type === highlightedType)) return;
    setHighlightedType(availableSections[0]?.[0] || null);
  }, [availableSections, highlightedType]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
      window.requestAnimationFrame(() => anchorRef?.current?.focus());
    };
    const closeOnOutsidePointerDown = (event) => {
      if (pickerRef.current?.contains(event.target) || anchorRef?.current?.contains(event.target)) return;
      onClose();
    };

    document.addEventListener('keydown', closeOnEscape, true);
    document.addEventListener('pointerdown', closeOnOutsidePointerDown, true);
    return () => {
      document.removeEventListener('keydown', closeOnEscape, true);
      document.removeEventListener('pointerdown', closeOnOutsidePointerDown, true);
    };
  }, [anchorRef, onClose]);

  const renderSectionDetails = () => {
    if (!highlightedSection) {
      return <div className="shopify-section-picker__preview-empty">Choose a section to see its layout and settings.</div>;
    }

    const [type, config] = highlightedSection;
    const settings = (config.fields || []).map((fieldName) => config.labels?.[fieldName] || FIELD_DEFS[fieldName]?.label || fieldName);
    const settingSummary = settings.slice(0, 4);
    const additionalSettings = Math.max(0, settings.length - settingSummary.length);

    return <>
      <SectionPreviewArt type={type} blogPostPickerSamples={blogPostPickerSamples} />
      <div className="shopify-section-picker__preview-description">
        <span className="shopify-section-picker__preview-category">{config.category || 'Content'}</span>
        <h3>{sectionDisplayName(config)}</h3>
        <p>{config.description}</p>
        {config.presetLayout && !blogPostPickerSamples.length ? <p className="shopify-section-picker__preview-empty-posts">No published News posts to preview. This shows the selected layout.</p> : null}
        {config.cards?.label ? <p className="shopify-section-picker__preview-blocks">Includes editable {config.cards.label.toLocaleLowerCase()} blocks.</p> : null}
        {settingSummary.length ? <div className="shopify-section-picker__preview-settings">
          <strong>Settings</strong>
          <ul>{settingSummary.map((setting) => <li key={setting}>{setting}</li>)}</ul>
          {additionalSettings ? <small>+{additionalSettings} more</small> : null}
        </div> : null}
      </div>
    </>;
  };

  return (
    typeof document === 'undefined' ? null : createPortal(<div ref={pickerRef} className="shopify-section-picker shopify-section-picker--floating" role="dialog" aria-label="Add a section">
      <label className="shopify-section-picker__search"><span className="sr-only">Search sections</span><input autoFocus type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sections" /></label>
      <div className="shopify-section-picker__tabs" role="tablist" aria-label="Available content">
        <button type="button" role="tab" aria-selected={tab === 'sections'} className={tab === 'sections' ? 'is-active' : ''} onClick={() => setTab('sections')}>Sections</button>
        <button type="button" role="tab" aria-selected={tab === 'apps'} className={tab === 'apps' ? 'is-active' : ''} onClick={() => setTab('apps')}>Apps</button>
      </div>
      {tab === 'sections' ? <>
        <div className="shopify-section-picker__workspace">
          <div className="shopify-section-picker__results" role="region" aria-label="Section types">
            {groupedSections.map((group) => <section key={group.name}>
              <h3>{group.name}</h3>
              {group.sections.map(([type, config]) => <button type="button" className={`shopify-section-picker__option${highlightedSection?.[0] === type ? ' is-highlighted' : ''}`} key={type} onMouseEnter={() => setHighlightedType(type)} onFocus={() => setHighlightedType(type)} onClick={() => { onAdd(index, type); onClose(); }}>
                <span className="shopify-section-picker__glyph"><EditorIcon name={sectionIconName(type)} size={17} /></span>
                <span><strong>{sectionDisplayName(config)}</strong><small>{config.description}</small></span>
              </button>)}
            </section>)}
            {!groupedSections.length ? <p className="shopify-section-picker__empty">No sections found. Try a different search.</p> : null}
          </div>
          <aside className="shopify-section-picker__preview" aria-live="polite" aria-label="Selected section preview">
            {renderSectionDetails()}
          </aside>
        </div>
      </> : <div className="shopify-section-picker__empty shopify-section-picker__apps">
        <strong>No app sections available</strong>
        <span>Sections from installed apps appear here.</span>
      </div>}
    </div>, document.body)
  );
}

function NestedBlockAdd({ sectionId, parentId, parentDepth = 0, childCount = 0, index = childCount, allowedBlockTypes = null, existingBlocks = [], canEditCode, onAdd, insertionLabel = '' }) {
  const [open, setOpen] = useState(false);
  const choices = (allowedBlockTypes ? allowedBlockTypes.map((type) => [type, BLOCK_TYPES[type]]) : Object.entries(BLOCK_TYPES))
    .filter(([type, config]) => config
      && (allowedBlockTypes ? allowedBlockTypes.includes(type) : !config.childOnly && !config.rootOnly)
      && (!config.unique || !existingBlocks.some((block) => block.type === type))
      && (canEditCode || !config.ownerOnly));
  const canAdd = parentDepth < 5 && childCount < 24;
  if (!choices.length) return null;

  return <div className={`shopify-editor-nested-block-add${insertionLabel ? ' shopify-editor-nested-block-add--insertion' : ''}`} style={{ marginInlineStart: `${8 + parentDepth * 14}px` }}>
    <button type="button" className="shopify-editor-section__add-block" aria-label={insertionLabel ? `Add block ${insertionLabel}` : 'Add block'} title={insertionLabel ? `Add block ${insertionLabel}` : undefined} aria-expanded={open} disabled={!canAdd} onClick={() => setOpen((isOpen) => !isOpen)}>
      <EditorIcon name="plus" size={13} />Add block
    </button>
    {open ? <div className="shopify-editor-nested-block-add__menu" role="menu" aria-label="Choose a block">
      {choices.map(([type, config]) => <button type="button" role="menuitem" key={type} onClick={() => {
        if (config.unavailableReason) return;
        onAdd(sectionId, parentId, type, index);
        setOpen(false);
      }} disabled={Boolean(config.unavailableReason)} style={config.unavailableReason ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}>
        <strong>{config.label}</strong><small>{config.unavailableReason || config.description}</small>
      </button>)}
    </div> : null}
  </div>;
}

function NestedBlockRow({ block, index, total, sectionId, parentId, selectedBlockId, onSelectCard, onAddNestedBlock, onMoveNestedBlock, onDuplicateNestedBlock, onToggleNestedBlock, onDeleteNestedBlock, canEditCode, visualDepth, blockDepth }) {
  const label = BLOCK_TYPES[block.type]?.label || block.label || block.type || `Block ${index + 1}`;
  const nestedBlocks = Array.isArray(block.blocks) ? block.blocks : [];
  const supportsNestedChildren = Boolean(BLOCK_TYPES[block.type]?.nestedBlocks);
  const selected = selectedBlockId === block.id;

  return <div className={`shopify-editor-nested-block${block.enabled === false ? ' is-hidden' : ''}${selected ? ' is-selected' : ''}`} data-nested-block-id={block.id}>
    <div className="shopify-editor-nested-block__row" data-tree-selected-row={selected ? '' : undefined}>
      <button type="button" className="shopify-editor-section__nested-block" style={{ paddingInlineStart: `${8 + visualDepth * 14}px` }} aria-current={selected ? 'true' : undefined} onClick={() => onSelectCard(sectionId, block.id)}>
        <EditorIcon name="branch" size={13} />
        <span>{label}</span>
      </button>
      {selected && !block.static ? <button type="button" className="shopify-editor-nested-block__remove" aria-label={`Remove ${label}`} title={`Remove ${label}`} onClick={() => onDeleteNestedBlock(sectionId, parentId, block.id)}>
        <EditorIcon name="trash" size={13} />
      </button> : null}
      {!block.static ? <button type="button" className="shopify-editor-nested-block__visibility" aria-label={`${block.enabled === false ? 'Show' : 'Hide'} ${label}`} aria-pressed={block.enabled !== false} title={`${block.enabled === false ? 'Show' : 'Hide'} ${label}`} onClick={() => onToggleNestedBlock(sectionId, block.id)}>
        <EditorIcon name={block.enabled === false ? 'eyeOff' : 'eye'} size={13} />
      </button> : null}
      {!block.static ? <details className="shopify-editor-nested-block__menu">
        <summary aria-label={`More actions for ${label}`}><EditorIcon name="more" size={14} /></summary>
        <div className="shopify-editor-section__menu-items">
          <button type="button" disabled={index === 0} onClick={(event) => { onMoveNestedBlock(sectionId, parentId, block.id, index - 1); event.currentTarget.closest('details')?.removeAttribute('open'); }}>Move up</button>
          <button type="button" disabled={index === total - 1} onClick={(event) => { onMoveNestedBlock(sectionId, parentId, block.id, index + 1); event.currentTarget.closest('details')?.removeAttribute('open'); }}>Move down</button>
          <button type="button" onClick={(event) => { onDuplicateNestedBlock(sectionId, parentId, block.id); event.currentTarget.closest('details')?.removeAttribute('open'); }}>Duplicate</button>
          {!selected ? <button type="button" className="is-danger" onClick={(event) => { onDeleteNestedBlock(sectionId, parentId, block.id); event.currentTarget.closest('details')?.removeAttribute('open'); }}>Remove</button> : null}
        </div>
      </details> : null}
    </div>
    {nestedBlocks.length || supportsNestedChildren ? <NestedBlockRows
      blocks={nestedBlocks}
      sectionId={sectionId}
      parentId={block.id}
      parentDepth={blockDepth}
      canAddChildren={supportsNestedChildren}
      allowedBlockTypes={BLOCK_TYPES[block.type]?.nestedBlockTypes || null}
      onSelectCard={onSelectCard}
      onAddNestedBlock={onAddNestedBlock}
      onMoveNestedBlock={onMoveNestedBlock}
      onDuplicateNestedBlock={onDuplicateNestedBlock}
      onToggleNestedBlock={onToggleNestedBlock}
      onDeleteNestedBlock={onDeleteNestedBlock}
      canEditCode={canEditCode}
      selectedBlockId={selectedBlockId}
      depth={visualDepth + 1}
    /> : null}
  </div>;
}

function NestedBlockRows({ blocks = [], sectionId, parentId = null, parentDepth = 0, canAddChildren = false, allowedBlockTypes = null, onSelectCard, onAddNestedBlock, onMoveNestedBlock, onDuplicateNestedBlock, onToggleNestedBlock, onDeleteNestedBlock, canEditCode, selectedBlockId, depth = 0 }) {
  const addBlockAtIndex = (index, insertionLabel = '') => <NestedBlockAdd
    sectionId={sectionId}
    parentId={parentId}
    parentDepth={parentDepth}
    childCount={blocks.length}
    index={index}
    allowedBlockTypes={allowedBlockTypes}
    existingBlocks={blocks}
    canEditCode={canEditCode}
    onAdd={onAddNestedBlock}
    insertionLabel={insertionLabel}
  />;

  return <>
    {canAddChildren && blocks.length ? addBlockAtIndex(0, 'before the first block') : null}
    {blocks.map((block, index) => {
      const blockLabel = BLOCK_TYPES[block.type]?.label || block.label || block.type || `Block ${index + 1}`;
      return <Fragment key={block.id || `${sectionId}-nested-${depth}-${index}`}>
        <NestedBlockRow
          block={block}
          index={index}
          total={blocks.length}
          sectionId={sectionId}
          parentId={parentId}
          selectedBlockId={selectedBlockId}
          onSelectCard={onSelectCard}
          onAddNestedBlock={onAddNestedBlock}
          onMoveNestedBlock={onMoveNestedBlock}
          onDuplicateNestedBlock={onDuplicateNestedBlock}
          onToggleNestedBlock={onToggleNestedBlock}
          onDeleteNestedBlock={onDeleteNestedBlock}
          canEditCode={canEditCode}
          visualDepth={depth}
          blockDepth={parentDepth + 1}
        />
        {canAddChildren && index < blocks.length - 1 ? addBlockAtIndex(index + 1, `after ${blockLabel}`) : null}
      </Fragment>;
    })}
    {canAddChildren ? addBlockAtIndex(blocks.length) : null}
  </>;
}

function CardInsertion({ label, afterLabel, onAdd }) {
  return <div className="shopify-editor-card-insertion">
    <button type="button" aria-label={`Add ${label} after ${afterLabel}`} title={`Add ${label} after ${afterLabel}`} onClick={onAdd}>
      <EditorIcon name="plus" size={13} />Add {label}
    </button>
  </div>;
}

function blockTreeContains(blocks, targetId) {
  return Array.isArray(blocks) && blocks.some((block) => block.id === targetId || blockTreeContains(block.blocks, targetId));
}

function sectionContainsBlock(section, targetId) {
  return blockTreeContains(section.blocks, targetId)
    || (Array.isArray(section.cards) && section.cards.some((card) => card.id === targetId || blockTreeContains(card.blocks, targetId)));
}

const LEGACY_THEME_SECTIONS = {
  'global.announcement': { identifier: 'announcement-bar', selectedKey: 'announcement', label: 'Announcement bar', description: 'Managed in Site-wide text', href: '/admin/editor/global' },
  'navigation.header-settings': { identifier: 'header', label: 'Header', description: 'Logo and Menu blocks', href: '/admin/editor/navigation' },
  'global.newsletter': { identifier: 'newsletter', label: 'Newsletter', description: 'Managed in Site-wide text', href: '/admin/editor/global' },
  'global.footer': { identifier: 'footer', label: 'Footer', description: 'Managed in Navigation', href: '/admin/editor/navigation' },
};

function legacyThemeSectionKey(section) {
  const source = section?.source;
  if (typeof source === 'string') return source;
  if (source && typeof source === 'object') {
    const scope = source.scope || source.collection || source.contentKey || source.group || source.type;
    const sourceId = source.sectionId || source.identifier || source.id || source.key;
    if (scope && sourceId) return `${scope}.${sourceId}`;
    if (source.key && String(source.key).includes('.')) return source.key;
  }
  const directSource = section?.sourceKey || section?.identifier || section?.key;
  return typeof directSource === 'string' ? directSource : '';
}

function themeSectionLabel(section) {
  return section.label
    || section.heading
    || section.eyebrow
    || BLOCK_TYPES[section.type]?.label?.split(' — ')[0]
    || 'Section';
}

function ThemeGroupInsertion({ group, index, isEnd = false, pickerTarget, openPicker, closePicker, addSection, canEditCode, templateContext, blogPostPickerSamples = [], pickerAnchorRef }) {
  const pickerId = `${group}-${index}`;
  const isOpen = pickerTarget?.group === group && pickerTarget.index === index;
  const insertionClass = isEnd ? ' shopify-editor-insertion--end' : index === 0 ? '' : ' shopify-editor-insertion--between';
  return <div className={`shopify-editor-insertion${insertionClass}`}>
    <button type="button" data-section-picker-index={index} data-section-picker-id={pickerId} onClick={(event) => openPicker(index, event, group)}>
      <EditorIcon name="plus" size={14} />Add section
    </button>
    {isOpen ? <SectionPicker index={index} pickerId={pickerId} canEditCode={canEditCode} templateContext={templateContext} blogPostPickerSamples={blogPostPickerSamples} onAdd={(insertIndex, type) => addSection(group, insertIndex, type)} onClose={closePicker} anchorRef={pickerAnchorRef} /> : null}
  </div>;
}

function ThemeGroupSectionRow({ section, group, index, total, selected, selectedBlockId, expanded, setExpanded, dragHandle, insertion, disableReorder = false, onSelect, onSelectBlock, onAddBlock, onAddNestedBlock, onMoveNestedBlock, onDuplicateNestedBlock, onToggleNestedBlock, onDeleteNestedBlock, onReorder, onDuplicate, onToggle, onDelete, canEditCode }) {
  const config = BLOCK_TYPES[section.type];
  const expansionKey = `theme-${group}-${section.id}`;
  const sectionCards = Array.isArray(section.cards) ? section.cards : [];
  const sectionBlocks = Array.isArray(section.blocks) ? section.blocks : [];
  const supportsBlocks = Boolean(config?.cards || config?.nestedBlocks || sectionBlocks.length || sectionCards.some((card) => card.blocks?.length));
  const displayName = themeSectionLabel(section);

  return <div className={`shopify-editor-section${selected ? ' is-selected' : ''}${section.enabled === false ? ' is-hidden' : ''}`}>
    <div className="shopify-editor-section__row" data-tree-selected-row={selected && !selectedBlockId ? '' : undefined}>
      {supportsBlocks ? <button type="button" className="shopify-editor-section__expand" aria-label={`${expanded ? 'Collapse' : 'Expand'} blocks in ${displayName}`} aria-expanded={expanded} onClick={() => setExpanded((current) => ({ ...current, [expansionKey]: !current[expansionKey] }))}><EditorIcon name={expanded ? 'chevronDown' : 'chevronRight'} size={14} /></button> : <span className="shopify-editor-section__expand-space" />}
      <button type="button" className="shopify-editor-section__select" onClick={() => {
        if (config?.nestedBlocks) setExpanded((current) => ({ ...current, [expansionKey]: true }));
        onSelect?.(group, section.id);
      }} aria-current={selected ? 'true' : undefined}>
        <span className="shopify-editor-section__icon"><EditorIcon name={sectionIconName(section.type)} size={16} /></span>
        <strong>{displayName}</strong>
      </button>
      <span {...(disableReorder ? {} : dragHandle)} className="shopify-editor-section__drag" aria-label={`Rearrange ${displayName}. Use the up and down arrow keys to move it.`} aria-disabled={disableReorder || undefined}><EditorIcon name="drag" size={14} /></span>
      <SectionRowQuickActions label={`${displayName} section`} enabled={section.enabled !== false} onToggle={onToggle ? () => onToggle(group, section.id) : undefined} onRemove={onDelete ? () => onDelete(group, section.id) : undefined} />
      <details className="shopify-editor-section__menu">
        <summary aria-label={`More actions for ${displayName}`}><EditorIcon name="more" size={15} /></summary>
        <div className="shopify-editor-section__menu-items">
          <button type="button" onClick={() => onDuplicate?.(group, section.id)}>Duplicate</button>
          <button type="button" aria-label={`Move ${displayName} up`} title={`Move ${displayName} up`} onClick={() => onReorder?.(group, index, index - 1)} disabled={disableReorder || index === 0}>Move up</button>
          <button type="button" aria-label={`Move ${displayName} down`} title={`Move ${displayName} down`} onClick={() => onReorder?.(group, index, index + 1)} disabled={disableReorder || index === total - 1}>Move down</button>
        </div>
      </details>
    </div>
    {expanded && supportsBlocks ? <div className="shopify-editor-section__blocks">
      {sectionCards.map((card, cardIndex) => {
        const cardLabel = card.label || card.heading || `${config?.cards?.label || 'Block'} ${cardIndex + 1}`;
        return <div className={`shopify-editor-nested-card${selectedBlockId === card.id ? ' is-selected' : ''}`} key={card.id || `${section.id}-card-${cardIndex}`}>
          <button type="button" className="shopify-editor-section__nested-block" style={{ paddingInlineStart: '8px' }} aria-current={selectedBlockId === card.id ? 'true' : undefined} data-tree-selected-row={selectedBlockId === card.id ? '' : undefined} onClick={() => onSelectBlock?.(group, section.id, card.id)}><EditorIcon name="branch" size={13} /><span>{cardLabel}</span></button>
          {card.blocks?.length ? <NestedBlockRows
            blocks={card.blocks}
            sectionId={section.id}
            parentId={card.id}
            parentDepth={0}
            canAddChildren={false}
            onSelectCard={(_, blockId) => onSelectBlock?.(group, section.id, blockId)}
            onAddNestedBlock={onAddNestedBlock}
            onMoveNestedBlock={onMoveNestedBlock}
            onDuplicateNestedBlock={onDuplicateNestedBlock}
            onToggleNestedBlock={onToggleNestedBlock}
            onDeleteNestedBlock={onDeleteNestedBlock}
            canEditCode={canEditCode}
            selectedBlockId={selectedBlockId}
            depth={1}
          /> : null}
          {config?.cards && sectionCards.length < (config.cards.max || 12) && cardIndex < sectionCards.length - 1 ? <CardInsertion label={String(config.cards.label || 'block').toLocaleLowerCase()} afterLabel={cardLabel} onAdd={() => onAddBlock?.(group, section.id, cardIndex + 1)} /> : null}
        </div>;
      })}
      {sectionBlocks.length || config?.nestedBlocks ? <NestedBlockRows
        blocks={sectionBlocks}
        sectionId={section.id}
        parentDepth={0}
        canAddChildren={Boolean(config?.nestedBlocks)}
        allowedBlockTypes={config?.nestedBlockTypes || null}
        onSelectCard={(_, blockId) => onSelectBlock?.(group, section.id, blockId)}
        onAddNestedBlock={onAddNestedBlock}
        onMoveNestedBlock={onMoveNestedBlock}
        onDuplicateNestedBlock={onDuplicateNestedBlock}
        onToggleNestedBlock={onToggleNestedBlock}
        onDeleteNestedBlock={onDeleteNestedBlock}
        canEditCode={canEditCode}
        selectedBlockId={selectedBlockId}
        depth={0}
      /> : null}
      {config?.cards && sectionCards.length < (config.cards.max || 12) ? <button type="button" className="shopify-editor-section__add-block" onClick={() => onAddBlock?.(group, section.id)}><EditorIcon name="plus" size={14} />Add {String(config.cards.label || 'block').toLocaleLowerCase()}</button> : null}
    </div> : null}
    {insertion}
  </div>;
}

export default function ShopifySectionTree({ sections, selectedId, selectedCardId = null, selectedSharedKey, selectedSharedBlockId = null, sharedHeaderBlocks = [], sharedHeaderMenuLabel = 'Main menu', sharedHeaderEnabled = true, themeSectionGroups = null, selectedThemeGroup = null, search, onSearch, onSelect, onSelectCard, onReorder, onAddSection, onAddBlock, onAddNestedBlock, onMoveNestedBlock, onDuplicateNestedBlock, onToggleNestedBlock, onDeleteNestedBlock, onDelete, onToggleEnabled, onSelectThemeSection, onAddThemeSection, onReorderThemeSections, onDuplicateThemeSection, onToggleThemeSection, onDeleteThemeSection, onAddThemeBlock, onAddThemeNestedBlock, onMoveThemeNestedBlock, onDuplicateThemeNestedBlock, onToggleThemeNestedBlock, onDeleteThemeNestedBlock, requestedPickerIndex = null, onPickerRequestHandled, canEditCode = false, templateLabel = 'Home page', templateContext = 'home', allowedSectionTypes = null, blogPostPickerSamples = [], hideSharedGroups = false, onSelectSharedSection, onToggleSharedBlock, onToggleSharedHeader, children }) {
  const [pickerIndex, setPickerIndex] = useState(null);
  const [pickerGroup, setPickerGroup] = useState('template');
  const [expandedSections, setExpandedSections] = useState({});
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [isSearchOpen, setIsSearchOpen] = useState(Boolean(search));
  const treeScrollRef = useRef(null);
  const pickerAnchorRef = useRef(null);
  const shouldHideSharedGroups = hideSharedGroups || templateContext === 'password';

  const activePickerIndex = requestedPickerIndex ?? pickerIndex;
  const activePickerGroup = requestedPickerIndex != null ? 'template' : pickerGroup;
  const pickerTarget = activePickerIndex == null ? null : { group: activePickerGroup, index: activePickerIndex };
  const isPickerOpen = (index, group = 'template') => pickerTarget?.group === group && pickerTarget.index === index;
  const closePicker = () => {
    setPickerIndex(null);
    setPickerGroup('template');
    if (requestedPickerIndex != null) onPickerRequestHandled?.(null);
  };
  const toggleSearch = () => {
    if (search.trim()) onSearch('');
    setIsSearchOpen((isOpen) => !isOpen && !search.trim());
  };
  const isSearchVisible = isSearchOpen || Boolean(search.trim());
  const toggleGroup = (groupName) => setCollapsedGroups((current) => ({ ...current, [groupName]: !current[groupName] }));
  const openPicker = (index, event, group = 'template') => {
    pickerAnchorRef.current = event.currentTarget;
    setPickerIndex(index);
    setPickerGroup(group);
  };

  const filteredSections = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return sections.map((section, sourceIndex) => ({
      ...section,
      sourceIndex,
      displayName: BLOCK_TYPES[section.type]?.label?.split(' — ')[0] || section.label || section.heading || section.eyebrow || 'Section',
      summary: blockSummary(section) || BLOCK_TYPES[section.type]?.description || '',
    })).filter((section) => !query || `${section.displayName} ${section.summary} ${BLOCK_TYPES[section.type]?.label || ''}`.toLocaleLowerCase().includes(query));
  }, [search, sections]);
  const canAddTemplateSection = !allowedSectionTypes
    || allowedSectionTypes.some((type) => !BLOCK_TYPES[type]?.unique || !sections.some((section) => section.type === type));

  useEffect(() => {
    if (!selectedId && !selectedCardId) return;
    setCollapsedGroups((current) => current.template ? { ...current, template: false } : current);
  }, [selectedCardId, selectedId]);

  const selectedSharedGroup = selectedThemeGroup?.group
    || (selectedSharedBlockId ? 'header' : null)
    || (['announcement', 'header', 'announcement-bar', 'navigation.header-settings', 'global.announcement'].includes(selectedSharedKey) ? 'header' : null)
    || (['newsletter', 'footer', 'global.newsletter', 'global.footer'].includes(selectedSharedKey) ? 'footer' : null);

  useEffect(() => {
    if (!selectedSharedKey && !selectedSharedBlockId && !selectedThemeGroup?.id) return;
    if (!selectedSharedGroup) return;
    setCollapsedGroups((current) => current[selectedSharedGroup] ? { ...current, [selectedSharedGroup]: false } : current);
  }, [selectedSharedBlockId, selectedSharedGroup, selectedSharedKey, selectedThemeGroup?.id]);

  useEffect(() => {
    if (!selectedCardId) return;
    const sectionWithSelection = sections.find((section) => sectionContainsBlock(section, selectedCardId));
    if (sectionWithSelection) setExpandedSections((current) => ({ ...current, [sectionWithSelection.id]: true }));
  }, [sections, selectedCardId]);

  useEffect(() => {
    let animationFrame = null;
    const scrollSelectedRow = () => {
      animationFrame = null;
      const scrollContainer = treeScrollRef.current;
      const selectedRow = scrollContainer?.querySelector('[data-tree-selected-row]');
      scrollTreeRowIntoView(scrollContainer, selectedRow);
    };
    const scheduleSelectedRowScroll = () => {
      if (animationFrame != null) return;
      animationFrame = requestAnimationFrame(scrollSelectedRow);
    };
    const scrollContainer = treeScrollRef.current;
    const resizeObserver = scrollContainer && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(scheduleSelectedRowScroll)
      : null;

    resizeObserver?.observe(scrollContainer);
    scheduleSelectedRowScroll();

    return () => {
      if (animationFrame != null) cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
    };
  }, [collapsedGroups, expandedSections, search, sections, selectedCardId, selectedId, selectedSharedBlockId, selectedSharedKey, selectedSharedGroup, selectedThemeGroup?.id, themeSectionGroups]);

  const addSection = (index, type) => {
    const [blockType, presetLayout] = String(type).split(':');
    if (allowedSectionTypes && !allowedSectionTypes.includes(blockType)) return;
    if (BLOCK_TYPES[blockType]?.unique && sections.some((section) => section.type === blockType)) return;
    const section = createBlock(blockType);
    if (presetLayout && ['grid', 'carousel', 'editorial'].includes(presetLayout)) {
      section.settings = { ...(section.settings || {}), layout: presetLayout };
      const preset = BLOCK_TYPES[blockType]?.sectionPresets?.find((sectionPreset) => sectionPreset.key === presetLayout);
      if (preset?.postCount) section.settings.postCount = preset.postCount;
    }
    const footerIndex = sections.findIndex((existingSection) => existingSection.type === 'passwordFooter');
    const insertionIndex = type === 'passwordFooter'
      ? sections.length
      : type === 'passwordSection' && footerIndex >= 0
        ? Math.min(index, footerIndex)
        : index;
    onAddSection(insertionIndex, section);
    onSelect(section.id);
  };
  const addThemeSection = (group, index, type) => {
    const [blockType, presetLayout] = String(type).split(':');
    const section = createBlock(blockType);
    if (presetLayout && ['grid', 'carousel', 'editorial'].includes(presetLayout)) {
      section.settings = { ...(section.settings || {}), layout: presetLayout };
      const preset = BLOCK_TYPES[blockType]?.sectionPresets?.find((sectionPreset) => sectionPreset.key === presetLayout);
      if (preset?.postCount) section.settings.postCount = preset.postCount;
    }
    onAddThemeSection?.(group, index, section);
  };
  const duplicateSection = (index) => {
    const original = sections[index];
    if (!original || original.static || BLOCK_TYPES[original.type]?.unique) return;
    const duplicate = duplicateBlockTree(original);
    onAddSection(index + 1, duplicate);
    onSelect(duplicate.id);
  };
  const moveSection = (section, direction) => {
    if (search.trim()) return;
    const destinationIndex = section.sourceIndex + direction;
    if (destinationIndex < 0 || destinationIndex >= sections.length) return;
    if (section.static || sections[destinationIndex]?.static) return;
    onReorder(section.sourceIndex, destinationIndex);
  };

  useEffect(() => {
    if (!selectedThemeGroup?.group || !selectedThemeGroup?.id || !selectedSharedBlockId) return;
    const group = selectedThemeGroup.group;
    setExpandedSections((current) => ({ ...current, [`theme-${group}-${selectedThemeGroup.id}`]: true }));
  }, [selectedSharedBlockId, selectedThemeGroup?.group, selectedThemeGroup?.id]);

  const renderThemeGroup = (group, label) => {
    if (shouldHideSharedGroups) return null;
    const defaultReferences = group === 'header'
      ? [
        { id: 'legacy-global-announcement', type: 'legacyReference', source: 'global.announcement' },
        { id: 'legacy-navigation-header', type: 'legacyReference', source: 'navigation.header-settings', enabled: sharedHeaderEnabled },
      ]
      : [
        { id: 'legacy-global-newsletter', type: 'legacyReference', source: 'global.newsletter' },
        { id: 'legacy-global-footer', type: 'legacyReference', source: 'global.footer' },
      ];
    const rawItems = Array.isArray(themeSectionGroups?.[group]) ? themeSectionGroups[group] : defaultReferences;
    const items = rawItems.map((item, index) => {
      const sourceKey = legacyThemeSectionKey(item);
      const isLegacy = item?.type === 'legacyReference' || item?.kind === 'legacyReference' || item?.legacyReference === true || Boolean(LEGACY_THEME_SECTIONS[sourceKey]);
      const id = item?.id || (isLegacy ? `legacy-${sourceKey || group}-${index}` : `${group}-section-${index}`);
      const legacy = LEGACY_THEME_SECTIONS[sourceKey];
      const normalizedSection = {
        ...item,
        id,
        sourceKey,
        isLegacy,
        displayName: legacy?.label || themeSectionLabel(item || {}),
        sourceIndex: index,
      };
      normalizedSection.summary = legacy?.description || blockSummary(normalizedSection) || BLOCK_TYPES[normalizedSection.type]?.description || '';
      return normalizedSection;
    });
    const groupSearch = search.trim().toLocaleLowerCase();
    const visibleItems = items.filter((item) => !groupSearch
      || `${item.displayName} ${item.summary} ${BLOCK_TYPES[item.type]?.label || ''}`.toLocaleLowerCase().includes(groupSearch));
    const canAddSections = Boolean(onAddThemeSection);
    const renderLegacyItem = (item, index) => {
      const legacy = LEGACY_THEME_SECTIONS[item.sourceKey];
      const commonActions = {
        onRemove: onDeleteThemeSection ? () => onDeleteThemeSection(group, item.id) : undefined,
        onMoveUp: !groupSearch && onReorderThemeSections ? () => onReorderThemeSections(group, item.sourceIndex, item.sourceIndex - 1) : undefined,
        onMoveDown: !groupSearch && onReorderThemeSections ? () => onReorderThemeSections(group, item.sourceIndex, item.sourceIndex + 1) : undefined,
        isFirst: index === 0,
        isLast: index === items.length - 1,
      };
      if (!legacy) {
        const identifier = item.identifier || item.id;
        return <SharedSectionRow
          label={item.label || item.displayName || 'Shared section'}
          description={item.description || 'Shared theme section'}
          identifier={identifier}
          onSelectSharedSection={onSelectSharedSection}
          sectionEnabled={item.enabled !== false}
          selected={selectedSharedKey === (item.selectedKey || identifier)}
          onToggleSharedSection={() => onToggleThemeSection?.(group, item.id)}
          {...commonActions}
        />;
      }
      const isHeader = legacy.identifier === 'header';
      const childBlocks = isHeader
        ? [
          { ...(sharedHeaderBlocks.find((block) => block.id === 'header-logo') || {}), id: 'header-logo', label: 'Logo' },
          { ...(sharedHeaderBlocks.find((block) => block.id === 'header-menu') || {}), id: 'header-menu', label: `Menu · ${sharedHeaderMenuLabel}` },
        ]
        : [];
      return <SharedSectionRow
        label={legacy.label}
        description={legacy.description}
        href={legacy.href}
        identifier={legacy.identifier}
        onSelectSharedSection={onSelectSharedSection}
        onToggleSharedBlock={isHeader ? onToggleSharedBlock : undefined}
        onToggleSharedSection={() => onToggleThemeSection?.(group, item.id)}
        sectionEnabled={item.enabled !== false}
        selected={selectedSharedKey === (legacy.selectedKey || legacy.identifier) && (!isHeader || !selectedSharedBlockId)}
        selectedBlockId={isHeader ? selectedSharedBlockId : null}
        childBlocks={childBlocks}
        {...commonActions}
      />;
    };

    return <section className={`shopify-editor-group${group === 'header' ? ' shopify-editor-group--theme-header' : ' shopify-editor-group--theme-footer'}`} key={group}>
      <h2><span>{label}</span><button type="button" aria-label={`${collapsedGroups[group] ? 'Expand' : 'Collapse'} ${label}`} aria-expanded={!collapsedGroups[group]} onClick={() => toggleGroup(group)}><EditorIcon name={collapsedGroups[group] ? 'chevronRight' : 'chevronDown'} size={14} /></button></h2>
      {!collapsedGroups[group] ? <>
        {canAddSections ? <ThemeGroupInsertion group={group} index={0} pickerTarget={pickerTarget} openPicker={openPicker} closePicker={closePicker} addSection={addThemeSection} canEditCode={canEditCode} templateContext={templateContext} blogPostPickerSamples={blogPostPickerSamples} pickerAnchorRef={pickerAnchorRef} /> : null}
        <SortableList
          className="shopify-editor-section-list"
          items={visibleItems}
          onReorder={(from, to) => {
            if (groupSearch) return;
            onReorderThemeSections?.(group, visibleItems[from]?.sourceIndex, visibleItems[to]?.sourceIndex);
          }}
          renderItem={(section, index, dragHandle) => {
            const sectionIndex = section.sourceIndex;
            const insertion = canAddSections ? <ThemeGroupInsertion group={group} index={sectionIndex + 1} isEnd={!groupSearch && sectionIndex === items.length - 1} pickerTarget={pickerTarget} openPicker={openPicker} closePicker={closePicker} addSection={addThemeSection} canEditCode={canEditCode} templateContext={templateContext} blogPostPickerSamples={blogPostPickerSamples} pickerAnchorRef={pickerAnchorRef} /> : null;
            if (section.isLegacy) return <div className="shopify-editor-section" key={section.id}>
              {renderLegacyItem(section, sectionIndex)}
              {insertion}
            </div>;

            const selected = selectedThemeGroup?.group === group && selectedThemeGroup?.id === section.id;
            const expandedKey = `theme-${group}-${section.id}`;
            const expanded = expandedSections[expandedKey] ?? selected;
            const groupOnSelectBlock = (sectionGroup, sectionId, blockId) => onSelectThemeSection?.(sectionGroup, sectionId, blockId);
            const addNestedBlock = (sectionId, parentId, type, insertionIndex) => onAddThemeNestedBlock?.(group, sectionId, parentId, type, insertionIndex);
            const moveNestedBlock = (sectionId, parentId, blockId, destinationIndex) => onMoveThemeNestedBlock?.(group, sectionId, parentId, blockId, destinationIndex);
            const duplicateNestedBlock = (sectionId, parentId, blockId) => onDuplicateThemeNestedBlock?.(group, sectionId, parentId, blockId);
            const toggleNestedBlock = (sectionId, blockId) => onToggleThemeNestedBlock?.(group, sectionId, blockId);
            const deleteNestedBlock = (sectionId, parentId, blockId) => onDeleteThemeNestedBlock?.(group, sectionId, parentId, blockId);
            return <ThemeGroupSectionRow
                key={section.id}
                section={section}
                group={group}
                index={sectionIndex}
                total={items.length}
                selected={selected}
                selectedBlockId={selectedSharedBlockId}
                expanded={expanded}
                setExpanded={setExpandedSections}
                dragHandle={dragHandle}
                insertion={insertion}
                disableReorder={Boolean(groupSearch)}
                onSelect={onSelectThemeSection}
                onSelectBlock={groupOnSelectBlock}
                onAddBlock={onAddThemeBlock}
                onAddNestedBlock={addNestedBlock}
                onMoveNestedBlock={moveNestedBlock}
                onDuplicateNestedBlock={duplicateNestedBlock}
                onToggleNestedBlock={toggleNestedBlock}
                onDeleteNestedBlock={deleteNestedBlock}
                onReorder={onReorderThemeSections}
                onDuplicate={onDuplicateThemeSection}
                onToggle={onToggleThemeSection}
                onDelete={onDeleteThemeSection}
                canEditCode={canEditCode}
              />
          }}
        />
        {groupSearch && visibleItems.length === 0 ? <p className="shopify-editor-empty">No sections match this search.</p> : null}
      </> : null}
    </section>;
  };

  return (
    <aside className={`shopify-editor-panel shopify-editor-panel--tree${templateContext === 'password' ? ' shopify-editor-panel--password' : ''}`} aria-label="Sections">
      <div className="shopify-editor-panel__modebar">
        <span className="shopify-editor-panel__mode-icon"><EditorIcon name="section" /></span>
        <strong>Sections</strong>
        <button type="button" className="shopify-icon-button" aria-label="Collapse sections panel" title="Collapse sections panel"><EditorIcon name="chevronRight" /></button>
      </div>
      <div className="shopify-editor-panel__scroll" ref={treeScrollRef}>
        <div className="shopify-editor-panel__page-heading">
          <span className="sr-only">Template</span>
          <strong>{templateLabel}</strong>
          <button type="button" className={`shopify-icon-button${isSearchVisible ? ' is-active' : ''}`} aria-label="Search sections" title="Search sections" aria-expanded={isSearchVisible} onClick={toggleSearch}><EditorIcon name="search" size={16} /></button>
          <button type="button" className="shopify-icon-button" aria-label="More template actions"><EditorIcon name="more" /></button>
        </div>
        {isSearchVisible ? <label className="shopify-editor-search"><span className="sr-only">Search sections</span><span className="shopify-editor-search__icon"><EditorIcon name="search" /></span><input autoFocus type="search" placeholder="Search sections" value={search} onChange={(event) => onSearch(event.target.value)} /></label> : null}

        {shouldHideSharedGroups ? null : renderThemeGroup('header', 'Header')}

        <section className="shopify-editor-group shopify-editor-group--template">
          <h2><span>Template</span><button type="button" aria-label={`${collapsedGroups.template ? 'Expand' : 'Collapse'} Template`} aria-expanded={!collapsedGroups.template} onClick={() => toggleGroup('template')}><EditorIcon name={collapsedGroups.template ? 'chevronRight' : 'chevronDown'} size={14} /></button></h2>
          {!collapsedGroups.template ? <>
          {canAddTemplateSection && templateContext !== 'password' ? <div className="shopify-editor-insertion">
            <button type="button" data-section-picker-index="0" onClick={(event) => openPicker(0, event)}><EditorIcon name="plus" size={14} />Add section</button>
            {isPickerOpen(0) ? <SectionPicker index={0} canEditCode={canEditCode} templateContext={templateContext} allowedSectionTypes={allowedSectionTypes} existingSections={sections} blogPostPickerSamples={blogPostPickerSamples} onAdd={addSection} onClose={closePicker} anchorRef={pickerAnchorRef} /> : null}
          </div> : null}
          <SortableList
            className="shopify-editor-section-list"
            items={filteredSections}
            onReorder={(from, to) => {
              if (search.trim()) return;
              if (sections[from]?.static || sections[to]?.static) return;
              onReorder(from, to);
            }}
            renderItem={(section, index, dragHandle) => {
              const config = BLOCK_TYPES[section.type];
              const isFixedSection = Boolean(section.static);
              const hideSectionMenu = isFixedSection || Boolean(allowedSectionTypes && config?.unique);
              const sectionCards = Array.isArray(section.cards) ? section.cards : [];
              const sectionBlocks = Array.isArray(section.blocks) ? section.blocks : [];
              const supportsBlocks = Boolean(config?.cards || config?.nestedBlocks || sectionBlocks.length || sectionCards.some((card) => card.blocks?.length));
              const expanded = expandedSections[section.id] ?? selectedId === section.id;
              const isSelectedSection = selectedId === section.id && !selectedCardId;
              const isParentOfSelectedBlock = selectedId === section.id && Boolean(selectedCardId);
              return <div className={`shopify-editor-section${isSelectedSection ? ' is-selected' : ''}${isParentOfSelectedBlock ? ' shopify-editor-section--parent-of-selected' : ''}${section.enabled === false ? ' is-hidden' : ''}`}>
                <div className="shopify-editor-section__row" data-tree-selected-row={selectedId === section.id && !selectedCardId ? '' : undefined}>
                  {supportsBlocks ? <button type="button" className="shopify-editor-section__expand" aria-label={`${expanded ? 'Collapse' : 'Expand'} blocks in ${section.displayName}`} aria-expanded={expanded} onClick={() => setExpandedSections((current) => ({ ...current, [section.id]: !current[section.id] }))}><EditorIcon name={expanded ? 'chevronDown' : 'chevronRight'} size={14} /></button> : <span className="shopify-editor-section__expand-space" />}
                  <button type="button" className="shopify-editor-section__select" onClick={() => {
                    if (config?.nestedBlocks) setExpandedSections((current) => ({ ...current, [section.id]: true }));
                    onSelect(section.id);
                  }} aria-current={selectedId === section.id ? 'true' : undefined}>
                    <span className="shopify-editor-section__icon"><EditorIcon name={sectionIconName(section.type)} size={16} /></span>
                    <strong>{section.displayName}</strong>
                  </button>
                  <span {...(isFixedSection ? {} : dragHandle)} className="shopify-editor-section__drag" aria-label={isFixedSection ? undefined : `Rearrange ${section.displayName}. Use the up and down arrow keys to move it.`} aria-disabled={isFixedSection || undefined}><EditorIcon name="drag" size={14} /></span>
                  <SectionRowQuickActions label={`${section.displayName} section`} enabled={section.enabled !== false} onToggle={() => onToggleEnabled(section.id)} onRemove={isFixedSection ? undefined : () => onDelete(section.id)} />
                  {!hideSectionMenu ? <details className="shopify-editor-section__menu">
                    <summary aria-label={`More actions for ${section.displayName}`}><EditorIcon name="more" size={15} /></summary>
                    <div className="shopify-editor-section__menu-items">
                      {!isFixedSection && !config?.unique ? <button type="button" onClick={() => duplicateSection(section.sourceIndex)}>Duplicate</button> : null}
                      <button type="button" aria-label={`Move ${section.displayName} up`} title={`Move ${section.displayName} up`} onClick={() => moveSection(section, -1)} disabled={Boolean(search.trim()) || isFixedSection || section.sourceIndex === 0 || Boolean(sections[section.sourceIndex - 1]?.static)}>Move up</button>
                      <button type="button" aria-label={`Move ${section.displayName} down`} title={`Move ${section.displayName} down`} onClick={() => moveSection(section, 1)} disabled={Boolean(search.trim()) || isFixedSection || section.sourceIndex === sections.length - 1 || Boolean(sections[section.sourceIndex + 1]?.static)}>Move down</button>
                    </div>
                  </details> : null}
                </div>
                {expanded && supportsBlocks ? <div className="shopify-editor-section__blocks">
                  {sectionCards.map((card, cardIndex) => {
                    const cardLabel = card.label || card.heading || `${config?.cards?.label || 'Block'} ${cardIndex + 1}`;
                    return <div className={`shopify-editor-nested-card${selectedCardId === card.id ? ' is-selected' : ''}`} key={card.id || `${section.id}-card-${cardIndex}`}>
                      <button type="button" className="shopify-editor-section__nested-block" style={{ paddingInlineStart: '8px' }} aria-current={selectedCardId === card.id ? 'true' : undefined} data-tree-selected-row={selectedCardId === card.id ? '' : undefined} onClick={() => onSelectCard(section.id, card.id)}><EditorIcon name="branch" size={13} /><span>{cardLabel}</span></button>
                      {card.blocks?.length ? <NestedBlockRows
                        blocks={card.blocks}
                        sectionId={section.id}
                        parentId={card.id}
                        parentDepth={0}
                        canAddChildren={false}
                        onSelectCard={onSelectCard}
                        onAddNestedBlock={onAddNestedBlock}
                        onMoveNestedBlock={onMoveNestedBlock}
                        onDuplicateNestedBlock={onDuplicateNestedBlock}
                        onToggleNestedBlock={onToggleNestedBlock}
                        onDeleteNestedBlock={onDeleteNestedBlock}
                        canEditCode={canEditCode}
                        selectedBlockId={selectedCardId}
                        depth={1}
                      /> : null}
                    {config?.cards && sectionCards.length < (config.cards.max || 12) && cardIndex < sectionCards.length - 1 ? <CardInsertion label={String(config.cards.label || 'block').toLocaleLowerCase()} afterLabel={cardLabel} onAdd={() => onAddBlock(section.id, cardIndex + 1)} /> : null}
                    </div>;
                  })}
                  {sectionBlocks.length || config?.nestedBlocks ? <NestedBlockRows
                    blocks={sectionBlocks}
                    sectionId={section.id}
                    parentDepth={0}
                    canAddChildren={Boolean(config?.nestedBlocks)}
                    allowedBlockTypes={config?.nestedBlockTypes || null}
                    onSelectCard={onSelectCard}
                    onAddNestedBlock={onAddNestedBlock}
                    onMoveNestedBlock={onMoveNestedBlock}
                    onDuplicateNestedBlock={onDuplicateNestedBlock}
                    onToggleNestedBlock={onToggleNestedBlock}
                    onDeleteNestedBlock={onDeleteNestedBlock}
                    canEditCode={canEditCode}
                    selectedBlockId={selectedCardId}
                    depth={0}
                  /> : null}
                  {config?.cards && sectionCards.length < (config.cards.max || 12) ? <button type="button" className="shopify-editor-section__add-block" onClick={() => onAddBlock(section.id)}><EditorIcon name="plus" size={14} />Add {String(config.cards.label || 'block').toLocaleLowerCase()}</button> : null}
                </div> : null}
                {canAddTemplateSection && (templateContext !== 'password' || section.type !== 'passwordFooter') ? <div className="shopify-editor-insertion shopify-editor-insertion--between">
                  <button type="button" data-section-picker-index={section.sourceIndex + 1} onClick={(event) => openPicker(section.sourceIndex + 1, event)}><EditorIcon name="plus" size={14} />Add section</button>
                  {isPickerOpen(section.sourceIndex + 1) ? <SectionPicker index={section.sourceIndex + 1} canEditCode={canEditCode} templateContext={templateContext} allowedSectionTypes={allowedSectionTypes} existingSections={sections} blogPostPickerSamples={blogPostPickerSamples} onAdd={addSection} onClose={closePicker} anchorRef={pickerAnchorRef} /> : null}
                </div> : null}
              </div>;
            }}
          />
          {!filteredSections.length && search.trim() ? <p className="shopify-editor-empty">No sections match this search.</p> : null}
          {search.trim() || !canAddTemplateSection || templateContext === 'password' ? null : <div className="shopify-editor-insertion shopify-editor-insertion--end">
            <button type="button" data-section-picker-index={sections.length} onClick={(event) => openPicker(sections.length, event)}><EditorIcon name="plus" size={14} />Add section</button>
            {isPickerOpen(sections.length) ? <SectionPicker index={sections.length} canEditCode={canEditCode} templateContext={templateContext} allowedSectionTypes={allowedSectionTypes} existingSections={sections} blogPostPickerSamples={blogPostPickerSamples} onAdd={addSection} onClose={closePicker} anchorRef={pickerAnchorRef} /> : null}
          </div>}
          </> : null}
        </section>

        {shouldHideSharedGroups ? null : renderThemeGroup('footer', 'Footer')}
        {children}
      </div>
    </aside>
  );
}
