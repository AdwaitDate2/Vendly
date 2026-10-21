// @ts-nocheck
'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { resetEmailTemplateAction, saveEmailTemplateAction, sendTestEmailAction } from '@/lib/email-template-actions';
import { BLOCK_PLACEHOLDERS, EDITABLE_FIELDS, buildEmail, emailTemplateMeta, sampleDataFor, starterCode, unknownPlaceholders } from '@/lib/email-templates';

const FIELD_LABELS = { subject: 'Subject line', heading: 'Heading', message: 'Message', buttonLabel: 'Button text', footer: 'Footer', html: 'Email HTML' };
const FIELD_HELP = {
  message: 'Leave a blank line between paragraphs. Order details, totals, and addresses are added below automatically.',
  buttonLabel: 'Leave empty to hide the button.',
};

export default function EmailTemplateEditor({ templateKey, initial, settings, testRecipient }) {
  const meta = emailTemplateMeta(templateKey);
  const [values, setValues] = useState(() => ({ ...Object.fromEntries(EDITABLE_FIELDS.map((field) => [field, initial[field] ?? ''])), mode: initial.mode || 'simple', html: initial.html || '' }));
  const [enabled, setEnabled] = useState(initial.enabled);
  const [saved, setSaved] = useState({ values, enabled: initial.enabled });
  const [focused, setFocused] = useState('message');
  const [message, setMessage] = useState(null);
  const [pending, startTransition] = useTransition();
  const inputs = useRef({});

  const code = values.mode === 'code';
  const dirty = enabled !== saved.enabled || [...EDITABLE_FIELDS, 'mode', 'html'].some((field) => values[field] !== saved.values[field]);
  // In code mode the HTML replaces heading, message, and footer; the subject (and button text) still apply.
  const fields = EDITABLE_FIELDS.filter((field) => (field !== 'buttonLabel' || meta.hasButton) && (!code || field === 'subject' || field === 'buttonLabel'));
  const unknown = unknownPlaceholders(meta, values);
  const isDefault = !code && EDITABLE_FIELDS.every((field) => values[field] === meta.defaults[field]);

  // This site's address, known only in the browser; links and the logo in the preview need it.
  const [origin, setOrigin] = useState('');
  useEffect(() => { setOrigin(window.location.origin); }, []);

  const preview = useMemo(() => {
    return buildEmail(templateKey, { wording: values, data: sampleDataFor(templateKey), settings, siteUrl: (path) => `${origin}${path}` });
  }, [templateKey, values, settings, origin]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = (field, value) => { setMessage(null); setValues((current) => ({ ...current, [field]: value })); };

  // Inserts {{name}} where the cursor is in the last field used.
  const insert = (name) => {
    const field = focused || 'message';
    const el = inputs.current[field];
    const token = `{{${name}}}`;
    const current = values[field] || '';
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;
    set(field, `${current.slice(0, start)}${token}${current.slice(end)}`);
    requestAnimationFrame(() => { if (el) { el.focus(); el.selectionStart = el.selectionEnd = start + token.length; } });
  };

  const switchMode = (mode) => {
    setMessage(null);
    // Start the code from the current simple design, so nothing has to be written from scratch.
    setValues((current) => ({ ...current, mode, html: mode === 'code' && !current.html.trim() ? starterCode(templateKey, current) : current.html }));
    setFocused(mode === 'code' ? 'html' : 'message');
  };

  const run = (task) => startTransition(async () => {
    const result = await task();
    setMessage(result);
    if (result?.template) {
      const next = { ...Object.fromEntries(EDITABLE_FIELDS.map((field) => [field, result.template[field] ?? ''])), mode: result.template.mode || 'simple', html: result.template.html || '' };
      setValues(next);
      setEnabled(result.template.enabled);
      setSaved({ values: next, enabled: result.template.enabled });
    }
  });

  return (
    <div className="admin-email-editor">
      <div className="admin-email-editor__form">
        <section className="admin-card">
          <div className="admin-segmented admin-email-editor__modes" role="radiogroup" aria-label="Editor">
            <button type="button" role="radio" aria-checked={!code} className={!code ? 'is-active' : ''} onClick={() => switchMode('simple')}>Simple</button>
            <button type="button" role="radio" aria-checked={code} className={code ? 'is-active' : ''} onClick={() => switchMode('code')}>Edit code</button>
          </div>
          <label className="admin-check admin-email-editor__switch">
            <input type="checkbox" checked={enabled} onChange={(event) => { setMessage(null); setEnabled(event.target.checked); }} />
            <span>{enabled ? 'This email is on' : 'This email is off — it won’t be sent'}</span>
          </label>
          {fields.map((field) => (
            <label key={field} className="admin-field">
              <span>{FIELD_LABELS[field]}</span>
              {field === 'message' ? (
                <textarea ref={(el) => { inputs.current[field] = el; }} rows={Math.max(4, values.message.split('\n').length + 1)} value={values[field]} onFocus={() => setFocused(field)} onChange={(event) => set(field, event.target.value)} />
              ) : (
                <input ref={(el) => { inputs.current[field] = el; }} value={values[field]} onFocus={() => setFocused(field)} onChange={(event) => set(field, event.target.value)} />
              )}
              {FIELD_HELP[field] ? <span className="admin-field-help">{FIELD_HELP[field]}</span> : null}
            </label>
          ))}
          {code ? (
            <label className="admin-field">
              <span>Email HTML</span>
              <textarea ref={(el) => { inputs.current.html = el; }} className="admin-code admin-code--html" rows={Math.min(30, Math.max(14, values.html.split('\n').length + 2))} value={values.html} spellCheck={false} onFocus={() => setFocused('html')} onChange={(event) => set('html', event.target.value)} />
              <span className="admin-field-help">Full control over the email, like Shopify’s code editor. Use inline styles (style=&quot;…&quot;); many inboxes ignore &lt;style&gt; tags. Placeholders such as {'{{order_number}}'} and blocks such as {'{{details_table}}'} are filled in when it’s sent. <button type="button" className="admin-text-button" onClick={() => { if (window.confirm('Replace your HTML with the current simple design?')) set('html', starterCode(templateKey, values)); }}>Rebuild from the simple design</button></span>
            </label>
          ) : null}
          {unknown.length ? <div className="admin-form-message" role="status">These placeholders aren’t available in this email and will be left blank: {unknown.map((name) => `{{${name}}}`).join(', ')}</div> : null}
        </section>

        <section className="admin-card">
          <div className="admin-card__heading"><div><h2>Placeholders</h2><p className="admin-field-help">Click one to add it where your cursor is ({FIELD_LABELS[focused]}). It’s replaced with the real details when the email is sent.</p></div></div>
          <div className="admin-email-editor__vars">
            {[...meta.variables, ...(code ? BLOCK_PLACEHOLDERS : [])].map(([name, description]) => (
              <button key={name} type="button" className="admin-email-var" onClick={() => insert(name)} title={description}>
                <code>{`{{${name}}}`}</code>
                <span>{description}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="admin-card admin-email-editor__preview">
        <div className="admin-email-editor__envelope">
          <div><span>Subject</span><strong>{preview.subject}</strong></div>
          <div><span>To</span>{meta.audience === 'team' ? settings.notifications.recipients.join(', ') : 'The client (sample: client@example.com)'}</div>
        </div>
        <iframe title="Email preview" className="admin-email-editor__frame" srcDoc={preview.html} sandbox="" />
        <p className="admin-field-help admin-email-editor__note">Preview with sample details. Real emails use the actual order or request.</p>
      </section>

      <div className="admin-savebar">
        <span className="admin-savebar__status" role="status">{message?.message || (dirty ? 'Unsaved changes' : 'Saved')}</span>
        <button type="button" className="admin-button admin-button--ghost" disabled={pending || isDefault} onClick={() => { if (window.confirm('Go back to the original wording for this email?')) run(() => resetEmailTemplateAction(templateKey)); }}>Reset to default</button>
        <button type="button" className="admin-button admin-button--ghost" disabled={pending} onClick={() => run(() => sendTestEmailAction(templateKey, values))} title={`Sends this version to ${testRecipient}`}>Send test to me</button>
        <button type="button" className="admin-button" disabled={pending || !dirty} onClick={() => run(() => saveEmailTemplateAction(templateKey, { ...values, enabled }))}>{pending ? 'Working…' : 'Save'}</button>
      </div>
    </div>
  );
}
