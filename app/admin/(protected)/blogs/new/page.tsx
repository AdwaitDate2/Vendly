import Link from 'next/link';
import BlogPostForm from '@/components/admin/BlogPostForm';
import { requireAdminPermission } from '@/lib/admin-auth';

export default async function NewBlogPostPage() {
  await requireAdminPermission('content:write');
  return <div className="admin-page"><div className="admin-page-heading"><div><Link href="/admin/blogs" className="admin-back-link">← Blog posts</Link><span className="admin-eyebrow">News</span><h1>Create a blog post</h1><p>Save a draft while you work, then publish it to the News page.</p></div></div><BlogPostForm /></div>;
}
