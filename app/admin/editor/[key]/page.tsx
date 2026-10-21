// @ts-nocheck
import { notFound } from 'next/navigation';
import ContentForm from '@/components/admin/ContentForm';
import AdminOffline from '@/components/admin/AdminOffline';
import { hasPermission, requireAdminPermission, requireAdminSession } from '@/lib/admin-auth';
import { saveCustomPageAction } from '@/lib/admin-actions';
import { getCustomPageById, listCustomPages } from '@/lib/custom-pages';
import { contentKeys, getEditableContent, getContentFallback } from '@/lib/content';
import { isDatabaseUnavailableError } from '@/lib/mongodb';
import { BLOCK_PAGES } from '@/lib/page-blocks';
import { getStoreSettings } from '@/lib/settings';
import { getPublicCatalog } from '@/lib/public-catalog';
import { normalizeTheme } from '@/lib/theme';
import { getResourceTemplateEditorData } from '@/lib/resource-templates';
import { getCollections } from '@/lib/catalog';
import { listPublishedBlogPosts } from '@/lib/blog-posts';

export const dynamic = 'force-dynamic';

const SEPARATELY_MANAGED_PAGES = ['shipping', 'returns', 'care', 'repairsWarranty', 'privacy', 'terms', 'accessibility', 'cookies', 'privacyChoices'];

async function getEditorPageChoices(session) {
  const pageChoices = contentKeys.filter((pageKey) => !SEPARATELY_MANAGED_PAGES.includes(pageKey)).map((pageKey) => {
    const page = getContentFallback(pageKey);
    return { key: pageKey, title: page.title, group: 'Pages' };
  });
  pageChoices.push(...(await listCustomPages().catch(() => [])).map((customPage) => ({
    label: customPage.title,
    href: `/admin/editor/custom-${customPage.id}`,
    group: 'Pages',
  })));

  if (hasPermission(session, 'product:write')) {
    const productTemplates = await getResourceTemplateEditorData({ resourceType: 'product' }).catch(() => null);
    if (productTemplates) pageChoices.push(...productTemplates.templates.map((template) => ({
      key: `resource-template-product-${template.key}`,
      title: template.name,
      href: `/admin/editor/templates/product/${template.key}${productTemplates.resources[0]?.handle ? `?resource=${encodeURIComponent(productTemplates.resources[0].handle)}` : ''}`,
      group: 'Product templates',
    })));
  }
  if (hasPermission(session, 'collection:write')) {
    const collectionTemplates = await getResourceTemplateEditorData({ resourceType: 'collection' }).catch(() => null);
    if (collectionTemplates) pageChoices.push(...collectionTemplates.templates.map((template) => ({
      key: `resource-template-collection-${template.key}`,
      title: template.name,
      href: `/admin/editor/templates/collection/${template.key}${collectionTemplates.resources[0]?.handle ? `?resource=${encodeURIComponent(collectionTemplates.resources[0].handle)}` : ''}`,
      group: 'Collection templates',
    })));
    const collectionListTemplates = await getResourceTemplateEditorData({ resourceType: 'collection-list' }).catch(() => null);
    if (collectionListTemplates) pageChoices.push(...collectionListTemplates.templates.map((template) => ({
      key: `resource-template-collection-list-${template.key}`,
      title: template.name,
      href: `/admin/editor/templates/collection-list/${template.key}`,
      group: 'Collections list templates',
    })));
  }
  if (hasPermission(session, 'content:write')) {
    const searchTemplate = await getResourceTemplateEditorData({ resourceType: 'search' }).catch(() => null);
    if (searchTemplate) pageChoices.push(...searchTemplate.templates.map((template) => ({
      key: `resource-template-search-${template.key}`,
      title: template.name,
      href: `/admin/editor/templates/search/${template.key}`,
      group: 'Search page',
    })));
    const cartTemplate = await getResourceTemplateEditorData({ resourceType: 'cart' }).catch(() => null);
    if (cartTemplate) pageChoices.push(...cartTemplate.templates.map((template) => ({
      key: `resource-template-cart-${template.key}`,
      title: template.name,
      href: `/admin/editor/templates/cart/${template.key}`,
      group: 'Cart page',
    })));
    const notFoundTemplate = await getResourceTemplateEditorData({ resourceType: '404' }).catch(() => null);
    if (notFoundTemplate) pageChoices.push(...notFoundTemplate.templates.map((template) => ({
      key: `resource-template-404-${template.key}`,
      title: template.name,
      href: `/admin/editor/templates/404/${template.key}`,
      group: '404 page',
    })));
    const passwordTemplates = await getResourceTemplateEditorData({ resourceType: 'password' }).catch(() => null);
    if (passwordTemplates) pageChoices.push(...passwordTemplates.templates.map((template) => ({
      key: `resource-template-password-${template.key}`,
      title: template.name,
      href: `/admin/editor/templates/password/${template.key}`,
      group: 'Password',
    })));
    const blogTemplates = await getResourceTemplateEditorData({ resourceType: 'blog' }).catch(() => null);
    if (blogTemplates) pageChoices.push(...blogTemplates.templates.map((template) => ({
      key: `resource-template-blog-${template.key}`,
      title: template.name,
      href: `/admin/editor/templates/blog/${template.key}${blogTemplates.resources[0]?.handle ? `?resource=${encodeURIComponent(blogTemplates.resources[0].handle)}` : ''}`,
      group: 'Blog templates',
    })));
    const blogPostTemplates = await getResourceTemplateEditorData({ resourceType: 'blog-post' }).catch(() => null);
    if (blogPostTemplates) pageChoices.push(...blogPostTemplates.templates.map((template) => ({
      key: `resource-template-blog-post-${template.key}`,
      title: template.name,
      href: `/admin/editor/templates/blog-post/${template.key}${blogPostTemplates.resources[0]?.handle ? `?resource=${encodeURIComponent(blogPostTemplates.resources[0].handle)}` : ''}`,
      group: 'Blog posts',
    })));
  }

  return pageChoices;
}

