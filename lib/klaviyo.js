import { randomBytes } from 'node:crypto';

// Klaviyo (https://developers.klaviyo.com) — server-side only. Two jobs:
//  1. Deliver the site's emails. Each email (designed in Admin → Email templates) is sent to Klaviyo as
//     a "byShreen Email" event carrying the finished subject and HTML; one Klaviyo Flow triggered by that
//     metric sends it ({{ event.subject }} / {{ event.html|safe }}).
//  2. Feed Klaviyo's marketing: store events (Started Checkout, Placed Order, …) and newsletter sign-ups.
// Nothing here throws to callers; without KLAVIYO_PRIVATE_API_KEY every function is a no-op.

const API = 'https://a.klaviyo.com/api';
const REVISION = '2026-07-15';
export const EMAIL_METRIC = 'byShreen Email';

export function klaviyoConfigured() {
  return Boolean(process.env.KLAVIYO_PRIVATE_API_KEY);
}

export function klaviyoListId() {
  return process.env.KLAVIYO_NEWSLETTER_LIST_ID || '';
}

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_API_KEY}`,
      revision: REVISION,
      accept: 'application/vnd.api+json',
      ...(body ? { 'content-type': 'application/vnd.api+json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    const message = detail?.errors?.[0]?.detail || detail?.errors?.[0]?.title || `Klaviyo responded ${response.status}`;
    throw Object.assign(new Error(message), { status: response.status });
  }
  return response.status === 204 || response.status === 202 ? null : response.json().catch(() => null);
}

function profileOf({ email, firstName, lastName, phone }) {
  return {
    data: {
      type: 'profile',
      attributes: {
        email,
        ...(firstName ? { first_name: firstName } : {}),
        ...(lastName ? { last_name: lastName } : {}),
        // Klaviyo only accepts E.164 phone numbers (+12125550199); anything else is left out.
        ...(/^\+[1-9]\d{7,14}$/.test(String(phone || '').replace(/[\s()-]/g, '')) ? { phone_number: String(phone).replace(/[\s()-]/g, '') } : {}),
      },
    },
  };
}

/**
 * Records an event on a person's Klaviyo profile. `uniqueId` stops the same event being counted twice
 * (Klaviyo skips a repeated metric + unique_id).
 */
export async function trackEvent({ metric, email, firstName, lastName, phone, properties = {}, value, uniqueId, time }) {
  if (!klaviyoConfigured() || !email) return { status: 'skipped' };
  await request('/events', {
    method: 'POST',
    body: {
      data: {
        type: 'event',
        attributes: {
          properties,
          metric: { data: { type: 'metric', attributes: { name: metric } } },
          profile: profileOf({ email, firstName, lastName, phone }),
          ...(typeof value === 'number' ? { value } : {}),
          unique_id: uniqueId || `${metric}-${randomBytes(8).toString('hex')}`,
          ...(time ? { time: new Date(time).toISOString() } : {}),
        },
      },
    },
  });
  return { status: 'sent' };
}

/** Hands one finished email to Klaviyo for delivery by the "byShreen Email" flow. Throws on failure. */
export async function deliverEmailViaKlaviyo({ to, subject, html, text, replyTo, tag }) {
  for (const email of to) {
    await trackEvent({
      metric: EMAIL_METRIC,
      email,
      properties: { subject, html, text, reply_to: replyTo || '', template: tag },
    });
  }
}

/** Adds an email address to the newsletter list with marketing consent. Best-effort. */
export async function subscribeToNewsletter(email, source = 'Website') {
  if (!klaviyoConfigured() || !klaviyoListId() || !email) return { status: 'skipped' };
  try {
    await request('/profile-subscription-bulk-create-jobs', {
      method: 'POST',
      body: {
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            custom_source: source,
            profiles: { data: [{ type: 'profile', attributes: { email, subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } } } }] },
          },
          relationships: { list: { data: { type: 'list', id: klaviyoListId() } } },
        },
      },
    });
    return { status: 'sent' };
  } catch (error) {
    console.error('[klaviyo] subscribe failed:', error.message);
    return { status: 'failed', error: error.message };
  }
}

/** For Settings → Integrations: confirms the key works and names the Klaviyo account. */
export async function checkKlaviyoConnection() {
  if (!klaviyoConfigured()) return { ok: false, message: 'KLAVIYO_PRIVATE_API_KEY is not set on the server.' };
  try {
    const result = await request('/accounts');
    const account = result?.data?.[0]?.attributes || {};
    let list = '';
    if (klaviyoListId()) {
      const found = await request(`/lists/${encodeURIComponent(klaviyoListId())}`).catch(() => null);
      list = found?.data?.attributes?.name ? `Newsletter list: “${found.data.attributes.name}”.` : `Newsletter list ${klaviyoListId()} was not found — check KLAVIYO_NEWSLETTER_LIST_ID.`;
    } else list = 'No newsletter list set (KLAVIYO_NEWSLETTER_LIST_ID), so sign-ups stay in the admin only.';
    return { ok: true, message: `Connected to Klaviyo account “${account.contact_information?.organization_name || 'Klaviyo'}”. ${list}` };
  } catch (error) {
    return { ok: false, message: `Klaviyo rejected the key: ${error.message}. The private key needs events:write, profiles:write, subscriptions:write, lists:read, and accounts:read.` };
  }
}
