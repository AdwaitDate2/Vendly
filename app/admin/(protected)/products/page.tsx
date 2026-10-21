import Link from 'next/link';
import { listProducts } from '@/lib/catalog';
import ProductsTable from '@/components/admin/ProductsTable';
import { hasPermission, requireAdminSession } from '@/lib/admin-auth';

const statuses = ['all', 'published', 'draft', 'archived'];

function statusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default async function AdminProductsPage({ searchParams }) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const query = String(params?.query || '');
  const status = String(params?.status || 'all');
  const category = String(params?.category || '');
  // Keeps the collection filter on tab, search, and page links.
  const keep = category ? `&category=${encodeURIComponent(category)}` : '';
  let result = { items: [], total: 0, page: 1, pages: 1 };
  let error = '';
  try {
    result = await listProducts({ query, status, category, page: params?.page });
  } catch (connectionError) {
    console.error(connectionError);
    error = 'The store database didn’t respond. Reload the page in a moment; nothing has been lost.';
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">Catalog</span><h1>Products</h1><p>Shape the pieces, stories, and details your clients discover.</p></div><div className="admin-page-heading__actions">{/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download from a route handler */}
<a href="/admin/products/export" className="admin-button admin-button--ghost">Export</a><Link href="/admin/products/import" className="admin-button admin-button--ghost">Import</Link><Link href="/admin/products/bulk-edit" className="admin-button admin-button--ghost">Bulk edit</Link><Link href="/admin/products/new" className="admin-button">Add product</Link></div></div>
      <div className="admin-list-toolbar"><form className="admin-list-search"><span aria-hidden="true">⌕</span><input name="query" defaultValue={query} placeholder="Search products, slugs, metals…" /><input type="hidden" name="status" value={status} />{category ? <input type="hidden" name="category" value={category} /> : null}<button type="submit">Search</button></form><Link href="/admin/products" className="admin-button admin-button--ghost">Reset</Link></div>
      <div className="admin-view-tabs" role="tablist" aria-label="Product views">{statuses.map((item) => <Link href={`/admin/products?status=${item}${keep}${query ? `&query=${encodeURIComponent(query)}` : ''}`} className={status === item ? 'is-active' : ''} key={item}>{statusLabel(item)} {item === 'all' ? <small>{result.total || ''}</small> : null}</Link>)}</div>
      {category ? <div className="admin-alert" role="status"><span>Showing products in the <strong>{category}</strong> collection.</span> <Link href={`/admin/products?status=${status}`} className="admin-text-link">Show all products</Link></div> : null}
      {params?.archived ? <div className="admin-alert" role="status"><strong>Product archived.</strong><span>It&rsquo;s hidden from the website. To bring it back, open it from the Archived tab and set its status to Published.</span></div> : null}
      {error ? <div className="admin-alert admin-alert--error"><strong>Could not load products.</strong><span>{error}</span></div> : null}
      <ProductsTable items={result.items} total={result.total} error={error} canDelete={hasPermission(session, 'records:delete')} />
      <div className="admin-table-footer"><span>Page {result.page} of {result.pages}</span><div><Link href={`/admin/products?status=${status}&page=${Math.max(1, result.page - 1)}${keep}${query ? `&query=${encodeURIComponent(query)}` : ''}`} aria-disabled={result.page <= 1} aria-label="Previous page">←</Link><Link href={`/admin/products?status=${status}&page=${Math.min(result.pages, result.page + 1)}${keep}${query ? `&query=${encodeURIComponent(query)}` : ''}`} aria-disabled={result.page >= result.pages} aria-label="Next page">→</Link></div></div>
    </div>
  );
}
