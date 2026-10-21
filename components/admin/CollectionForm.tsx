// @ts-nocheck
'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import DeleteButton from './DeleteButton';
import ImagePicker from './ImagePicker';
import { archiveCollectionAction, saveCollectionAction } from '@/lib/admin-actions';

function FieldError({ errors, name }) {
  return errors?.[name]?.length ? <span className="admin-field-error">{errors[name][0]}</span> : null;
}

export default function CollectionForm({ collection, canDelete = false, productCount = 0 }) {
  const [state, formAction, pending] = useActionState(saveCollectionAction, { message: '', errors: {} });
  const isEditing = Boolean(collection?.id);
  const [image, setImage] = useState(collection?.image || '');

  return (
    <form action={formAction} className="admin-editor-form">
      <input type="hidden" name="id" defaultValue={collection?.id || ''} />
      <input type="hidden" name="version" defaultValue={collection?.version || ''} />
      <div className="admin-editor-grid">
        <div className="admin-editor-main">
          <section className="admin-card">
            <div className="admin-card__heading"><div><span className="admin-eyebrow">Collection identity</span><h2>Shape the edit</h2></div><span className="admin-card__hint">Required</span></div>
            <label className="admin-field"><span>Name</span><input name="name" defaultValue={collection?.name || ''} placeholder="e.g. Rings" required /><FieldError errors={state.errors} name="name" /></label>
            <div className="admin-field-row">
              <label className="admin-field"><span>URL slug</span><input name="slug" defaultValue={collection?.slug || ''} placeholder="rings" /><span className="admin-field-help">Keep this stable once products use the collection.</span><FieldError errors={state.errors} name="slug" /></label>
              <label className="admin-field"><span>Sort order</span><input name="sortOrder" type="number" min="0" step="1" defaultValue={collection?.sortOrder ?? 0} /><span className="admin-field-help">Lower numbers appear first.</span><FieldError errors={state.errors} name="sortOrder" /></label>
            </div>
            <label className="admin-field"><span>Collection note</span><textarea name="note" rows="4" defaultValue={collection?.note || ''} placeholder="Fine chains, stations &amp; pendants" required /><FieldError errors={state.errors} name="note" /></label>
          </section>
          <section className="admin-card">
            <div className="admin-card__heading"><div><span className="admin-eyebrow">Visual direction</span><h2>Hero media</h2></div></div>
            <div className="admin-field"><span>Collection photo</span><input type="hidden" name="image" value={image} /><ImagePicker value={image} onChange={setImage} /><span className="admin-field-help">Upload a new photo (saved to Kenmark Storage) or choose one from the library.</span><FieldError errors={state.errors} name="image" /></div>
          </section>
          <section className="admin-card">
            <div className="admin-card__heading"><div><span className="admin-eyebrow">Search preview</span><h2>SEO metadata</h2></div><span className="admin-card__hint">Optional</span></div>
            <label className="admin-field"><span>SEO title</span><input name="seoTitle" defaultValue={collection?.seoTitle || ''} placeholder="Rings — byShreen" /><FieldError errors={state.errors} name="seoTitle" /></label>
            <label className="admin-field"><span>SEO description</span><textarea name="seoDescription" rows="3" defaultValue={collection?.seoDescription || ''} placeholder="Explore the byShreen rings edit." /><FieldError errors={state.errors} name="seoDescription" /></label>
          </section>
        </div>
        <aside className="admin-editor-side">
          <section className="admin-card">
            <div className="admin-card__heading"><div><span className="admin-eyebrow">Organization</span><h2>Visibility</h2></div></div>
            <label className="admin-field"><span>Status</span><select name="status" defaultValue={collection?.status || 'draft'}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select><FieldError errors={state.errors} name="status" /></label>
          </section>
          <section className="admin-card admin-card--soft"><span className="admin-eyebrow">Publishing checklist</span><ul className="admin-checklist"><li className={collection?.name ? 'is-done' : ''}>Clear collection name</li><li className={collection?.note ? 'is-done' : ''}>Editorial note</li><li className={collection?.image ? 'is-done' : ''}>Hero media path</li><li>Product assignments</li><li>SEO review</li></ul></section>
          {isEditing ? <section className="admin-card admin-card--danger"><span className="admin-eyebrow">Lifecycle</span><p>Archive keeps the collection record while removing it from the storefront.</p><button type="submit" formAction={archiveCollectionAction} className="admin-button admin-button--danger">Archive collection</button>{canDelete ? <div className="admin-danger-delete"><p className="admin-field-help">{productCount ? `${productCount} product${productCount === 1 ? ' is' : 's are'} in this collection. Move ${productCount === 1 ? 'it' : 'them'} to another collection before deleting.` : 'Delete removes the collection for good. You can restore it from Recently deleted for 90 days.'}</p><DeleteButton kind="collection" id={collection.id} name={collection.name} redirectTo="/admin/collections" label="Delete collection" /></div> : null}</section> : null}
        </aside>
      </div>
      {state.message ? <div className="admin-form-message" role="alert">{state.message}</div> : null}
      <div className="admin-savebar"><Link href="/admin/collections" className="admin-button admin-button--ghost">Cancel</Link><button type="submit" className="admin-button" disabled={pending}>{pending ? 'Saving…' : isEditing ? 'Save changes' : 'Create collection'}</button></div>
    </form>
  );
}
