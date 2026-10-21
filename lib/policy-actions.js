'use server';

import { revalidatePath } from 'next/cache';
import { logActivity } from './activity';
import { requireAdminPermission } from './admin-auth';
import { policyMeta, restorePolicyRevision, savePolicy } from './policies';

function refresh(key) {
  revalidatePath(policyMeta(key).path);
  revalidatePath('/admin/policies');
  revalidatePath(`/admin/policies/${key}`);
  revalidatePath('/sitemap.xml');
}

export async function savePolicyAction(_previousState, formData) {
  const session = await requireAdminPermission('content:write');
  const key = String(formData.get('key') || '');
  if (!policyMeta(key)) return { ok: false, message: 'Unknown policy.' };
  let body;
  try {
    body = JSON.parse(String(formData.get('body') || ''));
  } catch {
    return { ok: false, message: 'The text could not be read. Reload the page and try again.' };
  }
  try {
    const policy = await savePolicy(key, {
      title: String(formData.get('title') || ''),
      intro: String(formData.get('intro') || ''),
      body,
      lastUpdated: String(formData.get('lastUpdated') || ''),
      published: formData.get('published') === 'yes',
      seoTitle: String(formData.get('seoTitle') || ''),
      seoDescription: String(formData.get('seoDescription') || ''),
      version: String(formData.get('version') || '0'),
    }, session.email);
    await logActivity({ actor: session.email, type: 'content', action: policy.published ? 'Updated a policy' : 'Saved a hidden policy', label: policy.title, href: `/admin/policies/${key}` });
    refresh(key);
    return { ok: true, message: policy.published ? `${policy.title} saved. It’s live on the website.` : `${policy.title} saved. It’s hidden from the website.`, version: policy.version, savedAt: Date.now() };
  } catch (error) {
    return { ok: false, message: error.issues ? error.issues[0].message : error.message || 'Could not save the policy.', conflict: error.code === 'VERSION_CONFLICT' };
  }
}

export async function restorePolicyAction(_previousState, formData) {
  const session = await requireAdminPermission('content:write');
  const key = String(formData.get('key') || '');
  if (!policyMeta(key)) return { ok: false, message: 'Unknown policy.' };
  try {
    const policy = await restorePolicyRevision(key, String(formData.get('revisionId') || ''), session.email);
    await logActivity({ actor: session.email, type: 'content', action: 'Restored an earlier version of a policy', label: policy.title, href: `/admin/policies/${key}` });
    refresh(key);
    return { ok: true, message: 'Earlier version restored.', restoredAt: Date.now() };
  } catch (error) {
    return { ok: false, message: error.message || 'Could not restore that version.' };
  }
}
