'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { saveThemeAction } from '@/lib/theme-actions';
import {
  COLOR_SCHEME_GROUPS,
  COLOR_SCHEME_NUMBERS,
  DEFAULT_COLOR_SCHEMES,
  DEFAULT_THEME,
  THEME_COLORS,
  colorSchemeWarnings,
  isHexColor,
  isThemeColorValue,
  isTransparentColor,
  isThemeValid,
  normalizeTheme,
  themeCssVariableMap,
  themeWarnings,
  themesEqual,
} from '@/lib/theme';

const PREVIEW_PAGES = [
  ['/', 'Homepage'],
  ['/shop', 'Shop'],
  ['/bridal', 'Bridal'],
  ['/custom', 'Custom jewelry'],
  ['/our-story', 'Our Story'],
  ['/faq', 'FAQ'],
  ['/privacy', 'Privacy Policy'],
];

/** Applies brand and scheme CSS variables directly to the unsaved preview frame. */
function applyToFrame(frame, theme) {
  const root = frame?.contentDocument?.documentElement;
  if (!root) return;
  Object.entries(themeCssVariableMap(theme)).forEach(([cssVariable, value]) => root.style.setProperty(cssVariable, value));
}

function schemePreviewColor(value, fallback) {
  return isTransparentColor(value) ? fallback : value;
}

function ColorValueField({ label, value, onChange, disabled = false, allowTransparent = false, restoreColor = '#FFFFFF' }) {
  const valid = allowTransparent ? isThemeColorValue(value) : isHexColor(value);
  const transparent = allowTransparent && isTransparentColor(value);
  return (
    <div className="admin-theme__color-value">
      <span className="admin-theme__color-value-label">{label}</span>
      <span className="admin-theme__color-value-controls">
        <label className={`admin-theme__swatch${transparent ? ' is-transparent' : ''}`} style={{ background: valid ? value : 'transparent' }}>
          <input type="color" value={valid && !transparent ? value : restoreColor} onChange={(event) => onChange(event.target.value)} disabled={disabled} aria-label={`${label} color picker`} />
        </label>
        <span className="admin-theme__hex-controls">
          <input className={`admin-theme__hex${valid ? '' : ' is-invalid'}`} value={value} maxLength={allowTransparent ? 11 : 7} spellCheck={false} onChange={(event) => {
            const nextValue = event.target.value.trim();
            onChange(allowTransparent && nextValue.toLowerCase() === 'transparent' ? 'transparent' : nextValue && !nextValue.startsWith('#') ? `#${nextValue}` : nextValue);
          }} disabled={disabled} aria-label={`${label} hex value`} aria-invalid={!valid} />
          {allowTransparent ? <button type="button" className="admin-theme__transparent-toggle" aria-label={transparent ? `Use a solid color for ${label}` : `Set ${label} to transparent`} title={transparent ? 'Use color' : 'Set transparent'} aria-pressed={transparent} onClick={() => onChange(transparent ? restoreColor : 'transparent')} disabled={disabled}>{transparent ? 'Solid' : 'Clear'}</button> : null}
        </span>
      </span>
    </div>
  );
}

function SchemePreviewCard({ number, scheme, selected, onSelect }) {
  const transparentBackground = isTransparentColor(scheme.base.background);
  const readableTextTreatment = transparentBackground ? {
    textShadow: '0 0 2px #fff, 0 0 3px #fff',
    WebkitTextStroke: '0.25px #303030',
  } : {};
  return (
    <button type="button" className={`admin-theme__scheme-card${selected ? ' is-active' : ''}`} aria-pressed={selected} onClick={onSelect}>
      <span className="admin-theme__scheme-card-heading"><strong>Scheme {number}</strong></span>
      <span className={`admin-theme__scheme-preview${transparentBackground ? ' is-transparent' : ''}`} style={{ backgroundColor: transparentBackground ? 'transparent' : scheme.base.background }}>
        <strong style={{ ...readableTextTreatment, color: schemePreviewColor(scheme.base.headings, '#303030') }}>Aa</strong>
        <span style={{ ...readableTextTreatment, color: schemePreviewColor(scheme.base.links, '#005bd3') }}>Link</span>
        <i style={{
          ...readableTextTreatment,
          backgroundColor: schemePreviewColor(scheme.primaryButton.background, '#303030'),
          color: schemePreviewColor(scheme.primaryButton.text, '#ffffff'),
          borderColor: schemePreviewColor(scheme.primaryButton.borders, '#303030'),
        }}>Button</i>
      </span>
    </button>
  );
}

