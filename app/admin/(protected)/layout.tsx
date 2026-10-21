// @ts-nocheck
import AdminShell from '@/components/admin/AdminShell';
import AdminOffline from '@/components/admin/AdminOffline';
import { requireAdminSession } from '@/lib/admin-auth';
import { isDatabaseUnavailableError } from '@/lib/mongodb';
import '../commerce.css';

export default async function ProtectedAdminLayout({ children }) {
  let session;
  try {
    session = await requireAdminSession();
  } catch (error) {
    // Sign-in checks read the database; show a calm retry screen instead of crashing when it is unreachable.
    if (isDatabaseUnavailableError(error)) return <AdminOffline />;
    throw error;
  }
  return <AdminShell session={session}>{children}</AdminShell>;
}
