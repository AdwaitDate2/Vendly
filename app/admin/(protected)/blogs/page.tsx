// @ts-nocheck
import Link from 'next/link';
import { requireAdminPermission } from '@/lib/admin-auth';
import { isDatabaseUnavailableError } from '@/lib/mongodb';
import { listBlogPosts } from '@/lib/blog-posts';

const STATUSES = ['all', 'published', 'draft', 'archived'];

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

export default async function BlogPostsAdminPage({ searchParams }) {
  await requireAdminPermission('content:write');
  const params = await searchParams;
  const status = STATUSES.includes(String(params?.status || 'all')) ? String(params?.status || 'all') : 'all';
  const query = String(params?.query || '').slice(0, 100);
  let result = { items: [], total: 0 };
  let error = '';
  try {
    result = await listBlogPosts({ blogHandle: 'news', status, query });
  } catch (loadError) {
    if (isDatabaseUnavailableError(loadError)) error = 'The store database did not respond. Reload in a moment; your posts are safe.';
    else throw loadError;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">News</span><h1>Blog posts</h1><p>Write and publish stories for the News page.</p></div><Link href="/admin/blogs/new" className="admin-button">Add blog post</Link></div>
      {params?.created ? <div className="admin-alert" role="status">Blog post created.</div> : null}
      {params?.archived ? <div className="admin-alert" role="status">Blog post archived.</div> : null}
      {error ? <div className="admin-alert admin-alert--error"><strong>Could not load blog posts.</strong><span>{error}</span></div> : null}
      <div className="admin-list-toolbar">
        <form className="admin-list-search"><span aria-hidden="true">⌕</span><input name="query" defaultValue={query} placeholder="Search posts, excerpts, authors…" /><input type="hidden" name="status" value={status} /><button type="submit">Search</button></form>
        <Link href="/admin/blogs" className="admin-button admin-button--ghost">Reset</Link>
      </div>
      <div className="admin-view-tabs" role="tablist" aria-label="Blog post status">{STATUSES.map((item) => <Link href={`/admin/blogs?status=${item}${query ? `&query=${encodeURIComponent(query)}` : ''}`} className={status === item ? 'is-active' : ''} key={item}>{item[0].toUpperCase() + item.slice(1)}{item === 'all' ? <small>{result.total || ''}</small> : null}</Link>)}</div>
      <div className="admin-card admin-table-card">
        <div className="admin-table-scroll"><table className="admin-table">
          <thead><tr><th scope="col">Post</th><th scope="col">Handle</th><th scope="col">Status</th><th scope="col">Publish date</th><th scope="col">Updated</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{result.items.map((post) => <tr key={post.id}>
            <td><Link href={`/admin/blogs/${post.id}`} className="admin-product-cell"><span><strong>{post.title}</strong>{post.excerpt ? <small>{post.excerpt}</small> : null}</span></Link></td>
            <td>{post.handle}</td>
            <td><span className={`admin-status admin-status--${post.status}`}>{post.status[0].toUpperCase() + post.status.slice(1)}</span></td>
            <td>{formatDate(post.publishedAt)}</td>
            <td>{formatDate(post.updatedAt)}</td>
            <td className="admin-table-actions"><Link className="admin-row-action" href={`/admin/blogs/${post.id}`}>Edit</Link>{post.status === 'published' ? <Link className="admin-row-action" href={post.route} target="_blank">View</Link> : null}</td>
          </tr>)}
          {!result.items.length ? <tr><td colSpan="6"><div className="admin-empty"><span>▤</span><h2>{error ? 'Posts unavailable' : query ? 'No posts match this search' : status === 'all' ? 'No blog posts yet' : `No ${status} posts`}</h2><p>{error || (query ? 'Try another title, author, or phrase.' : 'Create a draft, add an image and excerpt, then publish it to the News page.')}</p>{!error && !query ? <Link href="/admin/blogs/new" className="admin-text-link">Create a blog post →</Link> : null}</div></td></tr> : null}</tbody>
        </table></div>
      </div>
    </div>
  );
}
