'use server';

import { getAppointmentAvailability, isSlotAvailable } from './appointments';
import { getPageContent } from './content';
import { trackNewsletterSignup, trackRequest } from './klaviyo-events';
import { notifyNewRequest, sendRequestReceivedEmail } from './notifications';
import { createInquiry, inquiryInputSchema, newsletterInputSchema, subscribeNewsletter } from './leads';

/** Open dates and times for the public booking calendar. */
export async function getAppointmentAvailabilityAction() {
  try {
    return await getAppointmentAvailability();
  } catch {
    return { enabled: false, days: {}, error: true };
  }
}

export async function createInquiryAction(_previousState, formData) {
  const raw = {
    requestType: String(formData.get('requestType') || 'contact'),
    name: String(formData.get('name') || ''),
    email: String(formData.get('email') || ''),
    phone: String(formData.get('phone') || ''),
    topic: String(formData.get('topic') || ''),
    interest: String(formData.get('interest') || ''),
    budget: String(formData.get('budget') || ''),
    timeline: String(formData.get('timeline') || ''),
    productSlug: String(formData.get('productSlug') || ''),
    productTitle: String(formData.get('productTitle') || ''),
    preferredDate: String(formData.get('preferredDate') || ''),
    preferredTime: String(formData.get('preferredTime') || ''),
    message: String(formData.get('message') || ''),
    consent: String(formData.get('consent') || ''),
    website: String(formData.get('website') || ''),
  };
  const parsed = inquiryInputSchema.safeParse(raw);
  if (!parsed.success) return { message: 'Please review the highlighted fields below.', success: false, errors: parsed.error.flatten().fieldErrors };
  let contactContent;
  try {
    contactContent = await getPageContent('contact');
  } catch {
    contactContent = null;
  }
  const thankYouBody = contactContent?.sections?.thankYou?.body || 'Thank you for reaching out. A concierge will be in touch with you shortly.';
  const emailHeading = contactContent?.sections?.email?.heading || 'concierge@byshreen.com';

  if (parsed.data.website) return { message: thankYouBody, success: true, errors: {} };
  try {
    if (parsed.data.requestType === 'appointment' && parsed.data.preferredDate) {
      if (!(await isSlotAvailable(parsed.data.preferredDate, parsed.data.preferredTime))) {
        return { message: 'Sorry, that time is no longer available. Please choose another slot.', success: false, slotTaken: true, errors: {} };
      }
    }
    const inquiry = await createInquiry(parsed.data);
    try {
      await Promise.allSettled([
        notifyNewRequest(inquiry),
        sendRequestReceivedEmail(inquiry, { message: thankYouBody }),
        trackRequest(inquiry),
      ]);
    } catch (e) {
      console.error('[lead-actions] post-submission notification error:', e);
    }
    return { message: thankYouBody, success: true, errors: {} };
  } catch (err) {
    console.error('[lead-actions] createInquiry error:', err);
    return { message: `We could not save your note right now. Please email ${emailHeading} directly.`, success: false, errors: {} };
  }
}

export async function subscribeNewsletterAction(_previousState, formData) {
  const raw = { email: String(formData.get('email') || ''), consent: String(formData.get('consent') || 'yes'), source: String(formData.get('source') || 'footer') };
  const parsed = newsletterInputSchema.safeParse(raw);
  if (!parsed.success) return { message: parsed.error.flatten().fieldErrors.email?.[0] || 'Enter a valid email address.', success: false };
  try {
    await subscribeNewsletter(parsed.data);
    await trackNewsletterSignup(parsed.data.email, parsed.data.source);
    return { message: 'You are on the list. Thank you.', success: true };
  } catch {
    return { message: 'We could not save that email right now. Please try again soon.', success: false };
  }
}
