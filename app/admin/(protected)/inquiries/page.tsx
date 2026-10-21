// @ts-nocheck
import Link from 'next/link';
import { listInquiries } from '@/lib/leads';
import DeleteButton from '@/components/admin/DeleteButton';
import { hasPermission, requireAdminPermission } from '@/lib/admin-auth';

const statuses = [['all', 'All statuses'], ['new', 'New'], ['active', 'In progress'], ['closed', 'Closed'], ['spam', 'Spam']];
const types = [['all', 'All types'], ['appointment', 'Appointments'], ['bespoke', 'Bespoke'], ['product', 'Piece enquiries'], ['contact', 'Messages']];
const TYPE_LABEL = { appointment: 'Appointment', bespoke: 'Bespoke', product: 'Piece enquiry', contact: 'Message' };

function formatDay(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export default async function InquiriesPage({ searchParams }) {
  const session = await requireAdminPermission('inquiry:read');
  const canDelete = hasPermission(session, 'records:delete');
  const params = await searchParams;
  const query = String(params?.query || '');
  const status = String(params?.status || 'all');
  const type = String(params?.type || 'all');
  let result = { items: [], total: 0, page: 1, pages: 1 };
  let error = '';
  try {
    result = await listInquiries({ query, status, type, page: params?.page });
  } catch (connectionError) {
    error = connectionError.message || 'MongoDB is unavailable.';
  }
  const href = (patch) => {
    const next = new URLSearchParams();
    const values = { query, status, type, ...patch };
    for (const [key, value] of Object.entries(values)) if (value && value !== 'all' && !(key === 'page' && Number(value) <= 1)) next.set(key, String(value));
    const qs = next.toString();
    return '/admin/inquiries' + (qs ? '?' + qs : '');
  };
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">Bespoke operations</span><h1>Customer requests</h1><p>Every appointment booking, bespoke inquiry and message. Open one to confirm a time, reply, or close it.</p></div></div>
      <div className="admin-view-tabs" role="navigation" aria-label="Requests sections"><Link href="/admin/inquiries" className="is-active">Customer inquiries</Link><Link href="/admin/appointments" className="">Customer appointments</Link></div>
      <form className="requests-toolbar" role="search">
        <label className="admin-list-search requests-toolbar__search"><span aria-hidden="true">⌕</span><input name="query" defaultValue={query} placeholder="Search names, emails, topics…" aria-label="Search requests" /></label>
        <label className="requests-toolbar__select"><span>Type</span><select name="type" defaultValue={type}>{types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="requests-toolbar__select"><span>Status</span><select name="status" defaultValue={status}>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <button type="submit" className="admin-button">Apply</button>
        {query || type !== 'all' || status !== 'all' ? <Link href="/admin/inquiries" className="admin-button admin-button--ghost">Clear</Link> : null}
      </form>
      {error ? <div className="admin-alert admin-alert--error"><strong>Could not load requests.</strong><span>{error}</span></div> : null}
      <div className="admin-card admin-table-card"><div className="admin-table-meta"><span>{result.total} {result.total === 1 ? 'request' : 'requests'}</span><span>Newest first</span></div><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th scope="col">Contact</th><th scope="col">Type</th><th scope="col">Appointment time</th><th scope="col">Status</th><th scope="col">Received</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>
        {result.items.map((item) => <tr key={item.id}><td><Link href={'/admin/inquiries/' + item.id}><strong>{item.name}</strong></Link><small className="admin-table-sub">{item.email}{item.phone ? ' · ' + item.phone : ''}</small></td><td>{TYPE_LABEL[item.requestType] || item.requestType}</td><td>{item.requestType === 'appointment' && item.preferredDate ? <><strong>{formatDay(item.preferredDate)}</strong><small className="admin-table-sub">{item.preferredTime}{item.appointmentStatus ? ' · ' + item.appointmentStatus : ''}</small></> : '—'}</td><td><span className={'admin-status admin-status--' + (item.status === 'active' ? 'published' : item.status === 'closed' || item.status === 'spam' ? 'archived' : 'draft')}>{item.status === 'active' ? 'in progress' : item.status}</span></td><td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td><td className="admin-table-actions"><Link href={'/admin/inquiries/' + item.id} className="admin-row-action">Open</Link>{canDelete ? <DeleteButton kind="inquiry" id={item.id} name={`${item.name}’s request`} variant="link" /> : null}</td></tr>)}
        {!result.items.length ? <tr><td colSpan="6"><div className="admin-empty"><span>✉</span><h2>{error ? 'Requests unavailable' : 'No requests here yet'}</h2><p>{error ? 'Check MongoDB and reload.' : 'New website requests will appear here.'}</p></div></td></tr> : null}
      </tbody></table></div><div className="admin-table-footer"><span>Page {result.page} of {result.pages}</span><div><Link href={href({ page: Math.max(1, result.page - 1) })} aria-disabled={result.page <= 1}>←</Link><Link href={href({ page: Math.min(result.pages, result.page + 1) })} aria-disabled={result.page >= result.pages}>→</Link></div></div></div>
    </div>
  );
}
