import { z } from 'zod';
import { categories as staticCategories, products as staticProducts } from '../data/products.js';
import { createFeaturedCollectionBlocks, normalizeFeaturedCollectionSection, PRODUCT_INFORMATION_CHILD_TYPES, PRODUCT_INFORMATION_DEFAULT_BLOCKS, SEARCH_HEADER_CHILD_TYPES, SEARCH_HEADER_DEFAULT_BLOCKS, SEARCH_RESULTS_CHILD_TYPES, SEARCH_RESULTS_DEFAULT_BLOCKS } from './blocks';
import { contentSectionSchema } from './content';
import { getDb } from './mongodb';
import { listBlogResources } from './blogs';
import { listBlogPosts } from './blog-posts';

const TEMPLATE_COLLECTION = 'resourceTemplates';
const ASSIGNMENT_COLLECTION = 'resourceTemplateAssignments';
const RESOURCE_TYPES = ['product', 'collection', 'collection-list', 'blog', 'blog-post', 'search', 'cart', '404', 'password', 'gift-card'];
const SINGLETON_TEMPLATE_TYPES = ['search', 'cart', '404', 'password', 'gift-card'];
let indexSetupPromise;

const DEFAULT_PRODUCT_SECTIONS = [
  { id: 'product-information', type: 'productInformation', label: 'Product information', enabled: true, cards: PRODUCT_INFORMATION_DEFAULT_BLOCKS },
  {
    id: 'product-story',
    type: 'productStory',
    label: 'Product story',
    enabled: true,
    eyebrow: 'The byShreen standard',
    heading: 'Design with intention.\nSource with care.\nFinish without compromise.',
  },
  {
    id: 'related-products',
    type: 'relatedProducts',
    label: 'Related products',
    enabled: true,
    eyebrow: 'Consider next',
    heading: 'You may also like.',
    count: 3,
  },
];

const DEFAULT_COLLECTION_SECTIONS = [
  { id: 'collection-hero', type: 'collectionHero', label: 'Collection banner', enabled: true },
  { id: 'collection-products', type: 'collectionProductGrid', label: 'Collection products', enabled: true },
  {
    id: 'collection-bespoke-band',
    type: 'collectionBespokeBand',
    label: 'Bespoke reassurance',
    enabled: true,
    eyebrow: 'Bespoke Fine Jewelry',
    heading: 'Looking for a personalized touch or specific gold purity?',
    body: 'Every byShreen design can be commissioned in your preferred choice of 14kt or 18kt yellow, white, or rose gold, or customized with specific diamond dimensions and hand-engravings.',
    linkLabel: 'CUSTOM INQUIRY →',
    linkHref: '/custom',
    secondaryLinkLabel: 'BOOK A PRIVATE CONSULTATION →',
    secondaryLinkHref: '/book-appointment',
  },
];

const DEFAULT_COLLECTION_LIST_SECTIONS = [
  {
    id: 'collections-index-hero',
    type: 'listingHeader',
    label: 'Collections introduction',
    enabled: true,
    eyebrow: 'Fine Natural Diamonds · 14kt & 18kt Solid Gold',
    heading: 'Collections.',
    body: 'Pieces designed to live with you—quiet enough for every day, distinct enough to feel entirely your own. Handcrafted in 14kt & 18kt solid gold with natural diamonds.',
  },
  { id: 'collections-index-grid', type: 'collectionListGrid', label: 'Collections', enabled: true },
  {
    id: 'collections-index-testimonials',
    type: 'testimonials',
    label: 'Client stories',
    enabled: true,
    layout: 'collection',
    eyebrow: 'From our clients',
    heading: 'Jewelry with a story.',
    body: 'A few words from the people who wear byShreen.',
  },
];

