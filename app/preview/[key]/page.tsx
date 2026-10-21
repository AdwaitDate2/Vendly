// @ts-nocheck
import { notFound } from 'next/navigation';
import LivePreview from '@/components/admin/LivePreview';
import PreviewStatusSignal from '@/components/admin/PreviewStatusSignal';
import { getAdminSession } from '@/lib/admin-auth';
import { contentKeys, getEditableContent, isBlockPage } from '@/lib/content';
import { BLOCK_PAGES } from '@/lib/page-blocks';
import { loadBlockBlogPosts, loadBlockCollections, loadBlockInstagram, loadBlockProducts, loadBlockProposals, loadBlockTestimonials } from '@/lib/page-data';
import { getCustomPageById } from '@/lib/custom-pages';
import { cookies } from 'next/headers';
import { COUNTRY_PREFERENCE_COOKIE, shippableCountries, validatedCountryPreference } from '@/lib/regions';
import { getStoreSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Preview', robots: { index: false, follow: false } };

export default async function PreviewPage({ params }) {
  const { key } = await params;
  if (!(await getAdminSession())) return <PreviewStatusSignal status="auth-required" />;

  if (key.startsWith('custom-')) {
    const [[settings, cookieStore], page, blockData] = await Promise.all([
      Promise.all([getStoreSettings(), cookies()]),
      getCustomPageById(key.slice('custom-'.length)),
      Promise.all([
        loadBlockProducts([{ type: 'featuredProducts' }, { type: 'featuredProduct' }]),
        loadBlockCollections([]),
        loadBlockInstagram([{ type: 'instagram' }]),
        loadBlockProposals([{ type: 'proposalsGallery' }]),
        loadBlockTestimonials([{ type: 'testimonials' }]),
      ]),
    ]);
    if (!page) notFound();
    const [products, collections, instagram, proposals, testimonials] = blockData;
    const initial = { title: page.title, intro: '', sections: page.sections };
    const countryOptions = shippableCountries(settings.shipping.rates);
    const initialCountry = validatedCountryPreference(cookieStore.get(COUNTRY_PREFERENCE_COOKIE)?.value, countryOptions, settings.address.country);
    return <LivePreview kind="blocks" mainClass="about-page" initial={initial} products={products} collections={collections} instagram={instagram} proposals={proposals} testimonials={testimonials} countryOptions={countryOptions} initialCountry={initialCountry} />;
  }
  if (!contentKeys.includes(key) || key === 'contact') notFound();

  const kind = isBlockPage(key) ? 'blocks' : key === 'faq' ? 'faq' : key === 'global' || key === 'navigation' ? key : 'content';
  const [settings, cookieStore, content, blockData] = await Promise.all([
    getStoreSettings(),
    cookies(),
    getEditableContent(key),
    // These lookups use the known page family and do not depend on the saved section list.
    kind === 'blocks'
      ? Promise.all([
        loadBlockProducts([{ type: 'featuredProducts' }, { type: 'featuredProduct' }]),
        loadBlockCollections(key === 'home' ? [{ type: 'collectionListSection' }] : []),
        loadBlockInstagram([{ type: 'instagram' }]),
        loadBlockProposals([{ type: 'proposalsGallery' }]),
        loadBlockTestimonials([{ type: 'testimonials' }]),
        loadBlockBlogPosts(key === 'home' ? [{ type: 'blogPosts' }] : []),
      ])
      : Promise.resolve([[], [], null, null, null, null]),
  ]);
  const countryOptions = shippableCountries(settings.shipping.rates);
  const initialCountry = validatedCountryPreference(cookieStore.get(COUNTRY_PREFERENCE_COOKIE)?.value, countryOptions, settings.address.country);
  // Always load products so a newly added "Featured products" block previews immediately.
  const [products, collections, instagram, proposals, testimonials, blogPosts] = blockData;
  const initial = { title: content.title, intro: content.intro, sections: content.sections || [] };

  return <LivePreview kind={kind} mainClass={BLOCK_PAGES[key]?.mainClass || ''} initial={initial} products={products} collections={collections} instagram={instagram} proposals={proposals} testimonials={testimonials} blogPosts={blogPosts} countryOptions={countryOptions} initialCountry={initialCountry} />;
}
