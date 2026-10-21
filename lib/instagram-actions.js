'use server';

import { revalidatePath } from 'next/cache';
import { logActivity } from './activity';
import { requireAdminPermission } from './admin-auth';
import { buildPostFromLink, saveInstagramFeed } from './instagram';

/** Turns a pasted post/reel link into a feed post, with its cover copied to Kenmark Storage. */
export async function fetchInstagramPostAction(link) {
  await requireAdminPermission('content:write');
  return buildPostFromLink(link);
}

export async function saveInstagramFeedAction(_previousState, formData) {
  const session = await requireAdminPermission('content:write');
  let feed;
  try {
    feed = JSON.parse(String(formData.get('feed') || ''));
  } catch {
    return { ok: false, message: 'The feed could not be read. Reload the page and try again.' };
  }
  try {
    const saved = await saveInstagramFeed(feed, session.email);
    await logActivity({ actor: session.email, type: 'content', action: 'Updated the Instagram feed', label: `${saved.posts.filter((post) => !post.hidden).length} posts showing`, href: '/admin/instagram' });
    // The feed can sit on any block page, so refresh the whole site.
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Instagram feed saved. It’s live on the website.', savedAt: Date.now() };
  } catch (error) {
    return { ok: false, message: error.issues ? error.issues[0].message : error.message || 'Could not save the feed.' };
  }
}
