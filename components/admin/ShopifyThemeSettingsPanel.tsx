'use client';

import { useEffect, useState } from 'react';
import {
  COLOR_SCHEME_GROUPS,
  COLOR_SCHEME_NUMBERS,
  DEFAULT_COLOR_SCHEMES,
  THEME_FONT_FAMILIES,
  THEME_COLORS,
  colorSchemeWarnings,
  isHexColor,
  isThemeColorValue,
  isTransparentColor,
  isThemeValid,
  themeWarnings,
  themesEqual,
  THEME_TYPOGRAPHY_PRESETS,
  DEFAULT_TYPOGRAPHY,
  getThemeFontStyles,
  normalizeTypography,
  isTypographyValid,
} from '@/lib/theme';

const THEME_CATEGORIES = [
  'Logo and favicon', 'Colors', 'Typography', 'Page layout', 'Animations', 'Badges',
  'Buttons', 'Cart', 'Drawers', 'Icons', 'Input fields', 'Popovers and modals',
  'Prices', 'Product cards', 'Search', 'Swatches', 'Variant pickers', 'Custom CSS',
];

function schemePreviewColor(value, fallback) {
  return isTransparentColor(value) ? fallback : value;
}

function SchemePreview({ scheme }) {
  const transparentBackground = isTransparentColor(scheme.base.background);
  const readableTextTreatment = transparentBackground ? {
    textShadow: '0 0 2px #fff, 0 0 3px #fff',
    WebkitTextStroke: '0.25px #303030',
  } : {};
  return (
    <span className={`shopify-theme-settings__scheme-preview${transparentBackground ? ' is-transparent' : ''}`} style={{ backgroundColor: transparentBackground ? 'transparent' : scheme.base.background }} aria-hidden="true">
      <strong style={{ ...readableTextTreatment, color: schemePreviewColor(scheme.base.headings, '#303030') }}>Aa</strong>
      <span style={{ ...readableTextTreatment, color: schemePreviewColor(scheme.base.links, '#005bd3') }}>Link</span>
      <i style={{
        ...readableTextTreatment,
        backgroundColor: schemePreviewColor(scheme.primaryButton.background, '#303030'),
        color: schemePreviewColor(scheme.primaryButton.text, '#ffffff'),
        borderColor: schemePreviewColor(scheme.primaryButton.borders, '#303030'),
      }}>Button</i>
    </span>
  );
}

const TYPOGRAPHY_FONT_ROLES = [
  { key: 'body', label: 'Body' },
  { key: 'subheading', label: 'Subheading' },
  { key: 'heading', label: 'Heading' },
  { key: 'accent', label: 'Accent' },
];

const FONT_ROLE_OPTIONS = {
  heading: ['heading', 'accent'],
  subheading: ['heading', 'accent', 'subheading', 'body'],
  body: ['heading', 'accent', 'subheading', 'body'],
};

const FONT_SIZE_OPTIONS = {
  paragraph: [10, 12, 14, 16, 18],
  h1: [10, 12, 14, 16, 18, 20, 24, 32, 40, 48, 56, 72, 88, 120, 152, 184],
  h2: [10, 12, 14, 16, 18, 20, 24, 32, 40, 48, 56, 72, 88, 120, 152, 184],
  h3: [10, 12, 14, 16, 18, 20, 24, 32, 40, 48, 56, 72, 88, 120, 152, 184],
  h4: [10, 12, 14, 16, 18, 20, 24, 32, 40, 48, 56, 72, 88, 120, 152, 184],
  h5: [10, 12, 14, 16, 18, 20, 24, 32, 40, 48, 56, 72, 88, 120, 152, 184],
  h6: [10, 12, 14, 16, 18, 20, 24, 32, 40, 48, 56, 72, 88, 120, 152, 184],
};

const LINE_HEIGHT_OPTIONS = [
  { label: 'Tight', value: 0.9 },
  { label: 'Normal', value: 1.2 },
  { label: 'Loose', value: 1.5 },
];

const LETTER_SPACING_OPTIONS = [
  { label: 'Tight', value: '-0.04em' },
  { label: 'Normal', value: '0em' },
  { label: 'Loose', value: '0.08em' },
];

const FONT_STYLE_LABELS = {
  '300': 'Light', '400': 'Regular', '500': 'Medium', '600': 'Semibold',
  italic: 'Italic', 'italic-300': 'Light italic', 'italic-400': 'Regular italic',
  'italic-500': 'Medium italic', 'italic-600': 'Semibold italic',
};

function fontWeight(style) {
  return style.startsWith('italic-') ? style.slice(7) : style === 'italic' ? '400' : style;
}

function fontStyle(style) {
  return style === 'italic' || style.startsWith('italic-') ? 'italic' : 'normal';
}

