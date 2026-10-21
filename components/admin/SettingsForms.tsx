// @ts-nocheck
'use client';

import { useActionState, useState } from 'react';
import { saveNotificationSettingsAction, saveStoreDetailsAction } from '@/lib/admin-actions';
import { resetProductCareTextAction, resetProductShippingTextAction, saveProductInfoAction, saveShippingSettingsAction, saveTaxSettingsAction } from '@/lib/commerce-admin-actions';

const dollars = (cents) => (Number(cents || 0) / 100).toString();

export function PaymentsCard({ payments }) {
  return (
    <section className="admin-card">
      <div className="admin-card__heading"><div><h2>Payments</h2><p className="admin-field-help">Card payments at checkout are processed by Stripe.</p></div></div>
      {payments.mode === 'stripe' ? (
        <div className="admin-alert"><span>Stripe is connected{payments.live ? ' (live — real cards are charged)' : ' in test mode (use Stripe test cards)'}.{payments.webhook ? '' : ' Add the webhook signing secret so payments are confirmed even if a customer closes the page.'}</span></div>
      ) : (
        <div className="admin-form-message"><span>Stripe is not connected yet. {payments.testCheckout ? 'Checkout runs in test mode: orders go through without a card and are marked as test orders.' : 'Checkout is closed to customers until Stripe keys are added on the server.'}</span></div>
      )}
    </section>
  );
}

export function ShippingRatesForm({ settings }) {
  const [state, action, pending] = useActionState(saveShippingSettingsAction, {});
  const [rates, setRates] = useState(() => settings.shipping.rates.map((rate) => ({ ...rate, price: dollars(rate.priceCents), freeOver: rate.freeOverCents ? dollars(rate.freeOverCents) : '', countries: rate.countries.join(', ') })));
  const change = (index, key, value) => setRates((current) => current.map((rate, i) => (i === index ? { ...rate, [key]: value } : rate)));
  return (
    <form action={action} className="admin-card">
      <div className="admin-card__heading"><div><h2>Shipping rates</h2><p className="admin-field-help">The options shoppers choose from at checkout. Set the price to 0 for complimentary shipping.</p></div></div>
      <input type="hidden" name="rates" value={JSON.stringify(rates)} />
      <div className="admin-rate-list">
        {rates.map((rate, index) => (
          <fieldset key={rate.id || index} className="admin-rate">
            <legend className="sr-only">Shipping rate {index + 1}</legend>
            <div className="admin-field-row">
              <label className="admin-field"><span>Name</span><input value={rate.name} onChange={(event) => change(index, 'name', event.target.value)} required /></label>
              <label className="admin-field"><span>Price ($)</span><input type="number" min="0" step="0.01" inputMode="decimal" value={rate.price} onChange={(event) => change(index, 'price', event.target.value)} required /></label>
            </div>
            <label className="admin-field"><span>Description</span><input value={rate.description} onChange={(event) => change(index, 'description', event.target.value)} placeholder="e.g. FedEx, fully insured, signature required" /></label>
            <div className="admin-field-row">
              <label className="admin-field"><span>Free for orders over ($)</span><input type="number" min="0" step="1" inputMode="decimal" value={rate.freeOver} onChange={(event) => change(index, 'freeOver', event.target.value)} placeholder="Never free" /></label>
              <label className="admin-field"><span>Countries</span><input value={rate.countries} onChange={(event) => change(index, 'countries', event.target.value.toUpperCase())} placeholder="US, CA — leave empty for everywhere" /></label>
            </div>
            <div className="admin-rate__actions">
              <label className="admin-check"><input type="checkbox" checked={rate.active} onChange={(event) => change(index, 'active', event.target.checked)} /><span>Offer at checkout</span></label>
              <button type="button" className="admin-button admin-button--ghost admin-button--danger" onClick={() => setRates((current) => current.filter((_, i) => i !== index))}>Remove</button>
            </div>
          </fieldset>
        ))}
      </div>
      <button type="button" className="admin-button admin-button--ghost" onClick={() => setRates((current) => [...current, { id: '', name: '', description: '', price: '0', freeOver: '', countries: 'US', active: true }])}>Add shipping rate</button>
      <Status state={state} />
      <div className="admin-import__actions"><button type="submit" className="admin-button" disabled={pending}>{pending ? 'Saving…' : 'Save shipping rates'}</button></div>
    </form>
  );
}

