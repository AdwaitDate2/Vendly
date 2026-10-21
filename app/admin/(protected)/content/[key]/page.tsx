// @ts-nocheck
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ContentForm from '@/components/admin/ContentForm';
import { hasPermission, requireAdminSession } from '@/lib/admin-auth';
import { contentKeys, getEditableContent } from '@/lib/content';

// Policy pages moved to Admin → Policies.
const MOVED_TO_POLICIES = { shipping: 'shippingReturns', returns: 'shippingReturns', care: 'repairsCare', repairsWarranty: 'repairsCare', privacy: 'privacy', terms: 'terms', accessibility: 'accessibility', cookies: 'cookies', privacyChoices: 'privacyChoices' };

export default async function ContentDetailPage({ params }) {
  const session = await requireAdminSession();
  const { key } = await params;
  if (MOVED_TO_POLICIES[key]) redirect(`/admin/policies/${MOVED_TO_POLICIES[key]}`);
  if (!contentKeys.includes(key)) notFound();
  const content = await getEditableContent(key);
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><Link href="/admin/content" className="admin-back-link">← Content</Link><span className="admin-eyebrow">Page editor</span><h1>{content.title}</h1><p>Edit the text, save as Published, then open the page to see your changes.</p></div><div className="admin-page-heading__actions"><Link href={`/admin/editor/${key}`} className="admin-button">Open full-screen editor ↗</Link><Link href={publicRouteFor(key)} target="_blank" className="admin-button admin-button--ghost">View page ↗</Link></div></div>
      {content.source === 'fallback' ? <div className="admin-alert"><strong>MongoDB is not available.</strong><span>You are viewing the safe fallback. Configure the database before saving changes.</span></div> : null}
      <ContentForm content={content} canEditCode={hasPermission(session, 'code:edit')} />
    </div>
  );
}


function publicRouteFor(key) {
  const routes = { home: '/', bridal: '/bridal', shop: '/shop', about: '/our-story', global: '/', clientCare: '/client-care', faq: '/faq', sizeGuide: '/size-guide', materialsSourcing: '/craftsmanship', privacy: '/privacy', terms: '/terms', accessibility: '/accessibility', cookies: '/cookies', privacyChoices: '/privacy-choices', bespoke: '/custom', contact: '/book-appointment', appointments: '/book-appointment' };
  return routes[key] || '/';
}
