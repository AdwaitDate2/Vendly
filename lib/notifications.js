import { sendTemplateEmail } from './email-template-store';

// Wording for these emails is edited in Admin → Email templates.
export { siteUrl } from './site-url';

/** Emails the team about a new appointment request, enquiry, or message. Never throws. */
export async function notifyNewRequest(inquiry) {
  await sendTemplateEmail('newRequestAlert', inquiry);
}

/** Confirms to the client that their request arrived. `message` is the site's own thank-you copy. Never throws. */
export async function sendRequestReceivedEmail(inquiry, { message = '' } = {}) {
  await sendTemplateEmail('requestReceived', { ...inquiry, thankYou: message });
}
