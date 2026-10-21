import { revalidatePath } from 'next/cache';
import { logActivity } from './activity';
import { trackPlacedOrder } from './klaviyo-events';
import { sendOrderPlacedEmails } from './order-emails';
import { getOrder, markOrderPaid } from './orders';
import { getPaymentStatus } from './payments';

/** Marks an order paid and runs the one-time follow-ups (emails, activity). Safe to call repeatedly. */
export async function confirmPaidOrder(orderId, { amountCents, source }) {
  const order = await markOrderPaid(orderId, { amountCents, source });
  if (!order) return getOrder(orderId);
  await Promise.all([sendOrderPlacedEmails(order), trackPlacedOrder(order)]);
  await logActivity({ actor: order.email, type: 'order', action: `Order ${order.name} placed`, label: `$${(order.totalCents / 100).toFixed(2)}`, href: `/admin/orders/${order.id}` });
  try {
    // Stock may have changed for ready-to-ship pieces.
    revalidatePath('/', 'layout');
  } catch {
    // Outside a request (e.g. scripts) there is nothing to revalidate.
  }
  return order;
}

/** Asks the payment provider about a pending order and confirms it when the charge succeeded. */
export async function syncOrderPayment(order) {
  if (!order || order.paymentStatus !== 'pending' || order.payment?.provider !== 'stripe') return order;
  const payment = await getPaymentStatus(order.payment.id);
  if (payment.status !== 'paid') return order;
  if (payment.amountCents !== order.totalCents) {
    await logActivity({ actor: 'system', type: 'order', action: `Order ${order.name}: amount paid differs from order total`, details: `Paid ${payment.amountCents}, expected ${order.totalCents}`, href: `/admin/orders/${order.id}` });
  }
  return confirmPaidOrder(order.id, { amountCents: payment.amountCents, source: 'card' });
}
