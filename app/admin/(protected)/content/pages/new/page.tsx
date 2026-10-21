import Link from 'next/link';
import { CreatePageForm } from '@/components/admin/CustomPageControls';
import { requireAdminPermission } from '@/lib/admin-auth';

export default async function NewCustomPage() {
  await requireAdminPermission('content:write');
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><Link href="/admin/content" className="admin-back-link">← Pages &amp; content</Link><h1>Add a page</h1><p>Create a new page with the block editor, such as an event, a lookbook, or a care guide.</p></div></div>
      <CreatePageForm />
    </div>
  );
}
