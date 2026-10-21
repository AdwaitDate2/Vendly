import HelpCenter from '@/components/admin/HelpCenter';
import { requireAdminSession } from '@/lib/admin-auth';
import { CHECKLIST, HELP_GROUPS, HELP_GUIDES } from '@/lib/help-guides';

export default async function HelpPage() {
  await requireAdminSession();
  const guides = HELP_GUIDES.map(({ slug, title, summary, group, who }) => ({ slug, title, summary, group, who }));
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><span className="admin-eyebrow">Help &amp; guides</span><h1>How can we help?</h1><p>A friendly guide for every part of the admin, with step-by-step instructions. Start with the checklist, or search for what you need.</p></div></div>
      <HelpCenter guides={guides} groups={HELP_GROUPS} checklist={CHECKLIST} />
    </div>
  );
}
