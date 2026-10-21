import { notFound } from 'next/navigation';
import BlockRenderer from '@/components/blocks/BlockRenderer';
import AccessibilityPage from '@/app/accessibility/page';
import AppointmentPage from '@/app/book-appointment/page';
import BridalPage from '@/app/bridal/page';
import CartPage from '@/app/cart/page';
import CheckoutPage from '@/app/checkout/page';
import ClientCarePage from '@/app/client-care/page';
import CollectionPage from '@/app/collections/[slug]/page';
import CollectionsPage from '@/app/collections/page';
import CookiesPage from '@/app/cookies/page';
import CraftsmanshipPage from '@/app/craftsmanship/page';
import CustomJewelryPage from '@/app/custom/page';
import CustomContentPage from '@/app/pages/[slug]/page';
import FaqPage from '@/app/faq/page';
import BlogArticlePage from '@/app/blogs/[blogHandle]/[articleHandle]/page';
import BlogPage from '@/app/blogs/[blogHandle]/page';
import OurStoryPage from '@/app/our-story/page';
import PolicyPage from '@/app/privacy/page';
import PrivacyChoicesPage from '@/app/privacy-choices/page';
import ProposalsPage from '@/app/proposals/page';
import RepairsPage from '@/app/repairs-care/page';
import SearchPage from '@/app/search/page';
import ShippingPage from '@/app/shipping-returns/page';
import ShopPage from '@/app/shop/page';
import ProductPage from '@/app/shop/[slug]/page';
import SizeGuidePage from '@/app/size-guide/page';
import TermsPage from '@/app/terms/page';
import CheckoutCompletePage from '@/app/checkout/complete/page';
import { getContentMetadata, getContentRoute, contentKeys } from '@/lib/content';
import { getPublishedCustomPage } from '@/lib/custom-pages';
import { getTenantIdBySiteSlug } from '@/lib/mongodb';
import { getPublicProduct } from '@/lib/public-catalog';
import { loadBlockBlogPosts, loadBlockCollections, loadBlockInstagram, loadBlockProducts, loadBlockProposals, loadBlockTestimonials, loadMediaFocalPoints } from '@/lib/page-data';

const STATIC_PAGES = {
  accessibility: AccessibilityPage,
  'book-appointment': AppointmentPage,
  bridal: BridalPage,
  cart: CartPage,
  checkout: CheckoutPage,
  'client-care': ClientCarePage,
  cookies: CookiesPage,
  craftsmanship: CraftsmanshipPage,
  custom: CustomJewelryPage,
  faq: FaqPage,
  'our-story': OurStoryPage,
  privacy: PolicyPage,
  'privacy-choices': PrivacyChoicesPage,
  proposals: ProposalsPage,
  'repairs-care': RepairsPage,
  search: SearchPage,
  'shipping-returns': ShippingPage,
  shop: ShopPage,
  'size-guide': SizeGuidePage,
  terms: TermsPage,
  'checkout/complete': CheckoutCompletePage,
};

export async function generateMetadata({ params }) {
  const { segments = [] } = await params;
  const path = `/${segments.join('/')}`;
  if (!segments.length) return getContentMetadata('home');
  if (segments[0] === 'pages' && segments[1]) {
    const page = await getPublishedCustomPage(segments[1]);
    return page ? { title: page.seoTitle || page.title, description: page.seoDescription || undefined } : {};
  }
  if (segments[0] === 'shop' && segments[1]) {
    const result = await getPublicProduct(segments[1]);
    return result ? { title: result.product.seoTitle || result.product.title, description: result.product.seoDescription || undefined } : {};
  }
  const key = contentKeys.find((candidate) => getContentRoute(candidate) === path);
  return key ? getContentMetadata(key) : {};
}

async function HomePageContent() {
  const { getPageBlocks } = await import('@/lib/content');
  const blocks = await getPageBlocks('home');
  const [products, collections, instagram, proposals, testimonials, blogPosts] = await Promise.all([
    loadBlockProducts(blocks),
    loadBlockCollections(blocks),
    loadBlockInstagram(blocks),
    loadBlockProposals(blocks),
    loadBlockTestimonials(blocks),
    loadBlockBlogPosts(blocks),
  ]);
  const focalPointBySource = await loadMediaFocalPoints(blocks, products, collections, instagram, proposals, testimonials, blogPosts);
  return <main><BlockRenderer blocks={blocks} products={products} collections={collections} instagram={instagram} proposals={proposals} testimonials={testimonials} blogPosts={blogPosts} focalPointBySource={focalPointBySource} /></main>;
}

export default async function StorefrontSitePage({ params, searchParams }) {
  const [{ siteSlug, segments = [] }, query = {}] = await Promise.all([params, searchParams || Promise.resolve({})]);
  if (!(await getTenantIdBySiteSlug(siteSlug))) notFound();
  if (!segments.length) return <HomePageContent />;

  if (segments[0] === 'pages' && segments[1] && segments.length === 2) {
    return CustomContentPage({ params: Promise.resolve({ slug: segments[1] }) });
  }
  if (segments[0] === 'shop' && segments[1] && segments.length === 2) {
    return ProductPage({ params: Promise.resolve({ slug: segments[1] }), searchParams: Promise.resolve(query) });
  }
  if (segments[0] === 'collections' && segments[1] && segments.length === 2) {
    return CollectionPage({ params: Promise.resolve({ slug: segments[1] }) });
  }
  if (segments[0] === 'collections' && segments.length === 1) return CollectionsPage();
  if (segments[0] === 'blogs' && segments[1] && segments[2] && segments.length === 3) {
    return BlogArticlePage({ params: Promise.resolve({ blogHandle: segments[1], articleHandle: segments[2] }) });
  }
  if (segments[0] === 'blogs' && segments[1] && segments.length === 2) {
    return BlogPage({ params: Promise.resolve({ blogHandle: segments[1] }) });
  }
  if (segments[0] === 'shop' && segments.length === 1) return ShopPage({ searchParams: Promise.resolve(query) });
  if (segments[0] === 'search' && segments.length === 1) return SearchPage({ searchParams: Promise.resolve(query) });
  if (segments[0] === 'checkout' && segments[1] === 'complete' && segments.length === 2) {
    return CheckoutCompletePage({ searchParams: Promise.resolve(query) });
  }

  const staticPage = STATIC_PAGES[segments.join('/')];
  if (staticPage && segments.length === 1) return staticPage();

  const contentKey = contentKeys.find((key) => getContentRoute(key) === `/${segments.join('/')}`);
  if (contentKey) {
    const { getPublicContent } = await import('@/lib/content');
    const ContentPage = (await import('@/components/ContentPage')).default;
    const content = await getPublicContent(contentKey);
    return <ContentPage content={content} eyebrow={content.title}></ContentPage>;
  }

  notFound();
}
