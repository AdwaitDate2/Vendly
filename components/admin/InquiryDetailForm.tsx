// @ts-nocheck
'use client';

import DeleteButton from './DeleteButton';
import { useActionState } from 'react';
import { updateInquiryAction } from '@/lib/admin-actions';

export default function InquiryDetailForm({ inquiry, canDelete = false }) {
  const [state, formAction, pending] = useActionState(updateInquiryAction, { message: '', errors: {} });
  return (
    <>
      <form className="admin-card" action={formAction}>
        <input type="hidden" name="id" value={inquiry.id} />
        <input type="hidden" name="version" value={inquiry.version || 1} />
        <div className="admin-card__heading"><div><span className="admin-eyebrow">Workflow</span><h2>Follow-up</h2></div></div>
        <label className="admin-field"><span>Status</span><select name="status" defaultValue={inquiry.status || 'new'}><option value="new">New</option><option value="active">In progress</option><option value="closed">Closed</option><option value="spam">Spam</option></select></label>
        {inquiry.requestType === 'appointment' ? <p className="admin-field-help">Closing or marking as spam releases the appointment time for other clients.</p> : null}
        <label className="admin-field"><span>Assignee</span><input name="assignee" defaultValue={inquiry.assignee || ''} placeholder="Name or email" /></label>
        <label className="admin-field"><span>Next follow-up</span><input name="nextFollowUpAt" type="datetime-local" defaultValue={inquiry.nextFollowUpAt || ''} /></label>
        <label className="admin-field"><span>Private notes</span><textarea name="internalNotes" rows="6" defaultValue={inquiry.internalNotes || ''} placeholder="Only staff can see these notes." /></label>
        {state.message ? <div className={state.saved ? 'admin-alert' : 'admin-form-message'} role="status">{state.message}</div> : null}
        <div className="admin-import__actions"><button type="submit" className="admin-button" disabled={pending}>{pending ? 'Saving…' : 'Save follow-up'}</button></div>
      </form>
      {canDelete ? <section className="admin-card admin-card--danger"><h2>Delete request</h2><p className="admin-field-help">For spam, or when a client asks for their information to be removed. You can restore it from Recently deleted for 90 days.</p><DeleteButton kind="inquiry" id={inquiry.id} name={`${inquiry.name}’s request`} redirectTo="/admin/inquiries" label="Delete request" /></section> : null}
    </>
  );
}
