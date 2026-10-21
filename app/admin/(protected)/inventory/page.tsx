// @ts-nocheck
import Link from 'next/link';
import InventoryAdjustForm from '@/components/admin/InventoryAdjustForm';
import { isLowStock, listInventory } from '@/lib/inventory';

const statuses = ['all', 'published', 'draft', 'archived'];

function statusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default async function AdminInventoryPage({ searchParams }) {
  const params = await searchParams;
  const query = String(params?.query || '');
  const status = String(params?.status || 'all');
  const stock = String(params?.stock || 'all');
  let result = { items: [], total: 0, page: 1, pages: 1 };
  let error = '';
  try {
    result = await listInventory({ query, status, stock, page: params?.page });
  } catch (connectionError) {
    error = connectionError.message || 'MongoDB is unavailable.';
  }

  const filterSuffix = `${status !== 'all' ? `&status=${status}` : ''}${stock === 'low' ? '&stock=low' : ''}${query ? `&query=${encodeURIComponent(query)}` : ''}`;
  const detailHref = (item) => `/admin/inventory/${item.productId}?variant=${encodeURIComponent(item.variantId)}`;
  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <h1>Inventory</h1>
          <p>Stock for each metal option. Choose Add when new pieces arrive, Remove when one leaves, or Set to after a count. Website orders update stock automatically.</p>
        </div>
        <div className="admin-page-heading__actions">
          <Link href={stock === 'low' ? '/admin/inventory' : '/admin/inventory?stock=low'} className={`admin-button ${stock === 'low' ? '' : 'admin-button--ghost'}`}>{stock === 'low' ? 'Show all' : 'Low stock'}</Link>
        </div>
      </div>
      <div className="admin-alert"><span><strong>Made-to-order pieces</strong> can always be ordered, so their stock is only for your records. Stock limits what shoppers can buy only for products with &ldquo;Made to order&rdquo; turned off on the product page.</span></div>
      <div className="admin-list-toolbar"><form className="admin-list-search"><span aria-hidden="true">⌕</span><input name="query" defaultValue={query} placeholder="Search product, SKU, collection…" /><input type="hidden" name="status" value={status} /><input type="hidden" name="stock" value={stock} /><button type="submit">Search</button></form><Link href="/admin/inventory" className="admin-button admin-button--ghost">Reset</Link></div>
      <div className="admin-view-tabs" role="tablist" aria-label="Inventory product status">{statuses.map((item) => <Link href={`/admin/inventory?status=${item}${stock === 'low' ? '&stock=low' : ''}${query ? `&query=${encodeURIComponent(query)}` : ''}`} className={status === item ? 'is-active' : ''} key={item}>{statusLabel(item)} {item === 'all' ? <small>{result.total || ''}</small> : null}</Link>)}</div>
      {error ? <div className="admin-alert admin-alert--error"><strong>Could not load inventory.</strong><span>{error}</span></div> : null}
      <div className="admin-card admin-table-card">
        <div className="admin-table-meta"><span>{result.total} {result.total === 1 ? 'option' : 'options'}</span><span>{stock === 'low' ? 'Ready-to-ship options at or below their alert level' : 'Every metal option'}</span></div>
        <div className="admin-table-scroll">
          <table className="admin-table admin-table--inventory">
            <thead><tr><th scope="col">Product</th><th scope="col">Collection</th><th scope="col">In stock</th><th scope="col">Alert at</th><th scope="col">Status</th><th scope="col">Update stock</th><th scope="col"><span className="sr-only">History</span></th></tr></thead>
            <tbody>
              {result.items.map((item) => (
                <tr key={`${item.productId}-${item.variantId}`}>
                  <td><Link href={detailHref(item)} className="admin-inventory-product"><strong>{item.productTitle || item.productSlug}</strong><small>{[item.variantTitle, item.sku].filter(Boolean).join(' · ') || item.variantId}</small></Link></td>
                  <td>{item.category || '—'}</td>
                  <td><strong className={isLowStock(item) ? 'admin-inventory-quantity is-low' : 'admin-inventory-quantity'}>{item.quantity}</strong></td>
                  <td>{item.madeToOrder ? '—' : item.lowStockThreshold}</td>
                  <td><span className={`admin-status admin-status--${item.productStatus}`}>{statusLabel(item.productStatus)}</span>{item.madeToOrder ? <span className="admin-inventory-tag">Made to order</span> : isLowStock(item) ? <span className="admin-low-stock-label">{item.quantity ? 'Low' : 'Sold out'}</span> : null}</td>
                  <td><InventoryAdjustForm item={item} compact /></td>
                  <td><Link href={detailHref(item)} className="admin-row-action">History</Link></td>
                </tr>
              ))}
              {!result.items.length ? <tr><td colSpan="7"><div className="admin-empty"><span>▤</span><h2>{error ? 'Inventory unavailable' : stock === 'low' ? 'Nothing is running low' : 'No products here yet'}</h2><p>{error ? 'Check the database connection, then reload.' : stock === 'low' ? 'Ready-to-ship options at or below their alert level will show here.' : 'Add a product or change the filters.'}</p>{!error && stock !== 'low' ? <Link href="/admin/products/new" className="admin-text-link">Add a product →</Link> : null}</div></td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className="admin-table-footer"><span>Page {result.page} of {result.pages}</span><div><Link href={`/admin/inventory?page=${Math.max(1, result.page - 1)}${filterSuffix}`} aria-disabled={result.page <= 1}>←</Link><Link href={`/admin/inventory?page=${Math.min(result.pages, result.page + 1)}${filterSuffix}`} aria-disabled={result.page >= result.pages}>→</Link></div></div>
      </div>
    </div>
  );
}
