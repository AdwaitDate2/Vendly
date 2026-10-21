import ProposalsEditor from '@/components/admin/ProposalsEditor';
import { requireAdminPermission } from '@/lib/admin-auth';
import { getProposals } from '@/lib/proposals';

export const metadata = { title: 'Proposal Stories — byShreen Admin' };

export default async function ProposalsAdminPage() {
  await requireAdminPermission('content:write');
  const proposals = await getProposals();
  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <h1>Proposal stories</h1>
          <p>The couples and commissions shown on the <a href="/proposals" target="_blank">/proposals</a> page. Add a story, upload a photo, and save to publish.</p>
        </div>
        <a href="/proposals" target="_blank" className="admin-button admin-button--ghost">View page ↗</a>
      </div>
      <ProposalsEditor initialProposals={JSON.parse(JSON.stringify(proposals))} />
    </div>
  );
}
