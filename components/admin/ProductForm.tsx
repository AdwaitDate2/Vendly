// @ts-nocheck
'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef, useState } from 'react';
import ProductMediaField from './ProductMediaField';
import ProductOptionsField from './ProductOptionsField';
import { archiveProductAction, saveProductAction } from '@/lib/admin-actions';
import DeleteButton from './DeleteButton';

function FieldError({ errors, name }) {
  return errors?.[name]?.length ? <span className="admin-field-error">{errors[name][0]}</span> : null;
}

function serialize(form) {
  return form ? new URLSearchParams(new FormData(form)).toString() : '';
}

function saveLabel(isEditing, savedStatus, status) {
  if (!isEditing) return { draft: 'Create draft', published: 'Create and publish', archived: 'Create as archived' }[status];
  if (status === savedStatus) return 'Save changes';
  if (status === 'published') return 'Save and publish';
  if (status === 'archived') return 'Save and archive';
  return savedStatus === 'published' ? 'Save and unpublish' : 'Save as draft';
}

function SharedTextField({ name, label, initial, shared, rows }) {
  const [value, setValue] = useState(initial);
  const custom = value.trim() !== shared.trim();
  return (
    <label className="admin-field">
      <span className="admin-field-labelrow"><span>{label}</span>{custom ? <button type="button" className="admin-row-action" onClick={() => setValue(shared)}>Use shared text</button> : <small className="admin-field-help">Same as every product</small>}</span>
      <textarea name={name} rows={rows} value={value} onChange={(event) => setValue(event.target.value)} />
    </label>
  );
}

