'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState, useTransition } from 'react';
import { restorePolicyAction, savePolicyAction } from '@/lib/policy-actions';
import RichTextEditor from './RichTextEditor';

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// A plain button, not a form: it sits inside the main edit form, and forms can't be nested.
function RestoreButton({ policyKey, revision }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const restore = () => {
    if (!window.confirm('Restore this version? The current text is kept in the history, so you can switch back.')) return;
    setError('');
    startTransition(async () => {
      const formData = new FormData();
      formData.set('key', policyKey);
      formData.set('revisionId', revision.id);
      const result = await restorePolicyAction(null, formData);
      if (result?.ok) router.refresh();
      else setError(result?.message || 'Could not restore that version.');
    });
  };
  return (
    <span className="admin-policy__restore">
      <button type="button" className="admin-text-button" disabled={pending} onClick={restore}>{pending ? 'Restoring…' : 'Restore'}</button>
      {error ? <small className="admin-field-error">{error}</small> : null}
    </span>
  );
}

export default function PolicyEditor({ policy, meta, revisions }) {
  const router = useRouter();
  const [state, action, saving] = useActionState(savePolicyAction, {});
  const [body, setBody] = useState(policy.body);
  const [title, setTitle] = useState(policy.title);
  const [lastUpdated, setLastUpdated] = useState(policy.lastUpdated);
  const [intro, setIntro] = useState(policy.intro);
  const [published, setPublished] = useState(policy.published);
  const [seoTitle, setSeoTitle] = useState(policy.seoTitle);
  const [seoDescription, setSeoDescription] = useState(policy.seoDescription);
  const [dirty, setDirty] = useState(false);
  const [version, setVersion] = useState(policy.version);
  const touch = () => setDirty(true);

  useEffect(() => {
    if (!state?.ok) return;
    setDirty(false);
    setVersion(state.version);
    router.refresh();
  }, [state, router]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return (
    <form action={action} className="admin-policy" onChange={touch}>
      <input type="hidden" name="key" value={policy.key} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="body" value={JSON.stringify(body)} />

      <div className="admin-policy__main">
        <section className="admin-card">
          <label className="admin-field"><span>Title</span><input name="title" value={title} maxLength={120} required onChange={(event) => setTitle(event.target.value)} /></label>
          <label className="admin-field"><span>Introduction (shown under the title)</span><textarea name="intro" rows={2} maxLength={600} value={intro} onChange={(event) => setIntro(event.target.value)} /></label>
          <div className="admin-field">
            <span>Content</span>
            <RichTextEditor value={policy.body} onChange={(next) => { setBody(next); touch(); }} label={`${title} content`} />
            <span className="admin-field-help">Use <strong>Heading</strong> for main sections (they appear in the page’s “On this page” list) and <strong>Subheading</strong> inside them. Paste from Word or Google Docs and the formatting is kept where the website supports it.</span>
          </div>
        </section>
      </div>

      <aside className="admin-policy__side">
        <section className="admin-card">
          <div className="admin-card__heading"><h2>Visibility</h2></div>
          <label className="admin-check"><input type="checkbox" name="published" value="yes" checked={published} onChange={(event) => setPublished(event.target.checked)} /><span>Show on website</span></label>
          <p className="admin-field-help">Live at <Link href={meta.path} target="_blank" className="admin-text-link">{meta.path} ↗</Link></p>
        </section>
        <section className="admin-card">
          <div className="admin-card__heading"><h2>Last updated</h2></div>
          <label className="admin-field"><span className="sr-only">Last updated date</span><input type="date" name="lastUpdated" value={lastUpdated} onChange={(event) => { setLastUpdated(event.target.value); touch(); }} /></label>
          <div className="admin-policy__date-actions">
            <button type="button" className="admin-text-button" onClick={() => { setLastUpdated(today()); touch(); }}>Set to today</button>
            {lastUpdated ? <button type="button" className="admin-text-button" onClick={() => { setLastUpdated(''); touch(); }}>Don’t show a date</button> : null}
          </div>
          <p className="admin-field-help">{meta.legal ? 'Legal pages usually show the date they last changed. Update it whenever the policy changes.' : 'Optional. Leave empty to hide the date.'}</p>
        </section>
        <section className="admin-card">
          <div className="admin-card__heading"><h2>Search engine listing</h2></div>
          <label className="admin-field"><span>Page title</span><input name="seoTitle" value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} maxLength={180} placeholder={`${title} — byShreen`} /></label>
          <label className="admin-field"><span>Description</span><textarea name="seoDescription" rows={3} value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} maxLength={320} placeholder="Uses the introduction when empty." /></label>
        </section>
        <section className="admin-card">
          <div className="admin-card__heading"><h2>Version history</h2></div>
          {revisions.length ? (
            <ul className="admin-policy__revisions">
              {revisions.map((revision) => (
                <li key={revision.id}>
                  <span><strong>{new Date(revision.updatedAt || revision.archivedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</strong><small>{revision.updatedBy || 'Client’s starting text'} · {revision.words} words</small></span>
                  <RestoreButton policyKey={policy.key} revision={revision} />
                </li>
              ))}
            </ul>
          ) : <p className="admin-field-help">Earlier versions appear here after you save changes.</p>}
        </section>
      </aside>

      <div className="admin-savebar">
        <span className="admin-savebar__status" role="status">{state?.message && !dirty ? state.message : dirty ? 'Unsaved changes' : policy.isDefault ? 'Showing the client’s text. Save to confirm it.' : `Saved${policy.updatedBy ? ` by ${policy.updatedBy}` : ''}`}</span>
        {state?.ok === false ? <span className="admin-field-error" role="alert">{state.message}</span> : null}
        <Link href={meta.path} target="_blank" className="admin-button admin-button--ghost">View page ↗</Link>
        <button type="submit" className="admin-button" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}
