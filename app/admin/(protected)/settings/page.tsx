import IntegrationsCard from '@/components/admin/IntegrationsCard';
import { NotificationSettingsForm, ProductInfoForm, ShippingRatesForm, StoreDetailsForm, TaxRatesForm } from '@/components/admin/SettingsForms';
import { klaviyoConfigured } from '@/lib/klaviyo';
import { hasPermission, requireAdminSession } from '@/lib/admin-auth';
import { emailProviderName, listOutbox } from '@/lib/email';
import { isLivePayments, mockPaymentsAllowed, paymentMode, stripePublishableKey } from '@/lib/payments';
import { getStoreSettings } from '@/lib/settings';

function SettingsSection({ title, description, children, defaultOpen = false }) {
  return (
    <details className="admin-settings__section" {...(defaultOpen ? { open: true } : {})}>
      <summary className="admin-settings__summary">
        <span className="admin-settings__summary-copy">
          <span className="admin-settings__summary-title" role="heading" aria-level={2}>{title}</span>
          <span className="admin-settings__summary-description">{description}</span>
        </span>
        <svg className="admin-settings__chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </summary>
      <div className="admin-settings__section-content">{children}</div>
    </details>
  );
}

export default async function SettingsPage() {
  const session = await requireAdminSession();
  if (!hasPermission(session, 'settings:manage')) {
    return <div className="admin-page"><div className="admin-page-heading"><div><h1>Settings</h1><p>Only owners can change store settings.</p></div></div></div>;
  }
  const [settings, outbox] = await Promise.all([getStoreSettings(), listOutbox().catch(() => [])]);
  const payments = { mode: paymentMode(), live: isLivePayments(), webhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET), testCheckout: mockPaymentsAllowed() };
  return (
    <div className="admin-page admin-settings-page">
      <div className="admin-page-heading"><div><h1>Settings</h1><p>Manage store details, checkout, and customer emails.</p></div></div>
      <div className="admin-settings__sections">
        <SettingsSection title="Store details" description="Business name and contact information used on receipts." defaultOpen>
          <StoreDetailsForm settings={settings} />
        </SettingsSection>

        <SettingsSection title="Checkout" description="Payment connections, shipping rates, and sales tax.">
          <div className="admin-settings__checkout">
            <IntegrationsCard stripe={{ connected: payments.mode === 'stripe' && Boolean(stripePublishableKey()) }} klaviyo={{ connected: klaviyoConfigured() }} />
            <ShippingRatesForm settings={settings} />
            <TaxRatesForm settings={settings} />
          </div>
        </SettingsSection>

        <SettingsSection title="Notifications" description="Choose who receives appointment and order emails.">
          <NotificationSettingsForm settings={settings} provider={emailProviderName()} outbox={JSON.parse(JSON.stringify(outbox))} />
        </SettingsSection>

        <SettingsSection title="Product page text" description="Shared details, care, and shipping copy for your products.">
          <ProductInfoForm settings={settings} />
        </SettingsSection>
      </div>
    </div>
  );
}
