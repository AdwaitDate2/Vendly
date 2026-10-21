// @ts-nocheck
'use client';

import { useActionState, useState } from 'react';
import SortableList, { moveItem } from './SortableList';
import { saveComingSoonAction } from '@/lib/admin-actions';
import { newId } from '@/lib/blocks';

export default function ComingSoonForm({ settings, passwordConfigured = false }) {
  const [state, action, pending] = useActionState(saveComingSoonAction, {});
  const page = settings.comingSoon;
  const [blocks, setBlocks] = useState(page.blocks.filter((block) => block.type === 'text'));
  const change = (index, key, value) => setBlocks((current) => current.map((block, i) => (i === index ? { ...block, [key]: value } : block)));
  const add = () => setBlocks((current) => [...current, { id: newId('block'), type: 'text', text: '', label: '', url: '' }]);

  return (
    <form action={action} className="admin-card">
      <div className="admin-card__heading"><div><h2>Landing page</h2><p className="admin-field-help">With no storefront password configured, visitors see this page while coming-soon mode is on. If a password is configured, they see the published Password template instead. To look at the real website while this is on, use “Preview full website” below.</p></div></div>
      <label className="admin-check"><input type="checkbox" name="enabled" value="yes" defaultChecked={page.enabled} /><span>Show the coming soon page instead of the website</span></label>
      <label className="admin-check"><input type="checkbox" name="showLogo" value="yes" defaultChecked={page.showLogo} /><span>Show the lotus logo</span></label>
      <label className="admin-field"><span>Heading</span><input name="heading" defaultValue={page.heading} required /></label>

      <h3>Text under the heading</h3>
      <p className="admin-field-help">Shown in this order. Drag the handle to reorder. The email and Instagram links always appear below the text.</p>
      <input type="hidden" name="blocks" value={JSON.stringify(blocks)} />
      <SortableList
        items={blocks}
        onReorder={(from, to) => setBlocks((current) => moveItem(current, from, to))}
        renderItem={(block, index, handle) => (
          <fieldset className="admin-rate">
            <legend className="sr-only">Paragraph {index + 1}</legend>
            <div className="admin-rate__actions">
              <span><span {...handle}>⠿</span> <strong>Paragraph {index + 1}</strong></span>
              <button type="button" className="admin-button admin-button--ghost admin-button--danger" onClick={() => setBlocks((current) => current.filter((_, i) => i !== index))}>Remove</button>
            </div>
            <label className="admin-field"><span className="sr-only">Text</span><textarea rows="3" value={block.text} onChange={(event) => change(index, 'text', event.target.value)} /></label>
          </fieldset>
        )}
      />
      {!blocks.length ? <p className="admin-field-help">Nothing here yet. Add a paragraph below.</p> : null}
      <div className="admin-import__actions">
        <button type="button" className="admin-button admin-button--ghost" onClick={add}>Add paragraph</button>
      </div>

      {state?.message ? <div className={state.ok ? 'admin-alert' : 'admin-form-message'} role="status">{state.message}</div> : null}
      <div className="admin-import__actions">
        <button type="submit" className="admin-button" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
        <a className="admin-button admin-button--ghost" href="/coming-soon" target="_blank" rel="noopener noreferrer">{passwordConfigured && page.enabled ? 'Preview public Password page' : 'Preview coming soon page'}</a>
        <a className="admin-button admin-button--ghost" href="/admin/preview-site" target="_blank" rel="noopener noreferrer">Preview full website</a>
      </div>
    </form>
  );
}
