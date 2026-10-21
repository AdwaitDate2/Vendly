// @ts-nocheck
'use client';

import { useActionState, useEffect, useState } from 'react';
import { requestStepAction } from '@/lib/admin-actions';
import { getAppointmentAvailabilityAction } from '@/lib/lead-actions';

function Status({ state }) {
  if (!state?.message) return null;
  return <div className={state.ok ? 'admin-alert' : 'admin-form-message'} role="status">{state.message}</div>;
}

export function formatDay(key) {
  if (!key) return '';
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

const STATUS_LABEL = { pending: 'Awaiting confirmation', confirmed: 'Confirmed', declined: 'Declined', completed: 'Completed' };

export function AppointmentStatusBadge({ status }) {
  const tone = status === 'confirmed' ? 'published' : status === 'pending' ? 'draft' : 'archived';
  return <span className={`admin-status admin-status--${tone}`}>{STATUS_LABEL[status] || status}</span>;
}

export function AppointmentPanel({ inquiry }) {
  const [state, action, pending] = useActionState(requestStepAction, {});
  const [availability, setAvailability] = useState(null);
  const [showMove, setShowMove] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const closed = inquiry.appointmentStatus === 'declined' || inquiry.appointmentStatus === 'completed';

  useEffect(() => {
    if (!showMove || availability) return;
    getAppointmentAvailabilityAction().then((result) => setAvailability(result));
  }, [showMove, availability]);

  const days = Object.keys(availability?.days || {}).sort();
  const times = availability?.days?.[date] || [];

  return (
    <form action={action} className="admin-card">
      <input type="hidden" name="id" value={inquiry.id} />
      <div className="admin-card__heading">
        <div><span className="admin-eyebrow">Appointment</span><h2>{inquiry.preferredDate ? `${formatDay(inquiry.preferredDate)}${inquiry.preferredTime ? ` at ${inquiry.preferredTime}` : ''}` : 'No time chosen'}</h2></div>
        <AppointmentStatusBadge status={inquiry.appointmentStatus} />
      </div>
      {inquiry.topic ? <p className="admin-field-help">{inquiry.topic}</p> : null}
      {closed ? (
        <p className="admin-field-help">This appointment is {inquiry.appointmentStatus}. Its time is open for other clients.</p>
      ) : (
        <>
          <label className="admin-check"><input type="checkbox" name="notify" value="yes" defaultChecked /><span>Email the client about this change</span></label>
          <div className="admin-import__actions">
            {inquiry.appointmentStatus !== 'confirmed' ? <button type="submit" name="intent" value="confirm" formNoValidate className="admin-button" disabled={pending || !inquiry.preferredDate}>Confirm appointment</button> : <button type="submit" name="intent" value="complete" formNoValidate className="admin-button" disabled={pending}>Mark completed</button>}
            <button type="button" className="admin-button admin-button--ghost" onClick={() => setShowMove((value) => !value)}>{showMove ? 'Cancel reschedule' : 'Reschedule'}</button>
            <button type="submit" name="intent" value="decline" formNoValidate className="admin-button admin-button--ghost admin-button--danger" disabled={pending}>Decline</button>
          </div>
          {showMove ? (
            <div className="admin-reschedule">
              {!availability ? <p className="admin-field-help">Loading open times…</p> : !days.length ? <p className="admin-field-help">No open times. Add hours under Customer appointments.</p> : (
                <div className="admin-field-row">
                  <label className="admin-field"><span>New date</span>
                    <select name="date" value={date} onChange={(event) => { setDate(event.target.value); setTime(''); }} required>
                      <option value="" disabled>Choose a date</option>
                      {days.map((day) => <option key={day} value={day}>{formatDay(day)}</option>)}
                    </select>
                  </label>
                  <label className="admin-field"><span>New time</span>
                    <select name="time" value={time} onChange={(event) => setTime(event.target.value)} required disabled={!date}>
                      <option value="" disabled>Choose a time</option>
                      {times.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                    </select>
                  </label>
                </div>
              )}
              <button type="submit" name="intent" value="reschedule" className="admin-button" disabled={pending || !date || !time}>Move and confirm</button>
            </div>
          ) : null}
        </>
      )}
      <Status state={state} />
    </form>
  );
}

export function ReplyForm({ inquiry }) {
  const [state, action, pending] = useActionState(requestStepAction, {});
  const defaultSubject = inquiry.requestType === 'appointment' ? 'Your byShreen appointment' : inquiry.requestType === 'product' ? `About ${inquiry.productTitle || 'your enquiry'}` : 'Re: your message to byShreen';
  return (
    <form action={action} className="admin-card" key={state.at && state.ok ? state.at : 'reply'}>
      <input type="hidden" name="id" value={inquiry.id} />
      <input type="hidden" name="intent" value="reply" />
      <div className="admin-card__heading"><div><span className="admin-eyebrow">Reply</span><h2>Email {inquiry.name.split(' ')[0]}</h2></div><span className="admin-card__hint">{inquiry.email}</span></div>
      <label className="admin-field"><span>Subject</span><input name="subject" defaultValue={defaultSubject} required maxLength={160} /></label>
      <label className="admin-field"><span>Message</span><textarea name="message" rows="6" required maxLength={5000} placeholder={`Hello ${inquiry.name.split(' ')[0]},`} /></label>
      <Status state={state} />
      <div className="admin-import__actions"><button type="submit" className="admin-button" disabled={pending}>{pending ? 'Sending…' : 'Send email'}</button></div>
    </form>
  );
}

const EVENT_LABEL = { confirmed: 'Confirmed', declined: 'Declined', completed: 'Completed', rescheduled: 'Rescheduled', reply: 'Email sent' };

export function RequestHistory({ inquiry }) {
  const entries = [
    ...(inquiry.events || []).map((entry) => ({ ...entry, label: EVENT_LABEL[entry.type] || entry.type })),
    { at: inquiry.createdAt, by: 'Client', label: inquiry.requestType === 'appointment' ? 'Requested an appointment' : 'Sent a message', text: '' },
  ].sort((a, b) => new Date(b.at) - new Date(a.at));
  return (
    <section className="admin-card">
      <div className="admin-card__heading"><div><span className="admin-eyebrow">History</span><h2>What has happened</h2></div></div>
      <ol className="admin-timeline">
        {entries.map((entry, index) => (
          <li key={index}>
            <strong>{entry.label}</strong>
            {entry.text ? <span>{entry.text}</span> : null}
            {entry.body ? <p className="admin-inquiry-message">{entry.body}</p> : null}
            <small>{entry.at ? new Date(entry.at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : ''}{entry.by ? ` · ${entry.by}` : ''}</small>
          </li>
        ))}
      </ol>
    </section>
  );
}
