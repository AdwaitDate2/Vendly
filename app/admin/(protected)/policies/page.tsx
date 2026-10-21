import Link from 'next/link';
import { requireAdminPermission } from '@/lib/admin-auth';
import { listPolicies } from '@/lib/policies';

function formatDate(value) {
  if (!value) return '—';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
}

export default async function PoliciesPage() {
  await requireAdminPermission('content:write');
  const policies = await listPolicies();
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><h1>Policies</h1><p>Legal and client-care pages. Each is edited like a document and linked from the website footer.</p></div></div>
      <div className="admin-card admin-table-card">
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead><tr><th scope="col">Policy</th><th scope="col">Web address</th><th scope="col">Status</th><th scope="col">Last updated (shown on page)</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy.key}>
                  <td><Link href={`/admin/policies/${policy.key}`} className="admin-table-link"><strong>{policy.title}</strong></Link><small className="admin-table-sub">{policy.summary}</small></td>
                  <td><Link href={policy.path} target="_blank" className="admin-text-link">{policy.path} ↗</Link></td>
                  <td><span className={`admin-status admin-status--${policy.published ? 'published' : 'draft'}`}>{policy.published ? 'Live' : 'Hidden'}</span></td>
                  <td>{formatDate(policy.lastUpdated)}</td>
                  <td><Link href={`/admin/policies/${policy.key}`} className="admin-row-action">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
