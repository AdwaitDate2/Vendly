import Link from 'next/link';
import { notFound } from 'next/navigation';
import EmailTemplateEditor from '@/components/admin/EmailTemplateEditor';
import { hasPermission, requireAdminSession } from '@/lib/admin-auth';
import { getEmailTemplate } from '@/lib/email-template-store';
import { emailTemplateMeta } from '@/lib/email-templates';
import { getStoreSettings } from '@/lib/settings';

export default async function EditEmailTemplatePage({ params }) {
  const session = await requireAdminSession();
  const { key } = await params;
  const meta = emailTemplateMeta(key);
  if (!meta) notFound();
  if (!hasPermission(session, 'settings:manage')) {
    return <div className="admin-page"><div className="admin-page-heading"><div><h1>{meta.label}</h1><p>Only owners can change the website’s emails.</p></div></div></div>;
  }
  const [template, settings] = await Promise.all([getEmailTemplate(key), getStoreSettings()]);
  // Only what the preview needs; no secrets.
  const previewSettings = { storeName: settings.storeName, contactEmail: settings.contactEmail, theme: settings.theme, emailDesign: settings.emailDesign, notifications: { recipients: settings.notifications.recipients } };
  return (
    <div className="admin-page admin-page--wide">
      <div className="admin-page-heading"><div><Link href="/admin/emails" className="admin-back-link">← Email templates</Link><h1>{meta.label}</h1><p>{meta.when} {meta.audience === 'team' ? `Sent to ${settings.notifications.recipients.join(', ')}.` : 'Sent to the client.'}</p></div></div>
      <EmailTemplateEditor templateKey={key} initial={JSON.parse(JSON.stringify(template))} settings={JSON.parse(JSON.stringify(previewSettings))} testRecipient={session.email} />
    </div>
  );
}
