// @ts-nocheck
import Link from 'next/link';
import { listSubscribers } from '@/lib/leads';
import DeleteButton from '@/components/admin/DeleteButton';
import { hasPermission, requireAdminPermission } from '@/lib/admin-auth';

const statuses = ['all', 'subscribed', 'unsubscribed', 'bounced'];

export default async function SubscribersPage({ searchParams }) {
  const session = await requireAdminPermission('subscriber:read');
  const canDelete = hasPermission(session, 'records:delete');
  const params = await searchParams;
  const query = String(params?.query || '');
  const status = String(params?.status || 'all');
  let result = { items: [], total: 0, page: 1, pages: 1 };
  let error = '';
  try {
    result = await listSubscribers({ query, status, page: params?.page });
  } catch (connectionError) {
    error = connectionError.message || 'MongoDB is unavailable.';
  }
  return (
    <div className="admin-page">
      <div className="admin-page-heading" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="admin-eyebrow">Audience</span>
          <h1>Subscribers</h1>
          <p>Keep consent-aware audience records useful, minimal, and easy to respect.</p>
        </div>
        <div>
          <Link href="/admin/subscribers/newsletter" className="admin-button" style={{ background: '#a84d5f', borderColor: '#a84d5f', color: '#fff' }}>
            ✉ Compose & Send Newsletter
          </Link>
        </div>
      </div>
      <div className="admin-list-toolbar"><form className="admin-list-search"><span aria-hidden="true">⌕</span><input name="query" defaultValue={query} placeholder="Search email addresses…" /><input type="hidden" name="status" value={status} /><button type="submit">Search</button></form><Link href="/admin/subscribers" className="admin-button admin-button--ghost">Reset</Link></div>
      <div className="admin-view-tabs" role="tablist" aria-label="Subscriber views">{statuses.map((item) => <Link href={'/admin/subscribers?status=' + item + (query ? '&query=' + encodeURIComponent(query) : '')} className={status === item ? 'is-active' : ''} key={item}>{item[0].toUpperCase() + item.slice(1)} {item === 'all' ? <small>{result.total || ''}</small> : null}</Link>)}</div>
      {error ? <div className="admin-alert admin-alert--error"><strong>Could not load subscribers.</strong><span>{error}</span></div> : null}
      <div className="admin-card admin-table-card"><div className="admin-table-meta"><span>{result.total} {result.total === 1 ? 'subscriber' : 'subscribers'}</span><span>Consent-aware records</span></div><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th scope="col">Email</th><th scope="col">Status</th><th scope="col">Source</th><th scope="col">Consent</th>{canDelete ? <th scope="col"><span className="sr-only">Actions</span></th> : null}</tr></thead><tbody>
        {result.items.map((item) => <tr key={item.id}><td><strong>{item.email}</strong></td><td><span className={'admin-status admin-status--' + (item.status === 'subscribed' ? 'published' : 'archived')}>{item.status}</span></td><td>{item.source}</td><td>{item.consentAt ? new Date(item.consentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>{canDelete ? <td className="admin-table-actions"><DeleteButton kind="subscriber" id={item.id} name={item.email} variant="link" confirmText={`Delete ${item.email} from the list permanently? Use this when someone asks to be removed. You can restore it from Recently deleted for 90 days.`} /></td> : null}</tr>)}
        {!result.items.length ? <tr><td colSpan="4"><div className="admin-empty"><span>◎</span><h2>{error ? 'Audience unavailable' : 'No subscribers here yet'}</h2><p>{error ? 'Check MongoDB and reload.' : 'Newsletter signups will appear here.'}</p></div></td></tr> : null}
      </tbody></table></div><div className="admin-table-footer"><span>Page {result.page} of {result.pages}</span><div><Link href={'/admin/subscribers?status=' + status + '&page=' + Math.max(1, result.page - 1)} aria-disabled={result.page <= 1}>←</Link><Link href={'/admin/subscribers?status=' + status + '&page=' + Math.min(result.pages, result.page + 1)} aria-disabled={result.page >= result.pages}>→</Link></div></div></div>
    </div>
  );
}
