'use server';

import { z } from 'zod';
import { cartLineSchema, checkoutInputSchema, priceCart } from './checkout';
import { trackStartedCheckout } from './klaviyo-events';
import { confirmPaidOrder } from './order-flow';
import { attachPayment, getOrderForShopper, upsertPendingOrder } from './orders';
import { mockPaymentsAllowed, paymentMode, preparePayment } from './payments';

const quoteSchema = z.object({
  lines: z.array(cartLineSchema).max(20),
  country: z.string().trim().toUpperCase().length(2).catch('US'),
  region: z.string().trim().toUpperCase().max(40).catch(''),
  shippingRateId: z.string().trim().max(40).catch(''),
  discountCode: z.string().trim().max(40).catch(''),
});

function flatErrors(error) {
  return Object.fromEntries(error.issues.map((issue) => [issue.path.join('.'), issue.message]));
}

/** Live totals while the shopper fills in checkout. Nothing is saved. */
export async function quoteCheckoutAction(input) {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Your bag could not be read. Please refresh the page.' };
  try {
    const { lines, country, region, shippingRateId, discountCode } = parsed.data;
    const priced = await priceCart({ lines, address: { country, region }, shippingRateId, discountCode });
    return { ok: true, quote: priced };
  } catch {
    return { ok: false, message: 'We could not load prices right now. Please try again in a moment.' };
  }
}

/**
 * Validates the checkout, prices it on the server, saves the order as awaiting payment, and prepares
 * the payment. `pending` ({ id, token }) lets a shopper who goes back and edits reuse their order.
 */
export async function startCheckoutAction(input, pending) {
  const parsed = checkoutInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Check the highlighted fields.', errors: flatErrors(parsed.error) };
  if (paymentMode() === 'mock' && !mockPaymentsAllowed()) return { ok: false, message: 'Online checkout is not open yet. Please book an appointment or email us to order.' };

  const checkout = parsed.data;
  try {
    const priced = await priceCart({ lines: checkout.lines, address: checkout.address, shippingRateId: checkout.shippingRateId, discountCode: checkout.discountCode });
    if (priced.problems.length) return { ok: false, message: priced.problems.map((problem) => problem.message).join(' '), quote: priced };
    if (checkout.discountCode && priced.discountError) return { ok: false, message: priced.discountError, errors: { discountCode: priced.discountError }, quote: priced };
    if (!priced.shipping) return { ok: false, message: 'We do not ship to that country online yet. Please email us and we will arrange delivery.', quote: priced };
    if (priced.totalCents < 50) return { ok: false, message: 'Your order total is too low to pay online.', quote: priced };

    const { order, token } = await upsertPendingOrder({ existing: pending, checkout, priced, test: paymentMode() === 'mock' });
    // Klaviyo abandoned-checkout flows start from this; it never delays the shopper.
    try {
      trackStartedCheckout(order)?.catch?.(() => {});
    } catch {
      // Best-effort tracking; never delays or crashes checkout
    }
    const payment = await preparePayment({ existingPaymentId: order.payment?.id, orderId: order.id, orderNumber: order.name, amountCents: order.totalCents, email: order.email });
    await attachPayment(order.id, { provider: payment.provider, id: payment.paymentId });
    return { ok: true, orderId: order.id, token, provider: payment.provider, clientSecret: payment.clientSecret, quote: priced };
  } catch (error) {
    console.error('startCheckoutAction error:', error);
    return { ok: false, message: 'We could not start your payment. Nothing has been charged — please try again.' };
  }
}

/** Test-mode stand-in for a card payment. Only works while Stripe is not connected. */
export async function completeMockPaymentAction({ orderId, token }) {
  if (!mockPaymentsAllowed()) return { ok: false, message: 'Test payments are turned off.' };
  const order = await getOrderForShopper(String(orderId || ''), String(token || ''));
  if (!order) return { ok: false, message: 'We could not find that order.' };
  if (order.paymentStatus === 'pending') await confirmPaidOrder(order.id, { amountCents: order.totalCents, source: 'test payment' });
  return { ok: true };
}
