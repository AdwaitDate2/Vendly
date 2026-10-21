'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

/** Shown when the admin cannot reach the database. */
export default function AdminOffline({ message }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="admin-route-root admin-offline">
      <div className="admin-card admin-offline__card" role="alert">
        <h1>Can&rsquo;t reach the database</h1>
        <p>{message || 'The admin couldn’t connect to the store database. This is usually a brief network problem. Your data is safe.'}</p>
        <p className="admin-field-help">If it keeps happening, check your internet connection, or that this network is allowed to reach the database server.</p>
        <button type="button" className="admin-button" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? 'Trying again…' : 'Try again'}</button>
      </div>
    </div>
  );
}
