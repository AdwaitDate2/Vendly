import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { isSlotAvailable } from './appointments';
import { emailLayout } from './email-layout';
import { sendEmail } from './email';
import { getDb } from './mongodb';
import { getStoreSettings } from './settings';

const COLLECTION = 'bespokeInquiries';

export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'declined', 'completed'];

const intents = z.enum(['confirm', 'decline', 'complete', 'reschedule', 'reply']);

function friendlyDate(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

async function emailClient(inquiry, { subject, heading, message, rows = [] }) {
  const settings = await getStoreSettings();
  const { html, text } = emailLayout({ heading, message, rows, brand: { storeName: settings.storeName }, footer: `Reply to this email to reach ${settings.storeName}.` });
  const result = await sendEmail({ to: inquiry.email, subject, html, text, replyTo: settings.contactEmail, tag: 'requestUpdate' });
  return result.status;
}

function visitDetails(inquiry) {
  const rows = [];
  if (inquiry.preferredDate) rows.push(['Date', friendlyDate(inquiry.preferredDate)]);
  if (inquiry.preferredTime) rows.push(['Time', inquiry.preferredTime]);
  if (inquiry.topic) rows.push(['Consultation', inquiry.topic.split(' · ').slice(0, 2).join(' · ')]);
  return rows;
}

/**
 * Runs one workflow step on a request: confirm / decline / complete / reschedule an appointment, or
 * email the client. Records it in the request's history. Returns { message } for the admin.
 */
export async function runRequestStep(id, input, actor) {
  if (!ObjectId.isValid(id)) throw new Error('Invalid request.');
  const intent = intents.parse(input.intent);
  const notify = input.notify !== false;
  const db = await getDb();
  const inquiry = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
  if (!inquiry) throw new Error('This request no longer exists.');
  const isAppointment = inquiry.requestType === 'appointment';
  if (intent !== 'reply' && !isAppointment) throw new Error('Only appointment requests can be scheduled.');

  const now = new Date();
  const set = { updatedAt: now };
  let event;
  let emailSent = '';
  let done;

  if (intent === 'confirm') {
    if (!inquiry.preferredDate) throw new Error('This request has no date to confirm. Reschedule it first.');
    Object.assign(set, { appointmentStatus: 'confirmed', status: 'active' });
    event = { type: 'confirmed', text: `Confirmed ${friendlyDate(inquiry.preferredDate)} at ${inquiry.preferredTime}` };
    if (notify) emailSent = await emailClient(inquiry, { subject: 'Your byShreen appointment is confirmed', heading: 'Your appointment is confirmed', message: `Hello ${inquiry.name},\n\nWe look forward to meeting you. Here are your appointment details.`, rows: visitDetails(inquiry) });
    done = 'Appointment confirmed.';
  } else if (intent === 'decline') {
    Object.assign(set, { appointmentStatus: 'declined', status: 'closed' });
    event = { type: 'declined', text: 'Declined. The time is open again.' };
    if (notify) emailSent = await emailClient(inquiry, { subject: 'About your byShreen appointment request', heading: 'We could not book that time', message: `Hello ${inquiry.name},\n\nThank you for your interest. Unfortunately we are unable to meet at the time you requested.\n\n${String(input.message || '').trim() || 'Please book another time on our website, or reply to this email and we will find one together.'}` });
    done = 'Request declined and the time released.';
  } else if (intent === 'complete') {
    Object.assign(set, { appointmentStatus: 'completed', status: 'closed' });
    event = { type: 'completed', text: 'Marked as completed.' };
    done = 'Appointment marked as completed.';
  } else if (intent === 'reschedule') {
    const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a new date.').parse(input.date);
    const time = String(input.time || '');
    const unchanged = date === inquiry.preferredDate && time === inquiry.preferredTime;
    if (unchanged) throw new Error('That is already the booked time.');
    if (!(await isSlotAvailable(date, time))) throw new Error('That time is not open. Choose one of the available times.');
    const parts = String(inquiry.topic || '').split(' · ');
    const label = new Date(Date.UTC(...date.split('-').map((n, i) => (i === 1 ? Number(n) - 1 : Number(n))))).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    if (parts.length >= 3) parts[parts.length - 1] = `${label} at ${time}`;
    Object.assign(set, { preferredDate: date, preferredTime: time, topic: parts.length >= 3 ? parts.join(' · ') : inquiry.topic, appointmentStatus: 'confirmed', status: 'active' });
    event = { type: 'rescheduled', text: `Moved from ${inquiry.preferredDate || 'no date'} ${inquiry.preferredTime || ''} to ${date} ${time}`.replace(/\s+/g, ' ') };
    if (notify) emailSent = await emailClient({ ...inquiry, preferredDate: date, preferredTime: time }, { subject: 'Your byShreen appointment has moved', heading: 'Your appointment has a new time', message: `Hello ${inquiry.name},\n\nWe have moved your appointment. Here are the new details.`, rows: visitDetails({ ...inquiry, preferredDate: date, preferredTime: time }) });
    done = 'Appointment rescheduled and confirmed.';
  } else {
    const subject = z.string().trim().min(1, 'Add a subject.').max(160).parse(input.subject);
    const message = z.string().trim().min(1, 'Write a message.').max(5000).parse(input.message);
    emailSent = await emailClient(inquiry, { subject, heading: subject, message });
    if (emailSent === 'failed') throw new Error('The email could not be sent. Try again.');
    if ((inquiry.status || 'new') === 'new') set.status = 'active';
    event = { type: 'reply', text: `Emailed “${subject}”`, body: message };
    done = emailSent === 'logged' ? 'Reply saved. No email provider is connected, so it was only recorded in the outbox.' : 'Reply sent.';
  }

  if (emailSent === 'failed') done += ' The email to the client could not be sent.';
  else if (emailSent === 'logged' && intent !== 'reply') done += ' No email provider is connected, so the client email was only recorded in the outbox.';
  else if (emailSent === 'sent') done += ' The client was emailed.';

  const entry = { at: now, by: actor, emailed: emailSent === 'sent', ...event };
  const result = await db.collection(COLLECTION).updateOne(
    { _id: inquiry._id, version: inquiry.version || 1 },
    { $set: set, $push: { events: entry }, $inc: { version: 1 } },
  );
  if (result.matchedCount !== 1) {
    const error = new Error('This request changed in another session. Reload before continuing.');
    error.code = 'VERSION_CONFLICT';
    throw error;
  }
  return { message: done, event: entry };
}
