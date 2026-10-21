import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';

export default async function HomePage() {
  redirect((await getAdminSession()) ? '/admin/editor/home' : '/admin/login');
}
