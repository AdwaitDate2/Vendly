// @ts-nocheck
'use client';

import { useActionState } from 'react';
import { saveCustomerNotesAction } from '@/lib/commerce-admin-actions';

export default function CustomerNotesForm({ customer }) {
  const [state, action, pending] = useActionState(saveCustomerNotesAction, {});
  return (
    <form action={action} className="admin-card">
      <div className="admin-card__heading"><h2>Notes</h2></div>
      <input type="hidden" name="id" value={customer.id} />
      <label className="admin-field"><span>Private notes</span><textarea name="notes" rows="5" defaultValue={customer.notes} placeholder="Ring size, anniversaries, preferences…" /></label>
      <label className="admin-field"><span>Tags</span><input name="tags" defaultValue={customer.tags.join(', ')} placeholder="VIP, bridal" /><span className="admin-field-help">Separate tags with commas.</span></label>
      {state?.message ? <div className={state.ok ? 'admin-alert' : 'admin-form-message'} role="status">{state.message}</div> : null}
      <button type="submit" className="admin-button" disabled={pending}>{pending ? 'Saving…' : 'Save notes'}</button>
    </form>
  );
}
