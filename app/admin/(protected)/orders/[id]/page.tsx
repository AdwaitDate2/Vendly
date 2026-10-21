// @ts-nocheck
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FulfillmentBadge, PaymentBadge } from '@/components/admin/OrderBadges';
import { CancelOrderForm, FulfillmentForm, OrderNoteForm, RefundForm, ShipOrderForm } from '@/components/admin/OrderActions';
import { hasPermission, requireAdminPermission } from '@/lib/admin-auth';
import { money } from '@/lib/order-emails';
import { getCustomerIdByEmail, getOrder } from '@/lib/orders';
import { countryName } from '@/lib/regions';
import { productPath } from '@/lib/routes';

const TIME_ZONE = 'America/New_York';
const when = (value) => new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));

export default async function OrderDetailPage({ params }) {
  const session = await requireAdminPermission('orders:manage');
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const customerId = await getCustomerIdByEmail(order.email).catch(() => null);
  const address = order.shippingAddress || {};
  const paid = ['paid', 'partially_refunded'].includes(order.paymentStatus);
  const open = order.status === 'open';
  const plain = JSON.parse(JSON.stringify(order));

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <Link href="/admin/orders" className="admin-back-link">← Orders</Link>
          <h1 className="admin-order-title">{order.name} <PaymentBadge status={order.paymentStatus} /> <FulfillmentBadge status={order.fulfillmentStatus} />{order.status === 'cancelled' ? <span className="admin-badge admin-badge--pay-voided">Cancelled</span> : null}{order.test ? <span className="admin-badge admin-badge--test">Test order</span> : null}</h1>
          <p>{when(order.createdAt)} · {order.payment?.provider === 'stripe' ? 'Card payment via Stripe' : 'Test checkout'}</p>
        </div>
      </div>

      <div className="admin-order-layout">
        <div className="admin-order-main">
          <section className="admin-card">
            <div className="admin-card__heading"><h2>Items</h2></div>
            <ul className="admin-order-items">
              {order.items.map((item) => (
                <li key={`${item.slug}:${item.variantId}:${item.size}`}>
                  <div className="admin-order-items__image">{item.image ? <Image src={item.image} alt="" fill sizes="56px" /> : null}</div>
                  <div className="admin-order-items__text">
                    <Link href={productPath(item.slug)} target="_blank">{item.title}</Link>
                    <small>{[item.variantTitle, item.size ? `Size ${item.size}` : '', item.sku ? `SKU ${item.sku}` : ''].filter(Boolean).join(' · ')}</small>
                    {item.madeToOrder ? <small>Made to order</small> : null}
                  </div>
                  <span>{money(item.unitCents)} × {item.qty}</span>
                  <strong>{money(item.lineCents)}</strong>
                </li>
              ))}
            </ul>
            {open && paid ? <FulfillmentForm order={plain} /> : null}
          </section>

          <section className="admin-card">
            <div className="admin-card__heading"><h2>Payment</h2></div>
            <dl className="admin-order-totals">
              <div><dt>Subtotal</dt><dd>{money(order.subtotalCents)}</dd></div>
              {order.discountCents ? <div><dt>Discount <small>{order.discount?.code}</small></dt><dd>−{money(order.discountCents)}</dd></div> : null}
              <div><dt>Shipping <small>{order.shipping?.name}</small></dt><dd>{money(order.shippingCents)}</dd></div>
              <div><dt>Tax <small>{order.tax ? `${order.tax.name} ${order.tax.ratePercent}%` : 'None'}</small></dt><dd>{money(order.taxCents)}</dd></div>
              <div className="admin-order-totals__total"><dt>Total</dt><dd>{money(order.totalCents)}</dd></div>
              {order.refundedCents ? <div><dt>Refunded</dt><dd>−{money(order.refundedCents)}</dd></div> : null}
              {order.paymentStatus !== 'pending' ? <div><dt>Net</dt><dd>{money(order.totalCents - order.refundedCents)}</dd></div> : null}
            </dl>
            {paid && hasPermission(session, 'orders:refund') ? <RefundForm order={plain} /> : null}
            {paid && !hasPermission(session, 'orders:refund') ? <p className="admin-field-help">Only an owner can issue refunds.</p> : null}
          </section>

          <section className="admin-card">
            <div className="admin-card__heading"><h2>Timeline</h2></div>
            <OrderNoteForm orderId={order.id} />
            <ol className="admin-timeline">
              {[...order.notes.map((note) => ({ id: note.id, at: note.createdAt, message: note.body, actor: note.author, note: true })), ...order.timeline.filter((entry) => entry.type !== 'note')]
                .sort((a, b) => new Date(b.at) - new Date(a.at))
                .map((entry) => (
                  <li key={entry.id} className={entry.note ? 'is-note' : ''}>
                    <p>{entry.message}</p>
                    <small>{when(entry.at)}{entry.actor && entry.actor !== 'system' ? ` · ${entry.actor}` : ''}</small>
                  </li>
                ))}
            </ol>
          </section>
        </div>

        <aside className="admin-order-side">
          <section className="admin-card">
            <div className="admin-card__heading"><h2>Customer</h2></div>
            <p className="admin-order-side__lines">
              {customerId ? <Link href={`/admin/customers/${customerId}`}><strong>{address.name || order.email}</strong></Link> : <strong>{address.name || order.email}</strong>}
              <a href={`mailto:${order.email}`}>{order.email}</a>
              {order.phone ? <a href={`tel:${order.phone}`}>{order.phone}</a> : null}
              {order.marketingOptIn ? <small>Agreed to marketing emails</small> : null}
            </p>
            <h3 className="admin-order-side__label">Shipping address</h3>
            <address className="admin-order-side__lines">
              {[address.name, address.line1, address.line2, [address.city, address.region, address.postalCode].filter(Boolean).join(', '), countryName(address.country)].filter(Boolean).map((line) => <span key={line}>{line}</span>)}
            </address>
            {order.customerNote ? (<><h3 className="admin-order-side__label">Note from customer</h3><p className="admin-order-note">{order.customerNote}</p></>) : null}
          </section>

          {open && paid ? (
            <section className="admin-card">
              <div className="admin-card__heading"><h2>Shipping</h2></div>
              {order.tracking ? (
                <p className="admin-order-side__lines">
                  <span>{[order.tracking.carrier, order.tracking.number].filter(Boolean).join(' · ') || 'Shipped'}</span>
                  {order.tracking.url ? <a href={order.tracking.url} target="_blank" rel="noreferrer">Track package</a> : null}
                </p>
              ) : null}
              <ShipOrderForm order={plain} />
            </section>
          ) : null}

          {open && order.paymentStatus !== 'paid' && order.paymentStatus !== 'partially_refunded' ? (
            <section className="admin-card">
              <div className="admin-card__heading"><h2>Cancel order</h2></div>
              <CancelOrderForm order={plain} />
            </section>
          ) : null}
          {open && paid ? <p className="admin-field-help admin-order-side__hint">To cancel a paid order, refund it in full first.</p> : null}
        </aside>
      </div>
    </div>
  );
}
