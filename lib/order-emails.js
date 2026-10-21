import { sendTemplateEmail } from './email-template-store';

// Wording for every order email is edited in Admin → Email templates; this file only decides when they go.
export { money } from './email-templates';

/** Sends the order confirmation to the customer and the new-order alert to the team. Never throws. */
export async function sendOrderPlacedEmails(order) {
  await Promise.all([sendTemplateEmail('orderConfirmation', order), sendTemplateEmail('newOrderAlert', order)]);
}

export async function sendShippedEmail(order) {
  await sendTemplateEmail('orderShipped', order);
}

export async function sendRefundEmail(order, amountCents) {
  await sendTemplateEmail('orderRefund', { ...order, refundAmountCents: amountCents });
}

/** Sent when an order moves to "In production": the jeweller has started on the piece. */
export async function sendInProductionEmail(order) {
  await sendTemplateEmail('orderInProduction', order);
}

/** Sent when an order is marked "Delivered". */
export async function sendDeliveredEmail(order) {
  await sendTemplateEmail('orderDelivered', order);
}

/** Sent when an order is cancelled. */
export async function sendCancelledEmail(order) {
  await sendTemplateEmail('orderCancelled', order);
}
