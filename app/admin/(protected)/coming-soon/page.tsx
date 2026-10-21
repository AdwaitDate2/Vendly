import { headers } from 'next/headers';
import ComingSoonForm from '@/components/admin/ComingSoonForm';
import { hasPermission, requireAdminSession } from '@/lib/admin-auth';
import { getStoreSettings } from '@/lib/settings';
import StorefrontPasswordForm from '@/components/admin/StorefrontPasswordForm';
import { getStorefrontPasswordState, isStorefrontAttemptRateLimitConfigured, isStorefrontPasswordSigningConfigured } from '@/lib/storefront-password';

export default async function ComingSoonPage() {
  const session = await requireAdminSession();
  if (!hasPermission(session, 'settings:manage')) {
    return <div className="admin-page"><div className="admin-page-heading"><div><h1>Coming soon page</h1><p>Only owners can turn the coming soon page on or off.</p></div></div></div>;
  }
  const [settings, passwordState] = await Promise.all([
    getStoreSettings(),
    getStorefrontPasswordState(),
  ]);
  const signingConfigured = isStorefrontPasswordSigningConfigured();
  const attemptRateLimitConfigured = isStorefrontAttemptRateLimitConfigured(await headers());
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><h1>Coming soon page</h1><p>Choose the existing landing page or protect the public site with a storefront password and the published Password template.</p></div></div>
      <div style={{ display: 'grid', gap: 14 }}>
        <ComingSoonForm settings={settings} passwordConfigured={passwordState.configured === true} />
        {!passwordState.available ? <section className="admin-card">
          <h2>Storefront password</h2>
          <p className="admin-form-message" role="status">The password settings database could not be reached. Try again when it is available.</p>
        </section> : !signingConfigured ? <section className="admin-card">
          <h2>Storefront password</h2>
          <p className="admin-form-message" role="status">Storefront password signing is unavailable. Configure a server secret that is at least 32 characters before setting a password.</p>
        </section> : <StorefrontPasswordForm passwordConfigured={passwordState.configured === true} attemptRateLimitConfigured={attemptRateLimitConfigured} />}
      </div>
    </div>
  );
}