const DEFAULT_BLOG_SECTIONS = [
  {
    id: 'blog-posts',
    type: 'blogPosts',
    label: 'Blog posts',
    enabled: true,
    settings: { colorScheme: 'scheme1', paddingTop: 0, paddingBottom: 48, customCss: '' },
    blocks: [
      { id: 'blog-title', type: 'blogTitle', label: 'Title', enabled: true, heading: '' },
      {
        id: 'blog-post',
        type: 'blogPost',
        label: 'Blog post',
        enabled: true,
        static: true,
        blocks: [
          { id: 'blog-post-title', type: 'blogPostTitle', label: 'Title', enabled: true, static: true },
          { id: 'blog-post-details', type: 'blogPostDetails', label: 'Details', enabled: true, static: true },
          { id: 'blog-post-description', type: 'blogPostDescription', label: 'Description', enabled: true, static: true },
          { id: 'blog-post-image', type: 'blogPostImage', label: 'Image', enabled: true, static: true },
        ],
      },
    ],
  },
];

const DEFAULT_BLOG_POST_SECTIONS = [
  {
    id: 'blog-article',
    type: 'blogArticle',
    label: 'Blog post',
    enabled: true,
    blocks: [
      { id: 'blog-article-image', type: 'blogArticleImage', label: 'Featured image', enabled: true },
      { id: 'blog-article-details', type: 'blogArticleDetails', label: 'Details', enabled: true },
      { id: 'blog-article-title', type: 'blogArticleTitle', label: 'Title', enabled: true },
      { id: 'blog-article-excerpt', type: 'blogArticleExcerpt', label: 'Excerpt', enabled: true },
      { id: 'blog-article-body', type: 'blogArticleBody', label: 'Content', enabled: true },
    ],
  },
];

const DEFAULT_SEARCH_SECTIONS = [
  {
    id: 'search-header',
    type: 'searchHeader',
    label: 'Search',
    enabled: true,
    eyebrow: 'Find your piece',
    heading: 'Search.',
    body: 'Search the collection',
    note: 'Try rings, gold, diamonds…',
    linkLabel: 'Search',
    layout: 'center',
    cards: SEARCH_HEADER_DEFAULT_BLOCKS,
  },
  {
    id: 'search-results',
    type: 'searchResults',
    label: 'Search results',
    enabled: true,
    heading: 'Nothing found yet.',
    body: 'Try a broader search or contact the atelier for a personal recommendation.',
    linkLabel: 'Ask the atelier',
    linkHref: '/book-appointment',
    note: 'Search by piece, collection, metal, or stone.',
    eyebrow: 'You may also like.',
    cards: SEARCH_RESULTS_DEFAULT_BLOCKS,
  },
];

const DEFAULT_CART_SECTIONS = [
  {
    id: 'cart-items',
    type: 'cartItems',
    label: 'Cart items',
    enabled: true,
    heading: 'Your bag.',
    linkLabel: 'Continue shopping',
    linkHref: '/shop',
  },
  {
    id: 'cart-summary',
    type: 'cartSummary',
    label: 'Order summary',
    enabled: true,
    heading: 'Order summary',
    body: 'Taxes and shipping are calculated at checkout.',
    linkLabel: 'Checkout',
    linkHref: '/checkout',
  },
  {
    id: 'cart-recommendations',
    type: 'cartRecommendations',
    label: 'You may also like',
    enabled: true,
    eyebrow: 'Consider next',
    heading: 'A little more to love.',
    count: 3,
  },
];

const DEFAULT_NOT_FOUND_SECTIONS = [
  {
    id: 'not-found',
    type: 'notFound',
    label: '404',
    enabled: true,
    settings: { width: 'standard', height: 'small', alignment: 'center', position: 'center', gap: 20, colorScheme: 'ivory', paddingTop: 100, paddingBottom: 100 },
    blocks: [
      { id: 'not-found-heading', type: 'heading', label: 'Page not found', enabled: true, heading: 'Page not found' },
      { id: 'not-found-copy', type: 'text', label: 'Explanatory text', enabled: true, body: 'The link may be incorrect, or the page has been removed.' },
      { id: 'not-found-button', type: 'button', label: 'Continue shopping', enabled: true, linkLabel: 'Continue shopping', linkHref: '/shop' },
    ],
  },
  {
    id: 'not-found-featured-collection',
    type: 'featuredCollection',
    label: 'Featured collection',
    enabled: true,
    settings: { collectionHandle: 'all', layout: 'grid', mobileCarousel: false, productCount: 4, columns: 4, mobileColumns: 2, horizontalGap: 12, verticalGap: 12, heading: 'You may also like', width: 'standard', alignment: 'left', gap: 28, colorScheme: 'paper', paddingTop: 48, paddingBottom: 64, customCss: '', blockSchemaVersion: 1 },
    blocks: createFeaturedCollectionBlocks(),
  },
];

