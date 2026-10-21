import Link from 'next/link';
import BulkProductEditor from '@/components/admin/BulkProductEditor';
import { requireAdminPermission } from '@/lib/admin-auth';
import { getCollections, getProductsForBulkEdit } from '@/lib/catalog';
import { composeCare, composeShipping } from '@/lib/product-info';
import { getStoreSettings } from '@/lib/settings';

export default async function BulkEditProductsPage({ searchParams }) {
  await requireAdminPermission('product:write');
  const params = await searchParams;
  const ids = String(params?.ids || '').split(',').map((id) => id.trim()).filter(Boolean);
  const [products, collections, { productInfo }] = await Promise.all([getProductsForBulkEdit(ids), getCollections().catch(() => []), getStoreSettings()]);
  const sharedText = { care: composeCare(productInfo), shipping: composeShipping(productInfo) };
  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <Link href="/admin/products" className="admin-back-link">← Products</Link>
          <h1>Bulk edit products</h1>
          <p>{ids.length ? `Editing ${products.length} selected product${products.length === 1 ? '' : 's'}.` : `Editing all ${products.length} active products.`} Change any cell, then save everything at once.</p>
        </div>
      </div>
      <BulkProductEditor products={JSON.parse(JSON.stringify(products))} collections={collections.map((item) => ({ slug: item.slug, name: item.name }))} sharedText={sharedText} />
    </div>
  );
}
