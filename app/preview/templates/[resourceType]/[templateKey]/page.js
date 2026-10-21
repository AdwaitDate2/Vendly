import { notFound } from 'next/navigation';
import LivePreview from '@/components/admin/LivePreview';
import { products as staticProducts, categories as staticCollections } from '@/data/products';
import { getCollections, getProductsForBulkEdit } from '@/lib/catalog';
import { getPublicCollections, getPublicProducts } from '@/lib/public-catalog';
import { getAdminSession } from '@/lib/admin-auth';
import { getStoreSettings } from '@/lib/settings';
import { getResourceTemplateEditorData } from '@/lib/resource-templates';
import { withOptions } from '@/lib/product-variants';
import { getSearchPageData } from '@/app/search/search-results';
import { getBlogResource } from '@/lib/blogs';
import { getBlogPostById } from '@/lib/blog-posts';
import { STORY_IMAGE } from '@/lib/asset-paths';
import { cookies } from 'next/headers';
import { COUNTRY_PREFERENCE_COOKIE, shippableCountries, validatedCountryPreference } from '@/lib/regions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Template preview', robots: { index: false, follow: false } };

export default async function ResourceTemplatePreviewPage({ params, searchParams }) {
  if (!(await getAdminSession())) notFound();
  const [{ resourceType, templateKey }, query] = await Promise.all([params, searchParams]);
  if (!['product', 'collection', 'collection-list', 'blog', 'blog-post', 'search', 'cart', '404', 'password', 'gift-card'].includes(resourceType)) notFound();
  const requestedHandle = resourceType === 'collection-list' ? 'index' : ['search', 'cart', '404', 'password', 'gift-card'].includes(resourceType) ? resourceType : String(query?.resource || '').trim();
  const [storeSettings, cookieStore, editorData] = await Promise.all([
    getStoreSettings(),
    cookies(),
    getResourceTemplateEditorData({ resourceType, resourceHandle: requestedHandle, templateKey }),
  ]);
  const countryOptions = shippableCountries(storeSettings.shipping.rates);
  const initialCountry = validatedCountryPreference(cookieStore.get(COUNTRY_PREFERENCE_COOKIE)?.value, countryOptions, storeSettings.address.country);
  const selectedHandle = editorData.resources.some((resource) => resource.handle === requestedHandle)
    ? requestedHandle
    : (editorData.resources[0]?.handle || '');
  if (!editorData.templates.some((template) => template.key === templateKey) || (!selectedHandle && resourceType !== 'blog-post')) notFound();

  const templateSections = editorData.template.draft?.sections || [];
  const sharedChromeProps = { countryOptions, initialCountry };
  if (resourceType === 'gift-card') {
    return <LivePreview
      kind="resource"
      mainClass="gift-card-template-preview"
      initial={{ title: 'Gift card', intro: '', sections: templateSections }}
      resourceType="gift-card"
      resource={{ handle: 'sample', title: 'Sample gift card', amount: 100, currency: 'INR', redemptionCode: 'SAMPLE-ONLY' }}
      {...sharedChromeProps}
    />;
  }
  if (resourceType === 'cart') {
    const catalog = await getPublicProducts();
    return <LivePreview
      kind="resource"
      mainClass="cart-template-preview"
      initial={{ title: 'Cart', intro: '', sections: templateSections }}
      resourceType="cart"
      resource={{ handle: 'cart', title: 'Cart' }}
      products={catalog.products}
      {...sharedChromeProps}
    />;
  }

  if (resourceType === 'search') {
    const searchData = await getSearchPageData(query);
    return <LivePreview
      kind="resource"
      mainClass="listing-page"
      initial={{ title: 'Search.', intro: '', sections: templateSections }}
      resourceType="search"
      resource={searchData}
      {...sharedChromeProps}
    />;
  }

  if (resourceType === '404') {
    const catalog = await getPublicProducts();
    return <LivePreview
      kind="resource"
      mainClass="not-found-template"
      initial={{ title: '404 page', intro: '', sections: templateSections }}
      resourceType="404"
      resource={{ handle: '404', title: '404 page' }}
      products={catalog.products}
      {...sharedChromeProps}
    />;
  }

  if (resourceType === 'password') {
    return <LivePreview
      kind="resource"
      mainClass="password-template-preview"
      initial={{ title: 'Password', intro: '', sections: templateSections }}
      resourceType="password"
      resource={{ handle: 'password', title: 'Password', logo: storeSettings.logo || '', logoWidth: storeSettings.logoWidth || 140 }}
      {...sharedChromeProps}
    />;
  }

  if (resourceType === 'blog') {
    const blog = getBlogResource(selectedHandle);
    if (!blog) notFound();
    return <LivePreview
      kind="resource"
      mainClass="blog-page"
      initial={{ title: blog.title, intro: '', sections: templateSections }}
      resourceType="blog"
      resource={{ ...blog, previewMode: true }}
      {...sharedChromeProps}
    />;
  }

  if (resourceType === 'blog-post') {
    const post = selectedHandle
      ? await getBlogPostById(selectedHandle)
      : {
        id: 'sample-blog-post',
        blogHandle: 'news',
        handle: 'sample-story',
        title: 'A closer look at the details',
        excerpt: 'A closer look at the quiet choices that make a piece feel personal, from its silhouette to its finish.',
        body: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Some of the most thoughtful design choices are quiet ones: a proportion that feels balanced, a finish that catches the light, or a detail that makes a piece feel personal.' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'This story takes a closer look at those small decisions and the way they shape the pieces we reach for every day.' }] },
          ],
        },
        author: 'byShreen',
        publishedAt: '2026-10-14',
        image: STORY_IMAGE,
        imageAlt: 'Sample image for the brand story',
        route: '',
      };
    if (!post) notFound();
    const blog = getBlogResource(post.blogHandle);
    if (!blog) notFound();
    return <LivePreview
      kind="resource"
      mainClass="blog-article-page"
      initial={{ title: post.title, intro: '', sections: templateSections }}
      resourceType="blog-post"
      resource={{ ...blog, article: post, previewMode: true }}
      {...sharedChromeProps}
    />;
  }

  if (resourceType === 'collection-list') {
    const collectionsList = await getPublicCollections();
    return <LivePreview
      kind="resource"
      mainClass="listing-page"
      initial={{ title: 'Collections.', intro: '', sections: templateSections }}
      resourceType="collection-list"
      resource={collectionsList}
      {...sharedChromeProps}
    />;
  }

  let products = staticProducts.map(withOptions);
  let collections = staticCollections;
  try {
    [products, collections] = await Promise.all([getProductsForBulkEdit(), getCollections()]);
  } catch {
    // Keep static catalog previews available while the admin database is offline.
  }

  if (resourceType === 'product') {
    const product = products.find((item) => item.slug === selectedHandle);
    if (!product) notFound();
    const relatedProducts = products.filter((item) => item.slug !== product.slug && item.category === product.category)
      .concat(products.filter((item) => item.slug !== product.slug && item.category !== product.category))
      .slice(0, 8);
    return <LivePreview
      kind="resource"
      mainClass="product-page"
      initial={{ title: product.title, intro: '', sections: templateSections }}
      resourceType="product"
      resource={product}
      relatedProducts={relatedProducts}
      products={products}
      productInfo={storeSettings.productInfo || {}}
      contactEmail={storeSettings.contactEmail || ''}
      {...sharedChromeProps}
    />;
  }

  const collection = collections.find((item) => item.slug === selectedHandle);
  if (!collection) notFound();
  const collectionProducts = products.filter((item) => item.category === collection.slug && item.status !== 'archived');
  return <LivePreview
    kind="resource"
    mainClass="collection-page"
    initial={{ title: collection.name, intro: collection.description || collection.note || '', sections: templateSections }}
    resourceType="collection"
    resource={collection}
    products={collectionProducts}
    {...sharedChromeProps}
  />;
}