const DEFAULT_PASSWORD_SECTIONS = [
  {
    id: 'password-main',
    type: 'passwordSection',
    label: 'Password',
    enabled: true,
    settings: {
      direction: 'vertical',
      alignment: 'center',
      position: 'center',
      gap: 12,
      width: 'page',
      colorScheme: 'scheme1',
      backgroundMedia: 'none',
      borderStyle: 'none',
      cornerRadius: 0,
      paddingTop: 0,
      paddingRight: 24,
      paddingBottom: 0,
      paddingLeft: 24,
      customCss: '',
    },
    blocks: [
      { id: 'password-logo', type: 'passwordLogo', label: 'Logo', enabled: true, image: '', imageAlt: '' },
      { id: 'password-heading', type: 'passwordText', label: 'Text', enabled: true, body: 'lucki loading <3', settings: { style: 'heading' } },
      { id: 'password-message', type: 'passwordText', label: 'Text', enabled: true, body: 'we will be back tomorrow!!!', settings: { style: 'body' } },
      { id: 'password-email-signup', type: 'emailSignup', label: 'Email signup', enabled: true, layout: 'centered', tone: 'ivory', heading: 'Subscribe to our emails', body: 'Be the first to know about new collections and special offers.', linkLabel: 'Sign up' },
    ],
  },
  { id: 'password-footer', type: 'passwordFooter', label: 'Password footer', enabled: true, static: true },
];

export const RESOURCE_TEMPLATE_DEFAULTS = {
  product: { key: 'default', name: 'Default product', sections: DEFAULT_PRODUCT_SECTIONS },
  collection: { key: 'default', name: 'Default collection', sections: DEFAULT_COLLECTION_SECTIONS },
  'collection-list': { key: 'default', name: 'Default collections list', sections: DEFAULT_COLLECTION_LIST_SECTIONS },
  blog: { key: 'default', name: 'Default blog', sections: DEFAULT_BLOG_SECTIONS },
  'blog-post': { key: 'default', name: 'Default blog post', sections: DEFAULT_BLOG_POST_SECTIONS },
  search: { key: 'default', name: 'Default search', sections: DEFAULT_SEARCH_SECTIONS },
  cart: { key: 'default', name: 'Default cart', sections: DEFAULT_CART_SECTIONS },
  '404': { key: 'default', name: '404 page', sections: DEFAULT_NOT_FOUND_SECTIONS },
  password: { key: 'default', name: 'Password', sections: DEFAULT_PASSWORD_SECTIONS },
  'gift-card': { key: 'default', name: 'Gift card', sections: [] },
};

export const resourceTemplateInputSchema = z.object({
  resourceType: z.enum(RESOURCE_TYPES),
  resourceHandle: z.string().trim().min(1).max(180).optional(),
  templateKey: z.string().trim().min(1).max(80),
  sections: z.array(contentSectionSchema).max(60),
  expectedVersion: z.coerce.number().int().nonnegative().optional(),
});

export const createResourceTemplateInputSchema = z.object({
  resourceType: z.enum(RESOURCE_TYPES),
  resourceHandle: z.string().trim().min(1).max(180).optional(),
  templateKey: z.string().trim().max(120).optional(),
  name: z.string().trim().min(1).max(25, 'Template names must be 25 characters or fewer.'),
  sourceTemplateKey: z.string().trim().min(1).max(80).default('default'),
  sections: z.array(contentSectionSchema).max(60).optional(),
});

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function clone(value) {
  return structuredClone(value);
}

