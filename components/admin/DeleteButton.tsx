'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { deleteCustomPageAction } from '@/lib/admin-actions';
import { deleteCollectionAction, deleteProductsAction, deleteRecordAction } from '@/lib/delete-actions';

const RUN = {
  product: (id) => deleteProductsAction([id]),
  collection: (id) => deleteCollectionAction(id),
  inquiry: (id) => deleteRecordAction('inquiry', id),
  subscriber: (id) => deleteRecordAction('subscriber', id),
  customer: (id) => deleteRecordAction('customer', id),
  // Custom pages have their own delete, which returns to Pages & content when done.
  page: async (id) => {
    const formData = new FormData();
    formData.set('id', id);
    await deleteCustomPageAction(formData);
    return { ok: true };
  },
};

/**
 * Permanently deletes one record after a confirmation. The record can be restored from
 * Admin → Recently deleted for 90 days. `redirectTo` is where to go afterwards (default: refresh).
 */
export default function DeleteButton({ kind, id, name, confirmText, redirectTo, label = 'Delete', variant = 'button' }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  const run = () => {
    const message = confirmText || `Delete “${name}” permanently? You can restore it from Recently deleted for 90 days.`;
    if (!window.confirm(message)) return;
    setError(null);
    startTransition(async () => {
      const result = await RUN[kind](id);
      if (!result?.ok) { setError(result); return; }
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  };

  return (
    <span className="admin-delete">
      <button type="button" className={variant === 'link' ? 'admin-text-button admin-text-button--danger' : 'admin-button admin-button--ghost admin-button--danger'} disabled={pending} onClick={run}>{pending ? 'Deleting…' : label}</button>
      {error ? (
        <span className="admin-field-error" role="alert">
          {error.message}
          {error.inUse ? <> <Link href={`/admin/products?category=${encodeURIComponent(error.inUse.slug)}`} className="admin-text-link">See the products</Link></> : null}
        </span>
      ) : null}
    </span>
  );
}
