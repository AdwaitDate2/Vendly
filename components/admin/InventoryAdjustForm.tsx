'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { adjustInventoryAction } from '@/lib/admin-actions';

const MODES = [
  { value: 'add', label: 'Add', verb: 'Add' },
  { value: 'remove', label: 'Remove', verb: 'Remove' },
  { value: 'set', label: 'Set to', verb: 'Set' },
];
const REASONS = {
  add: [['restock', 'New stock arrived'], ['return', 'Customer return'], ['correction', 'Count correction'], ['other', 'Other']],
  remove: [['sale', 'Sold in person'], ['damage', 'Damaged'], ['reserve', 'Reserved for a client'], ['correction', 'Count correction'], ['other', 'Other']],
  set: [['correction', 'Stock count'], ['restock', 'New stock arrived'], ['other', 'Other']],
};

function preview(mode, amount, current) {
  const value = Number(amount);
  if (amount === '' || !Number.isFinite(value) || value < 0) return null;
  if (mode === 'set') return value;
  return mode === 'add' ? current + value : current - value;
}

/** `compact` is the one-line version used in the inventory list; the full form adds reason, note, and the alert level. */
export default function InventoryAdjustForm({ item, compact = false }) {
  const [state, formAction, pending] = useActionState(adjustInventoryAction, { message: '', errors: {} });
  const [mode, setMode] = useState('add');
  const [amount, setAmount] = useState('');
  const formRef = useRef(null);
  const id = `${item.productId}-${item.variantId}`;
  const current = Number(item.quantity || 0);
  const next = preview(mode, amount, current);

  useEffect(() => {
    if (!state.saved) return;
    setAmount('');
  }, [state]);

  const status = state.message ? <span className={`admin-action-message ${state.saved ? 'is-success' : 'is-error'}`} role="status">{state.message}</span> : null;

  if (compact) {
    return (
      <form ref={formRef} action={formAction} className="admin-inventory-adjust">
        <input type="hidden" name="productId" value={item.productId} />
        <input type="hidden" name="variantId" value={item.variantId} />
        <input type="hidden" name="version" value={item.version || 0} />
        <select name="mode" value={mode} onChange={(event) => setMode(event.target.value)} aria-label={`How to change stock for ${item.productTitle} ${item.variantTitle || ''}`}>
          {MODES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <input id={`inventory-amount-${id}`} name="amount" type="number" min="0" step="1" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Qty" aria-label="Number of pieces" />
        <button type="submit" className="admin-button admin-button--secondary" disabled={pending || amount === ''}>{pending ? 'Saving…' : 'Save'}</button>
        {status}
      </form>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="admin-stock-form">
      <input type="hidden" name="productId" value={item.productId} />
      <input type="hidden" name="variantId" value={item.variantId} />
      <input type="hidden" name="version" value={item.version || 0} />
      <input type="hidden" name="mode" value={mode} />
      <div className="admin-segmented" role="radiogroup" aria-label="How to change stock">
        {MODES.map((option) => (
          <button key={option.value} type="button" role="radio" aria-checked={mode === option.value} className={mode === option.value ? 'is-active' : ''} onClick={() => setMode(option.value)}>{option.label}</button>
        ))}
      </div>
      <div className="admin-field-row">
        <label className="admin-field">
          <span>{mode === 'set' ? 'Pieces in stock now' : mode === 'add' ? 'Pieces to add' : 'Pieces to remove'}</span>
          <input name="amount" type="number" min="0" step="1" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} />
          <span className="admin-field-help">{next === null ? `Currently ${current} in stock.` : next < 0 ? `Only ${current} in stock.` : `${current} → ${next} in stock`}</span>
        </label>
        <label className="admin-field">
          <span>Reason</span>
          <select name="reason" key={mode} defaultValue={REASONS[mode][0][0]}>
            {REASONS[mode].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      <label className="admin-field"><span>Note (optional)</span><input name="note" maxLength={500} placeholder="e.g. Received from workshop, invoice #214" /></label>
      <label className="admin-field admin-stock-form__alert">
        <span>Low-stock alert</span>
        <input name="lowStockThreshold" type="number" min="0" step="1" inputMode="numeric" defaultValue={item.lowStockThreshold ?? 1} key={item.lowStockThreshold} />
        <span className="admin-field-help">Flag this option as low when stock falls to this number or fewer.</span>
      </label>
      {status}
      <div className="admin-import__actions">
        <button type="submit" className="admin-button" disabled={pending || (next !== null && next < 0)}>{pending ? 'Saving…' : amount === '' ? 'Save alert level' : `${MODES.find((option) => option.value === mode).verb} stock`}</button>
      </div>
    </form>
  );
}
