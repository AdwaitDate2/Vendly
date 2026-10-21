// @ts-nocheck
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CustomerNotesForm from '@/components/admin/CustomerNotesForm';
import DeleteButton from '@/components/admin/DeleteButton';
import { FulfillmentBadge, PaymentBadge } from '@/components/admin/OrderBadges';
import { hasPermission, requireAdminPermission } from '@/lib/admin-auth';
import { money } from '@/lib/order-emails';
import { getCustomer } from '@/lib/orders';
import { countryName } from '@/lib/regions';

export default async function CustomerDetailPage({ params }) {
  const session = await requireAdminPermission('customers:manage');
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();
  const address = customer.lastAddress || {};

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <Link href="/admin/customers" className="admin-back-link">← Customers</Link>
          <h1>{customer.name || customer.email}</h1>
          <p>Customer since {new Date(customer.firstOrderAt || customer.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
      <section className="admin-kpi-grid admin-kpi-grid--3" aria-label="Customer summary">
        <div className="admin-kpi-card"><span>Amount spent</span><strong>{money(customer.totalSpentCents)}</strong></div>
        <div className="admin-kpi-card"><span>Orders</span><strong>{customer.orderCount}</strong></div>
        <div className="admin-kpi-card"><span>Average order</span><strong>{money(customer.orderCount ? Math.round(customer.totalSpentCents / customer.orderCount) : 0)}</strong></div>
      </section>
      <div className="admin-order-layout">
        <div className="admin-order-main">
          <section className="admin-card admin-table-card">
            <div className="admin-card__heading"><h2>Orders</h2></div>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Payment</th><th>Fulfillment</th></tr></thead>
                <tbody>
                  {customer.orders.map((order) => (
                    <tr key={order.id}>
                      <td><Link href={`/admin/orders/${order.id}`} className="admin-table-link"><strong>{order.name}</strong></Link>{order.test ? <small className="admin-table-sub">Test order</small> : null}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td>{money(order.totalCents)}</td>
                      <td><PaymentBadge status={order.paymentStatus} /></td>
                      <td><FulfillmentBadge status={order.fulfillmentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <aside className="admin-order-side">
          <section className="admin-card">
            <div className="admin-card__heading"><h2>Contact</h2></div>
            <p className="admin-order-side__lines">
              <a href={`mailto:${customer.email}`}>{customer.email}</a>
              {customer.phone ? <a href={`tel:${customer.phone}`}>{customer.phone}</a> : null}
              <small>{customer.marketingOptIn ? 'Agreed to marketing emails' : 'Not subscribed to marketing emails'}</small>
            </p>
            <h3 className="admin-order-side__label">Last shipping address</h3>
            <address className="admin-order-side__lines">
              {[address.name, address.line1, address.line2, [address.city, address.region, address.postalCode].filter(Boolean).join(', '), countryName(address.country)].filter(Boolean).map((line) => <span key={line}>{line}</span>)}
            </address>
          </section>
          <CustomerNotesForm customer={{ id: customer.id, notes: customer.notes || '', tags: customer.tags || [] }} />
          {hasPermission(session, 'records:delete') ? (
            <section className="admin-card admin-card--danger">
              <h2>Delete customer profile</h2>
              <p className="admin-field-help">Removes the profile, notes, and tags. Their {customer.orderCount === 1 ? 'order stays' : 'orders stay'} in Orders, because order records are kept for tax and refunds. You can restore the profile from Recently deleted for 90 days.</p>
              <DeleteButton kind="customer" id={customer.id} name={customer.name || customer.email} redirectTo="/admin/customers" label="Delete profile" />
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
