import TeamManager from '@/components/admin/TeamManager';
import { hasPermission, requireAdminSession } from '@/lib/admin-auth';
import { ROLES, listAdminUsers } from '@/lib/admin-users';

export default async function TeamPage() {
  const session = await requireAdminSession();
  if (!hasPermission(session, 'team:manage')) {
    return <div className="admin-page"><div className="admin-page-heading"><div><h1>Team</h1><p>Only owners can manage team members.</p></div></div></div>;
  }
  const users = await listAdminUsers();
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><h1>Team</h1><p>Who can sign in to this admin, and what they can do.</p></div></div>
      <TeamManager users={users} currentUserId={session.id} roles={ROLES} />
    </div>
  );
}
