'use server';

import { revalidatePath } from 'next/cache';
import { logActivity } from './activity';
import { requireAdminPermission } from './admin-auth';
import { sendEmail } from './email';
import { resetEmailTemplate, saveEmailTemplate } from './email-template-store';
import { EDITABLE_FIELDS, buildEmail, emailTemplateMeta, sampleDataFor } from './email-templates';
import { getStoreSettings, saveStoreSettings } from './settings';
import { siteUrl } from './site-url';

function pick(values) {
  return { ...Object.fromEntries(EDITABLE_FIELDS.map((field) => [field, String(values?.[field] ?? '')])), mode: values?.mode === 'code' ? 'code' : 'simple', html: String(values?.html ?? '') };
}

function refresh(key) {
  revalidatePath('/admin/emails');
  revalidatePath(`/admin/emails/${key}`);
}

export async function saveEmailTemplateAction(key, values) {
  const session = await requireAdminPermission('settings:manage');
  const meta = emailTemplateMeta(key);
  if (!meta) return { ok: false, message: 'Unknown email.' };
  try {
    const saved = await saveEmailTemplate(key, { ...pick(values), enabled: values?.enabled !== false }, session.email);
    await logActivity({ actor: session.email, type: 'settings', action: saved.enabled ? 'Updated an email template' : 'Turned off an email', label: meta.label, href: `/admin/emails/${key}` });
    refresh(key);
    return { ok: true, message: saved.enabled ? `“${meta.label}” saved. The next one sent uses this wording.` : `“${meta.label}” saved and switched off.`, template: saved };
  } catch (error) {
    return { ok: false, message: error.issues ? error.issues[0].message : error.message || 'Could not save.' };
  }
}

export async function resetEmailTemplateAction(key) {
  const session = await requireAdminPermission('settings:manage');
  const meta = emailTemplateMeta(key);
  if (!meta) return { ok: false, message: 'Unknown email.' };
  const saved = await resetEmailTemplate(key, session.email);
  await logActivity({ actor: session.email, type: 'settings', action: 'Reset an email template', label: meta.label, href: `/admin/emails/${key}` });
  refresh(key);
  return { ok: true, message: `“${meta.label}” is back to the original wording.`, template: saved };
}

/** Sends the current (possibly unsaved) wording with sample data to the signed-in owner. */
export async function sendTestEmailAction(key, values) {
  const session = await requireAdminPermission('settings:manage');
  const meta = emailTemplateMeta(key);
  if (!meta) return { ok: false, message: 'Unknown email.' };
  if (!session.email || !session.email.includes('@')) return { ok: false, message: 'Your account has no email address to send the test to.' };
  const settings = await getStoreSettings();
  const email = buildEmail(key, { wording: pick(values), data: { ...sampleDataFor(key), test: true }, settings, siteUrl });
  const result = await sendEmail({ to: session.email, subject: email.subject, text: email.text, html: email.html, replyTo: settings.contactEmail, tag: `test-${key}` });
  if (result.status === 'sent') return { ok: true, message: `Test sent to ${session.email}.` };
  if (result.status === 'logged') return { ok: true, message: 'Klaviyo is not connected, so the test was saved to Settings → Notifications → Recent emails instead of being sent.' };
  return { ok: false, message: `The test could not be sent${result.error ? `: ${result.error}` : '.'}` };
}

/** Logo, logo width, and colors shared by every email. Empty colors follow the site Theme. */
export async function saveEmailDesignAction(design) {
  const session = await requireAdminPermission('settings:manage');
  try {
    const saved = await saveStoreSettings({ emailDesign: { logo: String(design?.logo || ''), logoWidth: design?.logoWidth, accentColor: String(design?.accentColor || ''), backgroundColor: String(design?.backgroundColor || '') } }, session.email);
    await logActivity({ actor: session.email, type: 'settings', action: 'Updated the email design', href: '/admin/emails' });
    revalidatePath('/admin/emails');
    return { ok: true, message: 'Email design saved. Every email now uses it.', design: saved.emailDesign };
  } catch (error) {
    return { ok: false, message: error.issues ? error.issues[0].message : error.message || 'Could not save.' };
  }
}