function defaultTemplate(resourceType) {
  return clone(RESOURCE_TEMPLATE_DEFAULTS[resourceType]);
}

async function ensureResourceTemplateIndexes(db) {
  if (!indexSetupPromise) {
    indexSetupPromise = Promise.all([
      db.collection(TEMPLATE_COLLECTION).createIndex({ resourceType: 1, key: 1 }, { unique: true, name: 'resource_template_type_key_unique' }),
      db.collection(ASSIGNMENT_COLLECTION).createIndex({ resourceType: 1, resourceHandle: 1 }, { unique: true, name: 'resource_template_assignment_unique' }),
    ]).catch((error) => {
      indexSetupPromise = null;
      throw error;
    });
  }
  return indexSetupPromise;
}

function validateSections(sections) {
  const normalizedSections = (sections || []).map(normalizeFeaturedCollectionSection);
  const parsed = z.array(contentSectionSchema).max(60).parse(normalizedSections);
  if (parsed.some((section) => !section.type)) {
    throw new Error('Every resource template section needs a block type.');
  }
  if (new Set(parsed.map((section) => section.id)).size !== parsed.length) {
    throw new Error('Resource template section IDs must be unique.');
  }
  for (const section of parsed) {
    const supportedChildTypes = section.type === 'productInformation'
      ? PRODUCT_INFORMATION_CHILD_TYPES
      : section.type === 'searchHeader'
        ? SEARCH_HEADER_CHILD_TYPES
        : section.type === 'searchResults'
          ? SEARCH_RESULTS_CHILD_TYPES
            : section.type === 'blogArticle'
              ? BLOG_ARTICLE_CHILD_TYPES
              : section.type === 'passwordSection'
                ? PASSWORD_SECTION_CHILD_TYPES
          : null;
    if (supportedChildTypes && ['blogArticle', 'passwordSection'].includes(section.type)) {
      const childIds = new Set();
      for (const child of section.blocks || []) {
        if (!Object.hasOwn(supportedChildTypes, child.type)) {
          throw new Error(`Unsupported ${section.type} block type: ${child.type || '(empty)'}.`);
        }
        if (childIds.has(child.id)) throw new Error(`${section.type} block IDs must be unique within their section.`);
        childIds.add(child.id);
      }
      continue;
    }
    if (!supportedChildTypes) continue;
    const childIds = new Set();
    for (const child of section.cards) {
      if (!Object.hasOwn(supportedChildTypes, child.type)) {
        throw new Error(`Unsupported ${section.type} block type: ${child.type || '(empty)'}.`);
      }
      if (childIds.has(child.id)) {
        throw new Error(`${section.type} block IDs must be unique within their section.`);
      }
      childIds.add(child.id);
    }
  }
  return parsed;
}

const BLOG_ARTICLE_CHILD_TYPES = {
  blogArticleTitle: true,
  blogArticleDetails: true,
  blogArticleImage: true,
  blogArticleExcerpt: true,
  blogArticleBody: true,
};

const PASSWORD_SECTION_CHILD_TYPES = {
  passwordLogo: true,
  passwordText: true,
  emailSignup: true,
};

async function withDatabaseOr(fallback, read) {
  try {
    const db = await getDb();
    return await read(db);
  } catch {
    return fallback;
  }
}

function serializeTemplate(document) {
  if (!document) return null;
  return {
    resourceType: document.resourceType,
    key: document.key,
    name: document.name,
    draft: document.draft ? {
      sections: clone(document.draft.sections || []),
      version: Number(document.draft.version || 0),
      updatedAt: document.draft.updatedAt || null,
      updatedBy: document.draft.updatedBy || '',
    } : null,
    published: document.published ? {
      sections: clone(document.published.sections || []),
      version: Number(document.published.version || 0),
      publishedAt: document.published.publishedAt || null,
      publishedBy: document.published.publishedBy || '',
    } : null,
    createdAt: document.createdAt || null,
    updatedAt: document.updatedAt || null,
  };
}

