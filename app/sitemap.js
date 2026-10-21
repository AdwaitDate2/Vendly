import { listCustomPages } from '@/lib/custom-pages';
import { getPublicProducts, getPublicCollections } from '@/lib/public-catalog';
import { siteUrl } from '@/lib/site-url';

export default async function sitemap() {
  const baseUrl = siteUrl();
  const [products, collections, customPages] = await Promise.all([getPublicProducts(), getPublicCollections(), listCustomPages().catch(() => [])]);
  const fixedRoutes = ['/', '/our-story', '/shop', '/collections', '/bridal', '/proposals', '/custom', '/book-appointment', '/client-care', '/shipping-returns', '/repairs-care', '/faq', '/size-guide', '/craftsmanship', '/privacy', '/terms', '/cookies', '/accessibility'];
  return [
    ...fixedRoutes.map((route) => ({ url: baseUrl + route, changeFrequency: 'weekly', priority: route === '/' ? 1 : 0.6 })),
    ...collections.map((collection) => ({ url: baseUrl + '/collections/' + collection.slug, changeFrequency: 'weekly', priority: 0.7 })),
    ...products.products.map((product) => ({ url: baseUrl + '/shop/' + product.slug, changeFrequency: 'weekly', priority: 0.8 })),
    ...customPages.filter((page) => page.status === 'published').map((page) => ({ url: baseUrl + page.route, changeFrequency: 'monthly', priority: 0.5 })),
  ];
}
