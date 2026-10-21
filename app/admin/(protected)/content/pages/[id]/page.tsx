// @ts-nocheck
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ContentForm from '@/components/admin/ContentForm';
import { DeletePageButton, PageUrlField } from '@/components/admin/CustomPageControls';
import { hasPermission, requireAdminPermission } from '@/lib/admin-auth';
import { saveCustomPageAction } from '@/lib/admin-actions';
import { getCustomPageById } from '@/lib/custom-pages';

export default async function EditCustomPage({ params }) {
  const session = await requireAdminPermission('content:write');
  const { id } = await params;
  const page = await getCustomPageById(id);
  if (!page) notFound();
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><Link href="/admin/content" className="admin-back-link">← Pages &amp; content</Link><span className="admin-eyebrow">Page</span><h1>{page.title}</h1><p>Edit the blocks, save as Published, then open the page to see it live.</p></div><div className="admin-page-heading__actions"><Link href={`/admin/editor/custom-${page.id}`} className="admin-button">Open full-screen editor ↗</Link><Link href={page.route} target="_blank" className="admin-button admin-button--ghost">View page ↗</Link></div></div>
      <ContentForm
        content={{ id: page.id, version: page.version, title: page.title, intro: '', status: page.status, seoTitle: page.seoTitle, seoDescription: page.seoDescription, sections: page.sections }}
        action={saveCustomPageAction}
        mode="blocks"
        previewKey={`custom-${page.id}`}
        publicRoute={page.route}
        titleEditable
        canEditCode={hasPermission(session, 'code:edit')}
        extraSettings={<><PageUrlField slug={page.slug} /><div className="admin-import__actions"><DeletePageButton /></div></>}
      />
    </div>
  );
}