export async function getPublishedResourceTemplate(resourceType, resourceHandle) {
  const fallback = { ...defaultTemplate(resourceType), isPublished: false };
  if (!RESOURCE_TYPES.includes(resourceType) || (!resourceHandle && !SINGLETON_TEMPLATE_TYPES.includes(resourceType))) return fallback;

  return withDatabaseOr(fallback, async (db) => {
    const assignment = SINGLETON_TEMPLATE_TYPES.includes(resourceType)
      ? null
      : await db.collection(ASSIGNMENT_COLLECTION).findOne({ resourceType, resourceHandle: String(resourceHandle) });
    const templateKey = SINGLETON_TEMPLATE_TYPES.includes(resourceType) ? 'default' : assignment?.templateKey || 'default';
    const template = await db.collection(TEMPLATE_COLLECTION).findOne({ resourceType, key: templateKey });
    if (template?.published?.sections) {
      return { key: template.key, name: template.name, sections: clone(template.published.sections), isPublished: true };
    }
    if (templateKey !== 'default') {
      const publishedDefault = await db.collection(TEMPLATE_COLLECTION).findOne({ resourceType, key: 'default' });
      if (publishedDefault?.published?.sections) {
        return { key: publishedDefault.key, name: publishedDefault.name, sections: clone(publishedDefault.published.sections), isPublished: true };
      }
    }
    return fallback;
  });
}

