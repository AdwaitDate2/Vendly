// @ts-nocheck
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '@/components/CartProvider';
import useCartMediaFocalPoints from '@/components/useCartMediaFocalPoints';
import { canonicalManagedImageSource, mediaFocalPointObjectPosition } from '@/lib/media-focal-points';
import { completeMockPaymentAction, quoteCheckoutAction, startCheckoutAction } from '@/lib/checkout-actions';
import { persistCountryPreference, US_STATES } from '@/lib/regions';

const money = (cents) => `$${(Number(cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PENDING_KEY = 'byshreen-checkout-pending';

function checkoutImageStyle(item, focalPointBySource) {
  const objectPosition = item.imagePosition
    || mediaFocalPointObjectPosition(focalPointBySource[canonicalManagedImageSource(item.image)]);
  return objectPosition ? { objectPosition } : undefined;
}

function readPending() {
  try {
    return JSON.parse(window.sessionStorage.getItem(PENDING_KEY) || 'null');
  } catch {
    return null;
  }
}

function writePending(value) {
  try {
    if (value) window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(value));
    else window.sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Without storage a returning shopper simply starts a fresh order.
  }
}

let stripeLoader = null;
function loadStripe(publishableKey) {
  if (!stripeLoader) {
    stripeLoader = new Promise((resolve, reject) => {
      if (window.Stripe) return resolve(window.Stripe(publishableKey));
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => resolve(window.Stripe(publishableKey));
      script.onerror = () => {
        stripeLoader = null;
        reject(new Error('Stripe.js failed to load'));
      };
      document.head.appendChild(script);
    });
  }
  return stripeLoader;
}

const STRIPE_APPEARANCE = {
  theme: 'flat',
  variables: { colorPrimary: '#a84d5f', colorBackground: '#ffffff', colorText: '#52532f', colorDanger: '#a3342f', fontFamily: 'Barlow, Arial, sans-serif', borderRadius: '2px', spacingUnit: '4px' },
  rules: { '.Input': { border: '1px solid rgba(106, 107, 68, 0.35)' }, '.Tab': { border: '1px solid rgba(106, 107, 68, 0.22)' } },
};

function StripePayment({ publishableKey, clientSecret, email, returnUrl, totalCents }) {
  const mountRef = useRef(null);
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let active = true;
    let element = null;
    loadStripe(publishableKey)
      .then((stripe) => {
        if (!active || !mountRef.current) return;
        const elements = stripe.elements({ clientSecret, appearance: STRIPE_APPEARANCE, fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500&display=swap' }] });
        element = elements.create('payment', { layout: 'tabs', defaultValues: { billingDetails: { email } } });
        element.on('ready', () => active && setReady(true));
        element.mount(mountRef.current);
        stripeRef.current = stripe;
        elementsRef.current = elements;
      })
      .catch(() => active && setError('The secure payment form could not load. Check your connection and refresh the page.'));
    return () => {
      active = false;
      element?.destroy();
    };
  }, [publishableKey, clientSecret, email]);

  async function pay() {
    if (!stripeRef.current || !elementsRef.current) return;
    setPaying(true);
    setError('');
    const result = await stripeRef.current.confirmPayment({ elements: elementsRef.current, confirmParams: { return_url: returnUrl } });
    // confirmPayment only returns here when the payment could not be completed; success redirects.
    setError(result.error?.message || 'Your payment could not be completed. Please try again.');
    setPaying(false);
  }

  return (
    <div className="checkout-payment">
      <div ref={mountRef} className="checkout-payment__element" />
      {!ready && !error ? <p className="checkout-muted">Loading secure payment form…</p> : null}
      {error ? <p className="checkout-error" role="alert">{error}</p> : null}
      <button type="button" className="button button--full" onClick={pay} disabled={!ready || paying}>{paying ? 'Processing…' : `Pay ${money(totalCents)}`}</button>
      <p className="checkout-muted checkout-secure">Payments are processed securely by Stripe. We never see or store your card details.</p>
    </div>
  );
}

function Field({ label, name, error, className = '', children }) {
  return (
    <label className={`checkout-field ${className}${error ? ' has-error' : ''}`}>
      <span>{label}</span>
      {children}
      {error ? <small role="alert" id={`${name}-error`}>{error}</small> : null}
    </label>
  );
}

export default function CheckoutForm({ payments, countries, initialCountry = '', contactEmail }) {
  const router = useRouter();
  const { items, loaded, clear } = useCart();
  const lines = useMemo(() => items.map((item) => ({ slug: item.slug, variantId: item.variantId === 'default' ? '' : item.variantId || '', size: item.size || '', qty: item.qty })), [items]);
  const [form, setForm] = useState({ email: '', phone: '', name: '', line1: '', line2: '', city: '', region: '', postalCode: '', country: initialCountry || countries[0]?.[0] || '', note: '', marketingOptIn: false });
  const [shippingRateId, setShippingRateId] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [stage, setStage] = useState('details');
  const [session, setSession] = useState(null);
  const [busy, setBusy] = useState(false);
  const focalImageItems = useMemo(() => [...items, ...(quote?.items || [])], [items, quote?.items]);
  const focalPointBySource = useCartMediaFocalPoints(focalImageItems);

  useEffect(() => {
    if (!loaded || !lines.length) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await quoteCheckoutAction({ lines, country: form.country, region: form.region, shippingRateId, discountCode: appliedCode });
      if (cancelled) return;
      if (result.ok) {
        setQuote(result.quote);
        setQuoteError('');
      } else setQuoteError(result.message);
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [loaded, lines, form.country, form.region, shippingRateId, appliedCode]);

  const update = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value, ...(key === 'country' ? { region: '' } : {}) }));
    setErrors((current) => ({ ...current, [key]: undefined, [`address.${key}`]: undefined }));
  };

  async function continueToPayment(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setErrors({});
    const { email, phone, note, marketingOptIn, ...address } = form;
    const result = await startCheckoutAction({ lines, email, phone, note, marketingOptIn, address, shippingRateId: quote?.shipping?.id || shippingRateId, discountCode: appliedCode }, readPending());
    setBusy(false);
    if (result.quote) setQuote(result.quote);
    if (!result.ok) {
      setErrors(result.errors || {});
      setMessage(result.message);
      return;
    }
    writePending({ id: result.orderId, token: result.token });
    setSession(result);
    setStage('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function placeTestOrder() {
    setBusy(true);
    setMessage('');
    const result = await completeMockPaymentAction({ orderId: session.orderId, token: session.token });
    if (!result.ok) {
      setBusy(false);
      setMessage(result.message);
      return;
    }
    writePending(null);
    clear();
    router.push(`/checkout/complete?order=${session.orderId}&token=${encodeURIComponent(session.token)}`);
  }

  if (loaded && !items.length && stage === 'details') {
    return (
      <section className="checkout-empty">
        <span className="eyebrow">Checkout</span>
        <h1>Your bag is empty.</h1>
        <p>Discover pieces designed to become part of your story.</p>
        <Link href="/shop" className="button">Explore the collection</Link>
      </section>
    );
  }

  const errorFor = (key) => errors[key] || errors[`address.${key}`];
  const locked = stage === 'payment';
  const summaryItems = quote?.items || [];

  return (
    <div className="checkout">
      <form className="checkout__main" onSubmit={continueToPayment} noValidate>
        <div className="checkout__head">
          <span className="eyebrow">Secure checkout</span>
          <h1>{locked ? 'Payment' : 'Checkout'}</h1>
          <ol className="checkout-steps" aria-label="Checkout progress">
            <li className={locked ? 'is-done' : 'is-current'}>Details</li>
            <li className={locked ? 'is-current' : ''}>Payment</li>
          </ol>
        </div>

        {!payments.open ? (
          <div className="checkout-notice" role="status">
            Online checkout opens soon. To order now, <Link href="/book-appointment">book an appointment</Link> or write to <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
          </div>
        ) : null}
        {payments.testCheckout ? <div className="checkout-notice checkout-notice--test" role="status"><strong>Test mode.</strong> Card payments are not connected yet, so no one is charged. Orders placed here are marked as test orders.</div> : null}
        {quote?.problems?.length ? <div className="checkout-error" role="alert">{quote.problems.map((problem) => <p key={problem.slug + problem.message}>{problem.message}</p>)}</div> : null}
        {quoteError ? <div className="checkout-error" role="alert">{quoteError}</div> : null}

        <fieldset className="checkout-section" disabled={locked}>
          <legend>Contact</legend>
          <div className="checkout-grid">
            <Field label="Email" name="email" error={errorFor('email')} className="checkout-field--wide">
              <input type="email" name="email" autoComplete="email" value={form.email} onChange={update('email')} required aria-invalid={Boolean(errorFor('email'))} />
            </Field>
            <Field label="Phone (for delivery)" name="phone" error={errorFor('phone')} className="checkout-field--wide">
              <input type="tel" name="phone" autoComplete="tel" value={form.phone} onChange={update('phone')} />
            </Field>
          </div>
          <label className="checkout-check">
            <input type="checkbox" checked={form.marketingOptIn} onChange={update('marketingOptIn')} />
            <span>Email me about new collections and private events.</span>
          </label>
        </fieldset>

        <fieldset className="checkout-section" disabled={locked}>
          <legend>Delivery</legend>
          <div className="checkout-grid">
            <Field label="Country" name="country" className="checkout-field--wide">
              <select name="country" autoComplete="country" value={form.country} onChange={(event) => { update('country')(event); persistCountryPreference(event.target.value); }}>
                {countries.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
            </Field>
            <Field label="Full name" name="name" error={errorFor('name')} className="checkout-field--wide">
              <input name="name" autoComplete="shipping name" value={form.name} onChange={update('name')} required aria-invalid={Boolean(errorFor('name'))} />
            </Field>
            <Field label="Address" name="line1" error={errorFor('line1')} className="checkout-field--wide">
              <input name="line1" autoComplete="shipping address-line1" value={form.line1} onChange={update('line1')} required aria-invalid={Boolean(errorFor('line1'))} />
            </Field>
            <Field label="Apartment, suite, etc. (optional)" name="line2" className="checkout-field--wide">
              <input name="line2" autoComplete="shipping address-line2" value={form.line2} onChange={update('line2')} />
            </Field>
            <Field label="City" name="city" error={errorFor('city')}>
              <input name="city" autoComplete="shipping address-level2" value={form.city} onChange={update('city')} required aria-invalid={Boolean(errorFor('city'))} />
            </Field>
            <Field label={form.country === 'US' ? 'State' : 'State / region'} name="region" error={errorFor('region')}>
              {form.country === 'US' ? (
                <select name="region" autoComplete="shipping address-level1" value={form.region} onChange={update('region')} required aria-invalid={Boolean(errorFor('region'))}>
                  <option value="">Select</option>
                  {US_STATES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                </select>
              ) : (
                <input name="region" autoComplete="shipping address-level1" value={form.region} onChange={update('region')} />
              )}
            </Field>
            <Field label={form.country === 'US' ? 'ZIP code' : 'Postal code'} name="postalCode" error={errorFor('postalCode')}>
              <input name="postalCode" autoComplete="shipping postal-code" value={form.postalCode} onChange={update('postalCode')} required aria-invalid={Boolean(errorFor('postalCode'))} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="checkout-section" disabled={locked}>
          <legend>Shipping method</legend>
          {quote && !quote.shippingRates.length ? <p className="checkout-muted">We do not ship to this country online yet. Please write to <a href={`mailto:${contactEmail}`}>{contactEmail}</a> and we will arrange delivery.</p> : null}
          <div className="checkout-rates">
            {(quote?.shippingRates || []).map((rate) => (
              <label key={rate.id} className={`checkout-rate${quote.shipping?.id === rate.id ? ' is-selected' : ''}`}>
                <input type="radio" name="shippingRate" value={rate.id} checked={quote.shipping?.id === rate.id} onChange={() => setShippingRateId(rate.id)} />
                <span className="checkout-rate__text"><strong>{rate.name}</strong>{rate.description ? <small>{rate.description}</small> : null}</span>
                <span className="checkout-rate__price">{rate.amountCents ? money(rate.amountCents) : 'Free'}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="checkout-section" disabled={locked}>
          <legend>Note for the studio (optional)</legend>
          <Field label="Gift message, engraving request, or delivery note" name="note">
            <textarea name="note" rows="3" maxLength={1000} value={form.note} onChange={update('note')} />
          </Field>
        </fieldset>

        {message ? <div className="checkout-error" role="alert">{message}</div> : null}

        {locked ? (
          <section className="checkout-section" aria-labelledby="payment-heading">
            <div className="checkout-section__row">
              <h2 id="payment-heading" className="checkout-legend">Payment</h2>
              <button type="button" className="text-link" onClick={() => setStage('details')}>Edit details</button>
            </div>
            {session.provider === 'stripe' ? (
              <StripePayment publishableKey={payments.publishableKey} clientSecret={session.clientSecret} email={form.email} totalCents={quote?.totalCents} returnUrl={`${window.location.origin}/checkout/complete?order=${session.orderId}&token=${encodeURIComponent(session.token)}`} />
            ) : (
              <div className="checkout-payment checkout-payment--test">
                <p>No card is needed in test mode. Placing the order sends the confirmation emails and adds the order to the admin, exactly as a real purchase would.</p>
                <button type="button" className="button button--full" onClick={placeTestOrder} disabled={busy}>{busy ? 'Placing order…' : `Place test order · ${money(quote?.totalCents)}`}</button>
              </div>
            )}
          </section>
        ) : (
          <button type="submit" className="button button--full checkout-continue" disabled={busy || !payments.open || !quote || Boolean(quote.problems?.length) || !quote.shippingRates.length}>
            {busy ? 'Checking your order…' : 'Continue to payment'}
          </button>
        )}
      </form>

      <aside className="checkout__summary" aria-label="Order summary">
        <h2 className="checkout-legend">Order summary</h2>
        <p className="checkout-free-shipping">Free shipping on all orders</p>
        <ul className="checkout-items">
          {(summaryItems.length ? summaryItems : items.map((item) => ({ ...item, title: item.shortTitle, lineCents: Math.round(item.price * 100) * item.qty }))).map((item) => (
            <li key={`${item.slug}:${item.variantId}:${item.size}`} className="checkout-item">
              <div className="checkout-item__image">
                {item.image ? <Image src={item.image} alt="" fill sizes="72px" style={checkoutImageStyle(item, focalPointBySource)} /> : null}
                <span className="checkout-item__qty" aria-label={`Quantity ${item.qty}`}>{item.qty}</span>
              </div>
              <div className="checkout-item__text">
                <strong>{item.title}</strong>
                <small>{[item.variantTitle, item.size ? `Size ${item.size}` : ''].filter(Boolean).join(' · ')}</small>
              </div>
              <span className="checkout-item__price">{money(item.lineCents)}</span>
            </li>
          ))}
        </ul>

        <div className="checkout-discount">
          {quote?.discount ? (
            <p className="checkout-discount__applied">
              <span>Code <strong>{quote.discount.code}</strong> applied</span>
              <button type="button" className="text-link" disabled={locked} onClick={() => { setAppliedCode(''); setCodeInput(''); }}>Remove</button>
            </p>
          ) : (
            <form className="checkout-discount__form" onSubmit={(event) => { event.preventDefault(); setAppliedCode(codeInput.trim().toUpperCase()); }}>
              <label className="checkout-field">
                <span>Discount code</span>
                <input value={codeInput} onChange={(event) => setCodeInput(event.target.value)} disabled={locked} autoComplete="off" />
              </label>
              <button type="submit" className="checkout-apply" disabled={locked || !codeInput.trim()}>Apply</button>
            </form>
          )}
          {appliedCode && quote?.discountError ? <small className="checkout-error-text" role="alert">{quote.discountError}</small> : null}
        </div>

        <dl className="checkout-totals">
          <div><dt>Subtotal</dt><dd>{money(quote?.subtotalCents)}</dd></div>
          {quote?.discountCents ? <div><dt>Discount</dt><dd>−{money(quote.discountCents)}</dd></div> : null}
          <div><dt>Shipping</dt><dd>{quote?.shipping ? (quote.shippingCents ? money(quote.shippingCents) : 'Free') : 'Free'}</dd></div>
          <div><dt>{quote?.tax ? `${quote.tax.name} (${quote.tax.ratePercent}%)` : 'Tax'}</dt><dd>{quote?.tax ? money(quote.taxCents) : form.region || form.country !== 'US' ? money(0) : 'Calculated with address'}</dd></div>
          <div className="checkout-totals__total"><dt>Total</dt><dd>{money(quote?.totalCents)}</dd></div>
        </dl>
        <p className="checkout-muted">Every piece is made to order in 5–7 weeks and ships fully insured.</p>
      </aside>
    </div>
  );
}
