// @ts-nocheck
import { notFound } from 'next/navigation';
import AdminOffline from '@/components/admin/AdminOffline';
import ContentForm from '@/components/admin/ContentForm';
import { saveResourceTemplateEditorAction } from '@/lib/resource-template-actions';
import { hasPermission, requireAdminPermission } from '@/lib/admin-auth';
import { getResourceTemplateEditorData } from '@/lib/resource-templates';
import { getCollections } from '@/lib/catalog';
import { categories as staticCollections } from '@/data/products';
import { contentKeys, getContentFallback, getEditableContent } from '@/lib/content';
import { listCustomPages } from '@/lib/custom-pages';
import { isDatabaseUnavailableError } from '@/lib/mongodb';
import { getStoreSettings } from '@/lib/settings';
import { normalizeTheme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

function templatePath(resourceType, templateKey, resourceHandle) {
  const query = resourceHandle ? `?resource=${encodeURIComponent(resourceHandle)}` : '';
  return `/admin/editor/templates/${resourceType}/${templateKey}${query}`;
}

const TEMPLATE_DESTINATION_TYPES = [
  { resourceType: 'product', permission: 'product:write', group: 'Products', noun: 'product' },
  { resourceType: 'collection', permission: 'collection:write', group: 'Collections', noun: 'collection' },
  { resourceType: 'collection-list', permission: 'collection:write', group: 'Collections list', noun: 'collections page' },
  { resourceType: 'blog', permission: 'content:write', group: 'Blogs', noun: 'blog' },
  { resourceType: 'blog-post', permission: 'content:write', group: 'Blog posts', noun: 'blog post' },
  { resourceType: 'search', permission: 'content:write', group: 'Search', noun: 'search page' },
  { resourceType: 'cart', permission: 'content:write', group: 'Cart', noun: 'cart page' },
  { resourceType: '404', permission: 'content:write', group: '404', noun: '404 page' },
  { resourceType: 'password', permission: 'content:write', group: 'Password', noun: 'Password page' },
  { resourceType: 'gift-card', permission: 'content:write', group: 'Gift cards', noun: 'gift card' },
];

async function getTemplateDestinations(session) {
  const availableTypes = TEMPLATE_DESTINATION_TYPES.filter(({ permission }) => hasPermission(session, permission));
  const templateDataByType = new Map(await Promise.all(availableTypes.map(async ({ resourceType }) => {
    try {
      return [resourceType, await getResourceTemplateEditorData({ resourceType })];
    } catch {
      return [resourceType, null];
    }
  })));

  const separatelyManagedPages = ['shipping', 'returns', 'care', 'repairsWarranty', 'privacy', 'terms', 'accessibility', 'cookies', 'privacyChoices'];
  const contentPageDestinations = contentKeys
    .filter((pageKey) => !separatelyManagedPages.includes(pageKey))
    .map((pageKey) => {
      const page = getContentFallback(pageKey);
      return {
        id: pageKey,
        title: pageKey === 'home' ? 'Home page' : page.title,
        group: pageKey === 'home' ? 'Home' : 'Pages',
        subtitle: pageKey === 'home' ? 'Homepage template' : 'Page template',
        href: `/admin/editor/${pageKey}`,
        supported: true,
      };
    });
  if (hasPermission(session, 'content:write')) {
    const customPages = await listCustomPages().catch(() => []);
    contentPageDestinations.push(...customPages.map((page) => ({
      id: page.href || `custom-${page.id}`,
      title: page.title,
      group: 'Pages',
      subtitle: 'Custom page template',
      href: page.href || `/admin/editor/custom-${page.id}`,
      supported: true,
    })));
  }
  const destinations = [...contentPageDestinations];

  TEMPLATE_DESTINATION_TYPES.forEach(({ resourceType, permission, group, noun }) => {
    if (!hasPermission(session, permission)) {
      destinations.push({ id: `permission-${resourceType}`, title: group, group, subtitle: 'You do not have access to this editor', supported: false });
      return;
    }
    const data = templateDataByType.get(resourceType);
    if (!data) {
      destinations.push({ id: `unavailable-${resourceType}`, title: group, group, subtitle: 'This destination could not be loaded', supported: false });
      return;
    }

    const resource = data.resources[0];
    data.templates.forEach((template) => {
      const isCollectionsList = resourceType === 'collection-list';
      const resourceHandle = isCollectionsList ? 'index' : resource?.handle;
      const destinationHandle = ['search', 'cart', '404', 'password', 'gift-card'].includes(resourceType) ? resourceType : resourceHandle;
      const isNavigable = Boolean(destinationHandle) || resourceType === 'blog-post';
      destinations.push({
        id: `${resourceType}-${template.key}`,
        title: template.name,
        group,
        subtitle: isCollectionsList || ['search', 'cart', '404', 'password', 'gift-card'].includes(resourceType)
          ? `${noun} template`
          : resource ? `Preview: ${resource.label}` : resourceType === 'blog-post' ? 'Sample article preview' : 'No preview resource is available',
        href: isNavigable ? templatePath(resourceType, template.key, destinationHandle) : undefined,
        supported: isNavigable,
      });
    });
  });

  destinations.push(
    { id: 'checkout-settings', title: 'Checkout and customer accounts', group: 'Checkout and customer accounts', subtitle: 'Manage in Settings', href: '/admin/settings', supported: true },
    { id: 'metaobject-create', title: 'Create metaobject template', group: 'Metaobjects', subtitle: 'Metaobject templates are not supported yet', supported: false },
  );

  return destinations;
}

export default async function ResourceTemplateEditorPage({ params, searchParams }) {
  const { resourceType, templateKey } = await params;
  if (!['product', 'collection', 'collection-list', 'blog', 'blog-post', 'search', 'cart', '404', 'password', 'gift-card'].includes(resourceType)) notFound();

  const permission = resourceType === 'product' ? 'product:write' : ['blog', 'blog-post', 'search', 'cart', '404', 'password', 'gift-card'].includes(resourceType) ? 'content:write' : 'collection:write';
  let session;
  let data;
  let requestedHandle;
  let resourceHandle;
  let settings;
  let collectionOptions = [];
  try {
    session = await requireAdminPermission(permission);
    const query = await searchParams;
    requestedHandle = resourceType === 'collection-list' ? 'index' : ['search', 'cart', '404', 'password', 'gift-card'].includes(resourceType) ? resourceType : String(query?.resource || '').trim();
    data = await getResourceTemplateEditorData({ resourceType, resourceHandle: requestedHandle, templateKey });
    resourceHandle = data.resources.some((resource) => resource.handle === requestedHandle)
      ? requestedHandle
      : (data.resources[0]?.handle || '');
    if (resourceHandle !== requestedHandle) {
      data = await getResourceTemplateEditorData({ resourceType, resourceHandle, templateKey });
    }
    if (resourceType === '404') {
      const collections = await getCollections().catch(() => staticCollections);
      collectionOptions = [{ value: 'all', label: 'Products' }, ...collections.map((collection) => ({ value: collection.slug, label: collection.name }))];
    }
    settings = await getStoreSettings();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) return <AdminOffline />;
    throw error;
  }

  if (!data.templates.some((template) => template.key === templateKey)) notFound();
  const template = data.template;
  const templateDestinations = await getTemplateDestinations(session);
  const canEditShared = hasPermission(session, 'content:write');
  const [sharedGlobalContent, sharedNavigationContent] = canEditShared
    ? await Promise.all([getEditableContent('global'), getEditableContent('navigation')])
    : [null, null];
  const resourceRoutes = {
    product: `/shop/${resourceHandle}`,
    'collection-list': '/collections',
    blog: `/blogs/${resourceHandle}`,
    'blog-post': data.resources.find((resource) => resource.handle === resourceHandle)?.route || '',
    search: '/search',
    cart: '/cart',
    '404': '/404',
    password: '',
  };
  const route = ['password', 'gift-card'].includes(resourceType) || (resourceType === 'blog-post' && !resourceHandle) ? '' : resourceRoutes[resourceType] || `/collections/${resourceHandle}`;
  const previewKey = ['cart', 'gift-card'].includes(resourceType)
    ? `templates/${resourceType}/${template.key}`
    : ['blog-post', 'password'].includes(resourceType) && !resourceHandle
      ? `templates/${resourceType}/${template.key}`
      : `templates/${resourceType}/${template.key}?resource=${encodeURIComponent(resourceHandle)}${resourceType === 'search' ? '&type=product' : ''}`;
  const editorKey = `resource-template-${resourceType}-${template.key}`;
  const pageChoices = data.templates.map((choice) => ({
    key: `resource-template-${resourceType}-${choice.key}`,
    title: choice.name,
    href: templatePath(resourceType, choice.key, resourceHandle),
    group: resourceType === 'product' ? 'Product templates' : resourceType === 'collection-list' ? 'Collections list templates' : resourceType === 'blog' ? 'Blog templates' : resourceType === 'blog-post' ? 'Blog post templates' : resourceType === 'search' ? 'Search page' : resourceType === 'cart' ? 'Cart page' : resourceType === '404' ? '404 page' : resourceType === 'password' ? 'Password' : resourceType === 'gift-card' ? 'Gift cards' : 'Collection templates',
  }));

  return (
    <main className="admin-fullscreen-page">
      <ContentForm
        key={editorKey}
        content={{
          id: `${resourceType}:${template.key}`,
          key: editorKey,
          version: template.draft?.version || 0,
          title: template.name,
          intro: '',
          status: template.published ? 'published' : 'draft',
          sections: template.draft?.sections || [],
        }}
        sharedGlobalContent={sharedGlobalContent}
        sharedNavigationContent={sharedNavigationContent}
        canEditShared={canEditShared && resourceType !== 'password'}
        mode="blocks"
        action={saveResourceTemplateEditorAction}
        pageChoices={pageChoices}
        previewKey={previewKey}
        publicRoute={route}
        canEditCode={hasPermission(session, 'code:edit')}
        canManageTheme={hasPermission(session, 'settings:manage')}
        initialTheme={normalizeTheme(settings.theme)}
        collectionOptions={collectionOptions}
        fullScreen
        adminIdentity={session.id || session.email}
        exitHref={resourceType === 'product' ? '/admin/products' : resourceType === 'blog-post' ? '/admin/blogs' : ['blog', 'search', 'cart', '404', 'password', 'gift-card'].includes(resourceType) ? '/admin' : '/admin/collections'}
        resourceTemplate={{
          resourceType,
          resourceHandle,
          templateKey: template.key,
          assignedTemplateKey: data.assignedTemplateKey,
          templates: data.templates,
          resources: data.resources,
          templateDestinations,
          hasUnsavedDraft: template.hasUnsavedDraft,
          samplePreviewOnly: resourceType === 'blog-post' && !resourceHandle,
        }}
      />
    </main>
  );
}
