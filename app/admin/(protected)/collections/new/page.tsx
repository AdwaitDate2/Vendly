// @ts-nocheck
import Link from 'next/link';
import CollectionForm from '@/components/admin/CollectionForm';

export default function NewCollectionPage() {
  return <div className="admin-page"><div className="admin-page-heading"><div><Link href="/admin/collections" className="admin-back-link">← Collections</Link><span className="admin-eyebrow">Catalog organization</span><h1>New collection</h1><p>Create a draft edit, then publish it when the story and media are ready.</p></div></div><CollectionForm /></div>;
}
