import Link from 'next/link';
import { notFound } from 'next/navigation';
import InventoryAdjustForm from '@/components/admin/InventoryAdjustForm';
import { getProductById } from '@/lib/catalog';
import { listInventoryMovements } from '@/lib/inventory';

const REASON_LABELS = { restock: 'New stock', correction: 'Count correction', damage: 'Damaged', return: 'Returned', sale: 'Sold', reserve: 'Reserved', release: 'Released', other: 'Other' };
const when = (value) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));

export default async function InventoryHistoryPage({ params, searchParams }) {
  const routeParams = await params;
  const product = await getProductById(routeParams.productId);
  if (!product) notFound();
  const query = await searchParams;
  const options = (product.variants || []).filter((item) => item.active !== false);
  const selectedVariant = String(query?.variant || options[0]?.id || '');
  const variant = options.find((item) => String(item.id) === selectedVariant) || options[0];
  if (!variant) notFound();
  const madeToOrder = product.madeToOrder !== false;
  const quantity = Number(variant.quantity || 0);
  const threshold = Number(variant.lowStockThreshold ?? 1);
  const item = { productId: product.id, variantId: String(variant.id), version: product.version || 0, productTitle: product.shortTitle || product.title, variantTitle: variant.title, sku: variant.sku, quantity, lowStockThreshold: threshold, madeToOrder };
  const movements = await listInventoryMovements(product.id, String(variant.id));
  const title = product.shortTitle || product.title;

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <Link href="/admin/inventory" className="admin-back-link">← Inventory</Link>
          <h1>{title}</h1>
          <p>{madeToOrder ? 'Made to order: shoppers can always buy this, so stock is only for your records.' : 'Ready to ship: shoppers can buy only what is in stock.'} <Link href={`/admin/products/${product.id}`} className="admin-text-link">Edit product</Link></p>
        </div>
        <Link href={`/shop/${product.slug}`} target="_blank" className="admin-button admin-button--ghost">View on website ↗</Link>
      </div>

      {options.length > 1 ? (
        <div className="admin-view-tabs" role="tablist" aria-label="Metal options">
          {options.map((option) => <Link key={option.id} href={`/admin/inventory/${product.id}?variant=${encodeURIComponent(option.id)}`} className={String(option.id) === String(variant.id) ? 'is-active' : ''}>{option.title} <small>{Number(option.quantity || 0)}</small></Link>)}
        </div>
      ) : null}

      <div className="admin-editor-grid">
        <section className="admin-card">
          <div className="admin-card__heading"><div><h2>{variant.title}</h2>{variant.sku ? <p className="admin-field-help">SKU {variant.sku}</p> : null}</div></div>
          <div className="admin-inventory-detail">
            <div><span>In stock</span><strong>{quantity}</strong></div>
            <div><span>Low-stock alert</span><strong>{madeToOrder ? 'Off' : `${threshold} or fewer`}</strong></div>
            <div><span>On the website</span><strong>{product.status === 'published' ? (madeToOrder || quantity > 0 ? 'Available' : 'Sold out') : 'Hidden'}</strong></div>
          </div>
          <InventoryAdjustForm item={item} />
        </section>

        <section className="admin-card">
          <div className="admin-card__heading"><div><h2>History</h2><p className="admin-field-help">Every change to {variant.title}, newest first. New York time.</p></div></div>
          {movements.length ? (
            <ol className="admin-movement-list">
              {movements.map((movement) => (
                <li key={movement.id}>
                  <div>
                    <strong>{movement.delta > 0 ? '+' : ''}{movement.delta} · {REASON_LABELS[movement.reason] || movement.reason}{movement.afterQuantity !== undefined ? ` · ${movement.afterQuantity} in stock` : ''}</strong>
                    <small>{[movement.note, movement.actor === 'local-preview' ? 'Admin' : movement.actor === 'system' ? 'Website order' : movement.actor].filter(Boolean).join(' · ')}</small>
                  </div>
                  <time dateTime={movement.createdAt ? new Date(movement.createdAt).toISOString() : undefined}>{movement.createdAt ? when(movement.createdAt) : '—'}</time>
                </li>
              ))}
            </ol>
          ) : <div className="admin-empty admin-empty--compact"><p>No stock changes for this option yet.</p></div>}
        </section>
      </div>
    </div>
  );
}