export async function getResourceTemplateEditorData({ resourceType, resourceHandle, templateKey: requestedTemplateKey = '' }) {
  if (!RESOURCE_TYPES.includes(resourceType)) throw new Error('Choose a product, collection, collections list, blog, blog post, search, cart, 404, Password, or Gift card template.');
  const selectedResourceHandle = resourceType === 'collection-list' ? 'index' : SINGLETON_TEMPLATE_TYPES.includes(resourceType) ? resourceType : resourceHandle;
  const staticResources = resourceType === 'product'
    ? staticProducts.map((product) => ({ handle: product.slug, label: product.title, status: 'published', templateKey: 'default' }))
      : resourceType === 'blog'
      ? listBlogResources().map((blog) => ({ handle: blog.handle, label: blog.title, status: 'published', templateKey: 'default' }))
      : resourceType === 'blog-post'
        ? (await listBlogPosts({ status: 'all' })).items.map((post) => ({ handle: post.id, label: post.title, status: post.status, templateKey: 'default', route: post.route, blogHandle: post.blogHandle }))
      : resourceType === 'collection-list'
      ? [{ handle: 'index', label: 'Collections', status: 'published', templateKey: 'default' }]
      : resourceType === 'search'
        ? [{ handle: 'search', label: 'Search', status: 'published', templateKey: 'default' }]
        : resourceType === 'cart'
          ? [{ handle: 'cart', label: 'Cart', status: 'published', templateKey: 'default' }]
          : resourceType === '404'
            ? [{ handle: '404', label: '404 page', status: 'published', templateKey: 'default' }]
            : resourceType === 'password'
              ? [{ handle: 'password', label: 'Password', status: 'published', templateKey: 'default' }]
              : resourceType === 'gift-card'
                ? [{ handle: 'sample', label: 'Sample gift card', status: 'sample', templateKey: 'default' }]
        : staticCategories.map((collection) => ({ handle: collection.slug, label: collection.name, status: 'published', templateKey: 'default' }));
  const fallback = {
    assignedTemplateKey: 'default',
    selectedTemplateKey: 'default',
    templates: [{ ...defaultTemplate(resourceType), hasPublishedVersion: false, sectionCount: defaultTemplate(resourceType).sections.length, assignmentCount: staticResources.length }],
    template: {
      ...defaultTemplate(resourceType),
      draft: { sections: defaultTemplate(resourceType).sections, version: 0 },
      published: null,
      hasUnsavedDraft: false,
    },
    resources: staticResources,
  };

  return withDatabaseOr(fallback, async (db) => {
    const resourceCollectionName = resourceType === 'product' ? 'products' : 'catalogCollections';
    const [assignment, documents, resourceDocuments, assignmentDocuments] = await Promise.all([
      selectedResourceHandle
        && !SINGLETON_TEMPLATE_TYPES.includes(resourceType)
        ? db.collection(ASSIGNMENT_COLLECTION).findOne({ resourceType, resourceHandle: String(selectedResourceHandle) })
        : null,
      db.collection(TEMPLATE_COLLECTION).find({ resourceType }).sort({ name: 1, key: 1 }).toArray(),
      resourceType === 'collection-list' || resourceType === 'blog' || resourceType === 'blog-post' || SINGLETON_TEMPLATE_TYPES.includes(resourceType)
        ? Promise.resolve([])
        : db.collection(resourceCollectionName)
          .find({ status: { $ne: 'archived' } }, { projection: { slug: 1, title: 1, name: 1, status: 1 } })
          .sort(resourceType === 'product' ? { title: 1 } : { sortOrder: 1, name: 1 })
          .limit(500)
          .toArray(),
      SINGLETON_TEMPLATE_TYPES.includes(resourceType)
        ? Promise.resolve([])
        : db.collection(ASSIGNMENT_COLLECTION).find({ resourceType }).project({ resourceHandle: 1, templateKey: 1 }).toArray(),
    ]);
    const assignedTemplateKey = assignment?.templateKey || 'default';
    const assignmentByHandle = new Map(assignmentDocuments.map((item) => [item.resourceHandle, item.templateKey || 'default']));
    const resources = resourceDocuments.map((resource) => ({
      handle: resource.slug,
      label: resource.title || resource.name || resource.slug,
      status: resource.status || 'published',
      templateKey: assignmentByHandle.get(resource.slug) || 'default',
    }));
    const templateByKey = new Map(documents
      .filter((document) => !SINGLETON_TEMPLATE_TYPES.includes(resourceType) || document.key === 'default')
      .map((document) => [document.key, serializeTemplate(document)]));
    if (!templateByKey.has('default')) templateByKey.set('default', defaultTemplate(resourceType));
    const selectedTemplateKey = templateByKey.has(requestedTemplateKey) ? requestedTemplateKey : assignedTemplateKey;
    const selectedTemplate = templateByKey.get(selectedTemplateKey) || templateByKey.get('default');
    const defaultValue = defaultTemplate(resourceType);
    const draft = selectedTemplate.draft || {
      sections: selectedTemplate.published?.sections || defaultValue.sections,
      version: selectedTemplate.published?.version || 0,
      updatedAt: null,
      updatedBy: '',
    };
    if (resourceType === 'gift-card') draft.sections = [];
    const template = {
      ...selectedTemplate,
      draft,
      hasUnsavedDraft: Boolean(selectedTemplate.draft && selectedTemplate.published && selectedTemplate.draft.version > selectedTemplate.published.version),
    };
    const resourceRows = resources.length
      ? resources
      : staticResources.map((resource) => ({ ...resource, templateKey: assignmentByHandle.get(resource.handle) || 'default' }));
    return {
      assignedTemplateKey,
      selectedTemplateKey,
      templates: [...templateByKey.values()].map(({ resourceType: _resourceType, draft: itemDraft, published, ...item }) => ({
        ...item,
        hasPublishedVersion: Boolean(published),
        sectionCount: itemDraft?.sections?.length || published?.sections?.length || item.sections?.length || 0,
        assignmentCount: resourceRows.filter((resource) => resource.templateKey === item.key).length,
      })),
      template,
      resources: resourceRows,
    };
  });
}