export default function ThemeEditor({ initial, comingSoonEnabled }) {
  const [theme, setTheme] = useState(() => normalizeTheme(initial || DEFAULT_THEME));
  const [savedTheme, setSavedTheme] = useState(() => normalizeTheme(initial || DEFAULT_THEME));
  const [activeScheme, setActiveScheme] = useState(1);
  const [path, setPath] = useState('/');
  const [message, setMessage] = useState(null);
  const [pending, startTransition] = useTransition();
  const frame = useRef(null);
  const dirty = !themesEqual(theme, savedTheme);
  const valid = isThemeValid(theme);
  const warnings = [...themeWarnings(theme), ...colorSchemeWarnings(theme, activeScheme)];
  const schemeKey = `scheme${activeScheme}`;
  const scheme = theme.colorSchemes[schemeKey];

  useEffect(() => { applyToFrame(frame.current, theme); }, [theme]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const setBrandColor = (key, value) => {
    setMessage(null);
    setTheme((currentTheme) => ({ ...currentTheme, [key]: value }));
  };

  const setSchemeRole = (schemeNumber, groupKey, role, value) => {
    setMessage(null);
    const selectedKey = `scheme${schemeNumber}`;
    setTheme((currentTheme) => ({
      ...currentTheme,
      colorSchemes: {
        ...currentTheme.colorSchemes,
        [selectedKey]: {
          ...currentTheme.colorSchemes[selectedKey],
          [groupKey]: { ...currentTheme.colorSchemes[selectedKey][groupKey], [role]: value },
        },
      },
    }));
  };

  const resetScheme = (schemeNumber) => {
    const selectedKey = `scheme${schemeNumber}`;
    setMessage(null);
    setTheme((currentTheme) => ({
      ...currentTheme,
      colorSchemes: { ...currentTheme.colorSchemes, [selectedKey]: DEFAULT_COLOR_SCHEMES[selectedKey] },
    }));
  };

  const save = () => startTransition(async () => {
    try {
      const result = await saveThemeAction(theme);
      setMessage(result);
      if (result.ok) { setSavedTheme(result.theme); setTheme(result.theme); }
    } catch (error) {
      setMessage({ ok: false, message: error?.message || 'Could not save the theme.' });
    }
  });

  const discard = () => {
    setMessage(null);
    setTheme(savedTheme);
  };

  return (
    <div className="admin-theme">
      <div className="admin-theme__controls">
        <section className="admin-card admin-theme__schemes">
          <div className="admin-card__heading">
            <div><h2>Color schemes</h2><p className="admin-field-help">Edit the six color groups for each scheme. Changes appear in the preview before you save.</p></div>
          </div>
          <div className="admin-theme__scheme-grid" aria-label="Shopify color schemes">
            {COLOR_SCHEME_NUMBERS.map((number) => {
              const selectedKey = `scheme${number}`;
              return <SchemePreviewCard key={selectedKey} number={number} scheme={theme.colorSchemes[selectedKey]} selected={activeScheme === number} onSelect={() => setActiveScheme(number)} />;
            })}
          </div>
          <section className="admin-theme__scheme-editor" aria-label={`Edit scheme ${activeScheme}`}>
            <div className="admin-theme__scheme-editor-heading"><h3>Scheme {activeScheme}</h3><button type="button" className="admin-text-button" onClick={() => resetScheme(activeScheme)} disabled={pending || COLOR_SCHEME_GROUPS.every((group) => group.roles.every(({ key }) => scheme[group.key][key] === DEFAULT_COLOR_SCHEMES[schemeKey][group.key][key]))}>Reset scheme</button></div>
            <div className="admin-theme__group-grid">
              {COLOR_SCHEME_GROUPS.map((group) => (
                <section className="admin-theme__role-group" key={group.key}>
                  <h4>{group.label}</h4>
                  <div className="admin-theme__role-grid">
                    {group.roles.map(({ key, label }) => {
                      const defaultValue = DEFAULT_COLOR_SCHEMES[schemeKey][group.key][key];
                      const restoreColor = isHexColor(defaultValue) ? defaultValue : '#FFFFFF';
                      return <ColorValueField key={key} label={label} value={scheme[group.key][key]} onChange={(value) => setSchemeRole(activeScheme, group.key, key, value)} disabled={pending} allowTransparent restoreColor={restoreColor} />;
                    })}
                  </div>
                </section>
              ))}
            </div>
          </section>
        </section>

        <section className="admin-card admin-theme__brand-colors">
          <details>
            <summary className="admin-theme__brand-summary"><span><strong>byShreen brand colors</strong><small>Seven original site-wide colors retained for existing storefront sections.</small></span><span>Manage</span></summary>
            <div className="admin-theme__colors">
              {THEME_COLORS.map((color) => {
                const value = theme[color.key];
                const validColor = isHexColor(value);
                return (
                  <div key={color.key} className="admin-theme__color">
                    <label className="admin-theme__swatch" style={{ background: validColor ? value : 'transparent' }} title="Pick a color">
                      <input type="color" value={validColor ? value : '#000000'} onChange={(event) => setBrandColor(color.key, event.target.value)} aria-label={`${color.label} color picker`} disabled={pending} />
                    </label>
                    <div className="admin-theme__meta"><strong>{color.label}</strong><small>{color.help}</small></div>
                    <input className={`admin-theme__hex${validColor ? '' : ' is-invalid'}`} value={value} maxLength={7} spellCheck={false} onChange={(event) => {
                      const nextValue = event.target.value.trim();
                      setBrandColor(color.key, nextValue && !nextValue.startsWith('#') ? `#${nextValue}` : nextValue);
                    }} aria-label={`${color.label} hex value`} aria-invalid={!validColor} disabled={pending} />
                    {value !== color.default ? <button type="button" className="admin-text-button" onClick={() => setBrandColor(color.key, color.default)} title={`Brand color: ${color.default}`} disabled={pending}>Reset</button> : <span className="admin-theme__brand">Brand</span>}
                  </div>
                );
              })}
              <button type="button" className="admin-button admin-button--ghost" onClick={() => { setMessage(null); setTheme((currentTheme) => ({ ...currentTheme, ...Object.fromEntries(THEME_COLORS.map(({ key, default: value }) => [key, value])) })); }} disabled={pending || THEME_COLORS.every((color) => theme[color.key] === color.default)}>Reset to byShreen brand colors</button>
            </div>
          </details>
        </section>
      </div>

      <section className="admin-card admin-theme__preview">
        <div className="admin-theme__preview-bar">
          <label className="admin-field"><span className="sr-only">Preview page</span>
            <select value={path} onChange={(event) => setPath(event.target.value)}>
              {PREVIEW_PAGES.map(([href, label]) => <option key={href} value={href}>{label}</option>)}
            </select>
          </label>
          <span className="admin-field-help">Live preview — only you see these changes until you save.</span>
        </div>
        <iframe ref={frame} key={path} src={comingSoonEnabled ? `/admin/preview-site?path=${encodeURIComponent(path)}` : path} title="Website preview" className="admin-theme__frame" onLoad={() => applyToFrame(frame.current, theme)} />
      </section>

      <div className="admin-savebar">
        <span className={`admin-savebar__status${message && !message.ok ? ' is-error' : ''}`} role="status">{message?.message || (dirty ? 'Unsaved theme changes' : 'Your saved theme is live')}</span>
        {dirty ? <button type="button" className="admin-button admin-button--ghost" onClick={discard} disabled={pending}>Discard changes</button> : null}
        <button type="button" className="admin-button" onClick={save} disabled={pending || !dirty || !valid}>{pending ? 'Saving…' : 'Save theme'}</button>
      </div>

      <style jsx>{`
        .admin-theme { display: grid; gap: 18px; padding-bottom: 82px; }
        .admin-theme__controls { display: grid; gap: 16px; }
        .admin-theme__scheme-editor { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--a-border, #e4e2da); }
        .admin-theme__scheme-editor-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
        .admin-theme__scheme-editor-heading h3 { margin: 0; color: var(--a-text, #303127); font-size: 14px; font-weight: 650; }
        .admin-theme__group-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 24px; }
        .admin-theme__role-group { min-width: 0; }
        .admin-theme__role-group h4 { margin: 0 0 9px; color: var(--a-text, #303127); font-size: 12px; font-weight: 650; }
        .admin-theme__role-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 14px; }
        .admin-theme__color-value { display: grid; gap: 5px; min-width: 0; }
        .admin-theme__color-value-label { overflow: hidden; color: var(--a-text-secondary, #5e6056); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
        .admin-theme__color-value-controls { display: flex; align-items: center; min-width: 0; gap: 6px; }
        .admin-theme__hex-controls { display: flex; align-items: center; min-width: 0; gap: 4px; }
        .admin-theme__swatch { position: relative; display: block; flex: 0 0 29px; width: 29px; height: 29px; overflow: hidden; border: 1px solid #b9bbb2; border-radius: 5px; box-shadow: inset 0 0 0 2px #fff; }
        .admin-theme__swatch.is-transparent { background-image: repeating-conic-gradient(#fff 0% 25%, #e7e7e7 0% 50%); background-size: 10px 10px; }
        .admin-theme__swatch input { position: absolute; inset: -6px; width: 40px; height: 40px; padding: 0; border: 0; cursor: pointer; opacity: 0; }
        .admin-theme__swatch:has(input:disabled) { opacity: .55; }
        .admin-theme__hex { width: 82px; min-width: 0; height: 31px; flex: 1 1 82px; padding: 0 7px; border: 1px solid var(--a-border, #c9cccf); border-radius: 5px; color: var(--a-text, #303127); font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; }
        .admin-theme__hex:focus-visible, .admin-theme__brand-summary:focus-visible { outline: 2px solid #005bd3; outline-offset: 2px; }
        .admin-theme__hex.is-invalid { border-color: #b42318; color: #b42318; }
        .admin-theme__transparent-toggle { flex: 0 0 auto; height: 27px; padding: 0 5px; border: 1px solid var(--a-border, #c9cccf); border-radius: 4px; background: #fff; color: #005bd3; font: inherit; font-size: 9px; white-space: nowrap; cursor: pointer; }
        .admin-theme__transparent-toggle:focus-visible { outline: 2px solid #005bd3; outline-offset: 2px; }
        .admin-theme__transparent-toggle:disabled { color: #8a8a8a; cursor: default; }
        .admin-theme__brand-summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; list-style: none; }
        .admin-theme__brand-summary::-webkit-details-marker { display: none; }
        .admin-theme__brand-summary > span:first-child { display: grid; gap: 4px; }
        .admin-theme__brand-summary strong { font-size: 13px; }
        .admin-theme__brand-summary small { color: var(--a-text-secondary, #5e6056); font-size: 11px; }
        .admin-theme__brand-summary > span:last-child { color: #005bd3; font-size: 11px; }
        .admin-theme__colors { margin: 15px 0; }
        .admin-theme__color { display: grid; grid-template-columns: 34px minmax(0, 1fr) 82px auto; align-items: center; gap: 10px; min-height: 56px; border-bottom: 1px solid #e9e8e2; }
        .admin-theme__meta { display: grid; gap: 3px; min-width: 0; }
        .admin-theme__meta strong { color: var(--a-text, #303127); font-size: 12px; font-weight: 600; }
        .admin-theme__meta small { color: var(--a-text-secondary, #5e6056); font-size: 10px; line-height: 1.35; }
        .admin-theme__brand { color: #5e6056; font-size: 10px; }
        .admin-theme__preview { min-height: 420px; overflow: hidden; }
        .admin-theme__preview-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
        .admin-theme__preview-bar .admin-field { margin: 0; }
        .admin-theme__frame { display: block; width: 100%; height: min(68vh, 760px); border: 1px solid var(--a-border, #d8d6ce); border-radius: 5px; background: #fff; }
        @media (max-width: 920px) { .admin-theme__group-grid { grid-template-columns: 1fr; } }
        @media (max-width: 760px) {
          .admin-theme__preview-bar { align-items: flex-start; flex-direction: column; }
          .admin-theme__preview { min-height: 320px; }
          .admin-theme__frame { height: 56vh; }
        }
        @media (max-width: 560px) {
          .admin-theme__role-grid { grid-template-columns: 1fr; }
          .admin-theme__color { grid-template-columns: 32px minmax(0, 1fr) 74px; gap: 8px; }
          .admin-theme__color > .admin-text-button, .admin-theme__brand { grid-column: 2 / 4; margin: -4px 0 5px; }
          .admin-theme__hex { width: 74px; }
        }
      `}</style>
    </div>
  );
}
