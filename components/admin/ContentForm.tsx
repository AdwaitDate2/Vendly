// @ts-nocheck
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import BlockEditor, { BlockSettingsPanel } from './BlockEditor';
import ListEditor from './ListEditor';
import NavigationEditor from './NavigationEditor';
import PreviewPanel, { SHARED_HEADER_FOCUS_ID, SHARED_HEADER_LOGO_FOCUS_ID, SHARED_HEADER_MENU_FOCUS_ID } from './PreviewPanel';
import ResourceTemplateControls from './ResourceTemplateControls';
import SectionDesign from './SectionDesign';
import SharedSectionEditor from './SharedSectionEditor';
import ShopifyThemeSettingsPanel from './ShopifyThemeSettingsPanel';
import ShopifySectionTree from './ShopifySectionTree';
import SortableList, { moveItem } from './SortableList';
import { moveContentSectionAction, saveContentAction, saveSharedContentAction } from '@/lib/admin-actions';
import { CONTENT_GUIDES, EDITOR_HELP, FIELD_LABELS } from '@/lib/content-guides';
import { BLOCK_PAGES } from '@/lib/page-blocks';
import { BLOCK_TYPES, blockSummary, createBlock, normalizeFeaturedCollectionSection, normalizeHeroContentSection, createSectionCard, duplicateBlockTree } from '@/lib/blocks';
import { DEFAULT_THEME, isThemeValid, normalizeTheme, themesEqual } from '@/lib/theme';
import { saveThemeAction } from '@/lib/theme-actions';
import { HEADER_LOGO_BLOCK_ID, HEADER_MENU_BLOCK_ID, getHeaderBlock, getHeaderSection } from '@/lib/header-settings';
import { editorRecoveryKey, readEditorRecovery, recoveryHasStaleBaseline, removeEditorRecovery, writeEditorRecovery } from '@/lib/editor-session-recovery';

const POLICY_KEYS = ['privacy', 'terms', 'cookies', 'privacyChoices'];
const MULTILINE = new Set(['heading', 'body', 'note', 'items']);
const PUBLIC_ROUTES = { navigation: '/', home: '/', bridal: '/bridal', shop: '/shop', about: '/our-story', global: '/', clientCare: '/client-care', shipping: '/shipping-returns', returns: '/shipping-returns', faq: '/faq', care: '/repairs-care', sizeGuide: '/size-guide', materialsSourcing: '/craftsmanship', repairsWarranty: '/repairs-care', privacy: '/privacy', terms: '/terms', accessibility: '/accessibility', cookies: '/cookies', privacyChoices: '/privacy-choices', bespoke: '/custom', contact: '/book-appointment', appointments: '/book-appointment' };
const ROUTE_LABELS = { navigation: 'Header and footer on every page', home: 'Homepage', global: 'Every page (header, newsletter, footer)', contact: 'Enquiry forms on /custom and /book-appointment' };

const EMPTY_SECTION = { eyebrow: '', heading: '', body: '', note: '', items: [], linkLabel: '', linkHref: '', secondaryLinkLabel: '', secondaryLinkHref: '' };
const MAX_NESTED_BLOCK_DEPTH = 5;
const MAX_CHILD_BLOCKS = 24;

function prettyKey(key) {
  return String(key || '').replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase());
}

function pageChoiceValue(page) {
  return page.href || page.key;
}

function pageChoiceLabel(page) {
  return page.key === 'home' ? 'Home page' : page.label || page.title || page.key;
}

function EditorModeIcon({ mode }) {
  const paths = {
    sections: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 4v16M9 9h11" /></>,
    theme: <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="2" fill="white" /><circle cx="15" cy="17" r="2" fill="white" /></>,
    apps: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><path d="M16.5 13v7M13 16.5h7" /></>,
  };

  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[mode]}</svg>;
}

function BlockInspectorIcon() {
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4.5" width="16" height="15" rx="2" /><path d="M8 8.5h8M8 12h8M8 15.5h5" /></svg>;
}

function blockTreeContains(blocks, targetId) {
  return Array.isArray(blocks) && blocks.some((block) => block.id === targetId || blockTreeContains(block.blocks, targetId));
}

function sectionContainsNestedBlock(section, targetId) {
  return blockTreeContains(section.blocks, targetId)
    || (Array.isArray(section.cards) && section.cards.some((card) => blockTreeContains(card.blocks, targetId)));
}

function normalizeEditorSections(sections = []) {
  return sections.map((section) => normalizeHeroContentSection(normalizeFeaturedCollectionSection(section)));
}

function findNestedBlock(blocks, targetId, depth = 1) {
  for (const block of blocks || []) {
    if (block.id === targetId) return { block, depth };
    const nestedMatch = findNestedBlock(block.blocks, targetId, depth + 1);
    if (nestedMatch) return nestedMatch;
  }
  return null;
}

function findSectionNestedBlock(section, targetId) {
  return findNestedBlock(section.blocks, targetId)
    || (section.cards || []).reduce((match, card) => match || findNestedBlock(card.blocks, targetId), null);
}

function findNestedBlockLocation(blocks, targetId, parentId = null, depth = 1) {
  for (let index = 0; index < (blocks || []).length; index += 1) {
    const block = blocks[index];
    if (block.id === targetId) return { block, parentId, depth, index, siblings: blocks };
    const nestedMatch = findNestedBlockLocation(block.blocks, targetId, block.id, depth + 1);
    if (nestedMatch) return nestedMatch;
  }
  return null;
}

function findSectionNestedBlockLocation(section, targetId) {
  const sectionBlock = findNestedBlockLocation(section.blocks, targetId);
  if (sectionBlock) return sectionBlock;
  for (const card of section.cards || []) {
    const cardBlock = findNestedBlockLocation(card.blocks, targetId, card.id, 1);
    if (cardBlock) return cardBlock;
  }
  return null;
}

function duplicateNestedBlock(block) {
  return duplicateBlockTree(block);
}

function updateNestedBlocks(blocks, targetId, updater) {
  let found = false;
  const nextBlocks = (blocks || []).map((block) => {
    if (block.id === targetId) {
      found = true;
      return updater(block);
    }
    const childResult = updateNestedBlocks(block.blocks, targetId, updater);
    if (childResult.found) {
      found = true;
      return { ...block, blocks: childResult.blocks };
    }
    return block;
  });
  return { blocks: found ? nextBlocks : blocks, found };
}

function updateNestedBlockInSection(section, targetId, updater) {
  const sectionBlocks = updateNestedBlocks(section.blocks, targetId, updater);
  let cardFound = false;
  const cards = (section.cards || []).map((card) => {
    const childResult = updateNestedBlocks(card.blocks, targetId, updater);
    if (!childResult.found) return card;
    cardFound = true;
    return { ...card, blocks: childResult.blocks };
  });
  if (!sectionBlocks.found && !cardFound) return section;
  return {
    ...section,
    ...(sectionBlocks.found ? { blocks: sectionBlocks.blocks } : {}),
    ...(cardFound ? { cards } : {}),
  };
}

function updateNestedBlockContainerInBlocks(blocks, parentId, updater) {
  let found = false;
  const nextBlocks = (blocks || []).map((block) => {
    if (block.id === parentId) {
      found = true;
      return { ...block, blocks: updater(Array.isArray(block.blocks) ? block.blocks : []) };
    }
    const childResult = updateNestedBlockContainerInBlocks(block.blocks, parentId, updater);
    if (childResult.found) {
      found = true;
      return { ...block, blocks: childResult.blocks };
    }
    return block;
  });
  return { blocks: found ? nextBlocks : blocks, found };
}

function updateNestedBlockContainerInSection(section, parentId, updater) {
  if (!parentId) return { section: { ...section, blocks: updater(Array.isArray(section.blocks) ? section.blocks : []) }, found: true };

  let cardFound = false;
  const cards = (section.cards || []).map((card) => {
    if (card.id === parentId) {
      cardFound = true;
      return { ...card, blocks: updater(Array.isArray(card.blocks) ? card.blocks : []) };
    }
    const childResult = updateNestedBlockContainerInBlocks(card.blocks, parentId, updater);
    if (!childResult.found) return card;
    cardFound = true;
    return { ...card, blocks: childResult.blocks };
  });
  if (cardFound) return { section: { ...section, cards }, found: true };

  const sectionBlocks = updateNestedBlockContainerInBlocks(section.blocks, parentId, updater);
  if (sectionBlocks.found) return { section: { ...section, blocks: sectionBlocks.blocks }, found: true };
  return { section, found: false };
}

function sharedRecordSignature(record) {
  if (!record) return '';
  return JSON.stringify({ key: record.key, id: record.id, version: record.version, title: record.title, intro: record.intro, status: record.status, seoTitle: record.seoTitle, seoDescription: record.seoDescription, sections: record.sections, themeSectionGroups: record.themeSectionGroups });
}

function sharedThemeGroupSections(record, group) {
  const sections = record?.themeSectionGroups?.[group];
  return Array.isArray(sections) ? sections : [];
}

function withSharedThemeGroupSections(record, group, sections) {
  return {
    ...record,
    themeSectionGroups: {
      ...(record.themeSectionGroups || {}),
      schemaVersion: 1,
      [group]: sections,
    },
  };
}

function initialGuidedValues(guide, sections) {
  const saved = new Map((sections || []).map((item) => [item.id, item]));
  return Object.fromEntries(guide.map(({ id, values }) => [id, { design: { width: 'default', spacing: 'default', align: 'default', background: 'default', headingSize: 'default', ...(saved.get(id)?.design || {}) }, ...Object.fromEntries(Object.entries(values).map(([field, fallback]) => {
    const current = saved.get(id)?.[field];
    return [field, typeof current === 'string' && current.trim() ? current : fallback];
  })) }]));
}

function GuidedEditor({ guide, values, onChange, fullScreen, selectedId, onSelect }) {
  return guide.map(({ id, label, values: defaults, labels = {} }) => (
    <section className={`admin-card${selectedId === id ? ' is-selected' : ''}`} data-editor-section-id={id} key={id} onFocusCapture={() => onSelect?.(id)}>
      <div className="admin-card__heading"><div><h2>{label}</h2></div></div>
      {Object.keys(defaults).map((field) => {
        const text = values[id][field] || '';
        const set = (event) => onChange(id, field, event.target.value);
        return (
          <label className="admin-field" key={field}>
            <span>{labels[field] || FIELD_LABELS[field]}</span>
            {MULTILINE.has(field) ? <textarea rows={field === 'body' ? 4 : 2} value={text} onChange={set} /> : <input value={text} onChange={set} />}
          </label>
        );
      })}
      {fullScreen ? <SectionDesign design={values[id].design} onChange={(design) => onChange(id, 'design', design)} /> : null}
    </section>
  ));
}

/**
 * Page editor shell. Site entries use the defaults; custom pages pass their own save `action`,
 * `mode="blocks"`, a `previewKey`, a `publicRoute`, and `extraSettings` (URL, delete).
 */