export default async function FullscreenContentEditorPage({ params }) {
  const { key } = await params;

  if (key.startsWith('custom-')) {
    const id = key.slice('custom-'.length);
    let session;
    try {
      session = await requireAdminPermission('content:write');
      const page = await getCustomPageById(id);
      if (!page) notFound();
      const settings = await getStoreSettings();
      const pageChoices = await getEditorPageChoices(session);
      return (
        <main className="admin-fullscreen-page">
          <ContentForm
            content={{ id: page.id, key, version: page.version, title: page.title, intro: '', status: page.status, seoTitle: page.seoTitle, seoDescription: page.seoDescription, sections: page.sections || [] }}
            action={saveCustomPageAction}
            mode="blocks"
            pageChoices={pageChoices}
            previewKey={key}
            publicRoute={page.route}
            titleEditable
            canEditCode={hasPermission(session, 'code:edit')}
            canManageTheme={hasPermission(session, 'settings:manage')}
            initialTheme={normalizeTheme(settings.theme)}
            fullScreen
            adminIdentity={session.id || session.email}
            exitHref={`/admin/content/pages/${page.id}`}
          />
        </main>
      );
    } catch (error) {
      if (isDatabaseUnavailableError(error)) return <AdminOffline />;
      throw error;
    }
  }

  if (!contentKeys.includes(key) || SEPARATELY_MANAGED_PAGES.includes(key)) notFound();

  let session;
  try {
    session = await requireAdminSession();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) return <AdminOffline />;
    throw error;
  }

  const content = await getEditableContent(key);
  const settings = await getStoreSettings();
  const canEditShared = hasPermission(session, 'content:write');
  const [sharedGlobalContent, sharedNavigationContent] = canEditShared
    ? await Promise.all([getEditableContent('global'), getEditableContent('navigation')])
    : [null, null];
  const pageChoices = await getEditorPageChoices(session);
  const [collectionOptions, blogPostPickerSamples, productOptions] = await Promise.all([
    key === 'home'
      ? getCollections().then((collections) => collections.filter((collection) => collection.status === 'published').map((collection) => ({ value: collection.slug, label: collection.name }))).catch(() => [])
      : Promise.resolve([]),
    key === 'home'
      ? listPublishedBlogPosts('news').then((posts) => posts.slice(0, 4).map((post) => ({ ...post, excerpt: String(post.excerpt || '').slice(0, 170) }))).catch(() => [])
      : Promise.resolve([]),
    key === 'home'
      ? getPublicCatalog().then(({ products }) => products.map((product) => ({ value: product.slug, label: product.shortTitle || product.title }))).catch(() => [])
      : Promise.resolve([]),
  ]);

  return (
    <main className="admin-fullscreen-page">
      <ContentForm
        content={content}
        sharedGlobalContent={sharedGlobalContent}
        sharedNavigationContent={sharedNavigationContent}
        canEditShared={canEditShared}
        pageChoices={pageChoices}
        collectionOptions={collectionOptions}
        productOptions={productOptions}
        blogPostPickerSamples={blogPostPickerSamples}
        canEditCode={hasPermission(session, 'code:edit')}
        canManageTheme={hasPermission(session, 'settings:manage')}
        initialTheme={normalizeTheme(settings.theme)}
        fullScreen
        adminIdentity={session.id || session.email}
        publicRoute={BLOCK_PAGES[key]?.route || {
          global: '/', navigation: '/', clientCare: '/client-care', faq: '/faq', sizeGuide: '/size-guide',
          materialsSourcing: '/craftsmanship', bespoke: '/custom', contact: '/book-appointment', appointments: '/book-appointment',
        }[key] || '/'}
      />
    </main>
  );
}
