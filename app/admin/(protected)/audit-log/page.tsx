import Link from 'next/link';
import { requireAdminSession } from '@/lib/admin-auth';
import { ACTIVITY_TYPES, listActivity } from '@/lib/activity';

const TIME_ZONE = 'America/New_York';

export default async function ActivityLogPage({ searchParams }) {
  await requireAdminSession();
  const params = await searchParams;
  const type = String(params?.type || 'all');
  const actor = String(params?.actor || '');
  const result = await listActivity({ type, actor, page: params?.page }).catch(() => ({ items: [], total: 0, page: 1, pages: 1, actors: [] }));
  const query = (next) => `/admin/audit-log?${new URLSearchParams({ ...(type !== 'all' ? { type } : {}), ...(actor ? { actor } : {}), ...next }).toString()}`;

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><h1>Activity log</h1><p>Who changed what, and when. Times are New York time.</p></div></div>
      <div className="admin-view-tabs">
        <Link href={actor ? `/admin/audit-log?actor=${encodeURIComponent(actor)}` : '/admin/audit-log'} className={type === 'all' ? 'is-active' : ''}>All</Link>
        {Object.entries(ACTIVITY_TYPES).map(([key, label]) => <Link key={key} href={query({ type: key, page: '1' })} className={type === key ? 'is-active' : ''}>{label}</Link>)}
      </div>
      {result.actors.length > 1 ? (
        <form className="admin-list-toolbar" action="/admin/audit-log">
          {type !== 'all' ? <input type="hidden" name="type" value={type} /> : null}
          <label className="admin-field"><span>Person</span>
            <select name="actor" defaultValue={actor}>
              <option value="">Everyone</option>
              {result.actors.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <button type="submit" className="admin-button admin-button--ghost">Filter</button>
        </form>
      ) : null}
      <div className="admin-card admin-table-card">
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead><tr><th>When</th><th>Who</th><th>What</th><th>Details</th></tr></thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={item.id}>
                  <td>{new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(item.createdAt))}</td>
                  <td>{item.actor}</td>
                  <td><strong>{item.action}</strong>{item.label ? <small className="admin-table-sub">{item.href ? <Link href={item.href}>{item.label}</Link> : item.label}</small> : item.href ? <small className="admin-table-sub"><Link href={item.href}>Open</Link></small> : null}</td>
                  <td>{item.details || '—'}</td>
                </tr>
              ))}
              {!result.items.length ? <tr><td colSpan={4}><p className="admin-field-help">No activity recorded yet.</p></td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="admin-table-footer"><span>{result.total} events · Page {result.page} of {result.pages}</span><div><Link href={query({ page: String(Math.max(1, result.page - 1)) })} aria-disabled={result.page <= 1}>←</Link><Link href={query({ page: String(Math.min(result.pages, result.page + 1)) })} aria-disabled={result.page >= result.pages}>→</Link></div></div>
      </div>
    </div>
  );
}
