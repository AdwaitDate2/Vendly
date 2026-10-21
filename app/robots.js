import { getStoreSettings } from '@/lib/settings';
import { siteUrl } from '@/lib/site-url';

export default async function robots() {
  // While the coming soon page is on, keep search engines out.
  if ((await getStoreSettings()).comingSoon.enabled) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/_next'] }],
    sitemap: siteUrl('/sitemap.xml'),
  };
}
