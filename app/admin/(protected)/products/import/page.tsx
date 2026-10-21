import Link from 'next/link';
import ProductImport from '@/components/admin/ProductImport';
import { requireAdminPermission } from '@/lib/admin-auth';
import { getCollections } from '@/lib/catalog';

export default async function ProductImportPage() {
  await requireAdminPermission('product:write');
  const collections = await getCollections().catch(() => []);
  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <Link href="/admin/products" className="admin-back-link">← Products</Link>
          <h1>Import products</h1>
          <p>Add or update many products at once from a spreadsheet.</p>
        </div>
      </div>
      <ProductImport collections={collections.map((item) => ({ name: item.name, slug: item.slug }))} />
    </div>
  );
}
