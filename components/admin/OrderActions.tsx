// @ts-nocheck
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { addOrderNoteAction, cancelOrderAction, markShippedAction, refundOrderAction, updateFulfillmentAction } from '@/lib/commerce-admin-actions';
import { FULFILLMENT_STATUSES } from '@/lib/order-statuses';

const money = (cents) => `$${(Number(cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Status({ state }) {
  if (!state?.message) return null;
  return <div className={state.ok ? 'admin-alert' : 'admin-form-message'} role="status">{state.message}</div>;
}

const PROGRESS_EMAILS = { in_production: 'Email the customer that their piece is being made', delivered: 'Email the customer that it has been delivered' };

export function FulfillmentForm({ order }) {
  const [state, action, pending] = useActionState(updateFulfillmentAction, {});
  const [status, setStatus] = useState(order.fulfillmentStatus);
  const emailLabel = status !== order.fulfillmentStatus ? PROGRESS_EMAILS[status] : null;
  return (
    <form action={action} className="admin-order-fulfillment">
      <input type="hidden" name="id" value={order.id} />
      <label className="admin-field">
        <span>Progress</span>
        <select name="status" defaultValue={order.fulfillmentStatus} onChange={(event) => setStatus(event.target.value)}>
          {Object.entries(FULFILLMENT_STATUSES).filter(([key]) => key !== 'shipped').map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          {order.fulfillmentStatus === 'shipped' ? <option value="shipped">Shipped</option> : null}
        </select>
      </label>
      {emailLabel ? <label className="admin-check"><input type="checkbox" name="notify" value="yes" defaultChecked /><span>{emailLabel}</span></label> : null}
      <button type="submit" className="admin-button admin-button--ghost" disabled={pending}>{pending ? 'Saving…' : 'Update'}</button>
      <Status state={state} />
    </form>
  );
}

export function ShipOrderForm({ order }) {
  const [state, action, pending] = useActionState(markShippedAction, {});
  const tracking = order.tracking || {};
  return (
    <form action={action} className="admin-order-form">
      <input type="hidden" name="id" value={order.id} />
      <label className="admin-field"><span>Carrier</span><input name="carrier" defaultValue={tracking.carrier || 'FedEx'} /></label>
      <label className="admin-field"><span>Tracking number</span><input name="number" defaultValue={tracking.number} /></label>
      <label className="admin-field"><span>Tracking link</span><input name="url" type="url" defaultValue={tracking.url} placeholder="https://" /></label>
      <label className="admin-check"><input type="checkbox" name="notify" value="yes" defaultChecked /><span>Email the customer their tracking details</span></label>
      <Status state={state} />
      <button type="submit" className="admin-button" disabled={pending}>{pending ? 'Saving…' : order.fulfillmentStatus === 'shipped' ? 'Update tracking' : 'Mark as shipped'}</button>
    </form>
  );
}

export function RefundForm({ order }) {
  const [state, action, pending] = useActionState(refundOrderAction, {});
  const [open, setOpen] = useState(false);
  const refundable = order.totalCents - (order.refundedCents || 0);
  if (!open) return <button type="button" className="admin-button admin-button--ghost" onClick={() => setOpen(true)}>Refund…</button>;
  return (
    <form
      action={action}
      className="admin-order-form admin-order-form--boxed"
      onSubmit={(event) => {
        const amount = new FormData(event.currentTarget).get('amount');
        if (!window.confirm(`Refund $${amount} to ${order.email}? This cannot be undone.`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={order.id} />
      <label className="admin-field"><span>Amount ($)</span><input name="amount" type="number" min="0.01" step="0.01" max={(refundable / 100).toFixed(2)} defaultValue={(refundable / 100).toFixed(2)} required /><span className="admin-field-help">Up to {money(refundable)}.{order.payment?.provider === 'stripe' ? ' The money goes back to the customer’s card.' : ' Test order: no money moves.'}</span></label>
      <label className="admin-field"><span>Reason (only visible to staff)</span><input name="reason" maxLength={300} /></label>
      <label className="admin-check"><input type="checkbox" name="notify" value="yes" defaultChecked /><span>Email the customer about the refund</span></label>
      <Status state={state} />
      <div className="admin-order-form__actions">
        <button type="submit" className="admin-button admin-button--danger" disabled={pending}>{pending ? 'Refunding…' : 'Refund'}</button>
        <button type="button" className="admin-button admin-button--ghost" onClick={() => setOpen(false)}>Close</button>
      </div>
    </form>
  );
}

export function CancelOrderForm({ order }) {
  const [state, action, pending] = useActionState(cancelOrderAction, {});
  const refunded = order.paymentStatus === 'refunded';
  return (
    <form action={action} className="admin-order-form" onSubmit={(event) => { if (!window.confirm(`Cancel order ${order.name}?`)) event.preventDefault(); }}>
      <input type="hidden" name="id" value={order.id} />
      <label className="admin-field"><span>Reason (only visible to staff)</span><input name="reason" maxLength={300} /></label>
      {refunded ? <label className="admin-check"><input type="checkbox" name="restock" value="yes" defaultChecked /><span>Put ready-to-ship items back in stock</span></label> : null}
      {/* An unfinished checkout was never an order to the customer, so emailing them is off by default. */}
      <label className="admin-check"><input type="checkbox" name="notify" value="yes" defaultChecked={order.paymentStatus !== 'pending'} /><span>Email the customer that the order was cancelled</span></label>
      <Status state={state} />
      <button type="submit" className="admin-button admin-button--ghost admin-button--danger" disabled={pending}>{pending ? 'Cancelling…' : 'Cancel order'}</button>
    </form>
  );
}

export function OrderNoteForm({ orderId }) {
  const [state, action, pending] = useActionState(addOrderNoteAction, {});
  const formRef = useRef(null);
  useEffect(() => {
    if (state?.reset) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} action={action} className="admin-order-noteform">
      <input type="hidden" name="id" value={orderId} />
      <label className="admin-field"><span className="sr-only">Add a note</span><textarea name="body" rows="2" placeholder="Add a note for the team (ring size confirmed, engraving text…)" required maxLength={2000} /></label>
      <button type="submit" className="admin-button admin-button--ghost" disabled={pending}>{pending ? 'Adding…' : 'Add note'}</button>
      {state?.ok === false ? <Status state={state} /> : null}
    </form>
  );
}
