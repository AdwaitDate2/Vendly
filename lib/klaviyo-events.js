import { klaviyoConfigured, subscribeToNewsletter, trackEvent } from './klaviyo';
import { siteUrl } from './site-url';

// Store activity sent to Klaviyo with its standard e-commerce metric names and properties, so Klaviyo's
// built-in flows (abandoned checkout, thank-you, win-back) and reports work without custom setup.
// All best-effort: failures are logged and never reach the shopper.

const dollars = (cents) => Math.round(Number(cents || 0)) / 100;

function nameParts(fullName) {
  const [firstName = '', ...rest] = String(fullName || '').trim().split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

function orderPerson(order) {
  return { email: order.email, phone: order.phone, ...nameParts(order.shippingAddress?.name) };
}

function orderProperties(order) {
  const items = (order.items || []).map((item) => ({
    ProductID: item.productId || item.slug,
    SKU: item.sku || '',
    ProductName: item.title,
    Variant: [item.variantTitle, item.size ? `Size ${item.size}` : ''].filter(Boolean).join(' · '),
    Quantity: item.qty,
    ItemPrice: dollars(item.unitCents),
    RowTotal: dollars(item.lineCents),
    ProductURL: siteUrl(`/shop/${item.slug}`),
    ImageURL: item.image ? (/^https?:/i.test(item.image) ? item.image : siteUrl(item.image)) : '',
  }));
  return {
    OrderId: order.name || `#${order.number}`,
    ItemNames: items.map((item) => item.ProductName),
    Items: items,
    DiscountCode: order.discount?.code || '',
    DiscountValue: dollars(order.discountCents),
    Shipping: dollars(order.shippingCents),
    Tax: dollars(order.taxCents),
    ShippingAddress: order.shippingAddress || {},
    IsTest: Boolean(order.test),
    $value: dollars(order.totalCents),
  };
}

async function safely(label, run) {
  if (!klaviyoConfigured()) return;
  try {
    await run();
  } catch (error) {
    console.error(`[klaviyo] ${label} failed:`, error.message);
  }
}

/** When checkout details are entered: powers abandoned-checkout flows. */
export function trackStartedCheckout(order) {
  return safely('Started Checkout', () => trackEvent({ metric: 'Started Checkout', ...orderPerson(order), value: dollars(order.totalCents), uniqueId: `checkout-${order.id}-${order.totalCents}`, properties: { ...orderProperties(order), CheckoutURL: siteUrl('/checkout') } }));
}

/** When an order is paid: one Placed Order plus one Ordered Product per line. */
export function trackPlacedOrder(order) {
  return safely('Placed Order', async () => {
    const properties = orderProperties(order);
    await trackEvent({ metric: 'Placed Order', ...orderPerson(order), value: properties.$value, uniqueId: `order-${order.id}`, time: order.paidAt, properties });
    for (const [index, item] of properties.Items.entries()) {
      await trackEvent({ metric: 'Ordered Product', ...orderPerson(order), value: item.RowTotal, uniqueId: `order-${order.id}-${index}`, properties: { ...item, OrderId: properties.OrderId, IsTest: properties.IsTest, $value: item.RowTotal } });
    }
    if (order.marketingOptIn) await subscribeToNewsletter(order.email, 'Checkout');
  });
}

export function trackFulfilledOrder(order) {
  return safely('Fulfilled Order', () => trackEvent({ metric: 'Fulfilled Order', ...orderPerson(order), value: dollars(order.totalCents), uniqueId: `fulfilled-${order.id}`, properties: { ...orderProperties(order), TrackingCarrier: order.tracking?.carrier || '', TrackingNumber: order.tracking?.number || '', TrackingURL: order.tracking?.url || '' } }));
}

export function trackCancelledOrder(order, reason = '') {
  return safely('Cancelled Order', () => trackEvent({ metric: 'Cancelled Order', ...orderPerson(order), value: dollars(order.totalCents), uniqueId: `cancelled-${order.id}`, properties: { ...orderProperties(order), Reason: reason } }));
}

export function trackRefundedOrder(order, amountCents, reason = '') {
  return safely('Refunded Order', () => trackEvent({ metric: 'Refunded Order', ...orderPerson(order), value: dollars(amountCents), uniqueId: `refund-${order.id}-${order.refundedCents || amountCents}`, properties: { ...orderProperties(order), RefundAmount: dollars(amountCents), Reason: reason, $value: dollars(amountCents) } }));
}

/** Appointment requests, custom enquiries, and messages from the website forms. */
export function trackRequest(inquiry) {
  return safely('Submitted Request', () => trackEvent({
    metric: 'Submitted Request',
    email: inquiry.email,
    phone: inquiry.phone,
    ...nameParts(inquiry.name),
    uniqueId: `request-${inquiry.id}`,
    properties: { RequestType: inquiry.requestType, Topic: inquiry.topic || '', LookingFor: inquiry.interest || '', Budget: inquiry.budget || '', Timeline: inquiry.timeline || '', Message: inquiry.message || '' },
  }));
}

export function trackNewsletterSignup(email, source) {
  return safely('Newsletter', () => subscribeToNewsletter(email, source === 'checkout' ? 'Checkout' : 'Website footer'));
}
