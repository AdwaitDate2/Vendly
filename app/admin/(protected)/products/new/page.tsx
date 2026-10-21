// @ts-nocheck
import Link from 'next/link';
import ProductForm from '@/components/admin/ProductForm';
import { getCollections } from '@/lib/catalog';
import { composeCare, composeShipping } from '@/lib/product-info';
import { getStoreSettings } from '@/lib/settings';

export default async function NewProductPage() {
  let collections = [];
  try { collections = await getCollections(); } catch { /* form remains usable once DB is configured */ }
  const { productInfo } = await getStoreSettings();
  const sharedText = { care: composeCare(productInfo), shipping: composeShipping(productInfo) };
  return <div className="admin-page"><div className="admin-page-heading"><div><Link href="/admin/products" className="admin-back-link">← Products</Link><span className="admin-eyebrow">New catalog record</span><h1>Create a product</h1><p>Start with the essentials. You can enrich variants and merchandising as the piece takes shape.</p></div></div><ProductForm collections={collections} sharedText={sharedText} /></div>;
}

