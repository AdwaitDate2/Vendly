'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import ImagePicker from './ImagePicker';
import { saveEmailDesignAction } from '@/lib/email-template-actions';
import { buildEmail, emailTemplateMeta, sampleDataFor } from '@/lib/email-templates';

const isHex = (value) => /^#[0-9a-f]{6}$/i.test(String(value || ''));

function ColorField({ label, help, value, themeValue, onChange }) {
  const shown = value || themeValue;
  return (
    <div className="admin-email-design__color">
      <label className="admin-theme__swatch" style={{ background: isHex(shown) ? shown : 'transparent' }} title="Pick a color">
        <input type="color" value={isHex(shown) ? shown : '#000000'} onChange={(event) => onChange(event.target.value)} aria-label={`${label} color picker`} />
      </label>
      <div className="admin-theme__meta"><strong>{label}</strong><small>{value ? help : `Using the Theme color (${themeValue}).`}</small></div>
      <input className={`admin-theme__hex${!value || isHex(value) ? '' : ' is-invalid'}`} value={value} placeholder={themeValue} maxLength={7} spellCheck={false} onChange={(event) => onChange(event.target.value.trim() ? (event.target.value.trim().startsWith('#') ? event.target.value.trim() : `#${event.target.value.trim()}`) : '')} aria-label={`${label} hex value`} />
      {value ? <button type="button" className="admin-text-button" onClick={() => onChange('')}>Use theme color</button> : <span className="admin-theme__brand">Theme</span>}
    </div>
  );
}

export default function EmailDesignForm({ initial, settings }) {
  const [design, setDesign] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [message, setMessage] = useState(null);
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(design) !== JSON.stringify(saved);
  const set = (key, value) => { setMessage(null); setDesign((current) => ({ ...current, [key]: value })); };

  // Preview a real email with the unsaved design. The logo uses this site's address.
  // This site's address, known only in the browser; links and the logo in the preview need it.
  const [origin, setOrigin] = useState('');
  useEffect(() => { setOrigin(window.location.origin); }, []);

  const preview = useMemo(() => {
    const meta = emailTemplateMeta('orderConfirmation');
    return buildEmail('orderConfirmation', { wording: meta.defaults, data: sampleDataFor('orderConfirmation'), settings: { ...settings, emailDesign: design }, siteUrl: (path) => `${origin}${path}` });
  }, [design, settings, origin]);

  const save = () => startTransition(async () => {
    const result = await saveEmailDesignAction(design);
    setMessage(result);
    if (result.ok) { setSaved(result.design); setDesign(result.design); }
  });

  return (
    <section className="admin-card admin-email-design">
      <div className="admin-email-design__form">
        <div className="admin-card__heading"><div><h2>Email design</h2><p className="admin-field-help">Your logo and colors for every email below, like Shopify’s “Customize email templates”.</p></div></div>
        <div className="admin-field">
          <span>Logo</span>
          <ImagePicker value={design.logo} onChange={(value) => set('logo', value)} />
          <span className="admin-field-help">Use a PNG or JPG with a transparent or white background. Leave empty to show “{settings.storeName || 'byShreen'}” in the accent color. Logos appear in inboxes once the website is live on its real address.</span>
        </div>
        <label className="admin-field">
          <span>Logo width: {design.logoWidth}px</span>
          <input type="range" min="40" max="320" step="10" value={design.logoWidth} onChange={(event) => set('logoWidth', Number(event.target.value))} disabled={!design.logo} />
        </label>
        <ColorField label="Accent color" help="Buttons and the store name." value={design.accentColor} themeValue={settings.theme?.mulberry} onChange={(value) => set('accentColor', value)} />
        <ColorField label="Background color" help="Behind the white email card." value={design.backgroundColor} themeValue={settings.theme?.paper} onChange={(value) => set('backgroundColor', value)} />
        <div className="admin-email-design__actions">
          <span className="admin-field-help" role="status">{message?.message || (dirty ? 'Unsaved changes' : '')}</span>
          {dirty ? <button type="button" className="admin-button admin-button--ghost" onClick={() => { setMessage(null); setDesign(saved); }}>Discard</button> : null}
          <button type="button" className="admin-button" disabled={pending || !dirty || [design.accentColor, design.backgroundColor].some((value) => value && !isHex(value))} onClick={save}>{pending ? 'Saving…' : 'Save design'}</button>
        </div>
      </div>
      <div className="admin-email-design__preview">
        <div className="admin-email-editor__envelope"><div><span>Preview</span><strong>{preview.subject}</strong></div></div>
        <iframe title="Email design preview" srcDoc={preview.html} sandbox="" className="admin-email-design__frame" />
      </div>
    </section>
  );
}
