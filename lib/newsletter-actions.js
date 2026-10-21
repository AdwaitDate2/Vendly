'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminPermission } from './admin-auth';
import {
  newsletterCampaignSchema,
  saveNewsletterCampaign,
  sendNewsletterBroadcast,
  sendTestNewsletter,
  unsubscribeByToken,
  resubscribeByToken,
} from './newsletter';

function parseDoc(raw) {
  if (!raw) return { type: 'doc', content: [{ type: 'paragraph' }] };
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(String(raw));
  } catch {
    return { type: 'doc', content: [{ type: 'paragraph' }] };
  }
}

/**
 * Server action to save a draft campaign.
 */
export async function saveNewsletterDraftAction(_prevState, formData) {
  const session = await requireAdminPermission('subscriber:read');
  const raw = {
    id: String(formData.get('id') || '') || undefined,
    title: String(formData.get('title') || ''),
    subject: String(formData.get('subject') || ''),
    preheader: String(formData.get('preheader') || ''),
    heading: String(formData.get('heading') || ''),
    buttonLabel: String(formData.get('buttonLabel') || ''),
    buttonUrl: String(formData.get('buttonUrl') || ''),
    richDoc: parseDoc(formData.get('richDoc')),
  };

  const parsed = newsletterCampaignSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0]?.[0] || 'Please review your newsletter details.';
    return { ok: false, message: firstError, errors };
  }

  try {
    const saved = await saveNewsletterCampaign(parsed.data, session.email || session.name);
    revalidatePath('/admin/subscribers');
    revalidatePath('/admin/subscribers/newsletter');
    return { ok: true, message: 'Draft saved successfully.', id: saved.id };
  } catch (err) {
    return { ok: false, message: err.message || 'Could not save draft.' };
  }
}

/**
 * Server action to send a test newsletter to a single email address.
 */
export async function sendTestNewsletterAction(_prevState, formData) {
  const session = await requireAdminPermission('subscriber:read');
  const testEmail = String(formData.get('testEmail') || '').trim();
  const raw = {
    subject: String(formData.get('subject') || ''),
    preheader: String(formData.get('preheader') || ''),
    heading: String(formData.get('heading') || ''),
    buttonLabel: String(formData.get('buttonLabel') || ''),
    buttonUrl: String(formData.get('buttonUrl') || ''),
    richDoc: parseDoc(formData.get('richDoc')),
  };

  const parsed = newsletterCampaignSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0]?.[0] || 'Please complete the newsletter before sending a test.';
    return { ok: false, message: firstError, errors };
  }

  if (!testEmail || !testEmail.includes('@')) {
    return { ok: false, message: 'Please enter a valid test recipient email address.' };
  }

  try {
    const result = await sendTestNewsletter({
      testEmail,
      subject: parsed.data.subject,
      preheader: parsed.data.preheader,
      heading: parsed.data.heading,
      richDoc: parsed.data.richDoc,
      buttonLabel: parsed.data.buttonLabel,
      buttonUrl: parsed.data.buttonUrl,
      actor: session.email || session.name,
    });
    return {
      ok: true,
      message: result.status === 'sent' ? `Test email sent to ${testEmail}!` : `Test email recorded in outbox for ${testEmail}.`,
      status: result.status,
    };
  } catch (err) {
    return { ok: false, message: err.message || 'Failed to send test email.' };
  }
}

/**
 * Server action to broadcast the newsletter to all active subscribers.
 */
export async function sendNewsletterBroadcastAction(_prevState, formData) {
  const session = await requireAdminPermission('subscriber:read');
  const raw = {
    id: String(formData.get('id') || '') || undefined,
    subject: String(formData.get('subject') || ''),
    preheader: String(formData.get('preheader') || ''),
    heading: String(formData.get('heading') || ''),
    buttonLabel: String(formData.get('buttonLabel') || ''),
    buttonUrl: String(formData.get('buttonUrl') || ''),
    richDoc: parseDoc(formData.get('richDoc')),
  };

  const parsed = newsletterCampaignSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0]?.[0] || 'Please complete required fields.';
    return { ok: false, message: firstError, errors };
  }

  try {
    const result = await sendNewsletterBroadcast({
      campaignId: raw.id,
      subject: parsed.data.subject,
      preheader: parsed.data.preheader,
      heading: parsed.data.heading,
      richDoc: parsed.data.richDoc,
      buttonLabel: parsed.data.buttonLabel,
      buttonUrl: parsed.data.buttonUrl,
      actor: session.email || session.name,
    });

    revalidatePath('/admin/subscribers');
    revalidatePath('/admin/subscribers/newsletter');

    return {
      ok: true,
      message: `Newsletter broadcast complete! Dispatched to ${result.results.total} subscriber(s).`,
      results: result.results,
      id: result.id,
    };
  } catch (err) {
    return { ok: false, message: err.message || 'Failed to broadcast newsletter.' };
  }
}

/**
 * Public action for user unsubscribe.
 */
export async function unsubscribeAction(_prevState, formData) {
  const email = String(formData.get('email') || '').trim();
  const token = String(formData.get('token') || '').trim();
  return await unsubscribeByToken(email, token);
}

/**
 * Public action for user re-subscribe.
 */
export async function resubscribeAction(_prevState, formData) {
  const email = String(formData.get('email') || '').trim();
  const token = String(formData.get('token') || '').trim();
  return await resubscribeByToken(email, token);
}
