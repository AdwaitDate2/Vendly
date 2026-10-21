// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LinkPicker from './LinkPicker';
import SortableList, { moveItem } from './SortableList';
import { newId } from '@/lib/blocks';
import { COLOR_SCHEME_NUMBERS, DEFAULT_THEME, getThemeColorScheme } from '@/lib/theme';
import { resolveColorSchemeSelection } from '@/lib/header-settings';
import {
  DEFAULT_HEADER_SECTION,
  HEADER_LOGO_BLOCK_ID,
  HEADER_MENU_BLOCK_ID,
  getHeaderBlock,
  getHeaderSection,
} from '@/lib/header-settings';

const SECTION_TITLES = {
  announcement: 'Announcement bar',
  header: 'Header',
  newsletter: 'Newsletter',
  footer: 'Footer',
};

function SharedEditorIcon({ name, size = 14 }) {
  // Parity: strokeWidth 1.5 to match Polaris and EditorIcon after parity fix
  // Evidence: E-SHOP-ICON-20261015-001
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

  const paths = {
    drag: <><circle cx="8" cy="6" r="1" /><circle cx="16" cy="6" r="1" /><circle cx="8" cy="12" r="1" /><circle cx="16" cy="12" r="1" /><circle cx="8" cy="18" r="1" /><circle cx="16" cy="18" r="1" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    chevronDown: <><path d="m6 9 6 6 6-6" /></>,
    chevronRight: <><path d="m9 6 6 6-6 6" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    eye: <><path d="M2.5 12s3.4-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.4 6.5-9.5 6.5S2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    eyeOff: <><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.7A9.8 9.8 0 0 1 12 5.5c6.1 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.8M6.2 6.2C3.9 7.8 2.5 12 2.5 12s3.4 6.5 9.5 6.5c1.3 0 2.4-.3 3.4-.8" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 13h11l1-13M9 7V4h6v3" /></>,
    duplicate: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
    arrowLeft: <><path d="M20 12H5M11 6 5 12l6 6" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4 4" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  };

  return <svg {...sharedProps}>{paths[name] || paths.menu}</svg>;
}

function getSection(content, id) {
  return content?.sections?.find((section) => section.id === id) || { id };
}

function replaceSection(content, id, nextSection) {
  const sections = content?.sections || [];
  const hasSection = sections.some((section) => section.id === id);
  return {
    ...content,
    sections: hasSection
      ? sections.map((section) => (section.id === id ? nextSection : section))
      : [...sections, nextSection],
  };
}

function Field({ label, value, onChange, multiline = false, placeholder = '', maxLength }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {multiline ? (
        <textarea rows={3} value={value || ''} placeholder={placeholder} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value || ''} placeholder={placeholder} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return <label className="admin-field shopify-shared-editor__select-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function SegmentedField({ label, value, options, onChange }) {
  return <fieldset className="shopify-shared-editor__segmented-field">
    <legend>{label}</legend>
    <div role="group" aria-label={label}>
      {options.map(([optionValue, optionLabel]) => <button type="button" key={optionValue} aria-pressed={value === optionValue} className={value === optionValue ? 'is-selected' : ''} onClick={() => onChange(optionValue)}>{optionLabel}</button>)}
    </div>
  </fieldset>;
}

function HeaderColorSchemeField({ value, onChange, themeColors = DEFAULT_THEME, onEditScheme, label = 'Color scheme', name = 'header-color-scheme', fallback = 'scheme1', help = '' }) {
  const selection = resolveColorSchemeSelection(value, fallback);
  const selectedScheme = selection.legacyValue ? null : selection.number;
  const originalValue = fallback === 'scheme5' ? 'inverse' : 'default';
  return <fieldset className="shopify-editor-color-scheme">
    <legend>{label}</legend>
    {onEditScheme && selectedScheme ? <button type="button" className="shopify-editor-color-scheme__edit" onClick={() => onEditScheme(selectedScheme)}>Edit scheme</button> : null}
    <div className="shopify-editor-color-scheme__options">
      <label className="shopify-editor-color-scheme__option" title="Use the byShreen brand colors">
        <input type="radio" name={name} value={originalValue} checked={Boolean(selection.legacyValue)} onChange={() => onChange(originalValue)} />
        <span className="shopify-editor-color-scheme__swatch" style={{ '--swatch-background': themeColors.paper, '--swatch-foreground': themeColors.ink, '--swatch-accent': themeColors.mulberry }} aria-hidden="true" />
        <span className="shopify-editor-color-scheme__label">Original palette</span>
      </label>
      {COLOR_SCHEME_NUMBERS.map((number) => {
        const scheme = getThemeColorScheme(themeColors, number);
        return <label className="shopify-editor-color-scheme__option" key={number} title={`Scheme ${number}`}>
        <input
          type="radio"
          name={name}
          value={`scheme${number}`}
          checked={selectedScheme === number}
          onChange={() => onChange(`scheme${number}`)}
        />
        <span className="shopify-editor-color-scheme__swatch" style={{
          '--swatch-background': `var(--color-scheme-${number}-base-background, ${scheme.base.background})`,
          '--swatch-foreground': `var(--color-scheme-${number}-base-text, ${scheme.base.text})`,
          '--swatch-accent': `var(--color-scheme-${number}-primary-button-background, ${scheme.primaryButton.background})`,
        }} aria-hidden="true" />
        <span className="shopify-editor-color-scheme__label">Scheme {number}</span>
      </label>;
      })}
    </div>
    {selection.legacyValue ? <p className="shopify-shared-editor__help">Uses the byShreen brand colors in Theme settings.</p> : null}
    {help ? <p className="shopify-shared-editor__help">{help}</p> : null}
  </fieldset>;
}

function ToggleField({ label, checked, onChange, disabled = false, switchControl = false }) {
  return <label className={`shopify-shared-editor__toggle${disabled ? ' is-disabled' : ''}`}><input type="checkbox" role={switchControl ? 'switch' : undefined} checked={Boolean(checked)} disabled={disabled} onChange={(event) => onChange?.(event.target.checked)} /><span>{label}</span></label>;
}

function RangeField({ label, value, min = 0, max = 80, onChange, unit = 'px', numericInput = false }) {
  const numericValue = Math.max(min, Math.min(max, Number(value) || 0));
  const [numericDraft, setNumericDraft] = useState(String(numericValue));
  useEffect(() => setNumericDraft(String(numericValue)), [numericValue]);

  const updateNumericDraft = (rawValue) => {
    setNumericDraft(rawValue);
    if (rawValue === '') return;
    const parsedValue = Number(rawValue);
    if (Number.isFinite(parsedValue)) onChange(Math.max(min, Math.min(max, Math.round(parsedValue))));
  };

  const normalizeNumericDraft = () => {
    const parsedValue = Number(numericDraft);
    const normalizedValue = Number.isFinite(parsedValue) ? Math.max(min, Math.min(max, Math.round(parsedValue))) : numericValue;
    setNumericDraft(String(normalizedValue));
    onChange(normalizedValue);
  };

  return <label className="shopify-shared-editor__range">
    <span>{label}{numericInput ? null : <output>{numericValue}{unit}</output>}</span>
    <div className={`shopify-shared-editor__range-controls${numericInput ? ' has-number-input' : ''}`}>
      <input type="range" min={min} max={max} value={numericValue} onChange={(event) => onChange(Number(event.target.value))} />
      {numericInput ? <div className="shopify-shared-editor__range-number"><input type="number" min={min} max={max} step="1" value={numericDraft} aria-label={`${label} desktop padding in pixels`} onChange={(event) => updateNumericDraft(event.target.value)} onBlur={normalizeNumericDraft} /><span>{unit}</span></div> : null}
    </div>
  </label>;
}

function MenuLinks({ menu, onChange, external = false }) {
  const links = menu.cards || [];
  const [expandedLinkId, setExpandedLinkId] = useState(links[0]?.id || null);
  const setLinks = (nextLinks) => onChange({ ...menu, cards: nextLinks });

  return (
    <div className="admin-nav-editor__links shopify-shared-editor__links">
      <SortableList
        items={links}
        onReorder={(fromIndex, toIndex) => setLinks(moveItem(links, fromIndex, toIndex))}
        renderItem={(link, index, dragHandle) => (
          <div className="shopify-shared-editor__link-item" key={link.id}>
            <div className={`shopify-shared-editor__link-summary${expandedLinkId === link.id ? ' is-open' : ''}`}>
              <span {...dragHandle} className="shopify-editor-section__drag" aria-label={`Drag ${link.heading || `link ${index + 1}`} to reorder`}><SharedEditorIcon name="drag" /></span>
              <button
                type="button"
                className="shopify-shared-editor__link-toggle"
                aria-expanded={expandedLinkId === link.id}
                onClick={() => setExpandedLinkId((currentId) => currentId === link.id ? null : link.id)}
              >
                <strong>{link.heading || 'Untitled link'}</strong>
                <small>{link.linkHref || 'No destination'}</small>
              </button>
              <button
                type="button"
                className="shopify-shared-editor__remove"
                aria-label={`Remove ${link.heading || `link ${index + 1}`}`}
                onClick={() => {
                  const nextLinks = links.filter((_, itemIndex) => itemIndex !== index);
                  setLinks(nextLinks);
                  if (expandedLinkId === link.id) setExpandedLinkId(nextLinks[Math.min(index, nextLinks.length - 1)]?.id || null);
                }}
              >
                <SharedEditorIcon name="close" size={12} />
              </button>
            </div>
            {expandedLinkId === link.id ? (
              <div className="shopify-shared-editor__link-fields">
                <Field
                  label={external ? 'Social link name' : 'Link text'}
                  value={link.heading}
                  maxLength={240}
                  onChange={(heading) => setLinks(links.map((item, itemIndex) => (itemIndex === index ? { ...item, heading } : item)))}
                />
                {external ? (
                  <Field
                    label="Web address"
                    value={link.linkHref}
                    placeholder="https://…"
                    maxLength={400}
                    onChange={(linkHref) => setLinks(links.map((item, itemIndex) => (itemIndex === index ? { ...item, linkHref } : item)))}
                  />
                ) : (
                  <label className="admin-field">
                    <span>Link destination</span>
                    <LinkPicker
                      value={link.linkHref || ''}
                      onChange={(linkHref) => setLinks(links.map((item, itemIndex) => (itemIndex === index ? { ...item, linkHref } : item)))}
                    />
                  </label>
                )}
              </div>
            ) : null}
          </div>
        )}
      />
      <button
        type="button"
        className="admin-button admin-button--ghost"
        onClick={() => {
          const newLink = { id: newId('link'), heading: '', linkHref: '' };
          setLinks([...links, newLink]);
          setExpandedLinkId(newLink.id);
        }}
        disabled={links.length >= 24}
      >
        Add link
      </button>
    </div>
  );
}

function EditorGroup({ title, children, className = '' }) {
  return (
    <section className={`shopify-editor-group${className ? ` ${className}` : ''}`}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

/**
 * Controlled inspector for shared storefront sections.
 * `globalContent` and `navigationContent` are independent editable content records from
 * getEditableContent(). Each callback receives that same record shape with only its own
 * `sections` changed; callers should keep the two records and their versions separate.
 */
export default function SharedSectionEditor({
  sectionKey,
  globalContent,
  navigationContent,
  onGlobalChange,
  onNavigationChange,
  onBack,
  selectedBlockId = null,
  themeColors = DEFAULT_THEME,
  onOpenThemeSettings,
}) {
  const title = sectionKey === 'header' && selectedBlockId === HEADER_LOGO_BLOCK_ID
    ? 'Logo'
    : sectionKey === 'header' && selectedBlockId === HEADER_MENU_BLOCK_ID
      ? 'Menu'
      : SECTION_TITLES[sectionKey];
  if (!title) return null;

  const globalSectionId = ['announcement', 'newsletter', 'footer'].includes(sectionKey) ? sectionKey : null;
  const globalSection = globalSectionId ? getSection(globalContent, globalSectionId) : null;
  const navigationSections = navigationContent?.sections || [];
  const headerSection = sectionKey === 'header' ? getHeaderSection(navigationSections) : null;
  const logoBlock = headerSection ? getHeaderBlock(headerSection, HEADER_LOGO_BLOCK_ID) : null;
  const headerMenuBlock = headerSection ? getHeaderBlock(headerSection, HEADER_MENU_BLOCK_ID) : null;
  const navigationMenus = navigationSections.filter((section) => section.type === 'menu');
  const selectedHeaderMenu = navigationMenus.find((menu) => menu.id === headerMenuBlock?.settings?.menuId)
    || navigationMenus.find((menu) => menu.layout === 'main');
  const storedMenuCase = headerMenuBlock?.settings?.case;
  const menuCaseValue = storedMenuCase === 'uppercase' || storedMenuCase === 'lowercase' ? storedMenuCase : 'default';
  const menuCaseOptions = [['default', 'Default'], ['uppercase', 'Uppercase']];
  if (storedMenuCase === 'lowercase') menuCaseOptions.push(['lowercase', 'Lowercase']);

  const updateGlobal = (patch) => {
    if (typeof onGlobalChange !== 'function') return;
    onGlobalChange(replaceSection(globalContent || {}, globalSectionId, { ...globalSection, ...patch }));
  };

  const updateNavigationMenu = (menuId, transform) => {
    if (typeof onNavigationChange !== 'function') return;
    const menu = navigationSections.find((section) => section.id === menuId);
    if (!menu) return;
    const updatedMenu = transform(menu);
    onNavigationChange({
      ...navigationContent,
      sections: navigationSections.map((section) => (section.id === menuId ? updatedMenu : section)),
    });
  };

  const updateHeaderSection = (transform) => {
    if (typeof onNavigationChange !== 'function') return;
    const nextHeaderSection = transform(headerSection || DEFAULT_HEADER_SECTION);
    const hasHeaderSection = navigationSections.some((section) => section.id === nextHeaderSection.id || section.type === 'header');
    onNavigationChange({
      ...navigationContent,
      sections: hasHeaderSection
        ? navigationSections.map((section) => (section.id === nextHeaderSection.id || section.type === 'header' ? nextHeaderSection : section))
        : [...navigationSections, nextHeaderSection],
    });
  };

  const updateHeaderSettings = (patch) => updateHeaderSection((section) => ({ ...section, settings: { ...section.settings, ...patch } }));

  const updateHeaderBlockSettings = (blockId, patch) => updateHeaderSection((section) => ({
    ...section,
    blocks: section.blocks.map((block) => block.id === blockId
      ? { ...block, settings: { ...block.settings, ...patch } }
      : block),
  }));

  const footerMenus = navigationSections.filter((section) => section.layout === 'footer');
  const socialMenu = navigationSections.find((section) => section.layout === 'social');

  return (
    <>
      <div className="shopify-editor-panel__modebar">
        <button type="button" className="shopify-icon-button" onClick={onBack} aria-label="Back to sections">‹</button>
        <div className="shopify-editor-inspector__title">
          <strong>{title}</strong>
          <small>{selectedBlockId ? 'Block settings' : sectionKey === 'header' ? 'Section settings' : 'Shared across the storefront'}</small>
        </div>
      </div>
      <div className="shopify-editor-panel__scroll shopify-editor-inspector__scroll">
        {sectionKey === 'announcement' ? (
          <Field label="Announcement text" value={globalSection.body} maxLength={5000} onChange={(body) => updateGlobal({ body })} multiline />
        ) : null}

        {sectionKey === 'header' ? <>
          {!selectedBlockId ? <>
            <EditorGroup title="Layout">
              <SegmentedField label="Logo position" value={headerSection.settings.logoPosition} options={ [['left', 'Left'], ['center', 'Center'], ['right', 'Right']] } onChange={(logoPosition) => updateHeaderSettings({ logoPosition })} />
              <SegmentedField label="Menu position" value={headerSection.settings.menuPosition} options={ [['left', 'Left'], ['center', 'Center'], ['right', 'Right']] } onChange={(menuPosition) => updateHeaderSettings({ menuPosition })} />
              <SegmentedField label="Menu row" value={headerSection.settings.menuRow} options={ [['top', 'Top'], ['bottom', 'Bottom']] } onChange={(menuRow) => updateHeaderSettings({ menuRow })} />
            </EditorGroup>
            <EditorGroup title="Customer account" className="shopify-shared-editor__account">
              <ToggleField label="Account icon" checked={Boolean(headerSection.settings.showAccount)} switchControl onChange={(showAccount) => updateHeaderSettings({ showAccount })} />
              <p className="shopify-shared-editor__help">Shows an account link in the header. Legacy customer accounts are not supported.</p>
            </EditorGroup>
            <EditorGroup title="Search" className="shopify-shared-editor__search">
              <ToggleField label="Search icon" checked={headerSection.settings.showSearch} onChange={(showSearch) => updateHeaderSettings({ showSearch })} />
              {headerSection.settings.showSearch ? <>
                <SegmentedField label="Position" value={headerSection.settings.searchPosition} options={ [['left', 'Left'], ['right', 'Right']] } onChange={(searchPosition) => updateHeaderSettings({ searchPosition })} />
                <SegmentedField label="Row" value={headerSection.settings.searchRow} options={ [['top', 'Top'], ['bottom', 'Bottom']] } onChange={(searchRow) => updateHeaderSettings({ searchRow })} />
              </> : null}
            </EditorGroup>
            <EditorGroup title="Localization" className="shopify-shared-editor__localization">
              <ToggleField label="Country/region" checked={headerSection.settings.showCountrySelector} switchControl onChange={(showCountrySelector) => updateHeaderSettings({ showCountrySelector })} />
              {headerSection.settings.showCountrySelector ? <>
                <p className="shopify-shared-editor__help">Uses enabled shipping destinations. A storefront selector appears when more than one destination is available; prices stay in USD.</p>
                <ToggleField label="Show flag" checked={headerSection.settings.showCountryFlag} switchControl onChange={(showCountryFlag) => updateHeaderSettings({ showCountryFlag })} />
                <SegmentedField label="Position" value={headerSection.settings.countryPosition} options={ [['left', 'Left'], ['right', 'Right']] } onChange={(countryPosition) => updateHeaderSettings({ countryPosition })} />
                <SegmentedField label="Row" value={headerSection.settings.countryRow} options={ [['top', 'Top'], ['bottom', 'Bottom']] } onChange={(countryRow) => updateHeaderSettings({ countryRow })} />
              </> : null}
              <ToggleField label="Language selector" checked={Boolean(headerSection.settings.showLanguageSelector)} switchControl onChange={(showLanguageSelector) => updateHeaderSettings({ showLanguageSelector })} />
              {headerSection.settings.showLanguageSelector ? <>
                <SegmentedField label="Font" value={headerSection.settings.languageFont || 'body'} options={ [['body', 'Body'], ['heading', 'Heading'], ['subheading', 'Subheading'], ['accent', 'Accent']] } onChange={(languageFont) => updateHeaderSettings({ languageFont })} />
                <RangeField label="Size" value={headerSection.settings.languageSize ?? 12} min={10} max={18} onChange={(languageSize) => updateHeaderSettings({ languageSize })} />
                <SegmentedField label="Position" value={headerSection.settings.languagePosition || 'left'} options={ [['left', 'Left'], ['right', 'Right']] } onChange={(languagePosition) => updateHeaderSettings({ languagePosition })} />
                <SegmentedField label="Row" value={headerSection.settings.languageRow || 'top'} options={ [['top', 'Top'], ['bottom', 'Bottom']] } onChange={(languageRow) => updateHeaderSettings({ languageRow })} />
              </> : <p className="shopify-shared-editor__help">English only. Add translated storefront content to enable other languages.</p>}
            </EditorGroup>
            <EditorGroup title="Appearance">
              <SegmentedField label="Width" value={headerSection.settings.width} options={ [['page', 'Page'], ['full', 'Full']] } onChange={(width) => updateHeaderSettings({ width })} />
              <SegmentedField label="Height" value={headerSection.settings.height} options={ [['compact', 'Compact'], ['standard', 'Standard']] } onChange={(height) => updateHeaderSettings({ height })} />
              <SegmentedField label="Sticky header" value={headerSection.settings.stickyMode} options={ [['always', 'Always'], ['on-scroll-up', 'On scroll up'], ['never', 'Never']] } onChange={(stickyMode) => updateHeaderSettings({ stickyMode })} />
              <RangeField label="Border thickness" value={headerSection.settings.borderThickness} min={0} max={8} onChange={(borderThickness) => updateHeaderSettings({ borderThickness })} />
            </EditorGroup>
            <EditorGroup title="Colors">
              <HeaderColorSchemeField value={headerSection.settings.colorScheme} onChange={(colorScheme) => updateHeaderSettings({ colorScheme })} themeColors={themeColors} onEditScheme={onOpenThemeSettings} name="header-color-scheme" help="Used when the Header background is solid." />
            </EditorGroup>
            <EditorGroup title="Transparency">
              <ToggleField label="Home page" checked={headerSection.settings.transparentHome} onChange={(transparentHome) => updateHeaderSettings({ transparentHome })} />
              {headerSection.settings.transparentHome ? <HeaderColorSchemeField label="Home page color scheme" name="header-home-color-scheme" value={headerSection.settings.homeScheme} fallback="scheme5" onChange={(homeScheme) => updateHeaderSettings({ homeScheme })} themeColors={themeColors} onEditScheme={onOpenThemeSettings} /> : null}
              <ToggleField label="Product pages" checked={headerSection.settings.transparentProduct} onChange={(transparentProduct) => updateHeaderSettings({ transparentProduct })} />
              <ToggleField label="Collection pages" checked={headerSection.settings.transparentCollection} onChange={(transparentCollection) => updateHeaderSettings({ transparentCollection })} />
            </EditorGroup>
          </> : null}

          {selectedBlockId === HEADER_LOGO_BLOCK_ID ? <>
            <EditorGroup title="Visibility">
              <ToggleField label="Hide logo on home page" checked={logoBlock.settings.hideOnHome} onChange={(hideOnHome) => updateHeaderBlockSettings(HEADER_LOGO_BLOCK_ID, { hideOnHome })} />
              <p className="shopify-shared-editor__help">Logo will remain visible when sticky header is active</p>
            </EditorGroup>
            <EditorGroup title="Desktop padding">
              <RangeField label="Top" value={logoBlock.settings.paddingTop} onChange={(paddingTop) => updateHeaderBlockSettings(HEADER_LOGO_BLOCK_ID, { paddingTop })} numericInput />
              <RangeField label="Bottom" value={logoBlock.settings.paddingBottom} onChange={(paddingBottom) => updateHeaderBlockSettings(HEADER_LOGO_BLOCK_ID, { paddingBottom })} numericInput />
              <RangeField label="Left" value={logoBlock.settings.paddingLeft} onChange={(paddingLeft) => updateHeaderBlockSettings(HEADER_LOGO_BLOCK_ID, { paddingLeft })} numericInput />
              <RangeField label="Right" value={logoBlock.settings.paddingRight} onChange={(paddingRight) => updateHeaderBlockSettings(HEADER_LOGO_BLOCK_ID, { paddingRight })} numericInput />
            </EditorGroup>
          </> : null}

          {selectedBlockId === HEADER_MENU_BLOCK_ID ? <EditorGroup title="Settings">
              {navigationMenus.length ? <SelectField
                label="Menu"
                value={selectedHeaderMenu?.id || ''}
                options={navigationMenus.map((menu) => [menu.id, menu.heading || 'Untitled menu'])}
                onChange={(menuId) => updateHeaderBlockSettings(HEADER_MENU_BLOCK_ID, { menuId })}
              /> : <p className="shopify-editor-inspector__empty">No navigation menus are configured.</p>}
              <HeaderColorSchemeField value={headerMenuBlock.settings.colorScheme} name="header-menu-color-scheme" onChange={(colorScheme) => updateHeaderBlockSettings(HEADER_MENU_BLOCK_ID, { colorScheme })} themeColors={themeColors} onEditScheme={onOpenThemeSettings} help="Controls the menu text and link colors." />
              <SegmentedField label="Font" value={headerMenuBlock.settings.font} options={ [['body', 'Body'], ['heading', 'Heading'], ['subheading', 'Subheading'], ['accent', 'Accent']] } onChange={(font) => updateHeaderBlockSettings(HEADER_MENU_BLOCK_ID, { font })} />
              <RangeField label="Top-level size" value={headerMenuBlock.settings.topLevelSize} min={10} max={18} onChange={(topLevelSize) => updateHeaderBlockSettings(HEADER_MENU_BLOCK_ID, { topLevelSize })} />
              <SegmentedField label="Submenu size" value={headerMenuBlock.settings.submenuSize || 'medium'} options={ [['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']] } onChange={(submenuSize) => updateHeaderBlockSettings(HEADER_MENU_BLOCK_ID, { submenuSize })} />
              <SegmentedField label="Submenu font" value={headerMenuBlock.settings.submenuFont || headerMenuBlock.settings.font || 'body'} options={ [['body', 'Body'], ['heading', 'Heading'], ['subheading', 'Subheading'], ['accent', 'Accent']] } onChange={(submenuFont) => updateHeaderBlockSettings(HEADER_MENU_BLOCK_ID, { submenuFont })} />
              <SegmentedField label="Case" value={menuCaseValue} options={menuCaseOptions} onChange={(value) => updateHeaderBlockSettings(HEADER_MENU_BLOCK_ID, { case: value })} />
              <SegmentedField label="Feature media" value={headerMenuBlock.settings.submenuFeatureMedia || 'none'} options={ [['none', 'None'], ['collection-images', 'Collection images'], ['featured-products', 'Featured products'], ['featured-collections', 'Featured collections']] } onChange={(submenuFeatureMedia) => updateHeaderBlockSettings(HEADER_MENU_BLOCK_ID, { submenuFeatureMedia })} />
              {headerMenuBlock.settings.submenuFeatureMedia && headerMenuBlock.settings.submenuFeatureMedia !== 'none' ? <>
                <SegmentedField label="Image ratio" value={headerMenuBlock.settings.submenuImageRatio || 'auto'} options={ [['auto', 'Auto'], ['portrait', 'Portrait'], ['square', 'Square']] } onChange={(submenuImageRatio) => updateHeaderBlockSettings(HEADER_MENU_BLOCK_ID, { submenuImageRatio })} />
                <RangeField label="Image corner radius" value={headerMenuBlock.settings.submenuImageCornerRadius ?? 0} min={0} max={24} onChange={(submenuImageCornerRadius) => updateHeaderBlockSettings(HEADER_MENU_BLOCK_ID, { submenuImageCornerRadius })} />
                <p className="shopify-shared-editor__help">Features are populated from your menu links.</p>
              </> : null}
              <div className="shopify-shared-editor__toggle-group" aria-label="Mobile layout">
                <strong>Mobile layout</strong>
                <ToggleField label="Navigation bar" checked={headerMenuBlock.settings.mobileNavigationBar} onChange={(mobileNavigationBar) => updateHeaderBlockSettings(HEADER_MENU_BLOCK_ID, { mobileNavigationBar })} />
                <ToggleField label="Accordion" checked={Boolean(headerMenuBlock.settings.mobileAccordion)} onChange={(mobileAccordion) => updateHeaderBlockSettings(HEADER_MENU_BLOCK_ID, { mobileAccordion })} />
                <ToggleField label="Dividers" checked={headerMenuBlock.settings.mobileDividers} onChange={(mobileDividers) => updateHeaderBlockSettings(HEADER_MENU_BLOCK_ID, { mobileDividers })} />
              </div>
              <Link className="shopify-shared-editor__navigation-link" href="/admin/editor/navigation">Edit menu links in Navigation <span aria-hidden="true">↗</span></Link>
            </EditorGroup> : null}
        </> : null}

        {sectionKey === 'newsletter' ? (
          <EditorGroup title="Newsletter sign-up">
            <Field label="Eyebrow" value={globalSection.eyebrow} maxLength={120} onChange={(eyebrow) => updateGlobal({ eyebrow })} />
            <Field label="Heading" value={globalSection.heading} maxLength={240} onChange={(heading) => updateGlobal({ heading })} />
            <Field label="Text" value={globalSection.body} maxLength={5000} onChange={(body) => updateGlobal({ body })} multiline />
          </EditorGroup>
        ) : null}

        {sectionKey === 'footer' ? (
          <>
            <EditorGroup title="Footer text">
              <Field label="Tagline" value={globalSection.body} maxLength={5000} onChange={(body) => updateGlobal({ body })} multiline />
              <Field label="Small line under the tagline" value={globalSection.note} maxLength={600} onChange={(note) => updateGlobal({ note })} />
            </EditorGroup>
            <EditorGroup title="Footer columns">
              <SortableList
                items={footerMenus}
                onReorder={(fromIndex, toIndex) => {
                  const reorderedMenus = moveItem(footerMenus, fromIndex, toIndex);
                  let menuIndex = 0;
                  onNavigationChange?.({
                    ...navigationContent,
                    sections: navigationSections.map((section) => section.layout === 'footer' ? reorderedMenus[menuIndex++] : section),
                  });
                }}
                renderItem={(menu, _index, dragHandle) => (
                  <div className="shopify-shared-editor__footer-menu">
                    <div className="shopify-shared-editor__footer-menu-heading">
                      <span {...dragHandle} className="shopify-editor-section__drag"><SharedEditorIcon name="drag" /></span>
                      <Field
                        label="Column title"
                        value={menu.heading}
                        maxLength={100}
                        onChange={(heading) => updateNavigationMenu(menu.id, (currentMenu) => ({ ...currentMenu, heading }))}
                      />
                      <button
                        type="button"
                        className="shopify-shared-editor__remove"
                        aria-label={`Remove ${menu.heading || 'untitled'} footer column`}
                        onClick={() => onNavigationChange?.({
                          ...navigationContent,
                          sections: navigationSections.filter((section) => section.id !== menu.id),
                        })}
                      >
                        Remove
                      </button>
                    </div>
                    <MenuLinks menu={menu} onChange={(nextMenu) => updateNavigationMenu(menu.id, () => nextMenu)} />
                  </div>
                )}
              />
              <button
                type="button"
                className="admin-button admin-button--ghost"
                onClick={() => onNavigationChange?.({
                  ...navigationContent,
                  sections: [...navigationSections, { id: newId('footer'), type: 'menu', layout: 'footer', heading: 'New column', cards: [] }],
                })}
                disabled={footerMenus.length >= 6}
              >
                Add column
              </button>
            </EditorGroup>
            {socialMenu ? (
              <EditorGroup title="Social links">
                <MenuLinks menu={socialMenu} external onChange={(nextMenu) => updateNavigationMenu(socialMenu.id, () => nextMenu)} />
              </EditorGroup>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
}