function FontPicker({ role, value, disabled, onDone }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [fontGroup, setFontGroup] = useState('system');
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (!isOpen) setDraft(value);
  }, [value, isOpen]);

  const systemFontValues = ['system-ui', 'Arial', 'Georgia'];
  const visibleFonts = THEME_FONT_FAMILIES.filter(({ value: family }) => (fontGroup === 'system'
    ? systemFontValues.includes(family)
    : !systemFontValues.includes(family)))
    .filter(({ label }) => label.toLowerCase().includes(search.trim().toLowerCase()));
  const openPicker = () => {
    setDraft(value);
    setSearch('');
    setFontGroup(systemFontValues.includes(value.family) ? 'system' : 'other');
    setIsOpen(true);
  };
  const availableStyles = getThemeFontStyles(draft.family);
  const updateFamily = (family) => setDraft((current) => {
    const supportedStyles = getThemeFontStyles(family);
    const style = supportedStyles.includes(current.style)
      ? current.style
      : supportedStyles.includes('400') ? '400' : supportedStyles[0];
    return { family, style };
  });
  const closePicker = () => setIsOpen(false);

  return (
    <div className="shopify-theme-settings__font-control">
      <span className="shopify-theme-settings__field-label">{role.label}</span>
      <button type="button" className="shopify-theme-settings__font-trigger" onClick={openPicker} disabled={disabled} aria-expanded={isOpen}>
        <span className="shopify-theme-settings__font-swatch" style={{ fontFamily: THEME_FONT_FAMILIES.find(({ value: family }) => family === value.family)?.css, fontStyle: fontStyle(value.style), fontWeight: fontWeight(value.style) }} aria-hidden="true">Aa</span>
        <span className="shopify-theme-settings__font-trigger-copy"><strong>{value.family}</strong><small>{FONT_STYLE_LABELS[value.style]}</small></span>
        <span className="shopify-theme-settings__chevron" aria-hidden="true">⌄</span>
      </button>
      {isOpen ? <>
        <button type="button" className="shopify-theme-settings__font-picker-backdrop" onClick={closePicker} aria-label={`Close ${role.label} font picker`} />
        <div className="shopify-theme-settings__font-picker" role="dialog" aria-label={`${role.label} font picker`}>
        <div className="shopify-theme-settings__font-picker-head"><strong>{role.label} font</strong><button type="button" onClick={closePicker} aria-label="Close font picker">×</button></div>
        <label className="shopify-theme-settings__font-search"><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search fonts" autoFocus /></label>
        <div className="shopify-theme-settings__font-tabs" role="tablist" aria-label="Font categories">
          {[['system', 'System fonts'], ['other', 'Other fonts']].map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={fontGroup === key} className={fontGroup === key ? 'is-active' : ''} onClick={() => setFontGroup(key)}>{label}</button>)}
        </div>
        <div className="shopify-theme-settings__font-list">
          {visibleFonts.length ? visibleFonts.map(({ value: family, label, css }) => <button type="button" key={family} className={`shopify-theme-settings__font-option${draft.family === family ? ' is-selected' : ''}`} onClick={() => updateFamily(family)}>
            <span style={{ fontFamily: css }} aria-hidden="true">Aa</span><strong>{label}</strong>{draft.family === family ? <span className="shopify-theme-settings__font-check" aria-label="Selected">✓</span> : null}
          </button>) : <p className="shopify-theme-settings__font-empty">No fonts match “{search}”.</p>}
        </div>
        <label className="shopify-theme-settings__font-style"><span>Style</span><select value={draft.style} onChange={(event) => setDraft((current) => ({ ...current, style: event.target.value }))}>{availableStyles.map((style) => <option value={style} key={style}>{FONT_STYLE_LABELS[style]}</option>)}</select></label>
        <div className="shopify-theme-settings__font-picker-actions"><button type="button" onClick={closePicker}>Cancel</button><button type="button" className="is-primary" onClick={() => { onDone(draft); closePicker(); }}>Done</button></div>
        </div>
      </> : null}
    </div>
  );
}

