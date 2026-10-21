import RestoreButton from '@/components/admin/RestoreButton';
import { hasPermission, requireAdminSession } from '@/lib/admin-auth';
import { listDeletedRecords } from '@/lib/deletions';

const when = (value) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));

export default async function RecentlyDeletedPage() {
  const session = await requireAdminSession();
  if (!hasPermission(session, 'records:delete')) {
    return <div className="admin-page"><div className="admin-page-heading"><div><h1>Recently deleted</h1><p>Only owners can delete or restore items.</p></div></div></div>;
  }
  const rows = await listDeletedRecords().catch(() => []);
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><h1>Recently deleted</h1><p>Products, collections, requests, subscribers, and customer profiles you delete stay here for 90 days. Restore puts them back exactly as they were. Deleted photos and videos are restored from Kenmark Storage.</p></div></div>
      <div className="admin-card admin-table-card">
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead><tr><th scope="col">Item</th><th scope="col">Type</th><th scope="col">Deleted</th><th scope="col">Removed for good</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.label}</strong></td>
                  <td>{row.noun}</td>
                  <td>{when(row.deletedAt)}<small className="admin-table-sub">{row.deletedBy}</small></td>
                  <td>{new Date(row.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="admin-table-actions"><RestoreButton id={row.id} label={row.label} /></td>
                </tr>
              ))}
              {!rows.length ? <tr><td colSpan={5}><div className="admin-empty"><h2>Nothing deleted</h2><p>Items you delete appear here for 90 days so they can be restored.</p></div></td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
