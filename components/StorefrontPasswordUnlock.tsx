'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { unlockStorefront } from '@/lib/storefront-password-actions';

export default function StorefrontPasswordUnlock({ preview = false }) {
  const [state, action, pending] = useActionState(unlockStorefront, {});
  const [previewAttempted, setPreviewAttempted] = useState(false);
  const dialogRef = useRef(null);
  const formRef = useRef(null);
  const notifyPreview = (open) => {
    if (preview) window.parent?.postMessage({ source: 'byshreen-preview', type: 'password-dialog', open }, window.location.origin);
  };

  useEffect(() => {
    if (state?.message) formRef.current?.elements.namedItem('password')?.focus();
  }, [state]);

  return <>
    <button
      type="button"
      className="password-template__unlock"
      onClick={() => {
        setPreviewAttempted(false);
        dialogRef.current?.showModal();
        notifyPreview(true);
      }}
    >enter using password</button>
    <dialog
      ref={dialogRef}
      className="storefront-password-dialog"
      aria-labelledby="storefront-password-title"
      onClose={() => notifyPreview(false)}
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current.close();
      }}
    >
      <form
        action={preview ? undefined : action}
        method={preview ? 'dialog' : undefined}
        ref={formRef}
        className="storefront-password-dialog__form"
        onSubmit={preview ? (event) => {
          event.preventDefault();
          setPreviewAttempted(true);
        } : undefined}
      >
        <button type="button" className="storefront-password-dialog__close" aria-label="Close" onClick={() => dialogRef.current?.close()}>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 3 10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
        <h2 id="storefront-password-title">Enter password</h2>
        <label htmlFor="storefront-password-input">password</label>
        <input id="storefront-password-input" name="password" type="password" placeholder="password" autoComplete="current-password" required maxLength={201} />
        {state?.message ? <p className="storefront-password-dialog__error" role="alert">{state.message}</p> : null}
        <button type="submit" disabled={pending}>{pending ? 'checking' : 'submit'}</button>
        {preview && previewAttempted ? <p className="storefront-password-dialog__preview-note" role="status">Password entry isn’t submitted from the theme preview.</p> : null}
      </form>
    </dialog>
  </>;
}
