import CheckoutForm from '@/components/checkout/CheckoutForm';
import { mockPaymentsAllowed, paymentMode, stripePublishableKey } from '@/lib/payments';
import { COUNTRY_PREFERENCE_COOKIE, shippableCountries, validatedCountryPreference } from '@/lib/regions';
import { getStoreSettings } from '@/lib/settings';
import { cookies } from 'next/headers';
import './checkout.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Checkout — byShreen',
  robots: { index: false },
};

export default async function CheckoutPage() {
  const settings = await getStoreSettings();
  const countries = shippableCountries(settings.shipping.rates);
  const savedCountry = (await cookies()).get(COUNTRY_PREFERENCE_COOKIE)?.value;
  const initialCountry = validatedCountryPreference(savedCountry, countries, settings.address.country);
  const mode = paymentMode();
  const payments = {
    mode,
    publishableKey: mode === 'stripe' ? stripePublishableKey() : '',
    testCheckout: mode === 'mock' && mockPaymentsAllowed(),
    open: mode === 'stripe' ? Boolean(stripePublishableKey()) : mockPaymentsAllowed(),
  };
  return (
    <main className="checkout-page">
      <CheckoutForm payments={payments} countries={countries} initialCountry={initialCountry} contactEmail={settings.contactEmail} />
    </main>
  );
}
