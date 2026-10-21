import Link from 'next/link';
import { FulfillmentBadge, PaymentBadge } from '@/components/admin/OrderBadges';
import { requireAdminPermission } from '@/lib/admin-auth';
import { money } from '@/lib/order-emails';
import { listOrders } from '@/lib/orders';

const TIME_ZONE = 'America/New_York';
const VIEWS = [
  { key: 'all', label: 'All' },
  { key: 'unfulfilled', label: 'Unfulfilled', fulfillment: 'unfulfilled' },
  { key: 'in_production', label: 'In production', fulfillment: 'in_production' },
  { key: 'shipped', label: 'Shipped', fulfillment: 'shipped' },
  { key: 'abandoned', label: 'Abandoned checkouts', view: 'abandoned' },
];

export default async function OrdersPage({ searchParams }) {
  await requireAdminPermission('orders:manage');
  const params = await searchParams;
  const query = String(params?.query || '');
  const tab = VIEWS.find((view) => view.key === params?.tab) || VIEWS[0];
  let result = { items: [], total: 0, page: 1, pages: 1 };
  let error = '';
  try {
    result = await listOrders({ query, view: tab.view || 'orders', fulfillment: tab.fulfillment || 'all', page: params?.page });
  } catch (loadError) {
    error = loadError.message || 'The database is unavailable.';
  }
  const href = (next) => `/admin/orders?${new URLSearchParams({ ...(tab.key !== 'all' ? { tab: tab.key } : {}), ...(query ? { query } : {}), ...next }).toString()}`;
  const abandoned = tab.key === 'abandoned';

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><h1>Orders</h1><p>{abandoned ? 'Checkouts that were started but not paid. Useful for a friendly follow-up.' : 'Every paid order from the website. Times are New York time.'}</p></div></div>
      <div className="admin-view-tabs" role="tablist" aria-label="Order views">
        {VIEWS.map((view) => <Link key={view.key} href={view.key === 'all' ? `/admin/orders${query ? `?query=${encodeURIComponent(query)}` : ''}` : `/admin/orders?tab=${view.key}${query ? `&query=${encodeURIComponent(query)}` : ''}`} className={tab.key === view.key ? 'is-active' : ''}>{view.label}</Link>)}
      </div>
      <div className="admin-list-toolbar">
        <form className="admin-list-search"><span aria-hidden="true">⌕</span><input name="query" defaultValue={query} placeholder="Search order number, name, email, product…" />{tab.key !== 'all' ? <input type="hidden" name="tab" value={tab.key} /> : null}<button type="submit">Search</button></form>
      </div>
      {error ? <div className="admin-alert admin-alert--error"><strong>Could not load orders.</strong><span>{error}</span></div> : null}
      <div className="admin-card admin-table-card">
        <div className="admin-table-meta"><span>{result.total} {abandoned ? (result.total === 1 ? 'checkout' : 'checkouts') : result.total === 1 ? 'order' : 'orders'}</span><span>Newest first</span></div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead><tr><th scope="col">Order</th><th scope="col">Date</th><th scope="col">Customer</th><th scope="col">Total</th><th scope="col">Payment</th>{abandoned ? null : <th scope="col">Fulfillment</th>}<th scope="col">Items</th></tr></thead>
            <tbody>
              {result.items.map((order) => (
                <tr key={order.id}>
                  <td><Link href={`/admin/orders/${order.id}`} className="admin-table-link"><strong>{order.name}</strong></Link>{order.test ? <small className="admin-table-sub">Test order</small> : null}{order.status === 'cancelled' ? <small className="admin-table-sub">Cancelled</small> : null}</td>
                  <td>{new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(order.createdAt))}</td>
                  <td><strong>{order.shippingAddress?.name || '—'}</strong><small className="admin-table-sub">{order.email}</small></td>
                  <td>{money(order.totalCents)}</td>
                  <td><PaymentBadge status={order.paymentStatus} /></td>
                  {abandoned ? null : <td><FulfillmentBadge status={order.fulfillmentStatus} /></td>}
                  <td>{order.items.reduce((sum, item) => sum + item.qty, 0)} {order.items.reduce((sum, item) => sum + item.qty, 0) === 1 ? 'item' : 'items'}</td>
                </tr>
              ))}
              {!result.items.length ? <tr><td colSpan={abandoned ? 6 : 7}><div className="admin-empty"><h2>{abandoned ? 'No abandoned checkouts' : 'No orders yet'}</h2><p>{abandoned ? 'Checkouts that are started but not paid will appear here.' : 'Orders placed at checkout will appear here.'}</p></div></td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="admin-table-footer"><span>Page {result.page} of {result.pages}</span><div><Link href={href({ page: String(Math.max(1, result.page - 1)) })} aria-disabled={result.page <= 1}>←</Link><Link href={href({ page: String(Math.min(result.pages, result.page + 1)) })} aria-disabled={result.page >= result.pages}>→</Link></div></div>
      </div>
    </div>
  );
}
