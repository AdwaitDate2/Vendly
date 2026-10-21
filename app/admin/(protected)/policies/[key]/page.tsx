import Link from 'next/link';
import { notFound } from 'next/navigation';
import PolicyEditor from '@/components/admin/PolicyEditor';
import { requireAdminPermission } from '@/lib/admin-auth';
import { getPolicy, listPolicyRevisions, policyMeta } from '@/lib/policies';

export default async function EditPolicyPage({ params }) {
  await requireAdminPermission('content:write');
  const { key } = await params;
  const meta = policyMeta(key);
  if (!meta) notFound();
  const [policy, revisions] = await Promise.all([getPolicy(key), listPolicyRevisions(key).catch(() => [])]);
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><Link href="/admin/policies" className="admin-back-link">← Policies</Link><h1>{policy.title}</h1><p>{meta.summary}</p></div></div>
      <PolicyEditor key={`${key}-${policy.version}`} policy={JSON.parse(JSON.stringify(policy))} meta={meta} revisions={JSON.parse(JSON.stringify(revisions))} />
    </div>
  );
}
