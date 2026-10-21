'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logActivity } from './activity';
import { requireAdminPermission } from './admin-auth';
import { createBlogPost, saveBlogPost } from './blog-posts';

function formInput(formData, includeId = false) {
  return {
    ...(includeId ? {
      id: String(formData.get('id') || ''),
      version: String(formData.get('version') || ''),
    } : {}),
    blogHandle: String(formData.get('blogHandle') || 'news'),
    title: String(formData.get('title') || ''),
    handle: String(formData.get('handle') || ''),
    excerpt: String(formData.get('excerpt') || ''),
    body: String(formData.get('body') || ''),
    author: String(formData.get('author') || ''),
    publishedAt: String(formData.get('publishedAt') || ''),
    image: String(formData.get('image') || ''),
    imageAlt: String(formData.get('imageAlt') || ''),
    status: String(formData.get('status') || 'draft'),
    seoTitle: String(formData.get('seoTitle') || ''),
    seoDescription: String(formData.get('seoDescription') || ''),
  };
}

function validationResult(error, fallback) {
  if (error?.issues) {
    return {
      message: 'Review the highlighted post details and try again.',
      errors: error.flatten?.().fieldErrors || {},
    };
  }
  if (error?.code === 'VERSION_CONFLICT') return { message: error.message, errors: {} };
  if (error?.code === 11000) return { message: 'A post already uses that web address. Choose another handle.', errors: { handle: ['Choose a unique web address.'] } };
  return { message: error?.message || fallback, errors: {} };
}

function revalidateBlogPost(post, previousHandle = '') {
  revalidatePath('/admin/blogs');
  revalidatePath(`/admin/blogs/${post.id}`);
  revalidatePath(`/blogs/${post.blogHandle}`);
  if (previousHandle) revalidatePath(`/blogs/${post.blogHandle}/${previousHandle}`);
  revalidatePath(`/blogs/${post.blogHandle}/${post.handle}`);
}

export async function createBlogPostAction(_previousState, formData) {
  const session = await requireAdminPermission('content:write');
  try {
    const post = await createBlogPost(formInput(formData), session.email);
    revalidateBlogPost(post);
    await logActivity({ actor: session.email, type: 'content', action: post.status === 'published' ? 'Created and published blog post' : 'Created blog post draft', label: post.title, href: `/admin/blogs/${post.id}` });
    redirect(`/admin/blogs/${post.id}`);
  } catch (error) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    return validationResult(error, 'Could not create this blog post.');
  }
}

export async function saveBlogPostAction(_previousState, formData) {
  const session = await requireAdminPermission('content:write');
  try {
    const { post, previousHandle } = await saveBlogPost(formInput(formData, true), session.email);
    revalidateBlogPost(post, previousHandle);
    const action = post.status === 'published' ? 'Saved and published blog post' : post.status === 'archived' ? 'Archived blog post' : 'Saved blog post draft';
    await logActivity({ actor: session.email, type: 'content', action, label: post.title, href: `/admin/blogs/${post.id}` });
    return { message: `Saved ${post.title}.${post.status === 'published' ? ` Live at ${post.route}` : ''}`, errors: {}, saved: true };
  } catch (error) {
    return validationResult(error, 'Unable to save this blog post.');
  }
}