function PresetEditor({ presetKey, preset, disabled, typography, onChange }) {
  const headingNumber = Number(presetKey.slice(1));
  const previewStyle = {
    fontFamily: preset.font ? THEME_FONT_FAMILIES.find(({ value }) => value === typography.fonts[preset.font].family)?.css : THEME_FONT_FAMILIES.find(({ value }) => value === typography.fonts.body.family)?.css,
    fontWeight: preset.font ? fontWeight(typography.fonts[preset.font].style) : fontWeight(typography.fonts.body.style),
    fontStyle: preset.font ? fontStyle(typography.fonts[preset.font].style) : fontStyle(typography.fonts.body.style),
    fontSize: `${preset.size}px`,
    lineHeight: preset.lineHeight,
    letterSpacing: preset.letterSpacing || 0,
    textTransform: preset.case === 'none' ? 'none' : preset.case,
  };
  const summaryPreviewStyle = { ...previewStyle, fontSize: `${Math.min(preset.size, 20)}px`, lineHeight: 1 };
  const update = (field, value) => onChange({ ...preset, [field]: value });
  return <details className="shopify-theme-settings__preset" open={presetKey === 'paragraph'}>
    <summary><span className="shopify-theme-settings__preset-title">{presetKey === 'paragraph' ? 'Paragraph' : `H${headingNumber}`}</span><span className="shopify-theme-settings__preset-sample" style={summaryPreviewStyle}>Aa</span><span className="shopify-theme-settings__preset-meta">{preset.size}px <i aria-hidden="true">·</i> {LINE_HEIGHT_OPTIONS.find(({ value }) => value === preset.lineHeight)?.label || 'Custom'}</span></summary>
    <div className="shopify-theme-settings__preset-fields">
      {presetKey !== 'paragraph' ? <label className="shopify-theme-settings__setting-field"><span>Font</span><select value={preset.font} onChange={(event) => update('font', event.target.value)} disabled={disabled}>{(headingNumber <= 2 ? FONT_ROLE_OPTIONS.heading : FONT_ROLE_OPTIONS.subheading).map((fontRole) => <option key={fontRole} value={fontRole}>{TYPOGRAPHY_FONT_ROLES.find(({ key }) => key === fontRole)?.label}</option>)}</select></label> : null}
      <label className="shopify-theme-settings__setting-field"><span>Size</span><select value={preset.size} onChange={(event) => update('size', Number(event.target.value))} disabled={disabled}>{!FONT_SIZE_OPTIONS[presetKey].includes(preset.size) ? <option value={preset.size}>Custom ({preset.size}px)</option> : null}{FONT_SIZE_OPTIONS[presetKey].map((size) => <option key={size} value={size}>{size}px</option>)}</select></label>
      <label className="shopify-theme-settings__setting-field"><span>Line height</span><select value={preset.lineHeight} onChange={(event) => update('lineHeight', Number(event.target.value))} disabled={disabled}>{!LINE_HEIGHT_OPTIONS.some(({ value }) => value === preset.lineHeight) ? <option value={preset.lineHeight}>Custom ({preset.lineHeight})</option> : null}{LINE_HEIGHT_OPTIONS.map(({ label, value }) => <option key={label} value={value}>{label}</option>)}</select></label>
      {presetKey !== 'paragraph' ? <>
        <label className="shopify-theme-settings__setting-field"><span>Letter spacing</span><select value={preset.letterSpacing} onChange={(event) => update('letterSpacing', event.target.value)} disabled={disabled}>{!LETTER_SPACING_OPTIONS.some(({ value }) => value === preset.letterSpacing) ? <option value={preset.letterSpacing}>Custom ({preset.letterSpacing})</option> : null}{LETTER_SPACING_OPTIONS.map(({ label, value }) => <option key={label} value={value}>{label}</option>)}</select></label>
        <label className="shopify-theme-settings__setting-field"><span>Case</span><select value={preset.case} onChange={(event) => update('case', event.target.value)} disabled={disabled}>{!['none', 'uppercase'].includes(preset.case) ? <option value={preset.case}>Custom ({preset.case})</option> : null}{[['none', 'Default'], ['uppercase', 'Uppercase']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </> : null}
    </div>
  </details>;
}

export default function ShopifyThemeSettingsPanel({ colors, savedColors, onChange, canManageSettings, saving = false, requestedScheme = null, onSchemeRequestHandled }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeScheme, setActiveScheme] = useState(1);
  useEffect(() => {
    if (!requestedScheme?.requestId) return;
    const number = Number(requestedScheme.number);
    if (COLOR_SCHEME_NUMBERS.includes(number)) {
      setActiveCategory('Colors');
      setActiveScheme(number);
    }
    onSchemeRequestHandled?.(requestedScheme.requestId);
  }, [requestedScheme, onSchemeRequestHandled]);
  const dirty = !themesEqual(colors, savedColors);
  const allColorsValid = isThemeValid({ ...colors, typography: DEFAULT_TYPOGRAPHY });
  const typography = normalizeTypography(colors.typography || DEFAULT_TYPOGRAPHY);
  const allTypographyValid = isTypographyValid(colors.typography || DEFAULT_TYPOGRAPHY);
  const schemeKey = `scheme${activeScheme}`;
  const scheme = colors.colorSchemes[schemeKey];
  const warnings = [...themeWarnings(colors), ...colorSchemeWarnings(colors, activeScheme)];

  const updateBrandColor = (key, value) => onChange({ ...colors, [key]: value });

  const updateTypographyFont = (role, font) => onChange({
    ...colors,
    typography: { ...typography, fonts: { ...typography.fonts, [role]: font } },
  });

  const updateTypographyPreset = (presetKey, preset) => onChange({
    ...colors,
    typography: {
      ...typography,
      presets: { ...typography.presets, [presetKey]: preset },
    },
  });

  const updateSchemeRole = (groupKey, role, value) => onChange({
    ...colors,
    colorSchemes: {
      ...colors.colorSchemes,
      [schemeKey]: {
        ...colors.colorSchemes[schemeKey],
        [groupKey]: { ...colors.colorSchemes[schemeKey][groupKey], [role]: value },
      },
    },
  });

  const resetScheme = () => onChange({
    ...colors,
    colorSchemes: { ...colors.colorSchemes, [schemeKey]: DEFAULT_COLOR_SCHEMES[schemeKey] },
  });

  const resetBrandColors = () => onChange({
    ...colors,
    ...Object.fromEntries(THEME_COLORS.map(({ key, default: value }) => [key, value])),
  });

  const discard = () => onChange({ ...savedColors });

  return (
    <aside className="shopify-editor-panel shopify-editor-panel--aux shopify-theme-settings" aria-label="Theme settings">
      <div className="shopify-editor-panel__modebar">
        {activeCategory ? <button type="button" className="shopify-icon-button" onClick={() => setActiveCategory(null)} aria-label="Back to theme settings">‹</button> : <span className="shopify-editor-panel__mode-icon" aria-hidden="true">◐</span>}
        <strong>{activeCategory || 'Theme settings'}</strong>
      </div>

      {!activeCategory ? (
        <div className="shopify-editor-panel__scroll shopify-theme-settings__categories">
          <p className="shopify-editor-aux__intro">Shared storefront settings. Color schemes, typography, and the byShreen brand palette are editable here.</p>
          {THEME_CATEGORIES.map((category) => {
            const available = category === 'Colors' || category === 'Typography';
            return (
              <button type="button" className="shopify-editor-aux__row" key={category} onClick={() => setActiveCategory(category)}>
                <span>{category}</span>
                <span className={available ? 'shopify-theme-settings__available' : 'shopify-theme-settings__unavailable'}>{category === 'Colors' ? '8' : category === 'Typography' ? '4 roles' : 'Not set up'}</span>
              </button>
            );
          })}
        </div>
      ) : activeCategory === 'Colors' ? (
        <div className="shopify-editor-panel__scroll shopify-theme-settings__color-editor">
          <p className="shopify-editor-aux__intro">Select a numbered scheme, then edit its six Shopify color groups.</p>
          {!canManageSettings ? <div className="shopify-editor-aux__empty" role="status"><strong>Owner access required</strong><span>Only an owner can change shared storefront colors.</span></div> : null}
          <div className="shopify-theme-settings__scheme-grid" aria-label="Shopify color schemes">
            {COLOR_SCHEME_NUMBERS.map((number) => {
              const selectedKey = `scheme${number}`;
              return (
                <button type="button" key={selectedKey} className={`shopify-theme-settings__scheme-choice${activeScheme === number ? ' is-active' : ''}`} aria-pressed={activeScheme === number} onClick={() => setActiveScheme(number)}>
                  <span className="shopify-theme-settings__scheme-number">{number}</span>
                  <SchemePreview scheme={colors.colorSchemes[selectedKey]} />
                </button>
              );
            })}
          </div>
          <div className="shopify-theme-settings__scheme-detail">
            <div className="shopify-theme-settings__scheme-heading">
              <strong>Scheme {activeScheme}</strong>
              <button type="button" onClick={resetScheme} disabled={!canManageSettings || saving || COLOR_SCHEME_GROUPS.every((group) => group.roles.every(({ key }) => scheme[group.key][key] === DEFAULT_COLOR_SCHEMES[schemeKey][group.key][key]))}>Reset scheme</button>
            </div>
            {COLOR_SCHEME_GROUPS.map((group) => (
              <section className="shopify-theme-settings__role-group" key={group.key}>
                <h3>{group.label}</h3>
                {group.roles.map(({ key, label }) => {
                  const value = scheme[group.key][key];
                  const valid = isThemeColorValue(value);
                  const transparent = isTransparentColor(value);
                  const defaultValue = DEFAULT_COLOR_SCHEMES[schemeKey][group.key][key];
                  const restoreColor = isHexColor(defaultValue) ? defaultValue : '#FFFFFF';
                  return (
                    <div className="shopify-theme-settings__color" key={`${group.key}-${key}`}>
                      <label className={`shopify-theme-settings__picker${transparent ? ' is-transparent' : ''}`} style={{ backgroundColor: valid ? value : 'transparent' }} title={`Choose ${group.label} ${label}`}>
                        <input type="color" value={valid && !transparent ? value : restoreColor} onChange={(event) => updateSchemeRole(group.key, key, event.target.value)} disabled={!canManageSettings || saving} aria-label={`${group.label} ${label} color picker`} />
                      </label>
                      <strong className="shopify-theme-settings__role-label">{label}</strong>
                      <div className="shopify-theme-settings__hex-controls">
                        <input className={`shopify-theme-settings__hex${valid ? '' : ' is-invalid'}`} value={value} maxLength={11} spellCheck={false} onChange={(event) => {
                          const nextValue = event.target.value.trim();
                          updateSchemeRole(group.key, key, nextValue.toLowerCase() === 'transparent' ? 'transparent' : nextValue && !nextValue.startsWith('#') ? `#${nextValue}` : nextValue);
                        }} disabled={!canManageSettings || saving} aria-label={`${group.label} ${label} hex value`} aria-invalid={!valid} />
                        <button type="button" className="shopify-theme-settings__reset-color" aria-label={transparent ? `Use a solid color for ${label}` : `Set ${label} to transparent`} title={transparent ? 'Use color' : 'Set transparent'} aria-pressed={transparent} onClick={() => updateSchemeRole(group.key, key, transparent ? restoreColor : 'transparent')} disabled={!canManageSettings || saving}>
                          {transparent ? 'Solid' : 'Clear'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </section>
            ))}
          </div>

          <details className="shopify-theme-settings__brand">
            <summary>byShreen brand colors <span>7</span></summary>
            <div className="shopify-theme-settings__color-list">
              {THEME_COLORS.map((color) => {
                const value = colors[color.key];
                const valid = isHexColor(value);
                return (
                  <div className="shopify-theme-settings__color" key={color.key}>
                    <label className="shopify-theme-settings__picker" style={{ backgroundColor: valid ? value : 'transparent' }} title={`Choose ${color.label}`}>
                      <input type="color" value={valid ? value : '#000000'} onChange={(event) => updateBrandColor(color.key, event.target.value)} disabled={!canManageSettings || saving} aria-label={`${color.label} color picker`} />
                    </label>
                    <div className="shopify-theme-settings__color-copy"><strong>{color.label}</strong><small>{color.help}</small></div>
                    <input className={`shopify-theme-settings__hex${valid ? '' : ' is-invalid'}`} value={value} maxLength={7} spellCheck={false} onChange={(event) => {
                      const nextValue = event.target.value.trim();
                      updateBrandColor(color.key, nextValue && !nextValue.startsWith('#') ? `#${nextValue}` : nextValue);
                    }} disabled={!canManageSettings || saving} aria-label={`${color.label} hex value`} aria-invalid={!valid} />
                    {value !== color.default ? <button type="button" className="shopify-theme-settings__reset-color shopify-theme-settings__brand-color-reset" onClick={() => updateBrandColor(color.key, color.default)} disabled={!canManageSettings || saving} title={`Reset to ${color.default}`}>Reset</button> : null}
                  </div>
                );
              })}
              {canManageSettings ? <button type="button" className="shopify-theme-settings__brand-reset" onClick={resetBrandColors} disabled={saving || THEME_COLORS.every((color) => colors[color.key] === color.default)}>Reset brand colors</button> : null}
            </div>
          </details>

          {warnings.length ? <div className="shopify-theme-settings__warnings" role="status"><strong>Contrast needs attention</strong>{warnings.map((warning) => <p key={warning}>{warning}</p>)}</div> : null}
          {canManageSettings ? <div className="shopify-theme-settings__actions">
            <button type="button" onClick={discard} disabled={!dirty || saving}>Discard</button>
            <span>Save changes from the editor toolbar.</span>
          </div> : null}
          <p className="shopify-theme-settings__status" role="status">{dirty ? 'Unsaved theme changes' : 'Saved'}{saving ? ' · Saving…' : ''}</p>
          {!canManageSettings ? <p className="shopify-theme-settings__status">Editing and saving are disabled for this role.</p> : null}
          {!allColorsValid ? <p className="shopify-theme-settings__status is-error" role="alert">Correct invalid hex values before saving from the toolbar.</p> : null}
        </div>
      ) : activeCategory === 'Typography' ? (
        <div className="shopify-editor-panel__scroll shopify-theme-settings__typography-editor">
          <p className="shopify-editor-aux__intro">Choose the storefront fonts, then tune the text presets used across your theme.</p>
          {!canManageSettings ? <div className="shopify-editor-aux__empty" role="status"><strong>Owner access required</strong><span>Only an owner can change shared storefront typography.</span></div> : null}
          <section className="shopify-theme-settings__typography-group" aria-labelledby="shopify-theme-fonts-heading">
            <h3 id="shopify-theme-fonts-heading">Fonts</h3>
            <p>Assign a typeface and style for each role.</p>
            <div className="shopify-theme-settings__font-grid">
              {TYPOGRAPHY_FONT_ROLES.map((role) => <FontPicker key={role.key} role={role} value={typography.fonts[role.key]} disabled={!canManageSettings || saving} onDone={(font) => updateTypographyFont(role.key, font)} />)}
            </div>
          </section>
          <section className="shopify-theme-settings__typography-group" aria-labelledby="shopify-theme-presets-heading">
            <h3 id="shopify-theme-presets-heading">Text presets</h3>
            <p>Set how paragraphs and headings appear throughout the storefront.</p>
            <p className="shopify-theme-settings__responsive-note">Edited desktop sizes scale down on screens narrower than 1000px.</p>
            <div className="shopify-theme-settings__preset-list">
              {THEME_TYPOGRAPHY_PRESETS.map((presetKey) => <PresetEditor key={presetKey} presetKey={presetKey} preset={typography.presets[presetKey]} typography={typography} disabled={!canManageSettings || saving} onChange={(nextPreset) => updateTypographyPreset(presetKey, nextPreset)} />)}
            </div>
          </section>
          {canManageSettings ? <div className="shopify-theme-settings__actions">
            <button type="button" onClick={discard} disabled={!dirty || saving}>Discard</button>
            <span>Save changes from the editor toolbar.</span>
          </div> : null}
          <p className="shopify-theme-settings__status" role="status">{dirty ? 'Unsaved theme changes' : 'Saved'}{saving ? ' · Saving…' : ''}</p>
          {!canManageSettings ? <p className="shopify-theme-settings__status">Editing and saving are disabled for this role.</p> : null}
          {!allTypographyValid ? <p className="shopify-theme-settings__status is-error" role="alert">Correct unsupported typography values before saving from the toolbar.</p> : null}
        </div>
      ) : (
        <div className="shopify-editor-panel__scroll">
          <div className="shopify-editor-aux__empty" role="status">
            <strong>{activeCategory} isn’t configured</strong>
            <span>This storefront does not have local theme settings for this group yet. No controls are available here.</span>
          </div>
          {dirty ? <p className="shopify-theme-settings__status">Theme changes are still unsaved.</p> : null}
        </div>
      )}
      <style jsx global>{`
        .shopify-theme-settings__categories > .shopify-editor-aux__row { width: 100%; border: 0; background: transparent; font: inherit; text-align: left; cursor: pointer; }
        .shopify-theme-settings__categories > .shopify-editor-aux__row:focus-visible,
        .shopify-theme-settings__reset-color:focus-visible,
        .shopify-theme-settings__brand-reset:focus-visible,
        .shopify-theme-settings__actions button:focus-visible { outline: 2px solid #005bd3; outline-offset: 2px; }
        .shopify-theme-settings__categories > .shopify-editor-aux__row:hover { background: #f6f6f7; }
        .shopify-theme-settings__categories .shopify-editor-aux__row .shopify-theme-settings__available,
        .shopify-theme-settings__categories .shopify-editor-aux__row .shopify-theme-settings__unavailable { font-size: 10px !important; white-space: nowrap; }
        .shopify-theme-settings__categories .shopify-editor-aux__row .shopify-theme-settings__available { color: #005bd3 !important; }
        .shopify-theme-settings__categories .shopify-editor-aux__row .shopify-theme-settings__unavailable { color: #8a8a8a !important; }
        .shopify-theme-settings__scheme-detail { margin-top: 14px; padding-top: 10px; border-top: 1px solid #e3e3e3; }
        .shopify-theme-settings__scheme-heading { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .shopify-theme-settings__scheme-heading strong { color: #303030; font-size: 12px; }
        .shopify-theme-settings__scheme-heading button { padding: 3px 0 3px 8px; border: 0; background: transparent; color: #005bd3; font: inherit; font-size: 10px; cursor: pointer; }
        .shopify-theme-settings__scheme-heading button:disabled { color: #8a8a8a; cursor: default; }
        .shopify-theme-settings__role-group { margin-top: 11px; }
        .shopify-theme-settings__role-group h3 { margin: 0; padding: 7px 0 4px; border-bottom: 1px solid #e3e3e3; color: #303030; font-size: 11px; font-weight: 650; }
        .shopify-theme-settings__color-list { display: grid; }
        .shopify-theme-settings__color-list .shopify-theme-settings__color { grid-template-columns: 28px minmax(0, 1fr) 65px; }
        .shopify-theme-settings__color { display: grid; grid-template-columns: 28px minmax(0, 1fr) minmax(0, 114px); align-items: center; gap: 8px; min-height: 48px; border-bottom: 1px solid #f1f1f1; }
        .shopify-theme-settings__picker { position: relative; display: block; width: 26px; height: 26px; overflow: hidden; border: 1px solid #c9cccf; border-radius: 6px; box-shadow: inset 0 0 0 2px #fff; }
        .shopify-theme-settings__picker.is-transparent { background-image: repeating-conic-gradient(#fff 0% 25%, #e7e7e7 0% 50%); background-size: 10px 10px; }
        .shopify-theme-settings__picker input { position: absolute; inset: -8px; width: 42px; height: 42px; padding: 0; border: 0; cursor: pointer; opacity: 0; }
        .shopify-theme-settings__picker:has(input:disabled) { opacity: .55; }
        .shopify-theme-settings__role-label { overflow: hidden; color: #303030; font-size: 11px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
        .shopify-theme-settings__color-copy { display: grid; min-width: 0; gap: 3px; }
        .shopify-theme-settings__color-copy strong { overflow: hidden; color: #303030; font-size: 11px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
        .shopify-theme-settings__color-copy small { display: -webkit-box; overflow: hidden; color: #616161; font-size: 10px; line-height: 1.35; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
        .shopify-theme-settings__hex-controls { display: flex; align-items: center; min-width: 0; gap: 4px; }
        .shopify-theme-settings__hex { width: 65px; min-width: 0; height: 29px; flex: 1 1 65px; padding: 0 6px; border: 1px solid #c9cccf; border-radius: 6px; color: #303030; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; }
        .shopify-theme-settings__hex:focus-visible { border-color: #005bd3; outline: 2px solid rgba(0, 91, 211, .2); }
        .shopify-theme-settings__hex.is-invalid { border-color: #b42318; color: #b42318; }
        .shopify-theme-settings__reset-color { flex: 0 0 auto; padding: 0 5px; border: 1px solid #c9cccf; border-radius: 4px; background: #fff; color: #005bd3; font-family: inherit; font-size: 9px; line-height: 25px; cursor: pointer; }
        .shopify-theme-settings__brand-color-reset { grid-column: 2 / 4; justify-self: start; margin: -4px 0 6px; padding: 0; border: 0; background: transparent; font-size: 10px; line-height: normal; }
        .shopify-theme-settings__brand-reset { grid-column: 2 / 4; justify-self: start; margin: -4px 0 6px; padding: 0; border: 0; background: transparent; color: #005bd3; font-family: inherit; font-size: 10px; cursor: pointer; }
        .shopify-theme-settings__reset-color:disabled, .shopify-theme-settings__brand-reset:disabled { color: #8a8a8a; cursor: default; }
        .shopify-theme-settings__brand { margin-top: 16px; border-top: 1px solid #e3e3e3; }
        .shopify-theme-settings__brand > summary { display: flex; align-items: center; justify-content: space-between; min-height: 42px; color: #303030; font-size: 11px; font-weight: 600; cursor: pointer; }
        .shopify-theme-settings__brand > summary span { color: #616161; font-size: 10px; font-weight: 400; }
        .shopify-theme-settings__warnings { margin-top: 10px; padding: 8px; border-radius: 6px; background: #fff4e5; color: #7a4f00; font-size: 10px; line-height: 1.45; }
        .shopify-theme-settings__warnings strong { display: block; margin-bottom: 4px; }
        .shopify-theme-settings__warnings p { margin: 0; }
        .shopify-theme-settings__actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 13px; }
        .shopify-theme-settings__actions button { min-height: 32px; padding: 0 10px; border: 1px solid #c9cccf; border-radius: 6px; background: #fff; color: #303030; font-family: inherit; font-size: 11px; font-weight: 600; cursor: pointer; }
        .shopify-theme-settings__actions button:disabled { border-color: #e3e3e3; background: #e3e3e3; color: #8a8a8a; cursor: default; }
        .shopify-theme-settings__actions span { color: #616161; font-size: 9px; text-align: right; }
        .shopify-theme-settings__status { margin: 9px 0 0; color: #616161; font-size: 10px; line-height: 1.45; }
        .shopify-theme-settings__status.is-error { color: #b42318; }
        .shopify-theme-settings__typography-group { margin: 11px 0 17px; }
        .shopify-theme-settings__typography-group > h3 { margin: 0; padding: 7px 0 4px; border-bottom: 1px solid #e3e3e3; color: #303030; font-size: 11px; font-weight: 650; }
        .shopify-theme-settings__typography-group > p { margin: 7px 0 10px; color: #616161; font-size: 10px; line-height: 1.4; }
        .shopify-theme-settings__typography-group > .shopify-theme-settings__responsive-note { margin-top: -5px; color: #8a8a8a; font-size: 9px; }
        .shopify-theme-settings__font-grid { display: grid; gap: 8px; }
        .shopify-theme-settings__font-control { position: relative; display: grid; gap: 4px; }
        .shopify-theme-settings__field-label, .shopify-theme-settings__setting-field > span { color: #616161; font-size: 10px; }
        .shopify-theme-settings__font-trigger { display: flex; align-items: center; min-width: 0; gap: 8px; padding: 6px 8px; border: 1px solid #c9cccf; border-radius: 6px; background: #fff; color: #303030; text-align: left; cursor: pointer; }
        .shopify-theme-settings__font-trigger:hover { background: #f6f6f7; }
        .shopify-theme-settings__font-trigger:disabled { opacity: .55; cursor: default; }
        .shopify-theme-settings__font-swatch { display: grid; flex: 0 0 32px; width: 32px; height: 32px; place-items: center; border: 1px solid #e3e3e3; border-radius: 4px; font-size: 18px; }
        .shopify-theme-settings__font-trigger-copy { display: grid; min-width: 0; flex: 1; gap: 2px; }
        .shopify-theme-settings__font-trigger-copy strong { overflow: hidden; font-size: 11px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
        .shopify-theme-settings__font-trigger-copy small { color: #616161; font-size: 9px; }
        .shopify-theme-settings__chevron { color: #616161; }
        .shopify-theme-settings__font-picker { position: absolute; z-index: 20; top: calc(100% + 5px); right: 0; left: 0; display: grid; overflow: hidden; border: 1px solid #c9cccf; border-radius: 8px; background: #fff; box-shadow: 0 8px 24px rgba(0,0,0,.16); }
        .shopify-theme-settings__font-picker-backdrop { display: none; }
        .shopify-theme-settings__font-picker-head { display: flex; align-items: center; justify-content: space-between; min-height: 38px; padding: 0 10px; border-bottom: 1px solid #e3e3e3; }
        .shopify-theme-settings__font-picker-head strong { font-size: 11px; }
        .shopify-theme-settings__font-picker-head button { width: 25px; height: 25px; border: 0; border-radius: 4px; background: transparent; color: #616161; font: inherit; font-size: 20px; line-height: 1; cursor: pointer; }
        .shopify-theme-settings__font-search { display: flex; align-items: center; gap: 7px; min-height: 32px; margin: 8px 9px; padding: 0 8px; border: 1px solid #c9cccf; border-radius: 5px; color: #616161; }
        .shopify-theme-settings__font-search input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: #303030; font: inherit; font-size: 10px; }
        .shopify-theme-settings__font-tabs { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #e3e3e3; }
        .shopify-theme-settings__font-tabs button { min-height: 32px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: #616161; font: inherit; font-size: 10px; cursor: pointer; }
        .shopify-theme-settings__font-tabs button.is-active { border-bottom-color: #303030; color: #303030; font-weight: 600; }
        .shopify-theme-settings__font-list { display: grid; max-height: 150px; overflow: auto; padding: 4px; }
        .shopify-theme-settings__font-option { display: flex; align-items: center; gap: 8px; min-height: 33px; padding: 0 7px; border: 0; border-radius: 4px; background: #fff; color: #303030; text-align: left; cursor: pointer; }
        .shopify-theme-settings__font-option:hover, .shopify-theme-settings__font-option.is-selected { background: #f1f2f3; }
        .shopify-theme-settings__font-option > span:first-child { width: 26px; color: #616161; font-size: 16px; }
        .shopify-theme-settings__font-option strong { flex: 1; font-size: 10px; font-weight: 500; }
        .shopify-theme-settings__font-check { color: #005bd3; font-size: 12px; }
        .shopify-theme-settings__font-empty { margin: 12px 6px; color: #616161; font-size: 10px; }
        .shopify-theme-settings__font-style { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 10px; border-top: 1px solid #e3e3e3; color: #616161; font-size: 10px; }
        .shopify-theme-settings__font-style select { max-width: 120px; min-height: 27px; padding: 0 5px; border: 1px solid #c9cccf; border-radius: 4px; background: #fff; color: #303030; font: inherit; font-size: 10px; }
        .shopify-theme-settings__font-picker-actions { display: flex; justify-content: flex-end; gap: 6px; padding: 7px 9px; border-top: 1px solid #e3e3e3; }
        .shopify-theme-settings__font-picker-actions button { min-height: 27px; padding: 0 9px; border: 1px solid #c9cccf; border-radius: 5px; background: #fff; color: #303030; font: inherit; font-size: 10px; font-weight: 600; cursor: pointer; }
        .shopify-theme-settings__font-picker-actions button.is-primary { border-color: #303030; background: #303030; color: #fff; }
        .shopify-theme-settings__preset-list { display: grid; gap: 5px; }
        .shopify-theme-settings__preset { border: 1px solid #e3e3e3; border-radius: 6px; background: #fff; }
        .shopify-theme-settings__preset > summary { display: grid; grid-template-columns: 54px minmax(0, 1fr) max-content 12px; align-items: center; gap: 7px; min-height: 40px; padding: 3px 7px; overflow: hidden; cursor: pointer; list-style: none; }
        .shopify-theme-settings__preset > summary::-webkit-details-marker { display: none; }
        .shopify-theme-settings__preset > summary::after { content: '⌄'; color: #616161; font-size: 12px; line-height: 1; text-align: center; transition: transform .15s ease; }
        .shopify-theme-settings__preset[open] > summary::after { transform: rotate(180deg); }
        .shopify-theme-settings__preset-title { color: #303030; font-size: 10px; font-weight: 650; }
        .shopify-theme-settings__preset-sample { display: block; min-width: 0; overflow: hidden; color: #303030; text-overflow: ellipsis; white-space: nowrap; }
        .shopify-theme-settings__preset-meta { max-width: 100%; overflow: hidden; color: #616161; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
        .shopify-theme-settings__preset-meta i { margin: 0 2px; font-style: normal; }
        .shopify-theme-settings__preset-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 2px 8px 9px; border-top: 1px solid #f1f1f1; }
        .shopify-theme-settings__setting-field { display: grid; min-width: 0; gap: 4px; padding-top: 7px; }
        .shopify-theme-settings__setting-field select { width: 100%; min-width: 0; min-height: 29px; padding: 0 6px; border: 1px solid #c9cccf; border-radius: 5px; background: #fff; color: #303030; font: inherit; font-size: 10px; }
        .shopify-theme-settings__setting-field select:disabled { opacity: .55; }
        .shopify-theme-settings__font-trigger:focus-visible, .shopify-theme-settings__font-option:focus-visible, .shopify-theme-settings__font-picker button:focus-visible, .shopify-theme-settings__font-picker select:focus-visible, .shopify-theme-settings__setting-field select:focus-visible { outline: 2px solid #005bd3; outline-offset: 1px; }
        @media (max-width: 760px) {
          .shopify-theme-settings__font-picker-backdrop { position: fixed; inset: 0; z-index: 80; display: block; border: 0; background: rgba(0,0,0,.32); }
          .shopify-theme-settings__font-picker { position: fixed; inset: auto 8px max(8px, env(safe-area-inset-bottom)); z-index: 81; display: grid; width: auto; height: min(440px, 58dvh); min-height: 260px; max-height: calc(100dvh - 72px); grid-template-rows: auto auto auto minmax(70px, 1fr) auto auto; overflow: hidden; border-radius: 10px; }
          .shopify-theme-settings__font-list { min-height: 0; max-height: none; overflow-y: auto; overscroll-behavior: contain; }
          .shopify-theme-settings__font-picker-actions { position: sticky; bottom: 0; background: #fff; }
        }
        @media (max-width: 350px) { .shopify-theme-settings__color { grid-template-columns: 25px minmax(0, 1fr) minmax(0, 106px); gap: 6px; } .shopify-theme-settings__hex { font-size: 10px; } }
      `}</style>
    </aside>
  );
}
