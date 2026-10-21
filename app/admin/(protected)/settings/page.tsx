import IntegrationsCard from '@/components/admin/IntegrationsCard';
import { NotificationSettingsForm, ProductInfoForm, ShippingRatesForm, StoreDetailsForm, TaxRatesForm } from '@/components/admin/SettingsForms';
import { klaviyoConfigured } from '@/lib/klaviyo';
import { hasPermission, requireAdminSession } from '@/lib/admin-auth';
import { emailProviderName, listOutbox } from '@/lib/email';
import { isLivePayments, mockPaymentsAllowed, paymentMode, stripePublishableKey } from '@/lib/payments';
import { getStoreSettings } from '@/lib/settings';

export default async function SettingsPage() {
  const session = await requireAdminSession();
  if (!hasPermission(session, 'settings:manage')) {
    return <div className="admin-page"><div className="admin-page-heading"><div><h1>Settings</h1><p>Only owners can change store settings.</p></div></div></div>;
  }
  const [settings, outbox] = await Promise.all([getStoreSettings(), listOutbox().catch(() => [])]);
  const payments = { mode: paymentMode(), live: isLivePayments(), webhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET), testCheckout: mockPaymentsAllowed() };
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><h1>Settings</h1><p>Store details, integrations (Stripe and Klaviyo), shipping, tax, and email notifications.</p></div></div>
      {/* Two independent columns, so short cards don't leave gaps next to tall ones. */}
      <div className="admin-settings">
        <div className="admin-settings__column">
          <StoreDetailsForm settings={settings} />
          <NotificationSettingsForm settings={settings} provider={emailProviderName()} outbox={JSON.parse(JSON.stringify(outbox))} />
        </div>
        <div className="admin-settings__column">
          <IntegrationsCard stripe={{ connected: payments.mode === 'stripe' && Boolean(stripePublishableKey()) }} klaviyo={{ connected: klaviyoConfigured() }} />
          <ShippingRatesForm settings={settings} />
          <TaxRatesForm settings={settings} />
          <ProductInfoForm settings={settings} />
        </div>
      </div>
    </div>
  );
}
