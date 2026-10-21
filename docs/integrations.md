# Integrations: Stripe and Klaviyo

Both are configured only through server environment variables (`.env` locally, the hosting provider's
environment settings in production). The admin shows **Connected / Not connected** under
Settings → Integrations; nothing is entered in the admin. Restart the app after changing variables.

## Stripe — card payments

| Variable | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | `sk_test_…` or `sk_live_…` (Developers → API keys) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` or `pk_live_…` — must be the same mode as the secret key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` from the webhook below |

Webhook (Developers → Webhooks → Add endpoint):

- URL: `https://<domain>/api/stripe/webhook`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

Without `STRIPE_SECRET_KEY`, checkout runs in test mode (orders go through without a card; allowed only in
development or with `ALLOW_TEST_CHECKOUT=true`). Test card: `4242 4242 4242 4242`, any future date, any CVC.

Code: `lib/payments.js` (REST calls, webhook signature check, `checkStripeConnection()`),
`lib/checkout-actions.js`, `app/api/stripe/webhook/route.js`.

## Klaviyo — emails and marketing

| Variable | Value |
| --- | --- |
| `KLAVIYO_PRIVATE_API_KEY` | Private API key (Settings → API keys). Scopes: Events, Profiles, Subscriptions (write); Lists, Accounts (read) |
| `KLAVIYO_NEWSLETTER_LIST_ID` | ID of the newsletter list (Audience → Lists → list → Settings) |

### Email delivery

Emails are designed in Admin → Email templates. Each finished email is sent to Klaviyo as a
**`byShreen Email`** event (`lib/klaviyo.js` → `deliverEmailViaKlaviyo`) with properties
`subject`, `html`, `text`, `reply_to`, `template`. One flow delivers all of them:

1. Flows → Create flow → trigger: metric **byShreen Email** (it appears after the first event — send a test
   from Email templates once the key is set).
2. Add one email. Subject: `{{ event.subject }}`. Body: a single **HTML** block containing only
   `{{ event.html|safe }}`.
3. Turn **Smart Sending off** (otherwise a second email to the same person within 16 hours is skipped).
4. Mark the message **Transactional** so it reaches customers who haven't subscribed to marketing
   (Klaviyo may review this).
5. Set the flow live.

### Marketing events (`lib/klaviyo-events.js`)

Standard e-commerce metrics, usable in Klaviyo's built-in flows and reports:

| Metric | Sent when |
| --- | --- |
| `Started Checkout` | Shopper continues to payment (abandoned-checkout flows) |
| `Placed Order`, `Ordered Product` | Order is paid |
| `Fulfilled Order` | Order marked shipped |
| `Cancelled Order` | Order cancelled |
| `Refunded Order` | Refund issued |
| `Submitted Request` | Appointment request, custom enquiry, or message |

Newsletter sign-ups (footer, and the checkout opt-in on paid orders) are subscribed to
`KLAVIYO_NEWSLETTER_LIST_ID` with marketing consent.

Test orders carry `IsTest: true`. Every Klaviyo call is best-effort: failures are logged and never block an
order or form. Without `KLAVIYO_PRIVATE_API_KEY`, emails are saved to the admin outbox
(Settings → Notifications → Recent emails) and no events are sent. `checkKlaviyoConnection()` in
`lib/klaviyo.js` verifies a key from a script if needed.
