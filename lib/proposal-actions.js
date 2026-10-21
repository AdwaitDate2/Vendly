'use server';

import { revalidatePath } from 'next/cache';
import { logActivity } from './activity';
import { requireAdminPermission } from './admin-auth';
import { saveProposals } from './proposals';

export async function saveProposalsAction(_previousState, formData) {
  const session = await requireAdminPermission('content:write');
  let proposals;
  try {
    proposals = JSON.parse(String(formData.get('proposals') || ''));
  } catch {
    return { ok: false, message: 'The data could not be read. Reload the page and try again.' };
  }
  if (!Array.isArray(proposals)) {
    return { ok: false, message: 'Invalid data.' };
  }
  try {
    await saveProposals(proposals, session.email);
    await logActivity({
      actor: session.email,
      type: 'content',
      action: 'Updated proposal stories',
      label: `${proposals.length} ${proposals.length === 1 ? 'story' : 'stories'}`,
      href: '/admin/proposals',
    });
    revalidatePath('/proposals');
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Proposal stories saved. They are live on the website.', savedAt: Date.now() };
  } catch (error) {
    return { ok: false, message: error.message || 'Could not save the stories.' };
  }
}
