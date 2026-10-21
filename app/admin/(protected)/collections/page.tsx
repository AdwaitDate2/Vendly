// @ts-nocheck
import Image from 'next/image';
import Link from 'next/link';
import DeleteButton from '@/components/admin/DeleteButton';
import { hasPermission, requireAdminSession } from '@/lib/admin-auth';
import { countProductsByCollection, listCollections } from '@/lib/catalog';

const statuses = ['all', 'published', 'draft', 'archived'];

function statusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default async function AdminCollectionsPage({ searchParams }) {
  const session = await requireAdminSession();
  const canDelete = hasPermission(session, 'records:delete');
  const params = await searchParams;
  const query = String(params?.query || '');
  const status = String(params?.status || 'all');
  let result = { items: [], total: 0, page: 1, pages: 1 };
  let counts = {};
  let error = '';
  try {
    result = await listCollections({ query, status, page: params?.page });
    counts = await countProductsByCollection(result.items.map((collection) => collection.slug));
  } catch (connectionError) {
    error = connectionError.message || 'MongoDB is unavailable.';
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">Catalog organization</span><h1>Collections</h1><p>Order the edits clients use to find their way through the catalog.</p></div><Link href="/admin/collections/new" className="admin-button">Add collection <span aria-hidden="true">＋</span></Link></div>
      <div className="admin-list-toolbar"><form className="admin-list-search"><span aria-hidden="true">⌕</span><input name="query" defaultValue={query} placeholder="Search collections, slugs, notes…" /><input type="hidden" name="status" value={status} /><button type="submit">Search</button></form><Link href="/admin/collections" className="admin-button admin-button--ghost">Reset</Link></div>
      <div className="admin-view-tabs" role="tablist" aria-label="Collection views">{statuses.map((item) => <Link href={`/admin/collections?status=${item}${query ? `&query=${encodeURIComponent(query)}` : ''}`} className={status === item ? 'is-active' : ''} key={item}>{statusLabel(item)} {item === 'all' ? <small>{result.total || ''}</small> : null}</Link>)}</div>
      {error ? <div className="admin-alert admin-alert--error"><strong>Could not load collections.</strong><span>{error}</span></div> : null}
      <div className="admin-card admin-table-card"><div className="admin-table-meta"><span>{result.total} {result.total === 1 ? 'collection' : 'collections'}</span><span>Ordered by sort position <span aria-hidden="true">⌄</span></span></div><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th scope="col"><input type="checkbox" aria-label="Select all collections" /></th><th scope="col">Collection</th><th scope="col">Slug</th><th scope="col">Products</th><th scope="col">Status</th><th scope="col">Updated</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{result.items.map((collection) => <tr key={collection.id}><td><input type="checkbox" aria-label={`Select ${collection.name}`} /></td><td><Link href={`/admin/collections/${collection.id}`} className="admin-product-cell"><span className="admin-product-thumb admin-collection-thumb" aria-hidden="true">{collection.image ? <Image src={collection.image} alt="" width={46} height={52} /> : '▦'}</span><span><strong>{collection.name}</strong><small>{collection.note}</small></span></Link></td><td>{collection.slug}</td><td>{counts[collection.slug]?.total ? <Link href={`/admin/products?category=${encodeURIComponent(collection.slug)}`} className="admin-table-link">{counts[collection.slug].total} {counts[collection.slug].total === 1 ? 'product' : 'products'}{counts[collection.slug].published !== counts[collection.slug].total ? <small className="admin-table-sub">{counts[collection.slug].published} on the website</small> : null}</Link> : <span className="admin-table-sub">No products yet</span>}</td><td><span className={`admin-status admin-status--${collection.status}`}>{statusLabel(collection.status)}</span></td><td>{collection.updatedAt ? new Date(collection.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td><td className="admin-table-actions"><Link href={`/admin/collections/${collection.id}`} className="admin-row-action">Edit</Link>{canDelete ? <DeleteButton kind="collection" id={collection.id} name={collection.name} variant="link" /> : null}</td></tr>)}{!result.items.length ? <tr><td colSpan="7"><div className="admin-empty"><span>▦</span><h2>{error ? 'Catalog unavailable' : 'No collections here yet'}</h2><p>{error ? 'Check the MongoDB connection, then reload.' : 'Sync the starter catalog or add your first collection.'}</p>{!error ? <Link href="/admin/collections/new" className="admin-text-link">Create a collection →</Link> : null}</div></td></tr> : null}</tbody></table></div><div className="admin-table-footer"><span>Page {result.page} of {result.pages}</span><div><Link href={`/admin/collections?status=${status}&page=${Math.max(1, result.page - 1)}${query ? `&query=${encodeURIComponent(query)}` : ''}`} aria-disabled={result.page <= 1}>←</Link><Link href={`/admin/collections?status=${status}&page=${Math.min(result.pages, result.page + 1)}${query ? `&query=${encodeURIComponent(query)}` : ''}`} aria-disabled={result.page >= result.pages}>→</Link></div></div></div>
    </div>
  );
}
