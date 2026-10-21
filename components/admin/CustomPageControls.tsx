'use client';

import { useActionState } from 'react';
import { createCustomPageAction, deleteCustomPageAction } from '@/lib/admin-actions';

export function CreatePageForm() {
  const [state, formAction, pending] = useActionState(createCustomPageAction, { message: '' });
  return (
    <form action={formAction} className="admin-card admin-create-page">
      <label className="admin-field"><span>Page title</span><input name="title" placeholder="e.g. Care for your jewelry" required autoFocus /></label>
      <p className="admin-field-help">The page starts as a draft with a title and a text block. Add, reorder, and style blocks in the editor, then publish it.</p>
      {state.message ? <div className="admin-form-message" role="alert">{state.message}</div> : null}
      <div className="admin-import__actions"><button type="submit" className="admin-button" disabled={pending}>{pending ? 'Creating…' : 'Create page'}</button></div>
    </form>
  );
}

export function PageUrlField({ slug }) {
  return (
    <label className="admin-field">
      <span>Web address</span>
      <div className="admin-url-field"><span>/pages/</span><input name="slug" defaultValue={slug} pattern="[a-z0-9-]*" title="Lowercase letters, numbers, and hyphens" /></div>
      <span className="admin-field-help">Changing this breaks links to the old address. Add the page to a menu under Navigation.</span>
    </label>
  );
}

export function DeletePageButton() {
  return (
    <button
      type="submit"
      formAction={deleteCustomPageAction}
      formNoValidate
      className="admin-button admin-button--danger"
      onClick={(event) => { if (!window.confirm('Delete this page? It will disappear from the website.')) event.preventDefault(); }}
    >
      Delete page
    </button>
  );
}
