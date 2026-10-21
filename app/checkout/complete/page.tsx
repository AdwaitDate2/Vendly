import Image from 'next/image';
import Link from 'next/link';
import ClearBag from '@/components/checkout/ClearBag';
import { syncOrderPayment } from '@/lib/order-flow';
import { getOrderForShopper } from '@/lib/orders';
import { countryName } from '@/lib/regions';
import { loadMediaFocalPoints } from '@/lib/page-data';
import { applyMediaFocalPoints } from '@/lib/media-focal-points';
import '../checkout.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Order confirmation — byShreen',
  robots: { index: false },
};

const money = (cents) => `$${(Number(cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function CheckoutCompletePage({ searchParams }) {
  const { order: orderId, token, redirect_status: redirectStatus } = await searchParams;
  let order = await getOrderForShopper(String(orderId || ''), String(token || ''));
  if (order?.paymentStatus === 'pending') order = await syncOrderPayment(order);

  if (!order) {
    return (
      <main className="checkout-page">
        <section className="checkout-empty">
          <span className="eyebrow">Order</span>
          <h1>We could not find that order.</h1>
          <p>If you completed a payment, your confirmation email has the details.</p>
          <Link href="/shop" className="button">Continue shopping</Link>
        </section>
      </main>
    );
  }

  const paid = order.paymentStatus !== 'pending' && order.paymentStatus !== 'failed' && order.paymentStatus !== 'voided';
  if (!paid) {
    const failed = redirectStatus === 'failed';
    return (
      <main className="checkout-page">
        <section className="checkout-empty">
          <span className="eyebrow">Order #{order.number}</span>
          <h1>{failed ? 'Your payment did not go through.' : 'Your payment is processing.'}</h1>
          <p>{failed ? 'No charge was made. You can go back and try another card.' : 'This can take a moment. We will email you as soon as it is confirmed — you can safely close this page.'}</p>
          <Link href="/checkout" className="button">{failed ? 'Return to checkout' : 'Back to checkout'}</Link>
        </section>
      </main>
    );
  }

  const focalPointBySource = await loadMediaFocalPoints(order.items);
  const orderItems = applyMediaFocalPoints(order.items, focalPointBySource);
  const address = order.shippingAddress || {};
  return (
    <main className="checkout-page">
      <ClearBag />
      <section className="checkout-confirmation">
        <Image src="/icons/lotus-mulberry.svg" alt="" width={52} height={52} unoptimized className="checkout-confirmation__mark" />
        <span className="eyebrow">Order {order.name}{order.test ? ' · Test order' : ''}</span>
        <h1>Thank you{address.name ? `, ${address.name.split(' ')[0]}` : ''}.</h1>
        <p>Your order is confirmed and a receipt is on its way to <strong>{order.email}</strong>. {order.items.some((item) => item.madeToOrder) ? 'Your piece is now being made for you in 5–7 weeks; we will email tracking details as soon as it ships.' : 'We will email tracking details as soon as it ships.'}</p>

        <div className="checkout-confirmation__grid">
          <div>
            <h2 className="checkout-legend">Your pieces</h2>
            <ul className="checkout-items">
              {orderItems.map((item) => (
                <li key={`${item.slug}:${item.variantId}:${item.size}`} className="checkout-item">
                  <div className="checkout-item__image">
                    {item.image ? <Image src={item.image} alt="" fill sizes="72px" style={item.imagePosition ? { objectPosition: item.imagePosition } : undefined} /> : null}
                    <span className="checkout-item__qty">{item.qty}</span>
                  </div>
                  <div className="checkout-item__text">
                    <strong>{item.title}</strong>
                    <small>{[item.variantTitle, item.size ? `Size ${item.size}` : ''].filter(Boolean).join(' · ')}</small>
                  </div>
                  <span className="checkout-item__price">{money(item.lineCents)}</span>
                </li>
              ))}
            </ul>
            <dl className="checkout-totals">
              <div><dt>Subtotal</dt><dd>{money(order.subtotalCents)}</dd></div>
              {order.discountCents ? <div><dt>Discount ({order.discount?.code})</dt><dd>−{money(order.discountCents)}</dd></div> : null}
              <div><dt>{order.shipping?.name || 'Shipping'}</dt><dd>{order.shippingCents ? money(order.shippingCents) : 'Free'}</dd></div>
              {order.taxCents ? <div><dt>{order.tax?.name || 'Tax'}</dt><dd>{money(order.taxCents)}</dd></div> : null}
              <div className="checkout-totals__total"><dt>Total paid</dt><dd>{money(order.totalCents)}</dd></div>
            </dl>
          </div>
          <div>
            <h2 className="checkout-legend">Shipping to</h2>
            <address className="checkout-address">
              {[address.name, address.line1, address.line2, [address.city, address.region, address.postalCode].filter(Boolean).join(', '), countryName(address.country)].filter(Boolean).map((line) => <span key={line}>{line}</span>)}
            </address>
            <div className="checkout-confirmation__actions">
              <Link href="/shop" className="button">Continue shopping</Link>
              <Link href="/book-appointment" className="text-link">Questions? Speak with us</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