export async function createResourceTemplate(input, actor = 'unknown') {
  const parsed = createResourceTemplateInputSchema.parse(input);
  const { resourceType, sections: submittedSections, sourceTemplateKey } = parsed;
  if (SINGLETON_TEMPLATE_TYPES.includes(resourceType)) throw new Error(`${RESOURCE_TEMPLATE_DEFAULTS[resourceType].name} uses a single template and cannot have additional templates.`);
  const resourceHandle = resourceType === 'collection-list' ? 'index' : parsed.resourceHandle;
  const normalizedKey = normalizeKey(parsed.templateKey || parsed.name);
  const normalizedName = parsed.name;
  if (!normalizedKey || normalizedKey === 'default' || !normalizedName) throw new Error('Choose a name for this template.');

  const db = await getDb();
  await ensureResourceTemplateIndexes(db);
  const templates = db.collection(TEMPLATE_COLLECTION);
  const source = sourceTemplateKey === 'default'
    ? defaultTemplate(resourceType)
    : serializeTemplate(await templates.findOne({ resourceType, key: sourceTemplateKey }));
  if (!source) throw new Error('The template to copy could not be found.');
  const now = new Date();
  const document = {
    resourceType,
    key: normalizedKey,
    name: normalizedName,
    draft: { sections: validateSections(submittedSections || source.draft?.sections || source.published?.sections || source.sections), version: 0, updatedAt: now, updatedBy: actor },
    published: null,
    createdAt: now,
    createdBy: actor,
    updatedAt: now,
    updatedBy: actor,
  };
  await templates.insertOne(document);
  if (resourceHandle) {
    await db.collection(ASSIGNMENT_COLLECTION).updateOne(
      { resourceType, resourceHandle: String(resourceHandle) },
      { $set: { templateKey: normalizedKey, updatedAt: now, updatedBy: actor }, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );
  }
  return serializeTemplate(document);
}

export async function saveResourceTemplateDraft(input, actor = 'unknown') {
  const parsed = resourceTemplateInputSchema.parse(input);
  if (SINGLETON_TEMPLATE_TYPES.includes(parsed.resourceType) && parsed.templateKey !== 'default') throw new Error(`${RESOURCE_TEMPLATE_DEFAULTS[parsed.resourceType].name} uses a single default template.`);
  const sections = parsed.resourceType === 'gift-card' ? [] : validateSections(parsed.sections);
  const db = await getDb();
  await ensureResourceTemplateIndexes(db);
  const templates = db.collection(TEMPLATE_COLLECTION);
  const now = new Date();
  const current = await templates.findOne({ resourceType: parsed.resourceType, key: parsed.templateKey });
  if (!current && parsed.templateKey !== 'default') throw new Error('Create this template before saving it.');
  const currentVersion = Number(current?.draft?.version ?? 0);
  if (typeof parsed.expectedVersion === 'number' && currentVersion !== parsed.expectedVersion) {
    const error = new Error('This template changed in another session. Reload before saving.');
    error.code = 'VERSION_CONFLICT';
    throw error;
  }

  const name = current?.name || RESOURCE_TEMPLATE_DEFAULTS[parsed.resourceType].name;
  if (current) {
    const result = await templates.updateOne(
      { resourceType: parsed.resourceType, key: parsed.templateKey, 'draft.version': currentVersion },
      { $set: { name, draft: { sections, version: currentVersion + 1, updatedAt: now, updatedBy: actor }, updatedAt: now, updatedBy: actor } },
    );
    if (!result.matchedCount) {
      const error = new Error('This template changed in another session. Reload before saving.');
      error.code = 'VERSION_CONFLICT';
      throw error;
    }
  } else {
    await templates.insertOne({
      resourceType: parsed.resourceType,
      key: parsed.templateKey,
      name,
      draft: { sections, version: currentVersion + 1, updatedAt: now, updatedBy: actor },
      published: null,
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    });
  }
  return { resourceType: parsed.resourceType, templateKey: parsed.templateKey, sections, version: currentVersion + 1, updatedAt: now };
}

export async function publishResourceTemplate({ resourceType, templateKey, expectedVersion }, actor = 'unknown') {
  if (!RESOURCE_TYPES.includes(resourceType) || (SINGLETON_TEMPLATE_TYPES.includes(resourceType) && String(templateKey) !== 'default')) throw new Error('Choose a valid resource template.');
  const db = await getDb();
  await ensureResourceTemplateIndexes(db);
  const templates = db.collection(TEMPLATE_COLLECTION);
  const current = await templates.findOne({ resourceType, key: String(templateKey) });
  if (!current?.draft?.sections) throw new Error('Save a template draft before publishing it.');
  if (typeof expectedVersion === 'number' && Number(current.draft.version || 0) !== expectedVersion) {
    const error = new Error('This template changed in another session. Reload before publishing.');
    error.code = 'VERSION_CONFLICT';
    throw error;
  }
  const now = new Date();
  const result = await templates.updateOne(
    { resourceType, key: String(templateKey), 'draft.version': current.draft.version },
    { $set: { published: { sections: validateSections(current.draft.sections), version: current.draft.version, publishedAt: now, publishedBy: actor }, updatedAt: now, updatedBy: actor } },
  );
  if (!result.matchedCount) {
    const error = new Error('This template changed in another session. Reload before publishing.');
    error.code = 'VERSION_CONFLICT';
    throw error;
  }
  return { resourceType, templateKey: String(templateKey), version: Number(current.draft.version), publishedAt: now };
}

export async function discardResourceTemplateDraft({ resourceType, templateKey }, actor = 'unknown') {
  if (!RESOURCE_TYPES.includes(resourceType) || (SINGLETON_TEMPLATE_TYPES.includes(resourceType) && String(templateKey) !== 'default')) throw new Error('Choose a valid resource template.');
  const db = await getDb();
  await ensureResourceTemplateIndexes(db);
  const templates = db.collection(TEMPLATE_COLLECTION);
  const current = await templates.findOne({ resourceType, key: String(templateKey) });
  if (!current) return { resourceType, templateKey: String(templateKey), sections: defaultTemplate(resourceType).sections, version: 0 };
  if (current.published) {
    const now = new Date();
    const version = Number(current.published.version || 0);
    const sections = validateSections(current.published.sections);
    await templates.updateOne({ _id: current._id }, { $set: { draft: { sections, version, updatedAt: now, updatedBy: actor }, updatedAt: now, updatedBy: actor } });
    return { resourceType, templateKey: String(templateKey), sections, version };
  }
  if (String(templateKey) === 'default') {
    const sections = defaultTemplate(resourceType).sections;
    const now = new Date();
    const version = Number(current.draft?.version || 0) + 1;
    await templates.updateOne({ _id: current._id }, { $set: { draft: { sections, version, updatedAt: now, updatedBy: actor }, updatedAt: now, updatedBy: actor } });
    return { resourceType, templateKey: String(templateKey), sections, version };
  }
  await templates.deleteOne({ _id: current._id });
  return { resourceType, templateKey: String(templateKey), sections: defaultTemplate(resourceType).sections, version: 0 };
}

export async function assignResourceTemplate({ resourceType, resourceHandle, templateKey }, actor = 'unknown') {
  if (!RESOURCE_TYPES.includes(resourceType) || SINGLETON_TEMPLATE_TYPES.includes(resourceType)) throw new Error('Choose a product, collection, collections list, or blog template.');
  const handle = resourceType === 'collection-list' ? 'index' : String(resourceHandle || '').trim().slice(0, 180);
  const key = normalizeKey(templateKey || 'default');
  if (!handle || !key) throw new Error('Choose a resource and template.');
  const db = await getDb();
  await ensureResourceTemplateIndexes(db);
  if (key !== 'default') {
    const template = await db.collection(TEMPLATE_COLLECTION).findOne({ resourceType, key });
    if (!template) throw new Error('That template could not be found.');
  }
  const now = new Date();
  await db.collection(ASSIGNMENT_COLLECTION).updateOne(
    { resourceType, resourceHandle: handle },
    { $set: { templateKey: key, updatedAt: now, updatedBy: actor }, $setOnInsert: { resourceType, resourceHandle: handle, createdAt: now } },
    { upsert: true },
  );
  return { resourceType, resourceHandle: handle, templateKey: key };
}
