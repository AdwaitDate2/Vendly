'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { restoreDeletedAction } from '@/lib/delete-actions';

export default function RestoreButton({ id, label }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState(null);
  const restore = () => startTransition(async () => {
    const next = await restoreDeletedAction(id);
    setResult(next);
    if (next.ok) router.refresh();
  });
  return (
    <span className="admin-delete">
      <button type="button" className="admin-button admin-button--ghost" disabled={pending} onClick={restore} aria-label={`Restore ${label}`}>{pending ? 'Restoring…' : 'Restore'}</button>
      {result && !result.ok ? <span className="admin-field-error" role="alert">{result.message}</span> : null}
    </span>
  );
}
