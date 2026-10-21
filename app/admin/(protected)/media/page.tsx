import MediaLibrary from '@/components/admin/MediaLibrary';
import { requireAdminSession } from '@/lib/admin-auth';

export default async function AdminMediaPage() {
  await requireAdminSession();
  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <h1>Files</h1>
          <p>Manage uploaded files and site media used across products, pages, hero sections, and collections.</p>
        </div>
      </div>
      <MediaLibrary />
    </div>
  );
}