export default function ProductForm({ product, collections, sharedText = { care: '', shipping: '' }, canDelete = false }) {
  const [saleMode, setSaleMode] = useState(product?.saleMode === 'enquire' ? 'enquire' : 'buy');
  const [state, formAction, pending] = useActionState(saveProductAction, { message: '', errors: {} });
  const isEditing = Boolean(product?.id);
  const savedStatus = product?.status || 'draft';
  const [status, setStatus] = useState(savedStatus);
  const [dirty, setDirty] = useState(false);
  const formRef = useRef(null);
  const baseline = useRef('');

  // Compare the whole form against what was last saved; covers photos and options, which live in hidden inputs.
  // Deferred a tick so hidden inputs reflect the state change the event just caused.
  const checkDirty = () => setTimeout(() => setDirty(serialize(formRef.current) !== baseline.current), 0);

  // After a save the page re-renders with the new version: that becomes the saved state to compare against.
  const savedKey = `${product?.id}:${product?.version}`;
  const [lastSavedKey, setLastSavedKey] = useState(savedKey);
  if (savedKey !== lastSavedKey) {
    setLastSavedKey(savedKey);
    setDirty(false);
  }
  useEffect(() => {
    baseline.current = serialize(formRef.current);
  }, [savedKey]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const confirmLeave = (event) => {
    if (dirty && !window.confirm('Leave without saving? Your changes to this product will be lost.')) event.preventDefault();
  };

  return (
    <>
      <form ref={formRef} action={formAction} className="admin-editor-form" onInput={checkDirty} onChange={checkDirty} onClick={checkDirty} onDrop={checkDirty}>
        <input type="hidden" name="id" defaultValue={product?.id || ''} />
        <input type="hidden" name="version" defaultValue={product?.version || ''} />
        <div className="admin-editor-grid">
          <div className="admin-editor-main">
            <section className="admin-card">
              <div className="admin-card__heading"><div><span className="admin-eyebrow">Essentials</span><h2>Product details</h2></div><span className="admin-card__hint">Required</span></div>
              <label className="admin-field"><span>Title</span><input name="title" defaultValue={product?.title || ''} placeholder="e.g. Diamond solitaire ring" required /><FieldError errors={state.errors} name="title" /></label>
              <label className="admin-field"><span>Card title</span><input name="shortTitle" defaultValue={product?.shortTitle && product.shortTitle !== product.title ? product.shortTitle : ''} placeholder="Short name for product cards (optional)" /><span className="admin-field-help">Shown on product cards in the shop. Leave blank to use the full title.</span></label>
              <label className="admin-field"><span>URL slug</span><input name="slug" defaultValue={product?.slug || ''} placeholder="diamond-solitaire-ring" /><span className="admin-field-help">The end of the product&rsquo;s web address. Changing it breaks existing links to the product.</span><FieldError errors={state.errors} name="slug" /></label>
              <label className="admin-field"><span>Description</span><textarea name="description" rows="7" defaultValue={product?.description || ''} placeholder="Describe the piece, materials, and intent." required /><FieldError errors={state.errors} name="description" /></label>
            </section>

            <section className="admin-card">
              <div className="admin-card__heading"><div><span className="admin-eyebrow">Jewelry details</span><h2>Materials &amp; story</h2></div></div>
              <div className="admin-field-row">
                <label className="admin-field"><span>Metal / purity</span><input name="metal" defaultValue={product?.metal || ''} placeholder="14K Yellow Gold" required /><FieldError errors={state.errors} name="metal" /></label>
                <label className="admin-field"><span>Stone</span><input name="stone" defaultValue={product?.stone || ''} placeholder="Natural Diamond" required /><FieldError errors={state.errors} name="stone" /></label>
              </div>
              <label className="admin-field"><span>Total diamond weight (ct)</span><input name="caratWeight" defaultValue={product?.caratWeight || ''} placeholder="1.25" inputMode="decimal" /><span className="admin-field-help">Shown on the product page as &ldquo;Approx. 1.25ct total&rdquo;. Leave blank to hide.</span><FieldError errors={state.errors} name="caratWeight" /></label>
            </section>

            <section className="admin-card">
              <div className="admin-card__heading"><div><span className="admin-eyebrow">Product page</span><h2>Details, care &amp; shipping text</h2></div></div>
              <fieldset className="admin-section-toggles">
                <legend>Sections shown on the product page</legend>
                {[['details', 'Product details'], ['care', 'Care instructions'], ['shipping', 'Shipping & returns']].map(([key, label]) => (
                  <label className="admin-check" key={key}><input type="checkbox" name="showSections" value={key} defaultChecked={!(product?.hiddenSections || []).includes(key)} /><span>{label}</span></label>
                ))}
              </fieldset>
              <p className="admin-field-help">This is the text shown under “Add to bag”. It starts as the wording shared by every product (change that in <Link href="/admin/settings">Settings → Product page text</Link>). Edit it here only if this piece needs different wording. Use a blank line for a new paragraph, “- ” for a bullet, and “# ” for a heading.</p>
              <label className="admin-field"><span>Extra product details</span><textarea name="detailsExtra" rows="3" defaultValue={product?.detailsExtra || ''} placeholder={'Optional, one per line, e.g.\nBand width: 2mm\nSetting: Six-prong'} /><span className="admin-field-help">Added under Metal and Natural Diamonds as “Label: value”.</span></label>
              <SharedTextField name="careText" label="Care instructions" initial={product?.careText || sharedText.care} shared={sharedText.care} rows={9} />
              <SharedTextField name="shippingText" label="Shipping & returns" initial={product?.shippingText || sharedText.shipping} shared={sharedText.shipping} rows={11} />
            </section>

            <section className="admin-card">
              <div className="admin-card__heading"><div><h2>How is this piece sold?</h2></div></div>
              <div className="admin-sale-mode" role="radiogroup" aria-label="How is this piece sold?">
                <label className={`admin-sale-mode__option${saleMode === 'buy' ? ' is-on' : ''}`}><input type="radio" name="saleMode" value="buy" checked={saleMode === 'buy'} onChange={() => setSaleMode('buy')} /><span><strong>Sell online</strong><small>Shoppers choose a metal, see the price and add it to their bag.</small></span></label>
                <label className={`admin-sale-mode__option${saleMode === 'enquire' ? ' is-on' : ''}`}><input type="radio" name="saleMode" value="enquire" checked={saleMode === 'enquire'} onChange={() => setSaleMode('enquire')} /><span><strong>Catalogue — enquiry only</strong><small>No price and no “Add to bag”. Shoppers send an enquiry about this piece, and it lands in Customer requests.</small></span></label>
              </div>
            </section>

            {saleMode === 'buy' ? (
              <section className="admin-card">
                <div className="admin-card__heading"><div><h2>Metal options &amp; pricing</h2></div></div>
                <ProductOptionsField product={product} errors={state.errors} />
              </section>
            ) : null}

            <section className="admin-card">
              <div className="admin-card__heading"><div><h2>Photos</h2></div></div>
              <ProductMediaField initialImages={product?.images || []} error={state.errors?.images?.[0]} />
            </section>
          </div>

          <aside className="admin-editor-side">
            <section className="admin-card">
              <div className="admin-card__heading"><div><span className="admin-eyebrow">Organization</span><h2>Visibility</h2></div></div>
              <label className="admin-field"><span>Status</span><select name="status" defaultValue={savedStatus} onChange={(event) => setStatus(event.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select><FieldError errors={state.errors} name="status" /></label>
              <label className="admin-field"><span>Collection</span><select name="category" defaultValue={product?.category || ''} required><option value="">Choose collection</option>{collections.map((collection) => <option key={collection.id || collection.slug} value={collection.slug}>{collection.name}</option>)}</select><FieldError errors={state.errors} name="category" /></label>
              <label className="admin-field"><span>Tags</span><input name="tags" defaultValue={(product?.tags || []).join(', ')} placeholder="bridal, bestseller, gift" /><span className="admin-field-help">Separate tags with commas. Used for search and filtering in the admin.</span></label>
              <label className="admin-check"><input type="checkbox" name="madeToOrder" value="yes" defaultChecked={product?.madeToOrder !== false} /><span>Made to order — can be bought even when stock is 0</span></label>
            </section>
            <section className="admin-card">
              <div className="admin-card__heading"><div><h2>Search engine listing</h2></div></div>
              <label className="admin-field"><span>Page title</span><input name="seoTitle" defaultValue={product?.seoTitle || ''} placeholder={product?.title ? `${product.title} — byShreen` : 'Defaults to the product title'} /></label>
              <label className="admin-field"><span>Description</span><textarea name="seoDescription" rows="3" defaultValue={product?.seoDescription || ''} placeholder="Defaults to the start of the product description" /></label>
            </section>
            <section className="admin-card admin-card--soft">
              <span className="admin-eyebrow">Publishing checklist</span>
              <ul className="admin-checklist"><li className={product?.title ? 'is-done' : ''}>Clear product title</li><li className={product?.description ? 'is-done' : ''}>Editorial description</li><li className={product?.images?.length ? 'is-done' : ''}>Primary media</li><li>Variant &amp; stock review</li><li>SEO preview</li></ul>
            </section>
            {isEditing ? <section className="admin-card admin-card--danger"><h2>Archive</h2><p className="admin-field-help">Archiving hides the product from the website but keeps its history.</p><button type="submit" form="archive-product-form" className="admin-button admin-button--danger" onClick={(event) => { if (!window.confirm(`Archive “${product.title}”? It will disappear from the website.${dirty ? ' Unsaved changes on this page will be lost.' : ''}`)) event.preventDefault(); }}>Archive product</button>{canDelete ? <div className="admin-danger-delete"><p className="admin-field-help">Delete removes the product and its stock history for good. Past orders keep their details. You can restore it from Recently deleted for 90 days.</p><DeleteButton kind="product" id={product.id} name={product.title} redirectTo="/admin/products" label="Delete product" /></div> : null}</section> : null}
          </aside>
        </div>
        {state.message ? <div className="admin-form-message" role="alert">{state.message}</div> : null}
        <div className="admin-savebar">{dirty ? <span className="admin-savebar__dirty">Unsaved changes</span> : null}<Link href="/admin/products" className="admin-button admin-button--ghost" onClick={confirmLeave}>Cancel</Link><button type="submit" className="admin-button" disabled={pending}>{pending ? 'Saving…' : saveLabel(isEditing, savedStatus, status)}</button></div>
      </form>
      {isEditing ? (
        <form id="archive-product-form" action={archiveProductAction} hidden>
          <input type="hidden" name="id" value={product.id} />
          <input type="hidden" name="version" value={product.version || 0} />
        </form>
      ) : null}
    </>
  );
}