export default function ContentForm({ content, action = saveContentAction, mode: modeOverride, previewKey, publicRoute, titleEditable = false, extraSettings = null, canEditCode = false, canManageTheme = false, initialTheme, fullScreen = false, exitHref, pageChoices = [], resourceTemplate = null, collectionOptions = [], productOptions = [], blogPostPickerSamples = [], sharedGlobalContent = null, sharedNavigationContent = null, canEditShared = false, adminIdentity = null }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, { message: '', errors: {} });
  const formRef = useRef(null);
  const key = content.key;
  const editorExitHref = exitHref || `/admin/content/${key}`;
  const guide = modeOverride ? null : CONTENT_GUIDES[key];
  const mode = modeOverride || (BLOCK_PAGES[key] ? 'blocks' : key === 'navigation' ? 'navigation' : guide ? 'guided' : 'list');
  const isShopifyEditor = fullScreen && mode === 'blocks';
  const isPolicy = POLICY_KEYS.includes(key);
  const hasPreview = key !== 'contact';

  const [title, setTitle] = useState(content.title || '');
  const [intro, setIntro] = useState(content.intro || '');
  const [items, setItems] = useState(() => (mode === 'guided' ? [] : normalizeEditorSections((content.sections || []).map((item) => (mode === 'list' ? { ...EMPTY_SECTION, ...item } : item)))));
  const [guided, setGuided] = useState(() => (guide ? initialGuidedValues(guide, content.sections) : null));
  const [guidedOrder, setGuidedOrder] = useState(() => guide?.map(({ id }) => id) || []);
  const [focusId, setFocusId] = useState(null);
  const [previewPickerIndex, setPreviewPickerIndex] = useState(null);
  const [sectionQuery, setSectionQuery] = useState('');
  const [workspaceView, setWorkspaceView] = useState('split');
  const [editorPaneWidth, setEditorPaneWidth] = useState(350);
  const [status, setStatus] = useState(content.status || 'draft');
  const [templateHasSavedDraft, setTemplateHasSavedDraft] = useState(Boolean(resourceTemplate?.hasUnsavedDraft));
  const resourceTitle = ['blog', 'blog-post'].includes(resourceTemplate?.resourceType)
    ? resourceTemplate.resources?.find((resource) => resource.handle === resourceTemplate.resourceHandle)?.label || ''
    : '';
  const [sectionActionMessage, setSectionActionMessage] = useState('');
  const [movingSection, setMovingSection] = useState(false);
  const [editorMode, setEditorMode] = useState('sections');
  const [mobileWorkspaceView, setMobileWorkspaceView] = useState('preview');
  const [focusedCardId, setFocusedCardId] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [previewInspectorEnabled, setPreviewInspectorEnabled] = useState(true);
  const [themeColors, setThemeColors] = useState(() => normalizeTheme(initialTheme || DEFAULT_THEME));
  const [savedThemeColors, setSavedThemeColors] = useState(() => normalizeTheme(initialTheme || DEFAULT_THEME));
  const [requestedThemeScheme, setRequestedThemeScheme] = useState(null);
  const themeSchemeRequestCounter = useRef(0);
  const [pageVersion, setPageVersion] = useState(Number(content.version) || 0);
  const [sharedGlobal, setSharedGlobal] = useState(sharedGlobalContent);
  const [sharedNavigation, setSharedNavigation] = useState(sharedNavigationContent);
  const [savedSharedGlobalSignature, setSavedSharedGlobalSignature] = useState(() => sharedRecordSignature(sharedGlobalContent));
  const [savedSharedNavigationSignature, setSavedSharedNavigationSignature] = useState(() => sharedRecordSignature(sharedNavigationContent));
  const [sharedSectionKey, setSharedSectionKey] = useState(null);
  const [selectedThemeGroup, setSelectedThemeGroup] = useState(null);
  const [sharedSelectedBlockId, setSharedSelectedBlockId] = useState(null);
  const [toolbarPending, setToolbarPending] = useState(false);
  const [shopifyActionResult, setShopifyActionResult] = useState(null);
  const [recordSaveStatuses, setRecordSaveStatuses] = useState({});
  const openThemeSettings = (schemeNumber = null) => {
    const numericSchemeNumber = Number(schemeNumber);
    if (numericSchemeNumber >= 1 && numericSchemeNumber <= 8) {
      themeSchemeRequestCounter.current += 1;
      setRequestedThemeScheme({ number: numericSchemeNumber, requestId: themeSchemeRequestCounter.current });
    } else {
      setRequestedThemeScheme(null);
    }
    setEditorMode('theme');
    setMobileWorkspaceView('theme');
  };
  const selectedNestedBlockId = focusedCardId && items.some((section) => sectionContainsNestedBlock(section, focusedCardId))
    ? focusedCardId
    : null;
  const sharedHeaderPreviewFocusId = sharedSelectedBlockId === HEADER_LOGO_BLOCK_ID
    ? SHARED_HEADER_LOGO_FOCUS_ID
    : sharedSelectedBlockId === HEADER_MENU_BLOCK_ID
      ? SHARED_HEADER_MENU_FOCUS_ID
      : SHARED_HEADER_FOCUS_ID;
  const previewFocusId = isShopifyEditor && editorMode === 'sections' && selectedThemeGroup
    ? sharedSelectedBlockId || selectedThemeGroup.id
    : isShopifyEditor && editorMode === 'sections' && sharedSectionKey === 'header'
      ? sharedHeaderPreviewFocusId
      : selectedNestedBlockId || focusId;

  const orderedGuide = useMemo(() => guidedOrder.map((id) => guide?.find((section) => section.id === id)).filter(Boolean), [guide, guidedOrder]);
  const sections = useMemo(() => (mode === 'guided' ? orderedGuide.map(({ id }) => ({ id, ...guided[id] })) : items), [mode, orderedGuide, guided, items]);
  const outlineItems = useMemo(() => (mode === 'guided'
    ? orderedGuide.map(({ id, label }, sourceIndex) => ({ id, outlineLabel: label, summary: guided[id]?.heading, sourceIndex }))
    : items.map((item, sourceIndex) => ({
      ...item,
      outlineLabel: item.label || item.heading || BLOCK_TYPES[item.type]?.label || item.eyebrow || 'Page section',
      summary: item.summary || blockSummary(item) || item.heading || item.eyebrow || '',
      sourceIndex,
    }))), [mode, orderedGuide, guided, items]);
  const filteredOutlineItems = useMemo(() => {
    const query = sectionQuery.trim().toLocaleLowerCase();
    return query ? outlineItems.filter((item) => `${item.outlineLabel} ${item.summary || ''}`.toLocaleLowerCase().includes(query)) : outlineItems;
  }, [outlineItems, sectionQuery]);
  const payload = useMemo(() => ({ title, intro, sections }), [title, intro, sections]);
  const sharedPreviewPayload = useMemo(() => ({
    globalSections: sharedGlobal?.sections || [],
    navigationSections: sharedNavigation?.sections || [],
    themeSectionGroups: sharedNavigation?.themeSectionGroups || null,
  }), [sharedGlobal, sharedNavigation]);
  const sharedHeaderSection = getHeaderSection(sharedNavigation?.sections || []);
  const sharedHeaderMenuId = getHeaderBlock(sharedHeaderSection, HEADER_MENU_BLOCK_ID).settings.menuId;
  const sharedHeaderMenuLabel = sharedNavigation?.sections?.find((section) => section.type === 'menu' && section.id === sharedHeaderMenuId)?.heading || 'Main menu';
  const moveTargets = useMemo(() => pageChoices.filter((page) => page.key !== key && (
    mode === 'blocks' ? Boolean(BLOCK_PAGES[page.key])
      : mode === 'list' && key === 'faq' ? page.key === 'faq'
        : mode === 'list' ? ['clientCare', 'sizeGuide'].includes(page.key)
          : false
  )), [key, mode, pageChoices]);
  const selectedPageChoice = pageChoices.find((page) => page.href === `/admin/editor/${key}` || page.key === key);
  const selectedPageChoiceValue = selectedPageChoice ? pageChoiceValue(selectedPageChoice) : key;
  const pageDestinationItems = useMemo(() => [
    ...pageChoices.map((page) => ({
      id: pageChoiceValue(page),
      title: pageChoiceLabel(page),
      group: page.key === 'home' ? 'Home' : page.group || 'Pages',
      subtitle: page.key === 'home' ? 'Homepage template' : page.group || 'Page template',
      href: page.href || (page.key ? `/admin/editor/${page.key}` : undefined),
      supported: Boolean(page.href || page.key),
    })),
    { id: 'gift-card-default', title: 'Gift card', group: 'Gift cards', subtitle: 'Sample gift card preview', href: '/admin/editor/templates/gift-card/default', supported: true },
    { id: 'checkout-settings', title: 'Checkout and customer accounts', group: 'Checkout and customer accounts', subtitle: 'Manage in Settings', href: '/admin/settings', supported: true },
    { id: 'metaobject-create', title: 'Create metaobject template', group: 'Metaobjects', subtitle: 'Metaobject templates are not supported yet', supported: false },
  ], [pageChoices]);
  const activeTemplateDestinations = resourceTemplate?.templateDestinations || pageDestinationItems;
  const activeDestinationId = resourceTemplate
    ? `${resourceTemplate.resourceType}-${resourceTemplate.templateKey}`
    : selectedPageChoiceValue;
  const activeDestinationName = resourceTemplate?.templates?.find((template) => template.key === resourceTemplate.templateKey)?.name
    || pageChoiceLabel(selectedPageChoice || { title: key === 'home' ? 'Home page' : content.title || prettyKey(key) });
  const current = JSON.stringify({ ...payload, status });
  const historySnapshot = JSON.stringify({
    page: { ...payload, status },
    sharedGlobal,
    sharedNavigation,
    themeColors,
  });

  const [history, setHistory] = useState({ past: [], future: [] });
  const currentRef = useRef(historySnapshot);
  const lastHistorySnapshot = useRef(historySnapshot);
  const historyTimer = useRef(null);
  const historyBatchActive = useRef(false);
  const restoringHistory = useRef(false);
  useLayoutEffect(() => { currentRef.current = historySnapshot; }, [historySnapshot]);

  useLayoutEffect(() => {
    if (restoringHistory.current) {
      restoringHistory.current = false;
      historyBatchActive.current = false;
      historyTimer.current = null;
      lastHistorySnapshot.current = historySnapshot;
      return undefined;
    }
    if (historySnapshot === lastHistorySnapshot.current) return undefined;
    const previousSnapshot = lastHistorySnapshot.current;
    if (!historyBatchActive.current) {
      historyBatchActive.current = true;
      setHistory((previous) => ({ past: [...previous.past, previousSnapshot].slice(-40), future: [] }));
    }
    clearTimeout(historyTimer.current);
    historyTimer.current = setTimeout(() => {
      lastHistorySnapshot.current = currentRef.current;
      historyBatchActive.current = false;
      historyTimer.current = null;
    }, 450);
    return () => clearTimeout(historyTimer.current);
  }, [historySnapshot]);

  useEffect(() => {
    if (!fullScreen || mode === 'blocks' || mode === 'navigation' || !focusId) return;
    document.querySelector(`[data-editor-section-id="${CSS.escape(focusId)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [focusId, fullScreen, mode]);

  const restoreSnapshot = (snapshot) => {
    const restored = JSON.parse(snapshot);
    clearTimeout(historyTimer.current);
    historyBatchActive.current = false;
    restoringHistory.current = true;
    const restoredPage = restored.page || (!Object.hasOwn(restored, 'sharedGlobal') && !Object.hasOwn(restored, 'sharedNavigation') && !Object.hasOwn(restored, 'themeColors') ? restored : null);
    if (restoredPage) {
      setTitle(restoredPage.title || '');
      setIntro(restoredPage.intro || '');
      setItems(normalizeEditorSections(restoredPage.sections || []));
      if (guide) {
        setGuided(initialGuidedValues(guide, restoredPage.sections || []));
        const restoredIds = (restoredPage.sections || []).map(({ id }) => id).filter((id) => guide.some((section) => section.id === id));
        setGuidedOrder([...restoredIds, ...guide.map(({ id }) => id).filter((id) => !restoredIds.includes(id))]);
      }
      setStatus(restoredPage.status || 'draft');
    }
    if (Object.hasOwn(restored, 'sharedGlobal')) setSharedGlobal(restored.sharedGlobal);
    if (Object.hasOwn(restored, 'sharedNavigation')) setSharedNavigation(restored.sharedNavigation);
    if (Object.hasOwn(restored, 'themeColors')) setThemeColors(restored.themeColors);
  };

  const undo = () => {
    if (!history.past.length) return;
    clearTimeout(historyTimer.current);
    historyBatchActive.current = false;
    const previousSnapshot = history.past.at(-1);
    setHistory((previous) => ({ past: previous.past.slice(0, -1), future: [historySnapshot, ...previous.future].slice(0, 40) }));
    restoreSnapshot(previousSnapshot);
  };

  const redo = () => {
    if (!history.future.length) return;
    clearTimeout(historyTimer.current);
    historyBatchActive.current = false;
    const nextSnapshot = history.future[0];
    setHistory((previous) => ({ past: [...previous.past, historySnapshot].slice(-40), future: previous.future.slice(1) }));
    restoreSnapshot(nextSnapshot);
  };

  const reorderOutline = (from, to) => {
    if (mode === 'guided') setGuidedOrder((currentOrder) => moveItem(currentOrder, from, to));
    else setItems((currentItems) => moveItem(currentItems, from, to));
  };

  const handlePreviewSectionAction = ({ id, action: sectionAction, value, targetKey }) => {
    if (mode === 'guided') return;
    const sectionIndex = items.findIndex((section) => section.id === id);
    if (sectionIndex < 0) return;
    if (sectionAction === 'move-up' || sectionAction === 'move-down') {
      const targetIndex = sectionIndex + (sectionAction === 'move-up' ? -1 : 1);
      setItems((currentItems) => moveItem(currentItems, sectionIndex, targetIndex));
      return;
    }
    if (sectionAction === 'layout') {
      setItems((currentItems) => currentItems.map((section) => section.id === id ? { ...section, layout: value } : section));
      return;
    }
    if (sectionAction === 'hide') {
      setItems((currentItems) => currentItems.map((section) => section.id === id ? { ...section, enabled: false } : section));
      setFocusId(null);
      return;
    }
    if (sectionAction === 'move-to-page') {
      const target = moveTargets.find((page) => page.key === targetKey);
      if (!target || movingSection) return;
      if (!window.confirm(`Move this section to ${target.title}? Both pages will be saved as drafts; the live site will not change.`)) return;
      setMovingSection(true);
      setSectionActionMessage('Moving section to a draft…');
      moveContentSectionAction({
        sourceKey: key,
        targetKey: target.key,
        sectionId: id,
        sourceDraft: {
          key,
          id: content.id,
          version: content.version || 0,
          title,
          intro,
          seoTitle: content.seoTitle || '',
          seoDescription: content.seoDescription || '',
          status: 'draft',
          sections,
        },
      }).then((result) => {
        if (result.targetKey) router.push(`/admin/editor/${result.targetKey}`);
        else setSectionActionMessage(result.message || 'Could not move the section.');
      }).catch(() => setSectionActionMessage('Could not move this section. Reload and try again.')).finally(() => setMovingSection(false));
      return;
    }
    if (sectionAction === 'delete') {
      setItems((currentItems) => currentItems.filter((section) => section.id !== id));
      setFocusId(null);
      return;
    }
    if (sectionAction === 'duplicate') {
      const original = items[sectionIndex];
      const duplicate = duplicateBlockTree(original);
      const nextItems = [...items];
      nextItems.splice(sectionIndex + 1, 0, duplicate);
      setItems(nextItems);
      setFocusId(duplicate.id);
    }
  };

  const addSectionAt = (index, section) => setItems((currentItems) => {
    const nextItems = [...currentItems];
    nextItems.splice(index, 0, section);
    return nextItems;
  });
  const duplicateSection = (id) => {
    const sectionIndex = items.findIndex((section) => section.id === id);
    if (sectionIndex < 0) return;
    const original = items[sectionIndex];
    const duplicate = duplicateBlockTree(original);
    addSectionAt(sectionIndex + 1, duplicate);
    setFocusId(duplicate.id);
  };
  const removeSection = (id) => {
    setItems((currentItems) => currentItems.filter((section) => section.id !== id));
    setFocusId((currentId) => currentId === id ? null : currentId);
  };
  const toggleSectionVisibility = (id) => setItems((currentItems) => currentItems.map((section) => section.id === id ? { ...section, enabled: section.enabled === false } : section));
  const selectSection = (id) => { setSharedSectionKey(null); setSelectedThemeGroup(null); setSharedSelectedBlockId(null); setFocusId(id); setFocusedCardId(null); };
  const selectSectionCard = (sectionId, cardId) => { setSharedSectionKey(null); setSelectedThemeGroup(null); setSharedSelectedBlockId(null); setFocusId(sectionId); setFocusedCardId(cardId); };
  const displayState = isShopifyEditor && shopifyActionResult ? shopifyActionResult : state;
  const selectPreviewSection = (id) => {
    if ([SHARED_HEADER_FOCUS_ID, SHARED_HEADER_LOGO_FOCUS_ID, SHARED_HEADER_MENU_FOCUS_ID].includes(id)) {
      const headerBlockId = id === SHARED_HEADER_LOGO_FOCUS_ID
        ? HEADER_LOGO_BLOCK_ID
        : id === SHARED_HEADER_MENU_FOCUS_ID ? HEADER_MENU_BLOCK_ID : null;
      selectSharedSection('header', headerBlockId);
      return;
    }
    const parentSection = items.find((section) => section.id === id || sectionContainsNestedBlock(section, id));
    const themeGroupMatch = ['header', 'footer'].map((group) => ({
      group,
      section: sharedThemeGroupSections(sharedNavigation, group).find((section) => section.id === id
        || sectionContainsNestedBlock(section, id)
        || section.cards?.some((card) => card.id === id)),
    })).find((match) => match.section);
    if (themeGroupMatch) {
      if (themeGroupMatch.section.type === 'legacyReference') {
        const legacyIdentifier = {
          'global.announcement': 'announcement-bar',
          'navigation.header-settings': 'header',
          'global.newsletter': 'newsletter',
          'global.footer': 'footer',
        }[themeGroupMatch.section.source];
        if (legacyIdentifier) {
          selectSharedSection(legacyIdentifier);
          return;
        }
      }
      setSharedSectionKey(null);
      setSelectedThemeGroup({ group: themeGroupMatch.group, id: themeGroupMatch.section.id });
      setSharedSelectedBlockId(themeGroupMatch.section.id === id ? null : id);
      setFocusId(null);
      setFocusedCardId(null);
      setEditorMode('sections');
      setMobileWorkspaceView('sections');
      return;
    }
    setSharedSectionKey(null);
    setSelectedThemeGroup(null);
    setSharedSelectedBlockId(null);
    setFocusId(parentSection?.id || id);
    setFocusedCardId(parentSection && parentSection.id !== id ? id : null);
    setEditorMode('sections');
    setMobileWorkspaceView('sections');
  };
  const addBlockToSection = (sectionId, insertionIndex = null) => {
    const section = items.find((item) => item.id === sectionId);
    const card = section ? createSectionCard(section) : null;
    const existingCards = Array.isArray(section?.cards) ? section.cards : [];
    if (!card || existingCards.length >= (BLOCK_TYPES[section.type]?.cards?.max || 12)) return;
    setItems((currentItems) => currentItems.map((item) => {
      if (item.id !== sectionId) return item;
      const cards = [...(item.cards || [])];
      cards.splice(insertionIndex == null ? cards.length : Math.max(0, Math.min(cards.length, insertionIndex)), 0, card);
      return { ...item, cards };
    }));
    setFocusId(sectionId);
    setFocusedCardId(card.id);
  };
  const addNestedBlockToSection = (sectionId, parentId, type, insertionIndex = null) => {
    const definition = BLOCK_TYPES[type];
    const section = items.find((item) => item.id === sectionId);
    if (!section || !definition || (definition.ownerOnly && !canEditCode)) return;

    const parentCard = parentId ? section.cards?.find((card) => card.id === parentId) : null;
    const parentBlock = parentId ? findSectionNestedBlock(section, parentId) : null;
    const parentType = parentCard?.type || parentBlock?.block.type || section.type;
    const allowedTypes = BLOCK_TYPES[parentType]?.nestedBlockTypes;
    if (allowedTypes && !allowedTypes.includes(type)) return;
    const currentDepth = parentBlock?.depth || 0;
    const childBlocks = parentId
      ? parentCard?.blocks || parentBlock?.block.blocks || []
      : section.blocks || [];
    if ((parentId && !parentCard && !parentBlock) || currentDepth >= MAX_NESTED_BLOCK_DEPTH || childBlocks.length >= MAX_CHILD_BLOCKS) return;

    const newBlock = createBlock(type);
    setItems((currentItems) => currentItems.map((item) => {
      if (item.id !== sectionId) return item;
      return updateNestedBlockContainerInSection(item, parentId, (blocks) => {
        const nextBlocks = [...blocks];
        nextBlocks.splice(insertionIndex == null ? nextBlocks.length : Math.max(0, Math.min(nextBlocks.length, insertionIndex)), 0, newBlock);
        return nextBlocks;
      }).section;
    }));
    setSharedSectionKey(null);
    setSharedSelectedBlockId(null);
    setFocusId(sectionId);
    setFocusedCardId(newBlock.id);
  };
  const moveNestedBlock = (sectionId, parentId, blockId, destinationIndex) => {
    setItems((currentItems) => currentItems.map((item) => {
      if (item.id !== sectionId) return item;
      return updateNestedBlockContainerInSection(item, parentId, (blocks) => {
        const sourceIndex = blocks.findIndex((block) => block.id === blockId);
        return sourceIndex < 0 ? blocks : moveItem(blocks, sourceIndex, destinationIndex);
      }).section;
    }));
  };
  const duplicateNestedBlockInSection = (sectionId, parentId, blockId) => {
    const section = items.find((item) => item.id === sectionId);
    const selectedBlock = section && findSectionNestedBlock(section, blockId)?.block;
    if (!selectedBlock) return;
    const parentCard = parentId ? section.cards?.find((card) => card.id === parentId) : null;
    const parentBlock = parentId ? findSectionNestedBlock(section, parentId)?.block : null;
    const siblings = parentId ? parentCard?.blocks || parentBlock?.blocks || [] : section.blocks || [];
    if (siblings.length >= MAX_CHILD_BLOCKS) return;
    const copy = duplicateNestedBlock(selectedBlock);
    setItems((currentItems) => currentItems.map((item) => {
      if (item.id !== sectionId) return item;
      return updateNestedBlockContainerInSection(item, parentId, (blocks) => {
        const sourceIndex = blocks.findIndex((block) => block.id === blockId);
        if (sourceIndex < 0 || blocks.length >= MAX_CHILD_BLOCKS) return blocks;
        const nextBlocks = [...blocks];
        nextBlocks.splice(sourceIndex + 1, 0, copy);
        return nextBlocks;
      }).section;
    }));
    setSharedSectionKey(null);
    setSharedSelectedBlockId(null);
    setFocusId(sectionId);
    setFocusedCardId(copy.id);
  };
  const toggleNestedBlockVisibility = (sectionId, blockId) => setItems((currentItems) => currentItems.map((item) => item.id === sectionId
    ? updateNestedBlockInSection(item, blockId, (block) => ({ ...block, enabled: block.enabled === false }))
    : item));
  const removeNestedBlock = (sectionId, parentId, blockId) => {
    const section = items.find((item) => item.id === sectionId);
    const selectedBlock = section && findSectionNestedBlock(section, blockId)?.block;
    if (!selectedBlock) return;
    setItems((currentItems) => currentItems.map((item) => {
      if (item.id !== sectionId) return item;
      return updateNestedBlockContainerInSection(item, parentId, (blocks) => blocks.filter((block) => block.id !== blockId)).section;
    }));
    setFocusId(sectionId);
    setFocusedCardId(parentId || null);
  };
  const selectedSection = items.find((section) => section.id === focusId);
  const selectedNestedBlockLocation = selectedSection && focusedCardId
    ? findSectionNestedBlockLocation(selectedSection, focusedCardId)
    : null;
  const selectedNestedBlock = selectedNestedBlockLocation?.block || null;
  const selectedSectionIndex = selectedSection ? items.findIndex((section) => section.id === selectedSection.id) : -1;
  const selectedThemeSection = selectedThemeGroup
    ? sharedThemeGroupSections(sharedNavigation, selectedThemeGroup.group).find((section) => section.id === selectedThemeGroup.id)
    : null;
  const selectedThemeNestedBlockLocation = selectedThemeSection && sharedSelectedBlockId
    ? findSectionNestedBlockLocation(selectedThemeSection, sharedSelectedBlockId)
    : null;
  const selectedThemeNestedBlock = selectedThemeNestedBlockLocation?.block || null;
  const selectedThemeCard = selectedThemeSection && sharedSelectedBlockId && !selectedThemeNestedBlock
    ? (selectedThemeSection.cards || []).find((card) => card.id === sharedSelectedBlockId) || null
    : null;
  const returnToSections = () => {
    setFocusId(null);
    setSharedSectionKey(null);
    setSelectedThemeGroup(null);
    setSharedSelectedBlockId(null);
    requestAnimationFrame(() => document.querySelector('.shopify-editor-panel--tree .shopify-editor-panel__scroll')?.scrollTo({ top: 0 }));
  };
  const inspectorBlock = selectedNestedBlock || selectedSection;
  const inspectorTypeLabel = selectedNestedBlock
    ? BLOCK_TYPES[selectedNestedBlock.type]?.label || selectedNestedBlock.label || 'Block'
    : selectedSection && ['heroVideo', 'heroImage'].includes(selectedSection.type)
      ? 'Hero'
      : BLOCK_TYPES[inspectorBlock?.type]?.label || inspectorBlock?.label || 'Section';
  const sectionInspector = selectedSection ? <aside className="shopify-editor-panel shopify-editor-panel--inspector" aria-label={`${inspectorTypeLabel} ${selectedNestedBlock ? 'block' : 'section'} settings`}>
    <div className="shopify-editor-panel__modebar">
      {selectedNestedBlock ? <>
        <button type="button" className="shopify-icon-button shopify-editor-inspector__block-close" onClick={returnToSections} aria-label="Back to sections" title="Back to sections">‹</button>
        <span className="shopify-editor-inspector__block-icon"><BlockInspectorIcon /></span>
        <div className="shopify-editor-inspector__title"><strong>{inspectorTypeLabel}</strong></div>
        <details className="shopify-editor-inspector__block-actions">
          <summary aria-label="More block actions" title="More block actions">⋯</summary>
          <div className="shopify-editor-section__menu-items">
            <button type="button" disabled={selectedNestedBlockLocation.index === 0} onClick={() => moveNestedBlock(selectedSection.id, selectedNestedBlockLocation.parentId, selectedNestedBlock.id, selectedNestedBlockLocation.index - 1)}>Move up</button>
            <button type="button" disabled={selectedNestedBlockLocation.index === selectedNestedBlockLocation.siblings.length - 1} onClick={() => moveNestedBlock(selectedSection.id, selectedNestedBlockLocation.parentId, selectedNestedBlock.id, selectedNestedBlockLocation.index + 1)}>Move down</button>
            <button type="button" onClick={() => duplicateNestedBlockInSection(selectedSection.id, selectedNestedBlockLocation.parentId, selectedNestedBlock.id)}>Duplicate</button>
            <button type="button" onClick={() => toggleNestedBlockVisibility(selectedSection.id, selectedNestedBlock.id)}>{selectedNestedBlock.enabled === false ? 'Show' : 'Hide'}</button>
            <button type="button" className="is-danger" onClick={() => removeNestedBlock(selectedSection.id, selectedNestedBlockLocation.parentId, selectedNestedBlock.id)}>Remove</button>
          </div>
        </details>
      </> : <>
        <button type="button" className="shopify-icon-button shopify-editor-inspector__block-close" onClick={returnToSections} aria-label="Back to sections" title="Back to sections">‹</button>
        <div className="shopify-editor-inspector__title"><strong>{inspectorTypeLabel}</strong></div>
        <details className="shopify-editor-inspector__block-actions">
          <summary aria-label="More section actions" title="More section actions">⋯</summary>
          <div className="shopify-editor-section__menu-items shopify-editor-inspector__section-menu">
            {selectedSection.type !== 'blogPosts' && selectedSection.type !== 'passwordFooter' ? <label className="shopify-editor-inspector__section-name"><span>Section name</span><input value={selectedSection.label || ''} placeholder="Section name" onChange={(event) => setItems((currentItems) => currentItems.map((section) => section.id === selectedSection.id ? { ...section, label: event.target.value } : section))} /></label> : null}
            {!selectedSection.static && !BLOCK_TYPES[selectedSection.type]?.unique ? <button type="button" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); duplicateSection(selectedSection.id); }}>Duplicate</button> : null}
            <button type="button" disabled={selectedSectionIndex <= 0 || selectedSection.static} onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); setItems((currentItems) => moveItem(currentItems, selectedSectionIndex, selectedSectionIndex - 1)); }}>Move up</button>
            <button type="button" disabled={selectedSectionIndex < 0 || selectedSectionIndex >= items.length - 1 || selectedSection.static} onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); setItems((currentItems) => moveItem(currentItems, selectedSectionIndex, selectedSectionIndex + 1)); }}>Move down</button>
            <button type="button" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); toggleSectionVisibility(selectedSection.id); }}>{selectedSection.enabled === false ? 'Show' : 'Hide'}</button>
            {!selectedSection.static ? <button type="button" className="is-danger" onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); removeSection(selectedSection.id); }}>Remove</button> : null}
          </div>
        </details>
      </>}
    </div>
    <div className="shopify-editor-panel__scroll shopify-editor-inspector__scroll">
      {displayState.sectionIssue?.sectionId === selectedSection.id ? <div className="admin-editor-validation" role="alert"><p>{displayState.sectionIssue.message}</p></div> : null}
      <BlockSettingsPanel
        block={inspectorBlock}
        canEditCode={canEditCode}
        themeColors={themeColors}
        collectionOptions={collectionOptions}
        productOptions={productOptions}
        resourceTitle={resourceTitle}
        resourceType={resourceTemplate?.resourceType || ''}
        onOpenThemeSettings={(schemeNumber) => {
          setFocusId(null);
          openThemeSettings(schemeNumber);
        }}
        selectedCardId={focusedCardId}
        showNestedBlocks={!isShopifyEditor}
        onChange={(updated) => setItems((currentItems) => currentItems.map((section) => {
          if (section.id !== selectedSection.id) return section;
          return selectedNestedBlock
            ? updateNestedBlockInSection(section, selectedNestedBlock.id, () => updated)
            : updated;
        }))}
      />
    </div>
  </aside> : null;

  const selectedThemeInspectorBlock = selectedThemeNestedBlock || selectedThemeCard || selectedThemeSection;
  const selectedThemeInspectorLabel = BLOCK_TYPES[selectedThemeInspectorBlock?.type]?.label || selectedThemeInspectorBlock?.label || 'Section';
  const themeSectionInspector = selectedThemeSection && canEditShared ? <aside className="shopify-editor-panel shopify-editor-panel--inspector" aria-label={`${selectedThemeInspectorLabel} ${selectedThemeNestedBlock ? 'block' : 'section'} settings`}>
    <div className="shopify-editor-panel__modebar">
      {selectedThemeNestedBlock ? <>
        <span className="shopify-editor-inspector__block-icon"><BlockInspectorIcon /></span>
        <div className="shopify-editor-inspector__title"><strong>{selectedThemeInspectorLabel}</strong></div>
        <details className="shopify-editor-inspector__block-actions">
          <summary aria-label="More block actions" title="More block actions">⋯</summary>
          <div className="shopify-editor-section__menu-items">
            <button type="button" disabled={selectedThemeNestedBlockLocation.index === 0} onClick={() => moveThemeNestedBlock(selectedThemeGroup.group, selectedThemeSection.id, selectedThemeNestedBlockLocation.parentId, selectedThemeNestedBlock.id, selectedThemeNestedBlockLocation.index - 1)}>Move up</button>
            <button type="button" disabled={selectedThemeNestedBlockLocation.index === selectedThemeNestedBlockLocation.siblings.length - 1} onClick={() => moveThemeNestedBlock(selectedThemeGroup.group, selectedThemeSection.id, selectedThemeNestedBlockLocation.parentId, selectedThemeNestedBlock.id, selectedThemeNestedBlockLocation.index + 1)}>Move down</button>
            <button type="button" onClick={() => duplicateThemeNestedBlock(selectedThemeGroup.group, selectedThemeSection.id, selectedThemeNestedBlockLocation.parentId, selectedThemeNestedBlock.id)}>Duplicate</button>
            <button type="button" onClick={() => toggleThemeNestedBlock(selectedThemeGroup.group, selectedThemeSection.id, selectedThemeNestedBlock.id)}>{selectedThemeNestedBlock.enabled === false ? 'Show' : 'Hide'}</button>
            <button type="button" className="is-danger" onClick={() => deleteThemeNestedBlock(selectedThemeGroup.group, selectedThemeSection.id, selectedThemeNestedBlockLocation.parentId, selectedThemeNestedBlock.id)}>Remove</button>
          </div>
        </details>
        <button type="button" className="shopify-icon-button shopify-editor-inspector__block-close" onClick={returnToSections} aria-label="Close block settings" title="Close block settings">×</button>
      </> : <>
        <button type="button" className="shopify-icon-button" onClick={returnToSections} aria-label="Back to sections">‹</button>
        <div className="shopify-editor-inspector__title"><strong>{selectedThemeInspectorLabel}</strong><small>{selectedThemeCard ? 'Block' : 'Section'}</small></div>
      </>}
    </div>
    <div className="shopify-editor-panel__scroll shopify-editor-inspector__scroll">
      {!selectedThemeNestedBlock && !selectedThemeCard ? <label className="shopify-editor-inspector__label"><span>Section name</span><input value={selectedThemeSection.label || ''} placeholder="Section name" onChange={(event) => updateThemeSection(selectedThemeGroup.group, selectedThemeSection.id, (section) => ({ ...section, label: event.target.value }))} /></label> : null}
      <BlockSettingsPanel
        block={selectedThemeInspectorBlock}
        canEditCode={canEditCode}
        themeColors={themeColors}
        collectionOptions={collectionOptions}
        productOptions={productOptions}
        resourceTitle={resourceTitle}
        resourceType={resourceTemplate?.resourceType || ''}
        onOpenThemeSettings={(schemeNumber) => {
          setSelectedThemeGroup(null);
          openThemeSettings(schemeNumber);
        }}
        selectedCardId={sharedSelectedBlockId}
        showNestedBlocks={!isShopifyEditor}
        onChange={(updated) => updateThemeSection(selectedThemeGroup.group, selectedThemeSection.id, (section) => {
          if (selectedThemeNestedBlock) return updateNestedBlockInSection(section, selectedThemeNestedBlock.id, () => updated);
          if (selectedThemeCard) return { ...section, cards: (section.cards || []).map((card) => card.id === selectedThemeCard.id ? updated : card) };
          return updated;
        })}
      />
    </div>
  </aside> : null;

  const [savedSnapshot, setSavedSnapshot] = useState(current);
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    if (state.saved) {
      setSavedSnapshot(current);
      if (resourceTemplate) setTemplateHasSavedDraft(!state.published);
    }
  }
  const dirty = current !== savedSnapshot;
  const themeDirty = isShopifyEditor && !themesEqual(themeColors, savedThemeColors);
  const sharedGlobalDirty = sharedRecordSignature(sharedGlobal) !== savedSharedGlobalSignature;
  const sharedNavigationDirty = sharedRecordSignature(sharedNavigation) !== savedSharedNavigationSignature;
  const sharedDirty = sharedGlobalDirty || sharedNavigationDirty;
  const hasUnsavedEditorChanges = dirty || themeDirty || sharedDirty;
  const recoveryTarget = resourceTemplate
    ? `resource:${resourceTemplate.resourceType}:${resourceTemplate.templateKey}:${resourceTemplate.resourceHandle || ''}`
    : `page:${key}`;
  const recoveryKey = isShopifyEditor ? editorRecoveryKey(adminIdentity, recoveryTarget) : null;
  const [recoveryRecord, setRecoveryRecord] = useState(null);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [recoveryDismissed, setRecoveryDismissed] = useState(false);
  const [recoveryStorageUnavailable, setRecoveryStorageUnavailable] = useState(false);
  const recoveryCurrentBaseline = {
    pageVersion: Number(content.version) || 0,
    globalVersion: sharedGlobalContent?.version ?? null,
    navigationVersion: sharedNavigationContent?.version ?? null,
    themeSignature: JSON.stringify(normalizeTheme(initialTheme || DEFAULT_THEME)),
  };
  const recoveryIsStale = recoveryHasStaleBaseline(recoveryRecord, recoveryCurrentBaseline);

  useEffect(() => {
    if (!recoveryKey) {
      setRecoveryReady(true);
      return undefined;
    }
    let active = true;
    readEditorRecovery(recoveryKey).then((record) => {
      if (active) setRecoveryRecord(record);
    }).catch(() => {
      if (active) setRecoveryStorageUnavailable(true);
    }).finally(() => {
      if (active) setRecoveryReady(true);
    });
    return () => { active = false; };
  }, [recoveryKey]);

  useEffect(() => {
    if (!recoveryKey || !recoveryReady) return undefined;
    if (recoveryRecord && !recoveryDismissed) return undefined;
    if (!hasUnsavedEditorChanges) {
      removeEditorRecovery(recoveryKey).catch(() => setRecoveryStorageUnavailable(true));
      if (recoveryRecord) setRecoveryRecord(null);
      return undefined;
    }
    const timeout = setTimeout(() => {
      const snapshot = {
        page: { ...payload, status },
        sharedGlobal,
        sharedNavigation,
        themeColors,
        pending: { page: dirty, global: sharedGlobalDirty, navigation: sharedNavigationDirty, theme: themeDirty },
        baseline: {
          pageVersion,
          globalVersion: sharedGlobal?.version ?? null,
          navigationVersion: sharedNavigation?.version ?? null,
          themeSignature: JSON.stringify(savedThemeColors),
        },
      };
      writeEditorRecovery(recoveryKey, snapshot).then((written) => {
        if (!written) setRecoveryStorageUnavailable(true);
        else setRecoveryStorageUnavailable(false);
      }).catch(() => setRecoveryStorageUnavailable(true));
    }, 650);
    return () => clearTimeout(timeout);
  }, [recoveryKey, recoveryReady, hasUnsavedEditorChanges, recoveryRecord, recoveryDismissed, payload, status, sharedGlobal, sharedNavigation, themeColors, pageVersion, savedThemeColors, dirty, sharedGlobalDirty, sharedNavigationDirty, themeDirty]);

  const restoreEditorRecovery = () => {
    if (!recoveryRecord?.snapshot) return;
    const { snapshot } = recoveryRecord;
    const pending = snapshot.pending || { page: true, global: true, navigation: true, theme: true };
    if (!Object.values(pending).some(Boolean)) {
      dismissEditorRecovery();
      return;
    }
    const restoredState = {};
    if (pending.page) restoredState.page = snapshot.page;
    if (pending.global) restoredState.sharedGlobal = snapshot.sharedGlobal;
    if (pending.navigation) restoredState.sharedNavigation = snapshot.sharedNavigation;
    if (pending.theme) restoredState.themeColors = snapshot.themeColors;
    restoreSnapshot(JSON.stringify(restoredState));
    if (pending.page && Number.isFinite(Number(snapshot.baseline?.pageVersion))) setPageVersion(Number(snapshot.baseline.pageVersion));
    setRecoveryDismissed(true);
  };

  const dismissEditorRecovery = () => {
    setRecoveryRecord(null);
    setRecoveryDismissed(true);
    removeEditorRecovery(recoveryKey).catch(() => setRecoveryStorageUnavailable(true));
  };
  useEffect(() => {
    if (!hasUnsavedEditorChanges) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasUnsavedEditorChanges]);

  const selectSharedSection = (identifier, selectedBlockId = null) => {
    const sectionKeys = { 'announcement-bar': 'announcement', header: 'header', newsletter: 'newsletter', footer: 'footer' };
    setSharedSectionKey(sectionKeys[identifier] || null);
    setSelectedThemeGroup(null);
    setSharedSelectedBlockId(selectedBlockId);
    setFocusId(null);
    setFocusedCardId(null);
    setEditorMode('sections');
    setMobileWorkspaceView('sections');
    setShopifyActionResult(null);
  };

  const selectThemeSection = (group, id, blockId = null) => {
    setSharedSectionKey(null);
    setSelectedThemeGroup({ group, id });
    setSharedSelectedBlockId(blockId);
    setFocusId(null);
    setFocusedCardId(null);
    setEditorMode('sections');
    setMobileWorkspaceView('sections');
    setShopifyActionResult(null);
  };

  function updateThemeSection(group, sectionId, updater) {
    setSharedNavigation((currentNavigation) => {
      if (!currentNavigation) return currentNavigation;
      const sections = sharedThemeGroupSections(currentNavigation, group);
      const nextSections = sections.map((section) => section.id === sectionId
        ? updater(section)
        : section);
      return withSharedThemeGroupSections(currentNavigation, group, nextSections);
    });
  }

  const addThemeSection = (group, index, section) => {
    setSharedNavigation((currentNavigation) => {
      if (!currentNavigation) return currentNavigation;
      const sections = sharedThemeGroupSections(currentNavigation, group);
      if (sections.length >= 60) return currentNavigation;
      const nextSections = [...sections];
      nextSections.splice(Math.max(0, Math.min(index, nextSections.length)), 0, section);
      return withSharedThemeGroupSections(currentNavigation, group, nextSections);
    });
    selectThemeSection(group, section.id);
  };

  const reorderThemeSections = (group, fromIndex, toIndex) => setSharedNavigation((currentNavigation) => {
    if (!currentNavigation) return currentNavigation;
    const sections = sharedThemeGroupSections(currentNavigation, group);
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= sections.length || toIndex >= sections.length) return currentNavigation;
    return withSharedThemeGroupSections(currentNavigation, group, moveItem(sections, fromIndex, toIndex));
  });

  const duplicateThemeSection = (group, sectionId) => {
    const sections = sharedThemeGroupSections(sharedNavigation, group);
    const sectionIndex = sections.findIndex((section) => section.id === sectionId && section.type !== 'legacyReference');
    if (sectionIndex < 0 || sections.length >= 60) return;
    const duplicate = duplicateBlockTree(sections[sectionIndex]);
    setSharedNavigation((currentNavigation) => {
      if (!currentNavigation) return currentNavigation;
      const currentSections = sharedThemeGroupSections(currentNavigation, group);
      const currentIndex = currentSections.findIndex((section) => section.id === sectionId);
      if (currentIndex < 0 || currentSections.length >= 60) return currentNavigation;
      const nextSections = [...currentSections];
      nextSections.splice(currentIndex + 1, 0, duplicate);
      return withSharedThemeGroupSections(currentNavigation, group, nextSections);
    });
    selectThemeSection(group, duplicate.id);
  };

  const deleteThemeSection = (group, sectionId) => {
    setSharedNavigation((currentNavigation) => {
      if (!currentNavigation) return currentNavigation;
      return withSharedThemeGroupSections(
        currentNavigation,
        group,
        sharedThemeGroupSections(currentNavigation, group).filter((section) => section.id !== sectionId),
      );
    });
    if (selectedThemeGroup?.group === group && selectedThemeGroup.id === sectionId) {
      setSelectedThemeGroup(null);
      setSharedSelectedBlockId(null);
    }
  };

  const toggleThemeSection = (group, sectionId) => updateThemeSection(group, sectionId, (section) => ({ ...section, enabled: section.enabled === false }));

  const addThemeBlock = (group, sectionId, insertionIndex = null) => {
    const section = sharedThemeGroupSections(sharedNavigation, group).find((item) => item.id === sectionId);
    const card = section ? createSectionCard(section) : null;
    const existingCards = Array.isArray(section?.cards) ? section.cards : [];
    if (!card || existingCards.length >= (BLOCK_TYPES[section.type]?.cards?.max || 12)) return;
    updateThemeSection(group, sectionId, (currentSection) => {
      const cards = [...(currentSection.cards || [])];
      cards.splice(insertionIndex == null ? cards.length : Math.max(0, Math.min(cards.length, insertionIndex)), 0, card);
      return { ...currentSection, cards };
    });
    selectThemeSection(group, sectionId, card.id);
  };

  const addThemeNestedBlock = (group, sectionId, parentId, type, insertionIndex = null) => {
    const definition = BLOCK_TYPES[type];
    const section = sharedThemeGroupSections(sharedNavigation, group).find((item) => item.id === sectionId);
    if (!section || !definition || (definition.ownerOnly && !canEditCode)) return;
    const parentCard = parentId ? section.cards?.find((card) => card.id === parentId) : null;
    const parentBlock = parentId ? findSectionNestedBlock(section, parentId) : null;
    const parentType = parentCard?.type || parentBlock?.block.type || section.type;
    const allowedTypes = BLOCK_TYPES[parentType]?.nestedBlockTypes;
    if (allowedTypes && !allowedTypes.includes(type)) return;
    const currentDepth = parentBlock?.depth || 0;
    const childBlocks = parentId ? parentCard?.blocks || parentBlock?.block.blocks || [] : section.blocks || [];
    if ((parentId && !parentCard && !parentBlock) || currentDepth >= MAX_NESTED_BLOCK_DEPTH || childBlocks.length >= MAX_CHILD_BLOCKS) return;
    const newBlock = createBlock(type);
    updateThemeSection(group, sectionId, (currentSection) => updateNestedBlockContainerInSection(currentSection, parentId, (blocks) => {
      const nextBlocks = [...blocks];
      nextBlocks.splice(insertionIndex == null ? nextBlocks.length : Math.max(0, Math.min(nextBlocks.length, insertionIndex)), 0, newBlock);
      return nextBlocks;
    }).section);
    selectThemeSection(group, sectionId, newBlock.id);
  };

  function moveThemeNestedBlock(group, sectionId, parentId, blockId, destinationIndex) {
    updateThemeSection(group, sectionId, (section) => updateNestedBlockContainerInSection(section, parentId, (blocks) => {
      const sourceIndex = blocks.findIndex((block) => block.id === blockId);
      return sourceIndex < 0 ? blocks : moveItem(blocks, sourceIndex, destinationIndex);
    }).section);
  }

  function duplicateThemeNestedBlock(group, sectionId, parentId, blockId) {
    const section = sharedThemeGroupSections(sharedNavigation, group).find((item) => item.id === sectionId);
    const selectedBlock = section && findSectionNestedBlock(section, blockId)?.block;
    if (!selectedBlock) return;
    const parentCard = parentId ? section.cards?.find((card) => card.id === parentId) : null;
    const parentBlock = parentId ? findSectionNestedBlock(section, parentId)?.block : null;
    const siblings = parentId ? parentCard?.blocks || parentBlock?.blocks || [] : section.blocks || [];
    if (siblings.length >= MAX_CHILD_BLOCKS) return;
    const copy = duplicateNestedBlock(selectedBlock);
    updateThemeSection(group, sectionId, (currentSection) => updateNestedBlockContainerInSection(currentSection, parentId, (blocks) => {
      const sourceIndex = blocks.findIndex((block) => block.id === blockId);
      if (sourceIndex < 0 || blocks.length >= MAX_CHILD_BLOCKS) return blocks;
      const nextBlocks = [...blocks];
      nextBlocks.splice(sourceIndex + 1, 0, copy);
      return nextBlocks;
    }).section);
    selectThemeSection(group, sectionId, copy.id);
  }

  function toggleThemeNestedBlock(group, sectionId, blockId) {
    updateThemeSection(group, sectionId, (section) => updateNestedBlockInSection(section, blockId, (block) => ({ ...block, enabled: block.enabled === false })));
  }

  function deleteThemeNestedBlock(group, sectionId, parentId, blockId) {
    updateThemeSection(group, sectionId, (section) => updateNestedBlockContainerInSection(section, parentId, (blocks) => blocks.filter((block) => block.id !== blockId)).section);
    setSharedSelectedBlockId(parentId || null);
  }

  const toggleSharedHeaderBlock = (blockId) => {
    setSharedNavigation((currentNavigation) => {
      if (!currentNavigation) return currentNavigation;
      const sections = currentNavigation.sections || [];
      const headerSection = getHeaderSection(sections);
      const nextHeaderSection = {
        ...headerSection,
        blocks: headerSection.blocks.map((block) => block.id === blockId
          ? { ...block, enabled: block.enabled === false }
          : block),
      };
      const hasHeaderSection = sections.some((section) => section.id === nextHeaderSection.id || section.type === 'header');
      return {
        ...currentNavigation,
        sections: hasHeaderSection
          ? sections.map((section) => (section.id === nextHeaderSection.id || section.type === 'header' ? nextHeaderSection : section))
          : [...sections, nextHeaderSection],
      };
    });
  };

  const toggleSharedHeaderSection = () => {
    setSharedNavigation((currentNavigation) => {
      if (!currentNavigation) return currentNavigation;
      const sections = currentNavigation.sections || [];
      const headerSection = getHeaderSection(sections);
      const nextHeaderSection = { ...headerSection, enabled: headerSection.enabled === false };
      const hasHeaderSection = sections.some((section) => section.id === nextHeaderSection.id || section.type === 'header');
      return {
        ...currentNavigation,
        sections: hasHeaderSection
          ? sections.map((section) => (section.id === nextHeaderSection.id || section.type === 'header' ? nextHeaderSection : section))
          : [...sections, nextHeaderSection],
      };
    });
  };

  const sharedRecordStatus = (recordKey, isDirty) => {
    const record = recordKey === 'global' ? sharedGlobal : sharedNavigation;
    const lastStatus = recordSaveStatuses[recordKey];
    if (lastStatus?.state === 'saving') return 'Saving…';
    if (isDirty) return 'Unsaved changes';
    if (lastStatus?.state === 'error') return `Error: ${lastStatus.message}`;
    if (lastStatus?.state === 'saved') return lastStatus.message;
    return record?.status === 'published' ? 'Published' : 'Draft saved';
  };

  const setRecordSaveStatus = (recordKey, nextState, message) => {
    setRecordSaveStatuses((currentStatuses) => ({
      ...currentStatuses,
      [recordKey]: { state: nextState, message },
    }));
  };

  const saveSharedRecord = async (recordKey, nextStatus, submittedRecord, submittedSignature) => {
    if (!submittedRecord) return { ok: false, message: 'Shared content is unavailable.' };
    const result = await saveSharedContentAction({ ...submittedRecord, status: nextStatus });
    if (!result?.ok || !result.content) {
      const message = result?.message || 'Unable to save shared content.';
      setRecordSaveStatus(recordKey, 'error', message);
      return { ok: false, message };
    }

    const savedRecord = result.content;
    if (recordKey === 'global') {
      setSharedGlobal((currentRecord) => {
        const changedDuringSave = sharedRecordSignature(currentRecord) !== submittedSignature;
        return changedDuringSave
          ? { ...currentRecord, id: savedRecord.id, version: savedRecord.version, status: savedRecord.status }
          : savedRecord;
      });
      setSavedSharedGlobalSignature(sharedRecordSignature(savedRecord));
    } else {
      setSharedNavigation((currentRecord) => {
        const changedDuringSave = sharedRecordSignature(currentRecord) !== submittedSignature;
        return changedDuringSave
          ? { ...currentRecord, id: savedRecord.id, version: savedRecord.version, status: savedRecord.status }
          : savedRecord;
      });
      setSavedSharedNavigationSignature(sharedRecordSignature(savedRecord));
    }
    const message = nextStatus === 'published' ? 'Published' : 'Draft saved';
    setRecordSaveStatus(recordKey, 'saved', message);
    return { ok: true, message };
  };

  const runShopifyEditorAction = async (intent) => {
    if (toolbarPending || pending) return;
    const isPublish = intent === 'published';
    const shouldSavePage = dirty || (isPublish && (resourceTemplate
      ? templateHasSavedDraft || status !== 'published'
      : status !== 'published'));
    const shouldSaveGlobal = Boolean(sharedGlobal && (sharedGlobalDirty || (isPublish && sharedGlobal.status !== 'published')));
    const shouldSaveNavigation = Boolean(sharedNavigation && (sharedNavigationDirty || (isPublish && sharedNavigation.status !== 'published')));
    const shouldSaveTheme = Boolean(themeDirty);
    const hasWork = shouldSavePage || shouldSaveGlobal || shouldSaveNavigation || shouldSaveTheme;
    if (!hasWork) return;

    const publishConfirmation = resourceTemplate?.resourceType === 'password'
      ? 'Publish the Password template draft? With a storefront password set and coming-soon mode enabled, visitors see this template at the public gate. Enabling coming-soon mode alone keeps its current landing page.'
      : resourceTemplate?.samplePreviewOnly
        ? 'Publish the default blog post template for future posts? The sample article will not be created or changed.'
        : 'Publish the page, shared storefront changes, and theme settings that are ready? Live storefront changes take effect immediately.';
    if (isPublish && !window.confirm(publishConfirmation)) return;
    if (shouldSaveTheme && !canManageTheme) {
      setRecordSaveStatus('theme', 'error', 'Owner access is required to save theme colors.');
    }

    const pageTargetStatus = resourceTemplate ? status : isPublish ? 'published' : 'draft';
    const pageSavedSnapshot = JSON.stringify({ ...payload, status: pageTargetStatus });
    const submittedVersion = pageVersion;
    const submittedGlobal = sharedGlobal ? { ...sharedGlobal, sections: [...(sharedGlobal.sections || [])] } : null;
    const submittedNavigation = sharedNavigation ? { ...sharedNavigation, sections: [...(sharedNavigation.sections || [])] } : null;
    const submittedGlobalSignature = sharedRecordSignature(sharedGlobal);
    const submittedNavigationSignature = sharedRecordSignature(sharedNavigation);
    const submittedTheme = { ...themeColors };
    const formData = shouldSavePage && formRef.current ? new FormData(formRef.current) : null;
    if (formData) {
      formData.set('version', String(pageVersion));
      formData.set('saveIntent', intent);
      if (!resourceTemplate) formData.set('status', pageTargetStatus);
    }

    setToolbarPending(true);
    setShopifyActionResult(null);
    const tasks = [];

    if (shouldSavePage && formData) {
      setRecordSaveStatus('page', 'saving', 'Saving…');
      tasks.push((async () => {
        try {
          const result = await action(shopifyActionResult || state, formData);
          setShopifyActionResult(result || { message: 'Unable to save page changes.', saved: false, errors: {} });
          if (!result?.saved) {
            const message = result?.message || 'Unable to save page changes.';
            setRecordSaveStatus('page', 'error', message);
            return { recordKey: 'page', ok: false, message };
          }
          setSavedSnapshot(pageSavedSnapshot);
          if (resourceTemplate) {
            if (Number.isFinite(Number(result.version))) setPageVersion(Number(result.version));
            setTemplateHasSavedDraft(!result.published);
          } else {
            setPageVersion(Number.isFinite(Number(result.version)) ? Number(result.version) : submittedVersion + 1);
            setStatus(pageTargetStatus);
          }
          const message = resourceTemplate
            ? result.published ? 'Template published' : 'Draft saved'
            : isPublish ? 'Published' : 'Draft saved';
          setRecordSaveStatus('page', 'saved', message);
          return { recordKey: 'page', ok: true, message };
        } catch (error) {
          const message = error?.message || 'Unable to save page changes.';
          setShopifyActionResult({ message, saved: false, errors: {} });
          setRecordSaveStatus('page', 'error', message);
          return { recordKey: 'page', ok: false, message };
        }
      })());
    }

    if (shouldSaveGlobal) {
      setRecordSaveStatus('global', 'saving', 'Saving…');
      tasks.push(saveSharedRecord('global', isPublish ? 'published' : 'draft', submittedGlobal, submittedGlobalSignature)
        .then((result) => ({ recordKey: 'global', ...result }))
        .catch((error) => {
          const message = error?.message || 'Unable to save shared content.';
          setRecordSaveStatus('global', 'error', message);
          return { recordKey: 'global', ok: false, message };
        }));
    }
    if (shouldSaveNavigation) {
      setRecordSaveStatus('navigation', 'saving', 'Saving…');
      tasks.push(saveSharedRecord('navigation', isPublish ? 'published' : 'draft', submittedNavigation, submittedNavigationSignature)
        .then((result) => ({ recordKey: 'navigation', ...result }))
        .catch((error) => {
          const message = error?.message || 'Unable to save navigation.';
          setRecordSaveStatus('navigation', 'error', message);
          return { recordKey: 'navigation', ok: false, message };
        }));
    }
    if (shouldSaveTheme) {
      if (canManageTheme) {
        setRecordSaveStatus('theme', 'saving', 'Saving…');
        tasks.push((async () => {
          if (!isThemeValid(submittedTheme)) {
            const message = 'Correct the invalid brand color and color scheme values before saving.';
            setRecordSaveStatus('theme', 'error', message);
            return { recordKey: 'theme', ok: false, message };
          }
          try {
            const result = await saveThemeAction(submittedTheme);
            if (!result?.ok) {
              const message = result?.message || 'Unable to save theme colors.';
              setRecordSaveStatus('theme', 'error', message);
              return { recordKey: 'theme', ok: false, message };
            }
            setSavedThemeColors(result.theme);
            setThemeColors((currentColors) => themesEqual(currentColors, submittedTheme) ? result.theme : currentColors);
            setRecordSaveStatus('theme', 'saved', 'Saved');
            return { recordKey: 'theme', ok: true, message: 'Saved' };
          } catch (error) {
            const message = error?.message || 'Unable to save theme colors.';
            setRecordSaveStatus('theme', 'error', message);
            return { recordKey: 'theme', ok: false, message };
          }
        })());
      }
    }

    const results = await Promise.all(tasks);
    const failures = results.filter((result) => !result.ok);
    if (failures.length) {
      setShopifyActionResult((previousResult) => previousResult?.sectionIssue
        ? previousResult
        : { message: failures.map((result) => `${result.recordKey}: ${result.message}`).join(' · '), saved: false, errors: {} });
    }
    setToolbarPending(false);
  };

  const sharedInspector = sharedSectionKey && canEditShared ? <aside className="shopify-editor-panel shopify-editor-panel--inspector" aria-label={`${sharedSectionKey} settings`}>
    <SharedSectionEditor
      sectionKey={sharedSectionKey}
      globalContent={sharedGlobal}
      navigationContent={sharedNavigation}
      onGlobalChange={setSharedGlobal}
      onNavigationChange={setSharedNavigation}
      onBack={returnToSections}
      selectedBlockId={sharedSelectedBlockId}
      themeColors={themeColors}
      onOpenThemeSettings={openThemeSettings}
    />
    <div className="shopify-shared-editor__actions" aria-label="Shared content save status">
      {['announcement', 'newsletter', 'footer'].includes(sharedSectionKey) ? <span className="shopify-shared-editor__record-label" role="status">{sharedSectionKey === 'footer' ? 'Footer text' : 'Storefront content'} · {sharedRecordStatus('global', sharedGlobalDirty)}</span> : null}
      {sharedSectionKey === 'footer' ? <span className="shopify-shared-editor__record-label" role="status">Footer menus · {sharedRecordStatus('navigation', sharedNavigationDirty)}</span> : null}
    </div>
  </aside> : null;

  const editor = mode === 'blocks'
    ? <BlockEditor blocks={items} onChange={setItems} onFocusBlock={setFocusId} selectedBlockId={fullScreen ? focusId : null} validationIssue={displayState.sectionIssue || null} canEditCode={canEditCode} themeColors={themeColors} onOpenThemeSettings={openThemeSettings} resourceTitle={resourceTitle} resourceType={resourceTemplate?.resourceType || ''} productOptions={productOptions} allowedBlockTypes={resourceTemplate?.resourceType === 'password' ? ['passwordSection', 'passwordFooter'] : null} />
    : mode === 'navigation'
      ? <NavigationEditor menus={items} onChange={setItems} />
    : mode === 'list'
      ? <ListEditor contentKey={key} items={items} onChange={setItems} fullScreen={fullScreen} selectedId={focusId} onSelect={setFocusId} />
    : <GuidedEditor guide={orderedGuide} values={guided} fullScreen={fullScreen} selectedId={focusId} onSelect={setFocusId} onChange={(id, field, value) => setGuided((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))} />;

  const help = mode === 'navigation' ? 'Links can point to a page on this site (e.g. /bridal) or a full web address. Drag ⋮⋮ to reorder.' : mode === 'guided' ? EDITOR_HELP : EDITOR_HELP.replace(' Emptying a field restores the original copy.', '');
  const shopifySaveDisabled = toolbarPending || pending || !hasUnsavedEditorChanges;
  const shopifyPublishDisabled = toolbarPending || pending || isPolicy || !(
    dirty || themeDirty || sharedDirty || templateHasSavedDraft || status !== 'published'
      || (sharedGlobal && sharedGlobal.status !== 'published')
      || (sharedNavigation && sharedNavigation.status !== 'published')
  );
  const operationErrors = Object.entries(recordSaveStatuses).filter(([, saveStatus]) => saveStatus.state === 'error');
  const toolbarStatusText = toolbarPending
    ? 'Saving…'
    : operationErrors.length
      ? `${operationErrors.length} save error${operationErrors.length === 1 ? '' : 's'}`
      : themeDirty || sharedDirty || dirty
        ? 'Unsaved changes'
        : displayState.message || 'Saved';
  const toolbarStatusDetails = operationErrors.map(([recordKey, saveStatus]) => `${recordKey}: ${saveStatus.message}`).join(' · ');

  return (
    <form ref={formRef} className={`admin-editor-form${fullScreen ? ' admin-editor-form--fullscreen' : ''}`} action={formAction} onSubmit={(event) => {
      if (isShopifyEditor) {
        event.preventDefault();
        void runShopifyEditorAction(event.nativeEvent.submitter?.value === 'published' ? 'published' : 'draft');
        return;
      }
      const pageTitle = content.title || prettyKey(key);
      if (dirty && status === 'published' && !window.confirm(`Publish these changes to ${pageTitle}? The live page will update immediately.`)) {
        event.preventDefault();
        return;
      }
      if (dirty && content.status === 'published' && status !== 'published' && !window.confirm(`Move ${pageTitle} to ${status}? This will remove it from the live website.`)) event.preventDefault();
    }}>
      <input type="hidden" name="id" value={content.id || ''} />
      <input type="hidden" name="version" value={isShopifyEditor ? pageVersion : state.version ?? content.version ?? ''} />
      <input type="hidden" name="key" value={key || ''} />
      {resourceTemplate ? <>
        <input type="hidden" name="resourceType" value={resourceTemplate.resourceType} />
        <input type="hidden" name="resourceHandle" value={resourceTemplate.resourceHandle || ''} />
        <input type="hidden" name="templateKey" value={resourceTemplate.templateKey} />
      </> : null}
      <input type="hidden" name="sections" value={JSON.stringify(sections)} />
      <input type="hidden" name="title" value={title || prettyKey(key)} />
      <input type="hidden" name="intro" value={intro} />
      {isShopifyEditor ? <input type="hidden" name="status" value={status} /> : null}
      {fullScreen ? isShopifyEditor ? (
        <header className="shopify-editor-toolbar">
          <div className="shopify-editor-toolbar__brand">
            <Link href={editorExitHref} className="shopify-editor-toolbar__back" aria-label="Return to page settings" onClick={(event) => { if (hasUnsavedEditorChanges && !window.confirm('Leave without saving? Your page or theme changes will be lost.')) event.preventDefault(); }}>←</Link>
            <span className="shopify-editor-toolbar__storemark" aria-hidden="true">b</span>
            <div><strong className="shopify-editor-toolbar__store-name">byShreen</strong><strong className="shopify-editor-toolbar__mobile-title">{key === 'home' ? 'Home page' : selectedPageChoice?.title || content.title || prettyKey(key)}</strong><small>{status === 'published' ? (hasUnsavedEditorChanges ? 'Live · unsaved' : templateHasSavedDraft ? 'Live · draft saved' : 'Live') : 'Draft'}</small></div>
          </div>
          <nav className="shopify-editor-toolbar__modes" aria-label="Theme editor modes" role="tablist">
            {[['sections', 'Sections'], ['theme', 'Theme settings'], ['apps', 'App embeds']].map(([value, label]) => <button type="button" key={value} role="tab" aria-label={label} title={label} aria-selected={editorMode === value} className={editorMode === value ? 'is-active' : ''} onClick={() => { setEditorMode(value); if (value !== 'sections') setFocusId(null); }}><EditorModeIcon mode={value} /></button>)}
          </nav>
          <div className="shopify-editor-toolbar__context">
            <span className="shopify-editor-toolbar__theme-title"><strong>byShreen</strong><small>{status === 'published' ? (hasUnsavedEditorChanges ? 'Live · unsaved' : templateHasSavedDraft ? 'Live · draft saved' : 'Live') : 'Draft'}</small></span>
            <ResourceTemplateControls
              {...(resourceTemplate || {})}
              templateDestinations={activeTemplateDestinations}
              currentDestinationId={activeDestinationId}
              currentDestinationName={activeDestinationName}
              sections={sections}
              hasUnsavedChanges={hasUnsavedEditorChanges}
            />
          </div>
          <div className="shopify-editor-toolbar__actions">
            <div className="shopify-editor-toolbar__devices" role="group" aria-label="Preview size">
              {[['desktop', '▣', 'Desktop preview'], ['tablet', '▭', 'Tablet preview'], ['mobile', '▯', 'Mobile preview']].map(([device, icon, label]) => <button type="button" key={device} className={previewDevice === device ? 'is-active' : ''} aria-label={label} aria-pressed={previewDevice === device} title={label} onClick={() => setPreviewDevice(device)}>{icon}</button>)}
            </div>
            <button type="button" className={`shopify-icon-button shopify-editor-toolbar__inspector-toggle${previewInspectorEnabled ? ' is-active' : ''}`} aria-label={previewInspectorEnabled ? 'Turn off preview inspector' : 'Turn on preview inspector'} aria-pressed={previewInspectorEnabled} title={previewInspectorEnabled ? 'Preview inspector on' : 'Preview inspector off'} onClick={() => setPreviewInspectorEnabled((enabled) => !enabled)}>⌖</button>
            <span className="shopify-editor-toolbar__divider" />
            <button type="button" className="shopify-icon-button" onClick={undo} disabled={!history.past.length} aria-label="Undo" title="Undo">↶</button>
            <button type="button" className="shopify-icon-button" onClick={redo} disabled={!history.future.length} aria-label="Redo" title="Redo">↷</button>
            {publicRoute ? <Link href={publicRoute} target="_blank" className="shopify-editor-toolbar__view">View</Link> : null}
            <span className={`shopify-editor-toolbar__save-state${hasUnsavedEditorChanges || operationErrors.length ? ' is-dirty' : ''}`} role="status" title={toolbarStatusDetails || undefined} aria-label={toolbarStatusDetails || toolbarStatusText}>{toolbarStatusText}</span>
            <button type="button" className="shopify-editor-toolbar__publish" onClick={() => runShopifyEditorAction('published')} disabled={shopifyPublishDisabled} title={isPolicy ? 'This page needs business/legal approval before it can be published.' : undefined}>{toolbarPending ? 'Publishing…' : 'Publish'}</button>
            <button type="button" className="shopify-editor-toolbar__save-draft" onClick={() => runShopifyEditorAction('draft')} disabled={shopifySaveDisabled}>{toolbarPending ? 'Saving…' : 'Save'}</button>
            <details className="shopify-editor-toolbar__mobile-menu">
              <summary className="shopify-icon-button" aria-label="More editor actions" title="More editor actions"><span aria-hidden="true">•••</span></summary>
              <div className="shopify-editor-toolbar__mobile-menu-panel">
                <button type="button" className="shopify-editor-toolbar__mobile-publish" onClick={() => runShopifyEditorAction('published')} disabled={shopifyPublishDisabled}>{toolbarPending ? 'Publishing…' : 'Publish'}</button>
                <button type="button" className="shopify-editor-toolbar__mobile-publish" onClick={() => runShopifyEditorAction('draft')} disabled={shopifySaveDisabled}>{toolbarPending ? 'Saving…' : 'Save'}</button>
                <div className="shopify-editor-toolbar__devices" role="group" aria-label="Preview size">
                  {[['desktop', '▣', 'Desktop preview'], ['tablet', '▭', 'Tablet preview'], ['mobile', '▯', 'Mobile preview']].map(([device, icon, label]) => <button type="button" key={device} className={previewDevice === device ? 'is-active' : ''} aria-label={label} aria-pressed={previewDevice === device} title={label} onClick={() => setPreviewDevice(device)}>{icon}</button>)}
                </div>
                <button type="button" className={`shopify-icon-button shopify-editor-toolbar__inspector-toggle${previewInspectorEnabled ? ' is-active' : ''}`} aria-label={previewInspectorEnabled ? 'Turn off preview inspector' : 'Turn on preview inspector'} aria-pressed={previewInspectorEnabled} title={previewInspectorEnabled ? 'Preview inspector on' : 'Preview inspector off'} onClick={() => setPreviewInspectorEnabled((enabled) => !enabled)}>⌖</button>
                <button type="button" className="shopify-icon-button" onClick={undo} disabled={!history.past.length} aria-label="Undo" title="Undo">↶</button>
                <button type="button" className="shopify-icon-button" onClick={redo} disabled={!history.future.length} aria-label="Redo" title="Redo">↷</button>
                {publicRoute ? <Link href={publicRoute} target="_blank" className="shopify-editor-toolbar__view">View</Link> : null}
                <span className={`shopify-editor-toolbar__save-state${hasUnsavedEditorChanges || operationErrors.length ? ' is-dirty' : ''}`} role="status" title={toolbarStatusDetails || undefined} aria-label={toolbarStatusDetails || toolbarStatusText}>{toolbarStatusText}</span>
                <div className="shopify-editor-toolbar__mobile-modes" role="group" aria-label="Editor mode">
                  {[['sections', 'Sections'], ['theme', 'Theme settings'], ['apps', 'App embeds']].map(([value, label]) => <button type="button" key={value} onClick={() => { setEditorMode(value); setMobileWorkspaceView(value); if (value !== 'sections') setFocusId(null); }}>{label}</button>)}
                </div>
              </div>
            </details>
          </div>
        </header>
      ) : (
        <header className="admin-editor-toolbar">
          <Link href={editorExitHref} className="admin-editor-toolbar__back" aria-label="Open page settings" onClick={(event) => { if (dirty && !window.confirm('Leave without saving? Your changes to this page will be lost.')) event.preventDefault(); }}>← <span>Page settings</span></Link>
          <div className="admin-editor-toolbar__title"><strong>{content.title || prettyKey(key)}</strong><span>{status === 'published' ? 'Published' : status === 'archived' ? 'Archived' : 'Draft changes'}</span></div>
          <div className="admin-editor-toolbar__actions">
            <ResourceTemplateControls
              templateDestinations={pageDestinationItems}
              currentDestinationId={selectedPageChoiceValue}
              currentDestinationName={pageChoiceLabel(selectedPageChoice || { title: title || 'Page' })}
              hasUnsavedChanges={hasUnsavedEditorChanges}
            />
            {content.source === 'fallback' ? <span className="admin-editor-toolbar__warning">Database unavailable · changes can’t be saved</span> : null}
            {publicRoute ? <Link href={publicRoute} target="_blank" className="admin-editor-toolbar__view">View page ↗</Link> : null}
          </div>
        </header>
      ) : null}
      {isShopifyEditor && recoveryRecord && !recoveryDismissed ? <aside className="shopify-session-recovery" aria-label="Restore unsaved editor session" aria-live="polite">
        <div className="shopify-session-recovery__copy">
          <strong>Restore last session?</strong>
          <span>{recoveryIsStale ? 'The saved page or theme changed after this editing session ended. Restoring keeps the original version check when you save.' : 'This editor closed with unsaved changes.'}</span>
        </div>
        <div className="shopify-session-recovery__actions">
          <button type="button" className="shopify-session-recovery__dismiss" onClick={dismissEditorRecovery}>Dismiss</button>
          <button type="button" className="shopify-session-recovery__restore" onClick={restoreEditorRecovery}>Restore</button>
        </div>
      </aside> : null}
      {isShopifyEditor && recoveryStorageUnavailable ? <span className="shopify-session-recovery__storage-status" role="status">Session recovery storage is unavailable; your current edits remain in this tab.</span> : null}
      {isShopifyEditor ? <div className={`shopify-editor-workspace mobile-${mobileWorkspaceView}-view${resourceTemplate?.resourceType === 'gift-card' ? ' gift-card-workspace' : ''}${editorMode === 'sections' && (selectedSection || selectedThemeSection || sharedSectionKey) ? ' has-inspector' : ''}`}>
        {editorMode === 'sections' ? <div id="shopify-editor-sidebar" className={`shopify-editor-sidebar${selectedSection || selectedThemeSection || sharedSectionKey ? ' has-inspector' : ''}`}>
          {resourceTemplate?.resourceType === 'gift-card' ? <aside className="shopify-editor-panel gift-card-editor-sidebar" aria-label="Gift card sections">
            <div className="shopify-editor-panel__modebar"><strong>Gift card</strong></div>
            <div className="gift-card-editor-sidebar__content">
              <p>This page doesn&apos;t have any sections.</p>
              <button type="button" onClick={() => openThemeSettings()}>Edit theme settings</button>
            </div>
          </aside> : <ShopifySectionTree
          sections={items}
          blogPostPickerSamples={blogPostPickerSamples}
          selectedId={focusId}
          selectedCardId={focusedCardId}
          search={sectionQuery}
          onSearch={setSectionQuery}
          onSelect={selectSection}
          onSelectCard={selectSectionCard}
          onReorder={(from, to) => setItems((currentItems) => moveItem(currentItems, from, to))}
          onAddSection={addSectionAt}
          onAddBlock={addBlockToSection}
          onAddNestedBlock={addNestedBlockToSection}
          onMoveNestedBlock={moveNestedBlock}
          onDuplicateNestedBlock={duplicateNestedBlockInSection}
          onToggleNestedBlock={toggleNestedBlockVisibility}
          onDeleteNestedBlock={removeNestedBlock}
          onDelete={removeSection}
          onToggleEnabled={toggleSectionVisibility}
          requestedPickerIndex={previewPickerIndex}
          onPickerRequestHandled={setPreviewPickerIndex}
          canEditCode={canEditCode}
          selectedSharedKey={sharedSectionKey}
          selectedSharedBlockId={sharedSelectedBlockId}
          sharedHeaderBlocks={sharedHeaderSection.blocks}
          sharedHeaderEnabled={sharedHeaderSection.enabled !== false}
          sharedHeaderMenuLabel={sharedHeaderMenuLabel}
          themeSectionGroups={sharedNavigation?.themeSectionGroups}
          selectedThemeGroup={selectedThemeGroup}
          onSelectThemeSection={canEditShared && sharedNavigation ? selectThemeSection : undefined}
          onAddThemeSection={canEditShared && sharedNavigation ? addThemeSection : undefined}
          onReorderThemeSections={canEditShared && sharedNavigation ? reorderThemeSections : undefined}
          onDuplicateThemeSection={canEditShared && sharedNavigation ? duplicateThemeSection : undefined}
          onToggleThemeSection={canEditShared && sharedNavigation ? toggleThemeSection : undefined}
          onDeleteThemeSection={canEditShared && sharedNavigation ? deleteThemeSection : undefined}
          onAddThemeBlock={canEditShared && sharedNavigation ? addThemeBlock : undefined}
          onAddThemeNestedBlock={canEditShared && sharedNavigation ? addThemeNestedBlock : undefined}
          onMoveThemeNestedBlock={canEditShared && sharedNavigation ? moveThemeNestedBlock : undefined}
          onDuplicateThemeNestedBlock={canEditShared && sharedNavigation ? duplicateThemeNestedBlock : undefined}
          onToggleThemeNestedBlock={canEditShared && sharedNavigation ? toggleThemeNestedBlock : undefined}
          onDeleteThemeNestedBlock={canEditShared && sharedNavigation ? deleteThemeNestedBlock : undefined}
          onSelectSharedSection={canEditShared && sharedGlobal && sharedNavigation ? selectSharedSection : undefined}
          onToggleSharedBlock={canEditShared && sharedNavigation ? toggleSharedHeaderBlock : undefined}
          onToggleSharedHeader={canEditShared && sharedNavigation ? toggleSharedHeaderSection : undefined}
          templateLabel={key === 'home' ? 'Home page' : title || pageChoices.find((page) => page.key === key)?.title || 'Home page'}
          templateContext={resourceTemplate?.resourceType || key}
          allowedSectionTypes={null}
          hideSharedGroups={resourceTemplate?.resourceType === 'password'}
        >
          {resourceTemplate?.resourceType === 'password' ? null : <div className="shopify-editor-page-fields"><details><summary>Page details and search engine listing</summary>{titleEditable ? <label className="admin-field"><span>Page title</span><input value={title} onChange={(event) => setTitle(event.target.value)} required /></label> : null}<label className="admin-field"><span>Google title</span><input name="seoTitle" defaultValue={content.seoTitle || ''} /></label><label className="admin-field"><span>Google description</span><textarea name="seoDescription" rows="3" defaultValue={content.seoDescription || ''} /></label></details></div>}
          </ShopifySectionTree>}
          {resourceTemplate?.resourceType !== 'gift-card' ? (selectedSection ? sectionInspector : selectedThemeSection && resourceTemplate?.resourceType !== 'password' ? themeSectionInspector : sharedSectionKey && resourceTemplate?.resourceType !== 'password' ? sharedInspector : null) : null}
        </div> : editorMode === 'theme' ? <ShopifyThemeSettingsPanel
          colors={themeColors}
          savedColors={savedThemeColors}
          onChange={setThemeColors}
          canManageSettings={canManageTheme}
          saving={toolbarPending}
          requestedScheme={requestedThemeScheme}
          onSchemeRequestHandled={(requestId) => setRequestedThemeScheme((request) => request?.requestId === requestId ? null : request)}
        /> : <aside className="shopify-editor-panel shopify-editor-panel--aux">
          <div className="shopify-editor-panel__modebar"><span className="shopify-editor-panel__mode-icon">⊞</span><strong>App embeds</strong></div>
          <div className="shopify-editor-panel__scroll"><label className="shopify-editor-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search app embeds" /></label><div className="shopify-editor-aux__empty"><strong>No app embeds installed</strong><span>Install an app to manage its storefront embeds here.</span></div></div>
        </aside>}
        <div id="shopify-editor-canvas" className="shopify-editor-canvas"><PreviewPanel contentKey={previewKey || key} payload={payload} sharedPayload={sharedPreviewPayload} focusId={previewFocusId} publicRoute={publicRoute || PUBLIC_ROUTES[key]} fullScreen onSelectBlock={selectPreviewSection} onSectionAction={handlePreviewSectionAction} onRequestAddSection={setPreviewPickerIndex} moveTargets={moveTargets} canEditCode={canEditCode} showSectionTools={false} showPreviewSelectionActions showBar={false} deviceValue={previewDevice} onDeviceChange={setPreviewDevice} inspectorEnabled={previewInspectorEnabled} themeColors={themeColors} /></div>
        <nav className={`shopify-editor-mobile-switch${mobileWorkspaceView === 'preview' ? ' is-collapsed' : ' is-expanded'}`} aria-label="Mobile editor view">
          <div className="shopify-editor-mobile-switch__handle" aria-hidden="true" />
          {mobileWorkspaceView === 'preview' ? <>
            <span className="shopify-editor-mobile-switch__hint">Select sections by tapping them in the Preview</span>
            <div className="shopify-editor-mobile-switch__controls">
              <button type="button" onClick={() => { setEditorMode('sections'); setMobileWorkspaceView('sections'); }}>{selectedSection || selectedThemeSection ? 'Edit section' : 'Edit'}</button>
              <ResourceTemplateControls
                {...(resourceTemplate || {})}
                templateDestinations={activeTemplateDestinations}
                currentDestinationId={activeDestinationId}
                currentDestinationName={activeDestinationName}
                sections={sections}
                hasUnsavedChanges={hasUnsavedEditorChanges}
              />
            </div>
          </> : <div className="shopify-editor-mobile-switch__expanded-header">
            <strong>{selectedThemeSection?.label || (sharedSectionKey ? ({ announcement: 'Announcement bar', header: 'Header', newsletter: 'Newsletter', footer: 'Footer' }[sharedSectionKey]) : key === 'home' ? 'Home page' : selectedPageChoice?.title || content.title || prettyKey(key))}</strong>
            <button type="button" onClick={() => setMobileWorkspaceView('preview')}>Done</button>
          </div>}
        </nav>
      </div> : <div className={hasPreview ? `admin-studio${fullScreen ? ` admin-studio--fullscreen admin-studio--${workspaceView}-view` : ''}` : 'admin-editor-single'} style={fullScreen && hasPreview ? { '--editor-pane-width': `${editorPaneWidth}px` } : undefined}>
        {fullScreen && hasPreview ? <div className="admin-studio__controls">
          <div className="admin-studio__view-switch" role="group" aria-label="Workspace view">
            {[['split', 'Split view'], ['editor', 'Edit only'], ['preview', 'Preview only']].map(([value, label]) => <button type="button" key={value} className={workspaceView === value ? 'is-active' : ''} aria-pressed={workspaceView === value} onClick={() => setWorkspaceView(value)}>{label}</button>)}
          </div>
          {workspaceView === 'split' ? <label className="admin-studio__width-control"><span>Editor width</span><input aria-label="Editor pane width" type="range" min="280" max="520" step="10" value={editorPaneWidth} onChange={(event) => setEditorPaneWidth(Number(event.target.value))} /><output>{editorPaneWidth}px</output></label> : null}
        </div> : null}
        <div className="admin-studio__editor">
          {sectionActionMessage ? <p className="admin-fullscreen-guidance" role="status">{sectionActionMessage}</p> : null}
          {fullScreen && mode !== 'navigation' ? (
            <nav className="admin-editor-outline" aria-label="Page sections">
              <div className="admin-editor-outline__heading"><strong>Page sections</strong><span>{sectionQuery.trim() ? `${filteredOutlineItems.length} of ${outlineItems.length}` : `${outlineItems.length} sections`}</span></div>
              <label className="admin-editor-outline__search"><span>Find a section</span><input type="search" value={sectionQuery} onChange={(event) => setSectionQuery(event.target.value)} placeholder="Search names and content" /></label>
              <p className="admin-fullscreen-guidance">{sectionQuery.trim() ? 'Search results are filtered. Clear the search to drag and reorder.' : 'Drag to reorder, or use the move controls.'}</p>
              <div className="admin-editor-outline__list">
                {filteredOutlineItems.length ? <SortableList
                  className="admin-editor-outline__sortable"
                  items={filteredOutlineItems}
                  onReorder={(from, to) => { if (!sectionQuery.trim()) reorderOutline(from, to); }}
                  renderItem={(block, index, dragHandle) => (
                    <div className="admin-editor-outline__row">
                      {sectionQuery.trim() ? <span className="admin-editor-outline__drag" aria-hidden="true" /> : <span {...dragHandle} className="admin-editor-outline__drag" aria-label={`Drag section ${block.sourceIndex + 1}, ${block.outlineLabel} to reorder`}>⋮⋮</span>}
                      <button type="button" className={focusId === block.id ? 'is-active' : ''} aria-current={focusId === block.id ? 'true' : undefined} onClick={() => setFocusId(block.id)}>
                        <span className="admin-editor-outline__index">{String(block.sourceIndex + 1).padStart(2, '0')}</span>
                        <span className="admin-editor-outline__copy"><strong title={block.outlineLabel}>{block.outlineLabel}</strong><small title={block.summary}>{block.summary || 'Select to edit this section'}</small></span>
                        <span className="admin-editor-outline__chevron" aria-hidden="true">›</span>
                      </button>
                      <div className="admin-editor-outline__move">
                        <button type="button" onClick={() => reorderOutline(block.sourceIndex, block.sourceIndex - 1)} disabled={block.sourceIndex === 0} aria-label={`Move section ${block.sourceIndex + 1}, ${block.outlineLabel}, up`}>↑</button>
                        <button type="button" onClick={() => reorderOutline(block.sourceIndex, block.sourceIndex + 1)} disabled={block.sourceIndex === outlineItems.length - 1} aria-label={`Move section ${block.sourceIndex + 1}, ${block.outlineLabel}, down`}>↓</button>
                      </div>
                    </div>
                  )}
                /> : <p className="admin-editor-outline__empty" role="status">No sections match “{sectionQuery}”. <button type="button" onClick={() => setSectionQuery('')}>Clear search</button></p>}
              </div>
            </nav>
          ) : null}
          <section className="admin-card admin-card--compact">
            <div className="admin-field-row">
              <label className="admin-field"><span>Status</span>
                <select name="status" value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="published" disabled={isPolicy}>Published (live)</option>
                  <option value="draft">Draft (not live)</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <div className="admin-field"><span>Appears on</span><p className="admin-field-help">{publicRoute || ROUTE_LABELS[key] || PUBLIC_ROUTES[key]}</p></div>
            </div>
            {titleEditable ? <label className="admin-field"><span>Page title</span><input value={title} onChange={(event) => setTitle(event.target.value)} required /></label> : null}
            {extraSettings}
            <p className="admin-field-help">{isPolicy ? 'Legal policies stay in draft until their legal review is recorded.' : 'Saving as Published updates the website straight away. Drafts keep the current live version.'}</p>
            {mode === 'list' ? (
              <>
                <label className="admin-field"><span>Page title</span><input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
                <label className="admin-field"><span>Introduction</span><textarea rows={3} value={intro} onChange={(event) => setIntro(event.target.value)} /></label>
              </>
            ) : null}
            <details className="admin-seo">
              <summary>Search engine settings (SEO)</summary>
              <label className="admin-field"><span>Browser tab / Google title</span><input name="seoTitle" defaultValue={content.seoTitle || ''} /></label>
              <label className="admin-field"><span>Google description</span><textarea name="seoDescription" rows="3" defaultValue={content.seoDescription || ''} /></label>
            </details>
          </section>
          {!fullScreen ? <p className="admin-field-help admin-editor-help">{mode === 'blocks' ? 'Click a block to edit it; the preview scrolls to it. Drag ⋮⋮ to reorder. ' : ''}{help}</p> : null}
          {fullScreen && mode === 'blocks' ? <p className="admin-fullscreen-guidance">Saving as a draft keeps the live page unchanged; publishing updates it immediately.</p> : null}
          {editor}
          {displayState.sectionIssue ? (
            <div className="admin-editor-validation" role="alert">
              <p>{displayState.sectionIssue.message}</p>
              {displayState.sectionIssue.sectionId ? (
                <button type="button" onClick={() => setFocusId(displayState.sectionIssue.sectionId)}>
                  Go to {BLOCK_TYPES[items[displayState.sectionIssue.sectionIndex]?.type]?.label || 'section'}{displayState.sectionIssue.fieldPath ? ` · ${displayState.sectionIssue.fieldPath.split('.').map((part) => /^\d+$/.test(part) ? `item ${Number(part) + 1}` : FIELD_LABELS[part] || prettyKey(part)).join(' · ')}` : ''}
                </button>
              ) : null}
            </div>
          ) : displayState.errors?.sections ? <p className="admin-field-error" role="alert">Review the page sections above and try again.</p> : null}
        </div>
        {hasPreview ? (
          <div className="admin-studio__preview">
            <PreviewPanel contentKey={previewKey || key} payload={payload} sharedPayload={sharedPreviewPayload} focusId={previewFocusId} publicRoute={publicRoute || PUBLIC_ROUTES[key]} fullScreen={fullScreen} onSelectBlock={setFocusId} onSectionAction={handlePreviewSectionAction} moveTargets={moveTargets} canEditCode={canEditCode} />
          </div>
        ) : null}
      </div>}
      <div className={`admin-savebar${isShopifyEditor ? ' shopify-editor-savebar' : ''}`}>
        {displayState.message ? <span className={displayState.saved ? 'admin-savebar__status' : 'admin-savebar__status is-error'} role="status">{displayState.message}</span> : null}
        {dirty ? <span className="admin-savebar__dirty">Unsaved changes</span> : null}
        {fullScreen ? <div className="admin-savebar__history" aria-label="Edit history">
          <button type="button" className="admin-button admin-button--ghost" onClick={undo} disabled={!history.past.length} aria-label="Undo last edit">Undo</button>
          <button type="button" className="admin-button admin-button--ghost" onClick={redo} disabled={!history.future.length} aria-label="Redo edit">Redo</button>
        </div> : null}
        {!fullScreen ? <Link href="/admin/content" className="admin-button admin-button--ghost" onClick={(event) => { if (dirty && !window.confirm('Leave without saving? Your changes to this page will be lost.')) event.preventDefault(); }}>Back</Link> : null}
        <button type="submit" className="admin-button" disabled={pending}>{pending ? 'Saving…' : status === 'published' ? 'Publish changes' : status === 'archived' ? 'Save as archived' : 'Save draft'}</button>
      </div>
    </form>
  );
}
