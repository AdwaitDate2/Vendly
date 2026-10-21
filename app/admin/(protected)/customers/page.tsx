// @ts-nocheck
import Link from 'next/link';
import DeleteButton from '@/components/admin/DeleteButton';
import { hasPermission, requireAdminPermission } from '@/lib/admin-auth';
import { money } from '@/lib/order-emails';
import { listCustomers } from '@/lib/orders';

export default async function CustomersPage({ searchParams }) {
  const session = await requireAdminPermission('customers:manage');
  const canDelete = hasPermission(session, 'records:delete');
  const params = await searchParams;
  const query = String(params?.query || '');
  let result = { items: [], total: 0, page: 1, pages: 1 };
  let error = '';
  try {
    result = await listCustomers({ query, page: params?.page });
  } catch (loadError) {
    error = loadError.message || 'The database is unavailable.';
  }
  const href = (page) => `/admin/customers?${new URLSearchParams({ ...(query ? { query } : {}), page: String(page) }).toString()}`;

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><h1>Customers</h1><p>Everyone who has placed an order. Appointment requests stay under Requests.</p></div></div>
      <div className="admin-list-toolbar">
        <form className="admin-list-search"><span aria-hidden="true">⌕</span><input name="query" defaultValue={query} placeholder="Search name, email, phone…" /><button type="submit">Search</button></form>
      </div>
      {error ? <div className="admin-alert admin-alert--error"><strong>Could not load customers.</strong><span>{error}</span></div> : null}
      <div className="admin-card admin-table-card">
        <div className="admin-table-meta"><span>{result.total} {result.total === 1 ? 'customer' : 'customers'}</span><span>Most recent order first</span></div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead><tr><th scope="col">Customer</th><th scope="col">Location</th><th scope="col">Orders</th><th scope="col">Spent</th><th scope="col">Last order</th><th scope="col">Email marketing</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {result.items.map((customer) => (
                <tr key={customer.id}>
                  <td><Link href={`/admin/customers/${customer.id}`} className="admin-table-link"><strong>{customer.name || customer.email}</strong></Link><small className="admin-table-sub">{customer.email}</small></td>
                  <td>{[customer.lastAddress?.city, customer.lastAddress?.region].filter(Boolean).join(', ') || '—'}</td>
                  <td>{customer.orderCount}</td>
                  <td>{money(customer.totalSpentCents)}</td>
                  <td>{customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                  <td>{customer.marketingOptIn ? 'Subscribed' : '—'}</td>
                  <td className="admin-table-actions"><Link href={`/admin/customers/${customer.id}`} className="admin-row-action">Open</Link>{canDelete ? <DeleteButton kind="customer" id={customer.id} name={customer.name || customer.email} variant="link" confirmText={`Delete the profile for ${customer.name || customer.email}? Their orders stay in Orders. You can restore the profile from Recently deleted for 90 days.`} /> : null}</td>
                </tr>
              ))}
              {!result.items.length ? <tr><td colSpan={7}><div className="admin-empty"><h2>No customers yet</h2><p>Customers are added automatically when they place an order.</p></div></td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="admin-table-footer"><span>Page {result.page} of {result.pages}</span><div><Link href={href(Math.max(1, result.page - 1))} aria-disabled={result.page <= 1}>←</Link><Link href={href(Math.min(result.pages, result.page + 1))} aria-disabled={result.page >= result.pages}>→</Link></div></div>
      </div>
    </div>
  );
}
