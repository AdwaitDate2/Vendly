import './fonts.css';
import './globals.css';
import './admin/admin.css';
import { cookies, headers } from 'next/headers';
import AppShell from '@/components/AppShell';
import { getContentMetadata, getNavigation, getPageContent } from '@/lib/content';
import ComingSoon from '@/components/ComingSoon';
import StorefrontPasswordPage from '@/components/StorefrontPasswordPage';
import { getAdminSession } from '@/lib/admin-auth';
import { getComingSoonGateSettings, getStoreSettings } from '@/lib/settings';
import { getStorefrontPasswordState, hasValidStorefrontAccessCookie } from '@/lib/storefront-password';
import { siteUrl } from '@/lib/site-url';
import { isDefaultTheme, themeCssVariables } from '@/lib/theme';
import { COUNTRY_PREFERENCE_COOKIE, shippableCountries, validatedCountryPreference } from '@/lib/regions';
import { loadMediaFocalPoints } from '@/lib/page-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const pathname = (await headers()).get('x-pathname') || '/';
  if (pathname.startsWith('/preview/')) {
    return { title: 'Preview', robots: { index: false, follow: false } };
  }
  const { title, description } = await getContentMetadata('global');
  return {
    title,
    description,
    metadataBase: new URL(siteUrl()),
    openGraph: { type: 'website', siteName: 'Vendly', title, description },
  };
}

// Routes that keep working while the coming soon page is on: the admin, its previews, and API callbacks (e.g. Stripe).
const COMING_SOON_EXEMPT = /^\/(admin|api|preview)(\/|$)/;

async function comingSoonPresentation(gateSettings) {
  if (gateSettings.available && !gateSettings.page.enabled) return null;
  const pathname = (await headers()).get('x-pathname') || '/';
  if (COMING_SOON_EXEMPT.test(pathname)) return null;
  // Only an admin who chose "Preview full website" (a one-hour cookie) sees the real site; everyone else sees the landing page.
  const previewing = (await cookies()).get('byshreen_preview_site')?.value === '1';
  if (previewing && (await getAdminSession().catch(() => null))) return null;

  const passwordState = await getStorefrontPasswordState();
  if (passwordState.configured === false) return 'coming-soon';
  // Unknown state is treated as protected so a database outage cannot reveal the storefront.
  if (await hasValidStorefrontAccessCookie()) return null;
  return 'password';
}

export default async function RootLayout({ children }) {
  const pathname = (await headers()).get('x-pathname') || '/';
  if (pathname === '/' || pathname === '/admin' || pathname.startsWith('/admin/')) {
    return (
      <html lang="en" data-scroll-behavior="smooth">
        <body>{children}</body>
      </html>
    );
  }
  // Preview pages render their own storefront chrome. Avoid loading the storefront shell
  // here as well: doing so duplicates several Mongo reads before the iframe can hydrate.
  if (pathname.startsWith('/preview/')) {
    return (
      <html lang="en" data-scroll-behavior="smooth">
        <head><meta name="robots" content="noindex, nofollow" /></head>
        <body>
          <noscript><style>{'.reveal{opacity:1!important;transform:none!important;}'}</style></noscript>
          {children}
        </body>
      </html>
    );
  }

  const [{ sections: site }, navigation, settings, gateSettings] = await Promise.all([
    getPageContent('global'),
    getNavigation(),
    getStoreSettings(),
    getComingSoonGateSettings(),
  ]);
  const focalPointBySource = await loadMediaFocalPoints(site, navigation);
  const countryOptions = shippableCountries(settings.shipping.rates);
  const savedCountry = (await cookies()).get(COUNTRY_PREFERENCE_COOKIE)?.value;
  const initialCountry = validatedCountryPreference(savedCountry, countryOptions, settings.address.country);
  // Brand colors and the global color-scheme model are validated hex values, safe to inline.
  const themeCss = isDefaultTheme(settings.theme) ? '' : `:root { ${themeCssVariables(settings.theme)} }`;
  const presentation = await comingSoonPresentation(gateSettings);
  if (presentation) {
    return (
      <html lang="en" data-scroll-behavior="smooth">
        <head>
          <meta name="robots" content="noindex, nofollow" />
          {themeCss ? <style id="theme-colors">{themeCss}</style> : null}
        </head>
        <body>{presentation === 'password' ? <StorefrontPasswordPage /> : <ComingSoon page={gateSettings.page} />}</body>
      </html>
    );
  }
  return (
    <html lang="en" data-scroll-behavior="smooth">
      {themeCss ? <head><style id="theme-colors">{themeCss}</style></head> : null}
      <body>
        <noscript><style>{'.reveal{opacity:1!important;transform:none!important;}'}</style></noscript>
        <AppShell site={site} navigation={navigation} focalPointBySource={focalPointBySource} countryOptions={countryOptions} initialCountry={initialCountry}>{children}</AppShell>
      </body>
    </html>
  );
}
