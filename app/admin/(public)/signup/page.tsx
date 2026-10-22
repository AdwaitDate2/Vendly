import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminSession, isAccountLoginConfigured } from '@/lib/admin-auth';
import SignupForm from './SignupForm';

export default async function AdminSignupPage() {
  if (await getAdminSession()) redirect('/dashboard');

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-sidebar__brand">Vendly</div>
        <span className="admin-eyebrow">Start building</span>
        <h1>Create your workspace.</h1>
        <p>Your account gets a private website workspace and a shareable site address.</p>
        {isAccountLoginConfigured() ? (
          <SignupForm />
        ) : (
          <div className="admin-form-message">Account creation is not configured. Add a MongoDB connection and a 32-character <code>ADMIN_SESSION_SECRET</code> to the server environment.</div>
        )}
        <p className="admin-login-switch">Already have an account? <Link href="/admin/login">Sign in</Link></p>
      </div>
    </main>
  );
}