export function TaxRatesForm({ settings }) {
  const [state, action, pending] = useActionState(saveTaxSettingsAction, {});
  const [rates, setRates] = useState(settings.tax.rates);
  const change = (index, key, value) => setRates((current) => current.map((rate, i) => (i === index ? { ...rate, [key]: value } : rate)));
  return (
    <form action={action} className="admin-card">
      <div className="admin-card__heading"><div><h2>Sales tax</h2><p className="admin-field-help">Charged on orders shipped to these places. Ask your accountant which states you need to collect in.</p></div></div>
      <input type="hidden" name="rates" value={JSON.stringify(rates)} />
      <label className="admin-check"><input type="checkbox" name="enabled" value="yes" defaultChecked={settings.tax.enabled} /><span>Charge sales tax at checkout</span></label>
      <label className="admin-check"><input type="checkbox" name="shippingTaxable" value="yes" defaultChecked={settings.tax.shippingTaxable} /><span>Also charge tax on shipping</span></label>
      <div className="admin-table-scroll">
        <table className="admin-table admin-tax-table">
          <thead><tr><th>Country</th><th>State</th><th>Name on receipt</th><th>Rate (%)</th><th><span className="sr-only">Remove</span></th></tr></thead>
          <tbody>
            {rates.map((rate, index) => (
              <tr key={index}>
                <td><input aria-label="Country code" value={rate.country} maxLength={2} onChange={(event) => change(index, 'country', event.target.value.toUpperCase())} /></td>
                <td><input aria-label="State code" value={rate.region} maxLength={10} placeholder="All" onChange={(event) => change(index, 'region', event.target.value.toUpperCase())} /></td>
                <td><input aria-label="Name on receipt" value={rate.name} onChange={(event) => change(index, 'name', event.target.value)} /></td>
                <td><input aria-label="Rate percent" type="number" min="0" max="30" step="0.001" value={rate.ratePercent} onChange={(event) => change(index, 'ratePercent', event.target.value)} /></td>
                <td><button type="button" className="admin-row-action" onClick={() => setRates((current) => current.filter((_, i) => i !== index))}>Remove</button></td>
              </tr>
            ))}
            {!rates.length ? <tr><td colSpan={5}><p className="admin-field-help">No tax rates. Orders will not include tax.</p></td></tr> : null}
          </tbody>
        </table>
      </div>
      <button type="button" className="admin-button admin-button--ghost" onClick={() => setRates((current) => [...current, { country: 'US', region: '', name: '', ratePercent: 0 }])}>Add tax rate</button>
      <Status state={state} />
      <div className="admin-import__actions"><button type="submit" className="admin-button" disabled={pending}>{pending ? 'Saving…' : 'Save tax settings'}</button></div>
    </form>
  );
}

function Status({ state }) {
  if (!state?.message) return null;
  return <div className={state.ok ? 'admin-alert' : 'admin-form-message'} role="status">{state.message}</div>;
}

export function StoreDetailsForm({ settings }) {
  const [state, action, pending] = useActionState(saveStoreDetailsAction, {});
  const address = settings.address || {};
  return (
    <form action={action} className="admin-card">
      <div className="admin-card__heading"><div><h2>Store details</h2><p className="admin-field-help">Shown on order emails and receipts.</p></div></div>
      <div className="admin-field-row">
        <label className="admin-field"><span>Store name</span><input name="storeName" defaultValue={settings.storeName} required /></label>
        <label className="admin-field"><span>Contact email</span><input name="contactEmail" type="email" defaultValue={settings.contactEmail} required /></label>
      </div>
      <label className="admin-field"><span>Phone</span><input name="phone" defaultValue={settings.phone} /></label>
      <label className="admin-field"><span>Address</span><input name="line1" defaultValue={address.line1} placeholder="Street address" /></label>
      <label className="admin-field"><span className="sr-only">Address line 2</span><input name="line2" defaultValue={address.line2} placeholder="Suite, floor (optional)" /></label>
      <div className="admin-field-row admin-field-row--4">
        <label className="admin-field"><span>City</span><input name="city" defaultValue={address.city} /></label>
        <label className="admin-field"><span>State</span><input name="region" defaultValue={address.region} /></label>
        <label className="admin-field"><span>ZIP code</span><input name="postalCode" defaultValue={address.postalCode} /></label>
        <label className="admin-field"><span>Country</span><input name="country" defaultValue={address.country} maxLength={2} /></label>
      </div>
      <Status state={state} />
      <div className="admin-import__actions"><button type="submit" className="admin-button" disabled={pending}>{pending ? 'Saving…' : 'Save store details'}</button></div>
    </form>
  );
}

