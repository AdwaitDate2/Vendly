import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// Stripe is called through its REST API so no SDK is needed. Without STRIPE_SECRET_KEY the store runs
// in mock mode: checkout works end to end and a "test payment" button stands in for the card form.

const STRIPE_API = 'https://api.stripe.com/v1';
const WEBHOOK_TOLERANCE_SECONDS = 300;

export function paymentMode() {
  return process.env.STRIPE_SECRET_KEY ? 'stripe' : 'mock';
}

export function stripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
}

export function isLivePayments() {
  return String(process.env.STRIPE_SECRET_KEY || '').startsWith('sk_live_');
}

function formEncode(data, prefix = '') {
  return Object.entries(data).flatMap(([key, value]) => {
    const name = prefix ? `${prefix}[${key}]` : key;
    if (value === undefined || value === null || value === '') return [];
    if (typeof value === 'object') return formEncode(value, name);
    return [`${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`];
  });
}

async function stripe(path, { method = 'GET', body, idempotencyKey } = {}) {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: body ? formEncode(body).join('&') : undefined,
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || `Stripe responded ${response.status}`);
    error.code = 'PAYMENT_PROVIDER';
    throw error;
  }
  return data;
}

/**
 * Mock payments mark orders paid without charging anyone, so outside local development they need
 * ALLOW_TEST_CHECKOUT=true. Orders paid this way are flagged as test orders.
 */
export function mockPaymentsAllowed() {
  return paymentMode() === 'mock' && (process.env.NODE_ENV !== 'production' || process.env.ALLOW_TEST_CHECKOUT === 'true');
}

/**
 * Starts (or refreshes, when `existingPaymentId` is given) the payment for an order and returns what the
 * browser needs to collect it.
 */
export async function preparePayment({ existingPaymentId, orderId, orderNumber, amountCents, email }) {
  if (paymentMode() === 'mock') {
    return { provider: 'mock', paymentId: existingPaymentId?.startsWith('mock_') ? existingPaymentId : `mock_pi_${randomBytes(8).toString('hex')}`, clientSecret: '' };
  }
  if (existingPaymentId?.startsWith('pi_')) {
    try {
      const current = await stripe(`/payment_intents/${encodeURIComponent(existingPaymentId)}`);
      if (!['succeeded', 'canceled', 'processing'].includes(current.status)) {
        const intent = current.amount === amountCents ? current : await stripe(`/payment_intents/${encodeURIComponent(existingPaymentId)}`, { method: 'POST', body: { amount: amountCents, receipt_email: email } });
        return { provider: 'stripe', paymentId: intent.id, clientSecret: intent.client_secret };
      }
    } catch {
      // If the existing payment intent is from another mode (e.g. live vs test switch) or not found, create a fresh one.
    }
  }
  const intent = await stripe('/payment_intents', {
    method: 'POST',
    idempotencyKey: `order-${orderId}-${amountCents}-${isLivePayments() ? 'live' : 'test'}`,
    body: {
      amount: amountCents,
      currency: 'usd',
      receipt_email: email,
      description: `byShreen order ${orderNumber}`,
      automatic_payment_methods: { enabled: 'true' },
      metadata: { orderId, orderNumber },
    },
  });
  return { provider: 'stripe', paymentId: intent.id, clientSecret: intent.client_secret };
}

/** @returns {Promise<{ status: 'paid' | 'pending' | 'failed', amountCents: number }>} */
export async function getPaymentStatus(paymentId) {
  if (paymentMode() === 'mock' || !String(paymentId).startsWith('pi_')) return { status: 'pending', amountCents: 0 };
  try {
    const intent = await stripe(`/payment_intents/${encodeURIComponent(paymentId)}`);
    const status = intent.status === 'succeeded' ? 'paid' : ['canceled', 'requires_payment_method'].includes(intent.status) && intent.last_payment_error ? 'failed' : 'pending';
    return { status, amountCents: intent.amount_received || 0 };
  } catch {
    return { status: 'pending', amountCents: 0 };
  }
}

export async function refundPayment({ paymentId, amountCents, reason = '' }) {
  if (paymentMode() === 'mock' || !String(paymentId).startsWith('pi_')) return { refundId: `mock_re_${randomBytes(6).toString('hex')}` };
  const refund = await stripe('/refunds', {
    method: 'POST',
    idempotencyKey: `refund-${paymentId}-${amountCents}-${Date.now()}`,
    body: { payment_intent: paymentId, amount: amountCents, metadata: { note: reason.slice(0, 400) } },
  });
  return { refundId: refund.id };
}

export async function cancelPayment(paymentId) {
  if (paymentMode() === 'mock' || !String(paymentId).startsWith('pi_')) return;
  await stripe(`/payment_intents/${encodeURIComponent(paymentId)}/cancel`, { method: 'POST' });
}

/** Verifies a Stripe webhook and returns the event, or null when the signature does not match. */
export function verifyStripeWebhook(rawBody, signatureHeader) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!secret || !signatureHeader) return null;
  const parts = Object.fromEntries(String(signatureHeader).split(',').map((part) => part.split('=')).filter((pair) => pair.length === 2).map(([key, value]) => [key, value]));
  const signatures = String(signatureHeader).split(',').filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  const timestamp = Number(parts.t);
  if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > WEBHOOK_TOLERANCE_SECONDS) return null;
  const expected = Buffer.from(createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex'));
  const valid = signatures.some((signature) => {
    const given = Buffer.from(signature);
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
  if (!valid) return null;
  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

/** For Settings → Integrations: confirms the Stripe keys work and names the account. */
export async function checkStripeConnection() {
  if (paymentMode() !== 'stripe') return { ok: false, message: 'STRIPE_SECRET_KEY is not set on the server, so checkout runs in test mode.' };
  const problems = [];
  if (!stripePublishableKey()) problems.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing, so the card form can’t load.');
  else if (isLivePayments() !== stripePublishableKey().startsWith('pk_live_')) problems.push('The secret and publishable keys are from different modes (one test, one live).');
  if (!process.env.STRIPE_WEBHOOK_SECRET) problems.push('STRIPE_WEBHOOK_SECRET is missing: payments still confirm when the customer returns, but add the webhook so every payment is recorded.');
  try {
    const account = await stripe('/account');
    const name = account.settings?.dashboard?.display_name || account.business_profile?.name || account.id;
    return { ok: problems.length === 0, message: `Connected to Stripe account “${name}” in ${isLivePayments() ? 'LIVE mode — real cards are charged' : 'test mode'}. ${problems.join(' ')}`.trim() };
  } catch (error) {
    return { ok: false, message: `Stripe rejected the secret key: ${error.message}` };
  }
}
