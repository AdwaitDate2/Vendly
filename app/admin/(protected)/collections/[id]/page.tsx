import Link from 'next/link';
import { notFound } from 'next/navigation';
import CollectionForm from '@/components/admin/CollectionForm';
import { hasPermission, requireAdminSession } from '@/lib/admin-auth';
import { countProductsByCollection, getCollectionById } from '@/lib/catalog';

export default async function EditCollectionPage({ params, searchParams }) {
  const session = await requireAdminSession();
  const routeParams = await params;
  const collection = await getCollectionById(routeParams.id);
  if (!collection) notFound();
  const counts = await countProductsByCollection([collection.slug], { includeArchived: true }).catch(() => ({}));
  const query = await searchParams;
  return <div className="admin-page"><div className="admin-page-heading"><div><Link href="/admin/collections" className="admin-back-link">← Collections</Link><span className="admin-eyebrow">{collection.status} collection</span><h1>{collection.name}</h1><p>Last edited {collection.updatedAt ? new Date(collection.updatedAt).toLocaleString() : 'just now'}. {query?.error ? <span className="admin-inline-error">{query.error}</span> : null}</p></div><Link href={`/collections/${collection.slug}`} target="_blank" className="admin-button admin-button--ghost">Preview storefront ↗</Link></div><CollectionForm collection={collection} canDelete={hasPermission(session, 'records:delete')} productCount={counts[collection.slug]?.total || 0} /></div>;
}