export function NotificationSettingsForm({ settings, provider, outbox }) {
  const [state, action, pending] = useActionState(saveNotificationSettingsAction, {});
  const notifications = settings.notifications;
  return (
    <form action={action} className="admin-card">
      <div className="admin-card__heading"><div><h2>Notifications</h2><p className="admin-field-help">Who gets emailed about new requests and orders.</p></div></div>
      {provider ? (
        <div className="admin-alert"><span>Emails are sent with {provider}.</span></div>
      ) : (
        <div className="admin-form-message"><span>Klaviyo is not connected, so emails are saved below instead of being sent.</span></div>
      )}
      <label className="admin-field"><span>Send alerts to</span><input name="recipients" defaultValue={notifications.recipients.join(', ')} placeholder="shreen@byshreen.com" /><span className="admin-field-help">Separate several addresses with commas.</span></label>
      <label className="admin-check"><input type="checkbox" name="newRequest" value="yes" defaultChecked={notifications.newRequest} /><span>Email me when an appointment request or enquiry arrives</span></label>
      <label className="admin-check"><input type="checkbox" name="newOrder" value="yes" defaultChecked={notifications.newOrder} /><span>Email me when an order is placed</span></label>
      <label className="admin-check"><input type="checkbox" name="customerOrderEmails" value="yes" defaultChecked={notifications.customerOrderEmails} /><span>Send customers order emails: confirmation, in production, shipped, delivered, refunds, and cancellations</span></label>
      <label className="admin-check"><input type="checkbox" name="customerRequestEmails" value="yes" defaultChecked={notifications.customerRequestEmails} /><span>Send clients a confirmation when their appointment request or enquiry arrives</span></label>
      <Status state={state} />
      <div className="admin-import__actions"><button type="submit" className="admin-button" disabled={pending}>{pending ? 'Saving…' : 'Save notifications'}</button></div>

      <details className="admin-seo" open={!provider}>
        <summary>Recent emails ({outbox.length})</summary>
        {outbox.length ? (
          <ul className="admin-outbox">
            {outbox.map((email) => (
              <li key={email.id}>
                <span className={`admin-status admin-status--${email.status === 'sent' ? 'published' : email.status === 'failed' ? 'error' : 'draft'}`}>{email.status === 'logged' ? 'Not sent (no provider)' : email.status}</span>
                <strong>{email.subject}</strong>
                <small>To {email.to.join(', ')} · {new Date(email.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}{email.error ? ` · ${email.error}` : ''}</small>
              </li>
            ))}
          </ul>
        ) : <p className="admin-field-help">No emails yet.</p>}
      </details>
    </form>
  );
}

function ResetTextButton({ action, label }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} style={{ display: 'inline' }}>
      <button type="submit" className="admin-button admin-button--ghost" disabled={pending} style={{ fontSize: 13 }}>
        {pending ? 'Applying…' : label}
      </button>
      {state?.message ? <span className={`admin-field-help${state.ok ? '' : ' is-error'}`} style={{ marginLeft: 10 }}>{state.message}</span> : null}
    </form>
  );
}

export function ProductInfoForm({ settings }) {
  const [state, action, pending] = useActionState(saveProductInfoAction, {});
  const info = settings.productInfo;
  return (
    <form action={action} className="admin-card">
      <div className="admin-card__heading"><div><h2>Product page text</h2><p className="admin-field-help">Shared wording for the Product details, Care instructions and Shipping &amp; returns sections on every product page. A single product can override it on its own edit page.</p></div></div>
      <label className="admin-field"><span>Diamond quality note</span><input name="diamondNote" defaultValue={info.diamondNote} placeholder="(E/F color, VVS/VS clarity)" /><span className="admin-field-help">Shown after the diamond weight under Product details.</span></label>
      <h3>Care instructions</h3>
      <label className="admin-field"><span>Introduction</span><input name="careIntro" defaultValue={info.careIntro} /></label>
      <label className="admin-field"><span>Care tips (one per line)</span><textarea name="careBullets" rows="6" defaultValue={info.careBullets} /></label>
      <label className="admin-field"><span>Closing line</span><input name="careSignoff" defaultValue={info.careSignoff} /></label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
        <span className="admin-field-help" style={{ margin: 0 }}>Apply the current care text to every product:</span>
        <ResetTextButton action={resetProductCareTextAction} label="Apply care text to all products" />
      </div>
      <h3>Shipping &amp; returns</h3>
      <div className="admin-field-row">
        <label className="admin-field"><span>Heading</span><input name="shippingHeading" defaultValue={info.shippingHeading} /></label>
        <label className="admin-field"><span>Tag beside the heading</span><input name="shippingTag" defaultValue={info.shippingTag} placeholder="Free shipping on all orders" /></label>
      </div>
      <label className="admin-field"><span>Text</span><textarea name="shippingBody" rows="9" defaultValue={info.shippingBody} /><span className="admin-field-help">Separate paragraphs with a blank line. Use **double stars** for bold, and {'{email}'} for a link to your contact email.</span></label>
      <label className="admin-field"><span>Small print</span><input name="shippingNote" defaultValue={info.shippingNote} /></label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="admin-field-help" style={{ margin: 0 }}>Apply the current shipping text to every product:</span>
        <ResetTextButton action={resetProductShippingTextAction} label="Apply shipping text to all products" />
      </div>
      <Status state={state} />
      <div className="admin-import__actions"><button type="submit" className="admin-button" disabled={pending}>{pending ? 'Saving…' : 'Save product page text'}</button></div>
    </form>
  );
}
