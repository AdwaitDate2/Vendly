/** A full link to a page on this website, e.g. siteUrl('/shop'). */
export function siteUrl(path = '', fallbackOrigin = '') {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || fallbackOrigin;

  return `${(baseUrl || 'http://localhost:3000').replace(/\/$/, '')}${path}`;
}
