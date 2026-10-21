import { NextResponse } from 'next/server';
import { confirmPaidOrder } from '@/lib/order-flow';
import { getOrderByPaymentId, markOrderPaymentFailed } from '@/lib/orders';
import { verifyStripeWebhook } from '@/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.text();
  const event = verifyStripeWebhook(body, request.headers.get('stripe-signature'));
  if (!event) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });

  const intent = event.data?.object;
  if (!intent?.id || intent.object !== 'payment_intent') return NextResponse.json({ received: true });

  const order = await getOrderByPaymentId(intent.id);
  if (!order) return NextResponse.json({ received: true });

  if (event.type === 'payment_intent.succeeded') {
    await confirmPaidOrder(order.id, { amountCents: intent.amount_received || intent.amount, source: 'card' });
  } else if (event.type === 'payment_intent.payment_failed') {
    await markOrderPaymentFailed(order.id, intent.last_payment_error?.message || 'Card declined');
  }
  return NextResponse.json({ received: true });
}
