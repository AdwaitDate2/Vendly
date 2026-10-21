import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAdminSession, isAccountLoginConfigured, isDeveloperTokenConfigured } from '@/lib/admin-auth';
import LoginForm from './LoginForm';

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect('/admin/editor/home');
  const accountLogin = isAccountLoginConfigured();
  const developerToken = isDeveloperTokenConfigured();

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-sidebar__brand">Vendly</div>
        <span className="admin-eyebrow">Your website workspace</span>
        <h1>Welcome back.</h1>
        <p>Sign in to design and publish your website.</p>
        {accountLogin || developerToken ? (
          <LoginForm accountLogin={accountLogin} developerToken={developerToken} />
        ) : (
          <div className="admin-form-message">Login is not configured. Add a database connection and <code>ADMIN_SESSION_SECRET</code> to the server environment.</div>
        )}
        <p className="admin-login-switch">New here? <Link href="/admin/signup">Create an account</Link></p>
      </div>
    </main>
  );
}
