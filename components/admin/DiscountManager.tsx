'use client';

import { useActionState, useEffect, useState } from 'react';
import { deleteDiscountAction, saveDiscountAction } from '@/lib/commerce-admin-actions';

const STATUS_LABELS = { active: 'Active', scheduled: 'Scheduled', expired: 'Expired', 'used-up': 'Used up', off: 'Off' };
const STATUS_CLASS = { active: 'published', scheduled: 'draft', expired: 'archived', 'used-up': 'archived', off: 'archived' };

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

// datetime-local has no time zone, so send the moment as ISO from the browser's own clock.
function DateField({ name, label, help, value }) {
  const [local, setLocal] = useState(toDateInput(value));
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input type="datetime-local" value={local} onChange={(event) => setLocal(event.target.value)} />
      <input type="hidden" name={name} value={local ? new Date(local).toISOString() : ''} />
      <span className="admin-field-help">{help}</span>
    </label>
  );
}

function DiscountForm({ discount, onDone }) {
  const [state, action, pending] = useActionState(saveDiscountAction, {});
  const [type, setType] = useState(discount?.type || 'percent');
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);
  return (
    <form action={action} className="admin-card admin-discount-form">
      <div className="admin-card__heading"><h2>{discount ? `Edit ${discount.code}` : 'New discount code'}</h2></div>
      {discount ? <input type="hidden" name="id" value={discount.id} /> : null}
      <div className="admin-field-row">
        <label className="admin-field"><span>Code</span><input name="code" defaultValue={discount?.code} required placeholder="WELCOME10" autoCapitalize="characters" /><span className="admin-field-help">What the shopper types at checkout.</span></label>
        <label className="admin-field"><span>Type</span>
          <select name="type" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="percent">Percentage off</option>
            <option value="fixed">Fixed amount off</option>
          </select>
        </label>
      </div>
      <div className="admin-field-row">
        <label className="admin-field"><span>{type === 'percent' ? 'Percent off (%)' : 'Amount off ($)'}</span><input name="value" type="number" min="0.01" step="0.01" max={type === 'percent' ? 100 : undefined} defaultValue={discount?.value} required /></label>
        <label className="admin-field"><span>Minimum order ($)</span><input name="minSubtotal" type="number" min="0" step="1" defaultValue={discount?.minSubtotalCents ? discount.minSubtotalCents / 100 : ''} placeholder="No minimum" /></label>
      </div>
      <div className="admin-field-row">
        <DateField name="startsAt" label="Starts" help="Leave empty to start now." value={discount?.startsAt} />
        <DateField name="endsAt" label="Ends" help="Leave empty to never expire." value={discount?.endsAt} />
      </div>
      <label className="admin-field"><span>Total uses allowed</span><input name="usageLimit" type="number" min="0" step="1" defaultValue={discount?.usageLimit || ''} placeholder="Unlimited" /></label>
      <label className="admin-check"><input type="checkbox" name="active" value="yes" defaultChecked={discount ? discount.active : true} /><span>Code is turned on</span></label>
      {state?.message && !state.ok ? <div className="admin-form-message" role="status">{state.message}</div> : null}
      <div className="admin-import__actions">
        <button type="submit" className="admin-button" disabled={pending}>{pending ? 'Saving…' : 'Save discount'}</button>
        <button type="button" className="admin-button admin-button--ghost" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
}

function DeleteDiscount({ discount }) {
  const [state, action, pending] = useActionState(deleteDiscountAction, {});
  return (
    <form action={action} onSubmit={(event) => { if (!window.confirm(`Delete ${discount.code}? Past orders keep their discount.`)) event.preventDefault(); }}>
      <input type="hidden" name="id" value={discount.id} />
      <button type="submit" className="admin-row-action admin-row-action--danger" disabled={pending}>{pending ? 'Deleting…' : 'Delete'}</button>
      {state?.ok === false ? <small role="alert">{state.message}</small> : null}
    </form>
  );
}

export default function DiscountManager({ discounts }) {
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const close = () => {
    setMessage(editing === 'new' ? 'Discount created.' : 'Discount saved.');
    setEditing(null);
  };
  return (
    <>
      {message && !editing ? <div className="admin-alert" role="status">{message}</div> : null}
      {editing ? (
        <DiscountForm key={editing === 'new' ? 'new' : editing.id} discount={editing === 'new' ? null : editing} onDone={close} />
      ) : (
        <div className="admin-list-toolbar"><button type="button" className="admin-button" onClick={() => { setMessage(''); setEditing('new'); }}>Create discount</button></div>
      )}
      <div className="admin-card admin-table-card">
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead><tr><th>Code</th><th>Discount</th><th>Status</th><th>Used</th><th>Ends</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {discounts.map((discount) => (
                <tr key={discount.id}>
                  <td><strong className="admin-code">{discount.code}</strong></td>
                  <td>{discount.summary}</td>
                  <td><span className={`admin-status admin-status--${STATUS_CLASS[discount.status]}`}>{STATUS_LABELS[discount.status]}</span></td>
                  <td>{discount.usedCount}{discount.usageLimit ? ` of ${discount.usageLimit}` : ''}</td>
                  <td>{discount.endsAt ? new Date(discount.endsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}</td>
                  <td className="admin-table-actions"><button type="button" className="admin-row-action" onClick={() => { setMessage(''); setEditing(discount); }}>Edit</button><DeleteDiscount discount={discount} /></td>
                </tr>
              ))}
              {!discounts.length ? <tr><td colSpan={6}><div className="admin-empty"><h2>No discount codes yet</h2><p>Create a code to share with clients, for example for a trunk show or a returning client.</p></div></td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
