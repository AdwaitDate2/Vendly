// @ts-nocheck
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminOffline from '@/components/admin/AdminOffline';
import BlogPostForm from '@/components/admin/BlogPostForm';
import { requireAdminPermission } from '@/lib/admin-auth';
import { getBlogPostById } from '@/lib/blog-posts';
import { isDatabaseUnavailableError } from '@/lib/mongodb';

export default async function EditBlogPostPage({ params }) {
  await requireAdminPermission('content:write');
  const { id } = await params;
  let post;
  try {
    post = await getBlogPostById(id);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) return <AdminOffline />;
    throw error;
  }
  if (!post) notFound();
  return <div className="admin-page"><div className="admin-page-heading"><div><Link href="/admin/blogs" className="admin-back-link">← Blog posts</Link><span className="admin-eyebrow">{post.status} blog post</span><h1>{post.title}</h1><p>Changes stay in a draft until you publish them.</p></div>{post.status === 'published' ? <Link href={post.route} target="_blank" className="admin-button admin-button--ghost">View post ↗</Link> : null}</div><BlogPostForm key={`${post.id}:${post.version}`} post={post} /></div>;
}
