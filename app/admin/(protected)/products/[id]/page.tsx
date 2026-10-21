import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import { hasPermission, requireAdminSession } from '@/lib/admin-auth';
import { getCollections, getProductById } from '@/lib/catalog';
import { composeCare, composeShipping } from '@/lib/product-info';
import { productPath } from '@/lib/routes';
import { getStoreSettings } from '@/lib/settings';

export default async function EditProductPage({ params, searchParams }) {
  const session = await requireAdminSession();
  const routeParams = await params;
  const product = await getProductById(routeParams.id);
  if (!product) notFound();
  const collections = await getCollections();
  const query = await searchParams;
  const { productInfo } = await getStoreSettings();
  const sharedText = { care: composeCare(productInfo), shipping: composeShipping(productInfo) };
  return <div className="admin-page"><div className="admin-page-heading"><div><Link href="/admin/products" className="admin-back-link">← Products</Link><span className="admin-eyebrow">{product.status} product</span><h1>{product.shortTitle || product.title}</h1><p>Last edited {product.updatedAt ? new Date(product.updatedAt).toLocaleString() : 'just now'}. {query?.error ? <span className="admin-inline-error">{query.error}</span> : null}</p></div>{product.status === 'published' ? <Link href={productPath(product.slug)} target="_blank" className="admin-button admin-button--ghost">View on website ↗</Link> : <span className="admin-field-help">Not on the website until it&rsquo;s published.</span>}</div><ProductForm sharedText={sharedText} product={product} collections={collections} canDelete={hasPermission(session, 'records:delete')} /></div>;
}

