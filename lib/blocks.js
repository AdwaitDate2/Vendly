// Block types for page-builder pages. Plain data shared by the admin editor (client) and
// the storefront renderer, so it must not import server-only modules.

export const TONES = {
  ivory: 'Ivory',
  paper: 'Paper',
  olive: 'Green',
  'olive-dark': 'Dark green',
  mulberry: 'Mulberry',
  'mulberry-dark': 'Dark mulberry',
};

export const DARK_TONES = new Set(['olive', 'olive-dark', 'mulberry', 'mulberry-dark']);

export const FIELD_DEFS = {
  eyebrow: { label: 'Small label', kind: 'text' },
  heading: { label: 'Heading', kind: 'textarea', rows: 2 },
  body: { label: 'Text', kind: 'textarea', rows: 5 },
  note: { label: 'Accent line', kind: 'textarea', rows: 2 },
  accent: { label: 'Closing line', kind: 'textarea', rows: 2 },
  linkLabel: { label: 'Button text', kind: 'text' },
  linkHref: { label: 'Button link', kind: 'link' },
  secondaryLinkLabel: { label: 'Second button text', kind: 'text' },
  secondaryLinkHref: { label: 'Second button link', kind: 'link' },
  image: { label: 'Image', kind: 'image' },
  imageAlt: { label: 'Image description (read by screen readers)', kind: 'text' },
  image1: { label: 'Image 1', kind: 'image' },
  image1Alt: { label: 'Image 1 description (read by screen readers)', kind: 'text' },
  image2: { label: 'Image 2', kind: 'image' },
  image2Alt: { label: 'Image 2 description (read by screen readers)', kind: 'text' },
  backgroundImage: { label: 'Background image', kind: 'image' },
  backgroundVideo: { label: 'Background video', kind: 'video' },
  imagePosition: { label: 'Image focus', kind: 'focus' },
  spacerHeight: { label: 'Height', kind: 'number', min: 0, max: 240 },
  video: { label: 'Video', kind: 'video' },
  mobileImage: { label: 'Phone image (optional)', kind: 'image', help: 'Shown on phones instead of the main image. Leave empty to use the main image on phones too.' },
  mobileImagePosition: { label: 'Phone image focus', kind: 'focus' },
  mobileVideo: { label: 'Phone video (optional)', kind: 'video', help: 'Played on phones instead of the main video. Leave empty to use the main video on phones too.' },
  icon: { label: 'Icon', kind: 'icon' },
  html: { label: 'HTML', kind: 'code', language: 'html' },
  liquid: { label: 'Liquid code', kind: 'code', language: 'liquid' },
  css: { label: 'CSS (optional — only affects this block)', kind: 'code', language: 'css' },
  shape: { label: 'Photo shape', kind: 'select', options: [['landscape', 'Landscape'], ['portrait', 'Portrait']] },
  count: { label: 'Number of products', kind: 'number', min: 1, max: 24 },
  showAvailability: { label: 'Availability filter', kind: 'checkbox' },
  showPriceFilter: { label: 'Price filter', kind: 'checkbox' },
  showSorting: { label: 'Sort control', kind: 'checkbox' },
  autoLoad: { label: 'Load more as shoppers scroll', kind: 'checkbox' },
  fullWidthMobile: { label: 'Full-width cards on phones', kind: 'checkbox' },
  layout: { label: 'Layout', kind: 'select', options: [['grid', 'Grid'], ['editorial', 'Editorial']] },
  cardSize: { label: 'Card size', kind: 'select', options: [['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']] },
  mobileCardSize: { label: 'Phone card size', kind: 'select', options: [['small', 'Small'], ['large', 'Large']] },
  groupGap: { label: 'Spacing between blocks', kind: 'select', options: [['compact', 'Compact'], ['standard', 'Standard'], ['spacious', 'Spacious']] },
  'cta.eyebrow': { label: 'Box — small label', kind: 'text' },
  'cta.heading': { label: 'Box — heading', kind: 'text' },
  'cta.body': { label: 'Box — text', kind: 'textarea', rows: 2 },
  'cta.linkLabel': { label: 'Box — button text', kind: 'text' },
  'cta.linkHref': { label: 'Box — button link', kind: 'link' },
};

export const FOCUS_OPTIONS = [
  ['center 10%', 'Top'],
  ['center 25%', 'Upper'],
  ['center 50%', 'Middle'],
  ['center 70%', 'Lower'],
  ['center 90%', 'Bottom'],
];

export const TIMELINE_ICONS = [
  ['/icons/process-vision.svg', 'Sprout'],
  ['/icons/process-source.svg', 'Bud'],
  ['/icons/process-review.svg', 'Flower'],
  ['/icons/process-craft.svg', 'Flower with leaf'],
  ['/icons/lotus-mulberry.svg', 'Lotus'],
];

export const VIDEO_STEP_ICONS = [
  ['M4 6h16M4 12h10M4 18h13', 'Lines'],
  ['M4 9h16l-8 12z|M4 9l4-6h8l4 6', 'Diamond'],
  ['M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2 2M15.5 15.5l2 2M6.5 17.5l2-2M15.5 8.5l2-2', 'Sparkle'],
  ['circle', 'Ring'],
];

const SAMPLE_IMAGE = '/images/selection-2/diamond-detail.webp';
const TEXT_TONES = ['ivory', 'paper', 'olive', 'olive-dark', 'mulberry', 'mulberry-dark'];

export const PRODUCT_INFORMATION_CHILD_TYPES = {
  vendor: { label: 'Vendor', fields: ['eyebrow'] },
  productTitle: { label: 'Title', fields: ['heading'] },
  price: { label: 'Price', fields: [] },
  description: { label: 'Description', fields: ['body'] },
  variantPicker: { label: 'Variant picker', fields: ['label'] },
  sizeSelector: { label: 'Size selector', fields: ['label'] },
  quantitySelector: { label: 'Quantity selector', fields: ['count'] },
  madeToOrder: { label: 'Delivery timeline', fields: ['body'] },
  buyButtons: { label: 'Buy buttons', fields: ['label'] },
  enquiryForm: { label: 'Enquiry form', fields: [] },
  productDetails: { label: 'Product details', fields: [] },
  share: { label: 'Share', fields: ['label'] },
};

export const PRODUCT_INFORMATION_DEFAULT_BLOCKS = [
  { id: 'vendor', type: 'vendor', label: 'Vendor', enabled: true, eyebrow: 'byShreen · Fine Diamond Jewelry' },
  { id: 'title', type: 'productTitle', label: 'Title', enabled: true, heading: '' },
  { id: 'description', type: 'description', label: 'Description', enabled: true, body: '' },
  { id: 'price', type: 'price', label: 'Price', enabled: true },
  { id: 'variant-picker', type: 'variantPicker', label: 'Variant picker', enabled: true },
  { id: 'size-selector', type: 'sizeSelector', label: 'Size selector', enabled: true },
  { id: 'quantity-selector', type: 'quantitySelector', label: 'Quantity selector', enabled: false, count: 1 },
  { id: 'made-to-order', type: 'madeToOrder', label: 'Delivery timeline', enabled: true },
  { id: 'buy-buttons', type: 'buyButtons', label: 'Buy buttons', enabled: true },
  { id: 'enquiry-form', type: 'enquiryForm', label: 'Enquiry form', enabled: true },
  { id: 'product-details', type: 'productDetails', label: 'Product details', enabled: true },
  { id: 'share', type: 'share', label: 'Share', enabled: false },
];

export const SEARCH_HEADER_CHILD_TYPES = {
  heading: { label: 'Heading', fields: ['eyebrow', 'heading'] },
  searchInput: { label: 'Search input', fields: ['body', 'note', 'linkLabel'] },
};

export const SEARCH_HEADER_DEFAULT_BLOCKS = [
  { id: 'search-heading', type: 'heading', label: 'Heading', enabled: true, eyebrow: 'Find your piece', heading: 'Search.' },
  { id: 'search-input', type: 'searchInput', label: 'Search input', enabled: true, body: 'Search the collection', note: 'Try rings, gold, diamonds…', linkLabel: 'Search' },
];

export const SEARCH_RESULTS_CHILD_TYPES = {
  filteringAndSorting: { label: 'Filtering and sorting', fields: ['showAvailability', 'showPriceFilter', 'showSorting', 'layout', 'count', 'autoLoad'], labels: { count: 'Products per page' } },
  productCard: { label: 'Product card', fields: ['cardSize', 'mobileCardSize', 'fullWidthMobile'] },
};

export const SEARCH_RESULTS_DEFAULT_BLOCKS = [
  { id: 'search-filtering-sorting', type: 'filteringAndSorting', label: 'Filtering and sorting', enabled: true, showAvailability: true, showPriceFilter: true, showSorting: true, layout: 'grid', count: 24, autoLoad: false },
  { id: 'search-product-card', type: 'productCard', label: 'Product card', enabled: true, cardSize: 'medium', mobileCardSize: 'large', fullWidthMobile: false },
];

export const NOT_FOUND_CHILD_TYPES = {
  heading: { label: 'Heading', fields: ['heading'] },
  text: { label: 'Text', fields: ['body'] },
  button: { label: 'Button', fields: ['linkLabel', 'linkHref'] },
};

export const NOT_FOUND_DEFAULT_BLOCKS = [
  { id: 'not-found-heading', type: 'heading', label: 'Heading', enabled: true, heading: 'Page not found' },
  { id: 'not-found-text', type: 'text', label: 'Text', enabled: true, body: 'The link may be incorrect, or the page has been removed.' },
  { id: 'not-found-button', type: 'button', label: 'Button', enabled: true, linkLabel: 'Continue shopping', linkHref: '/shop' },
];

export const HERO_CONTENT_BLOCK_SCHEMA_VERSION = 1;

// Hero defaults aligned to Shopify inspector: no "Original" sentinels. Legacy
// sections stored with original values are migrated in normalizeHeroSettings.
export function getHeroSectionDefaults(type) {
  const isPhotoHero = type === 'heroImage';
  return {
    direction: 'vertical',
    alignment: 'left',
    position: 'center',
    gap: 0,
    width: 'page',
    height: 'auto',
    colorScheme: 'inherit',
    overlayEnabled: true,
    overlayStyle: 'solid',
    overlayColor: isPhotoHero ? '#3c1820' : '#180a10',
    overlayOpacity: 35,
    paddingPreset: 'custom',
    paddingTop: isPhotoHero ? 80 : 88,
    paddingBottom: isPhotoHero ? 80 : 40,
  };
}

export function normalizeHeroSettings(settings = {}) {
  const defaults = getHeroSectionDefaults(settings.heroType || 'heroVideo');
  const normalized = { ...defaults, ...settings };
  if (normalized.position === 'original') normalized.position = 'center';
  if (normalized.width === 'original') normalized.width = 'page';
  if (normalized.overlayStyle === 'original') {
    normalized.overlayStyle = normalized.overlayEnabled ? 'solid' : 'solid';
  }
  if (normalized.paddingPreset === 'original') normalized.paddingPreset = 'custom';
  return normalized;
}

export const HERO_CONTENT_CHILD_TYPES = {
  heroEyebrow: { label: 'Text', fields: ['eyebrow'] },
  heroHeading: { label: 'Heading', fields: ['heading'] },
  heroText: { label: 'Text', fields: ['body'] },
  heroButton: { label: 'Button', fields: ['linkLabel', 'linkHref'], labels: { linkLabel: 'Button label', linkHref: 'Button link' } },
};

function createHeroContentBlock(type, fields, label = HERO_CONTENT_CHILD_TYPES[type].label) {
  return {
    id: newId(`hero-${type}`),
    type,
    label,
    enabled: true,
    ...fields,
  };
}

/** Convert the old scalar hero copy fields into editable content blocks once. */
export function createHeroContentBlocks(section) {
  const blocks = [
    createHeroContentBlock('heroEyebrow', { eyebrow: section.eyebrow || '' }),
    createHeroContentBlock('heroHeading', { heading: section.heading || '' }),
  ];
  if (section.body) blocks.push(createHeroContentBlock('heroText', { body: section.body }));
  if (section.linkLabel) {
    blocks.push(createHeroContentBlock('heroButton', {
      linkLabel: section.linkLabel,
      linkHref: section.linkHref || '/',
      settings: { variant: 'primary' },
    }));
  }
  if (section.secondaryLinkLabel) {
    blocks.push(createHeroContentBlock('heroButton', {
      linkLabel: section.secondaryLinkLabel,
      linkHref: section.secondaryLinkHref || '/',
      settings: { variant: 'secondary' },
    }));
  }
  return blocks;
}

export function normalizeHeroContentSection(section) {
  if (!['heroVideo', 'heroImage'].includes(section?.type)) return section;
  const currentSettings = section.settings && typeof section.settings === 'object' && !Array.isArray(section.settings) ? section.settings : {};
  const hasCurrentSchema = Number(currentSettings.heroContentSchemaVersion) >= HERO_CONTENT_BLOCK_SCHEMA_VERSION;
  const savedBlocks = Array.isArray(section.blocks) ? section.blocks : [];
  const contentFieldByType = { heroEyebrow: 'eyebrow', heroHeading: 'heading', heroText: 'body', heroButton: 'linkLabel' };
  const legacyCopyBlocks = createHeroContentBlocks(section).filter((candidate) => !savedBlocks.some((savedBlock) => (
    savedBlock?.type === candidate.type
    && Boolean(savedBlock[contentFieldByType[candidate.type]])
    && (candidate.type !== 'heroButton' || (savedBlock.settings?.variant || 'primary') === candidate.settings?.variant)
  )));
  return {
    ...section,
    settings: { ...currentSettings, heroContentSchemaVersion: HERO_CONTENT_BLOCK_SCHEMA_VERSION },
    // Preserve the scalar copy when upgrading older hero sections, while retaining
    // any legacy nested blocks after the new content blocks in their old order.
    blocks: hasCurrentSchema ? savedBlocks : [...legacyCopyBlocks, ...savedBlocks],
  };
}

export const FEATURED_COLLECTION_DEFAULT_BLOCKS = [
  {
    id: 'featured-collection-header',
    type: 'featuredCollectionHeader',
    label: 'Header',
    enabled: true,
    blocks: [
      { id: 'featured-collection-title', type: 'featuredCollectionTitle', label: 'Collection title', enabled: true },
    ],
  },
  {
    id: 'featured-collection-product-card',
    type: 'featuredCollectionProductCard',
    label: 'Product card',
    enabled: true,
    blocks: [
      {
        id: 'featured-collection-media',
        type: 'featuredCollectionMedia',
        label: 'Media',
        enabled: true,
        settings: { aspectRatio: 'auto', showSecondaryImage: true, showViewLink: true, borderStyle: 'none', cornerRadius: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 },
      },
      {
        id: 'featured-collection-product-details',
        type: 'featuredCollectionGroup',
        label: 'Group',
        enabled: true,
        settings: { direction: 'horizontal', alignment: 'left', gap: 15, widthMode: 'fill', mobileWidthMode: 'fill', heightMode: 'fit' },
        blocks: [
          { id: 'featured-collection-product-title', type: 'featuredCollectionProductTitle', label: 'Title', enabled: true, settings: { width: 'fill', maxWidth: 0, typographyPreset: 'heading', color: 'inherit', background: 'none', paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 } },
          { id: 'featured-collection-price', type: 'featuredCollectionPrice', label: 'Price', enabled: true, settings: { showSaleFirst: true, showInstallmentPrice: false, showTaxInformation: false, typographyPreset: 'caption', width: 'fit', alignment: 'left', color: 'inherit', paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 } },
          { id: 'featured-collection-swatches', type: 'featuredCollectionSwatches', label: 'Swatches', enabled: true, settings: { desktopAlignment: 'left', mobileAlignment: 'left', paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 } },
        ],
      },
    ],
    settings: {
      repeating: true,
      productSource: 'parent',
      verticalGap: 12,
      colorScheme: 'inherit',
      borderStyle: 'none',
      cornerRadius: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
    },
  },
];

export const FEATURED_COLLECTION_BLOCK_SCHEMA_VERSION = 3;

function assignFeaturedCollectionIds(block) {
  return {
    ...block,
    id: newId(block.type || 'block'),
    ...(Array.isArray(block.blocks) ? { blocks: block.blocks.map(assignFeaturedCollectionIds) } : {}),
  };
}

function featuredCollectionBlockTemplate(type) {
  const pending = [...FEATURED_COLLECTION_DEFAULT_BLOCKS];
  while (pending.length) {
    const block = pending.shift();
    if (block.type === type) return block;
    pending.push(...(block.blocks || []));
  }
  return null;
}

export function createFeaturedCollectionBlocks() {
  return FEATURED_COLLECTION_DEFAULT_BLOCKS.map(assignFeaturedCollectionIds);
}

export function createFeaturedCollectionProductCard() {
  return assignFeaturedCollectionIds(featuredCollectionBlockTemplate('featuredCollectionProductCard'));
}

export function createFeaturedCollectionGroup() {
  return assignFeaturedCollectionIds(featuredCollectionBlockTemplate('featuredCollectionGroup'));
}

function normalizeFeaturedCollectionBlock(block, insideProductCard = false, addDefaultSwatches = false) {
  if (!block || typeof block !== 'object' || Array.isArray(block)) return block;
  const isProductCard = block.type === 'featuredCollectionProductCard';
  const promoteLegacyGroup = insideProductCard && block.type === 'group';
  const normalizedType = promoteLegacyGroup ? 'featuredCollectionGroup' : block.type;
  const defaultSettings = featuredCollectionBlockTemplate(normalizedType)?.settings;
  const normalizedChildren = Array.isArray(block.blocks)
    ? block.blocks.map((childBlock) => normalizeFeaturedCollectionBlock(childBlock, insideProductCard || isProductCard, addDefaultSwatches))
    : null;
  if (insideProductCard && normalizedType === 'featuredCollectionGroup' && addDefaultSwatches && !normalizedChildren?.some((childBlock) => childBlock.type === 'featuredCollectionSwatches')) {
    normalizedChildren?.push({ id: newId('featured-collection-swatches'), type: 'featuredCollectionSwatches', label: 'Swatches', enabled: true });
  }
  return {
    ...block,
    ...(promoteLegacyGroup ? { type: normalizedType } : {}),
    ...(defaultSettings ? { settings: { ...defaultSettings, ...(block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {}) } } : {}),
    ...(normalizedChildren ? { blocks: normalizedChildren } : {}),
  };
}

export function normalizeFeaturedCollectionSection(section) {
  if (section?.type !== 'featuredCollection') return section;
  const currentSettings = section.settings && typeof section.settings === 'object' && !Array.isArray(section.settings) ? section.settings : {};
  const hasSavedBlocks = Array.isArray(section.blocks) && section.blocks.length > 0;
  const hasCurrentSchema = Number(currentSettings.blockSchemaVersion) >= FEATURED_COLLECTION_BLOCK_SCHEMA_VERSION;
  const savedBlocks = Array.isArray(section.blocks)
    ? section.blocks.map((block) => normalizeFeaturedCollectionBlock(block, false, !hasCurrentSchema))
    : [];
  return {
    ...section,
    settings: { ...currentSettings, blockSchemaVersion: FEATURED_COLLECTION_BLOCK_SCHEMA_VERSION },
    blocks: hasSavedBlocks || hasCurrentSchema ? savedBlocks : createFeaturedCollectionBlocks(),
  };
}

let counter = 0;
export function newId(prefix = 'block') {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export function duplicateBlockTree(block) {
  const copy = JSON.parse(JSON.stringify(block));
  const assignFreshIds = (item) => {
    if (!item || typeof item !== 'object') return;
    item.id = newId(item.type || 'block');
    if (Array.isArray(item.blocks)) item.blocks.forEach(assignFreshIds);
    if (Array.isArray(item.cards)) item.cards.forEach((card) => {
      card.id = newId('card');
      if (Array.isArray(card.blocks)) card.blocks.forEach(assignFreshIds);
    });
  };
  assignFreshIds(copy);
  return copy;
}

function cards(count, make) {
  return Array.from({ length: count }, (_, index) => ({ id: newId('card'), ...make(index) }));
}

export const BLOCK_TYPES = {
  heroVideo: {
    label: 'Hero — video',
    category: 'Banners',
    description: 'Full-width video with a large heading and two buttons.',
    fields: ['eyebrow', 'heading', 'body', 'linkLabel', 'linkHref', 'secondaryLinkLabel', 'secondaryLinkHref', 'video', 'image', 'mobileVideo', 'mobileImage'],
    nestedBlocks: true,
    nestedBlockTypes: ['heroEyebrow', 'heroHeading', 'heroText', 'heroButton'],
    labels: { video: 'Desktop video', image: 'Desktop poster image (shown while the video loads)', mobileVideo: 'Phone video (optional)', mobileImage: 'Phone poster image (optional)' },
    create: () => ({ eyebrow: 'BYSHREEN', heading: 'A new heading', body: 'A short introduction.', linkLabel: 'SHOP THE COLLECTION →', linkHref: '/shop', video: '/videos/journey/hero-video.mp4', image: '/images/hero-poster.png' }),
  },
  heroImage: {
    label: 'Hero — photo',
    category: 'Banners',
    description: 'Full-width photo with a heading over it.',
    fields: ['eyebrow', 'heading', 'body', 'image', 'imageAlt', 'imagePosition', 'mobileImage', 'mobileImagePosition'],
    nestedBlocks: true,
    nestedBlockTypes: ['heroEyebrow', 'heroHeading', 'heroText', 'heroButton'],
    labels: { image: 'Desktop image', imagePosition: 'Desktop image focus' },
    create: () => ({ eyebrow: 'Label', heading: 'A new heading', body: 'A short introduction.', image: SAMPLE_IMAGE, imagePosition: 'center 45%' }),
  },
  pageHeader: {
    label: 'Page title',
    category: 'Banners',
    description: 'A title with a short introduction, no image.',
    fields: ['eyebrow', 'heading', 'body'],
    layouts: [['centered', 'Centered'], ['story', 'Centered, italic introduction'], ['left', 'Left-aligned']],
    labels: { layout: 'Title style' },
    create: () => ({ layout: 'centered', eyebrow: 'Label', heading: 'A new page title', body: '' }),
  },
  centeredText: {
    label: 'Text — centered',
    category: 'Content',
    description: 'A centered heading and paragraphs, with an optional link.',
    fields: ['eyebrow', 'heading', 'body', 'linkLabel', 'linkHref'],
    tones: TEXT_TONES,
    create: () => ({ eyebrow: 'Label', heading: 'A new heading', body: 'Write your text here.' }),
  },
  splitText: {
    label: 'Text — two columns',
    category: 'Content',
    description: 'Heading on the left, text and link on the right.',
    fields: ['eyebrow', 'heading', 'body', 'linkLabel', 'linkHref'],
    tones: TEXT_TONES,
    create: () => ({ eyebrow: 'Label', heading: 'A new heading', body: 'Write your text here.', linkLabel: 'LEARN MORE →', linkHref: '/our-story' }),
  },
  splitImage: {
    label: 'Photo + text',
    category: 'Content',
    description: 'Text on one side, a large photo on the other.',
    fields: ['eyebrow', 'heading', 'body', 'image', 'imageAlt', 'imagePosition'],
    tones: TEXT_TONES,
    create: () => ({ eyebrow: 'Label', heading: 'A new heading', body: 'Write your text here.', image: SAMPLE_IMAGE }),
  },
  imageCompare: {
    label: 'Image compare',
    category: 'Storytelling',
    description: 'Let visitors compare two images with an adjustable divider.',
    templateTypes: ['home'],
    fields: [],
    nestedBlocks: true,
    nestedBlockTypes: ['group', 'comparisonSlider'],
    create: () => ({
      settings: {
        direction: 'horizontal',
        verticalOnMobile: true,
        alignment: 'space-between',
        position: 'center',
        gap: 24,
        width: 'page',
        height: 'auto',
        colorScheme: 'scheme1',
        backgroundMedia: 'none',
        backgroundImage: '',
        borderStyle: 'none',
        cornerRadius: 0,
        paddingTop: 48,
        paddingBottom: 48,
      },
      blocks: [
        {
          id: newId('image-compare-content'),
          type: 'group',
          label: 'Content',
          enabled: true,
          settings: { direction: 'vertical', alignment: 'left', position: 'center', gap: 16, widthMode: 'fill', heightMode: 'fit', colorScheme: 'inherit', paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 },
          blocks: [
            { id: newId('image-compare-text'), type: 'text', label: 'Text', enabled: true, body: '' },
            { id: newId('image-compare-button'), type: 'button', label: 'Button', enabled: true, linkLabel: '', linkHref: '/' },
          ],
        },
        {
          id: newId('comparison-slider'),
          type: 'comparisonSlider',
          label: 'Comparison slider',
          enabled: true,
          image1: '',
          image1Alt: '',
          image2: '',
          image2Alt: '',
          settings: { direction: 'horizontal', aspectRatio: 'auto', widthMode: 'fill', customWidth: 65, mobileWidthMode: 'fill', mobileCustomWidth: 100, textOnImages: false, inheritColorScheme: true, borderStyle: 'none', cornerRadius: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 },
        },
      ],
    }),
  },
  storyChapter: {
    label: 'Story chapter',
    category: 'Content',
    description: 'Text that stays in place while a column of photos scrolls.',
    fields: ['eyebrow', 'heading', 'note', 'body', 'accent'],
    labels: { note: 'Italic tagline (above the text)', accent: 'Italic line (after the text)' },
    tones: ['paper', 'ivory', 'olive', 'olive-dark', 'mulberry', 'mulberry-dark'],
    layouts: [['image-right', 'Photos on the right'], ['image-left', 'Photos on the left']],
    cards: { label: 'Photo', fields: ['image', 'imageAlt', 'imagePosition', 'shape'], max: 4 },
    create: () => ({ tone: 'paper', layout: 'image-right', eyebrow: 'Chapter', heading: 'A new chapter', body: 'Write your text here.', cards: cards(1, () => ({ image: SAMPLE_IMAGE, shape: 'landscape' })) }),
  },
  letter: {
    label: 'Letter with portrait',
    category: 'Content',
    description: 'A personal note with a sign-off, next to a portrait.',
    fields: ['eyebrow', 'body', 'note', 'heading', 'linkLabel', 'linkHref', 'image', 'imageAlt'],
    labels: { note: 'Sign-off line', heading: 'Signature name' },
    create: () => ({ eyebrow: 'A NOTE FROM SHREEN', body: 'Write your letter here.', note: 'With love,', heading: 'Shreen', linkLabel: 'MEET SHREEN →', linkHref: '/our-story', image: '/images/selection-2/founder-portrait.webp' }),
  },
  quoteBand: {
    label: 'Quote',
    category: 'Content',
    description: 'A large centered quote with an attribution.',
    fields: ['body', 'note'],
    labels: { body: 'Quote', note: 'Attribution' },
    tones: TEXT_TONES,
    create: () => ({ body: '“A new quote.”', note: 'byShreen' }),
  },
  cta: {
    label: 'Call to action',
    category: 'Content',
    description: 'A colored band with a heading and buttons.',
    fields: ['heading', 'body', 'linkLabel', 'linkHref', 'secondaryLinkLabel', 'secondaryLinkHref'],
    tones: TEXT_TONES,
    create: () => ({ heading: 'Let’s create something meaningful.', body: 'We’re here to help.', linkLabel: 'Book an Appointment', linkHref: '/book-appointment' }),
  },
  closingBand: {
    label: 'Closing statement',
    category: 'Content',
    description: 'A paragraph followed by a large italic line.',
    fields: ['eyebrow', 'body', 'accent'],
    labels: { accent: 'Large italic line' },
    tones: TEXT_TONES,
    create: () => ({ eyebrow: 'Label', body: 'Write your text here.', accent: 'A memorable closing line.' }),
  },
  imageCards: {
    label: 'Photo cards',
    category: 'Collections',
    description: 'A row of clickable cards, each with a photo.',
    fields: ['eyebrow', 'heading'],
    cards: { label: 'Card', fields: ['eyebrow', 'heading', 'body', 'linkLabel', 'linkHref', 'image', 'imagePosition'], max: 8 },
    create: () => ({ eyebrow: 'Label', heading: 'A new heading', cards: cards(3, (i) => ({ eyebrow: `0${i + 1}`, heading: 'Card title', body: 'Short description.', linkLabel: 'EXPLORE', linkHref: '/shop', image: SAMPLE_IMAGE })) }),
  },
  collectionListSection: {
    label: 'Collection list: Grid',
    category: 'Collections',
    description: 'A merchant-curated list of published collections with their current images and descriptions.',
    templateTypes: ['home'],
    fields: ['eyebrow', 'heading', 'body'],
    nestedBlocks: true,
    nestedBlockTypes: ['collectionListHeader', 'collectionListCard'],
    labels: {},
    create: () => ({ eyebrow: '', heading: '', body: '', collectionRefs: [], settings: { layout: 'grid', mobileCarousel: false, cardGap: 12, width: 'page', sectionGap: 12, colorScheme: 'scheme1', paddingTop: 48, paddingBottom: 64 }, blocks: [
      { id: newId('collection-list-header'), type: 'collectionListHeader', label: 'Header', enabled: true, blocks: [
        { id: newId('collection-list-text'), type: 'collectionListText', label: 'Text', enabled: true, heading: 'Shop by collection', body: '' },
      ] },
      { id: newId('collection-list-card'), type: 'collectionListCard', label: 'Collection card', enabled: true, static: true, blocks: [
        { id: newId('collection-list-image'), type: 'collectionListImage', label: 'Image', enabled: true, static: true, image: '', imageAlt: '', imagePosition: 'center' },
        { id: newId('collection-list-title'), type: 'collectionListTitle', label: 'Collection title', enabled: true, heading: '' },
      ] },
    ] }),
  },
  collectionListHeader: {
    label: 'Header',
    category: 'Collections',
    description: 'A group for the collection list heading and introduction.',
    fields: [],
    rootOnly: true,
    unique: true,
    nestedBlocks: true,
    nestedBlockTypes: ['collectionListText'],
    create: () => ({ blocks: [createBlock('collectionListText')] }),
  },
  collectionListText: {
    label: 'Text',
    category: 'Collections',
    description: 'Heading and introduction shown above the collection cards.',
    fields: ['heading', 'body'],
    rootOnly: true,
    unique: true,
    create: () => ({ heading: 'Shop by collection', body: '' }),
  },
  collectionListCard: {
    label: 'Collection card',
    category: 'Collections',
    description: 'A card repeated for each selected collection.',
    fields: [],
    childOnly: true,
    unique: true,
    nestedBlocks: true,
    nestedBlockTypes: ['collectionListImage', 'collectionListTitle'],
    create: () => ({ static: true, blocks: [
      { ...createBlock('collectionListImage'), static: true },
      createBlock('collectionListTitle'),
    ] }),
  },
  collectionListImage: {
    label: 'Image',
    category: 'Collections',
    description: 'The image repeated for each selected collection card. Leave empty to use each collection’s image.',
    fields: ['image', 'imageAlt', 'imagePosition'],
    childOnly: true,
    unique: true,
    labels: { image: 'Image', imagePosition: 'Image focus' },
    create: () => ({ image: '', imageAlt: '', imagePosition: 'center' }),
  },
  collectionListTitle: {
    label: 'Collection title',
    category: 'Collections',
    description: 'The title repeated for each selected collection card.',
    fields: ['heading'],
    childOnly: true,
    unique: true,
    labels: { heading: 'Title override (optional)' },
    create: () => ({ heading: '' }),
  },
  valuesBand: {
    label: 'Values band',
    category: 'Content',
    description: 'A dark band with numbered points and a lotus watermark.',
    fields: ['eyebrow', 'heading', 'linkLabel', 'linkHref'],
    cards: { label: 'Point', fields: ['eyebrow', 'heading', 'body'], max: 6 },
    create: () => ({ eyebrow: 'Label', heading: 'A new heading', cards: cards(3, (i) => ({ eyebrow: `0${i + 1}`, heading: 'Point title', body: 'Short description.' })) }),
  },
  standardsBand: {
    label: 'Standards band',
    category: 'Content',
    description: 'A green band with a heading, short facts, and an italic closing line.',
    fields: ['eyebrow', 'heading', 'body', 'accent'],
    cards: { label: 'Fact', fields: ['heading', 'body'], max: 6 },
    create: () => ({ eyebrow: 'Label', heading: 'A new heading', body: 'Write your text here.', cards: cards(3, () => ({ heading: 'Fact', body: 'Short description.' })) }),
  },
  stepsList: {
    label: 'Numbered steps with photos',
    category: 'Content',
    description: 'An introduction on the left and a list of steps, each with a photo.',
    fields: ['eyebrow', 'heading', 'body'],
    cards: { label: 'Step', fields: ['eyebrow', 'heading', 'body', 'image', 'imageAlt'], max: 10 },
    create: () => ({ eyebrow: 'Label', heading: 'A new heading', body: 'Write your text here.', cards: cards(3, (i) => ({ eyebrow: `0${i + 1}`, heading: 'Step title', body: 'Short description.', image: SAMPLE_IMAGE })) }),
  },
  processTimeline: {
    label: 'Process timeline',
    category: 'Content',
    description: 'Stages connected by a line, each with a botanical icon.',
    fields: ['eyebrow', 'heading', 'body', 'accent', 'linkLabel', 'linkHref'],
    labels: { accent: 'Closing line (large italic)' },
    cards: { label: 'Stage', fields: ['eyebrow', 'heading', 'body', 'icon'], max: 6 },
    create: () => ({ eyebrow: 'THE PROCESS', heading: 'A new heading', body: 'A short introduction.', cards: cards(3, (i) => ({ eyebrow: `STAGE ${['I', 'II', 'III'][i]}`, heading: 'Stage title', body: 'Short description.', icon: TIMELINE_ICONS[i][0] })) }),
  },
  processVideos: {
    label: 'Video steps',
    category: 'Content',
    description: 'A row of short videos with a call-to-action box underneath.',
    fields: ['eyebrow', 'heading', 'body', 'cta.eyebrow', 'cta.heading', 'cta.body', 'cta.linkLabel', 'cta.linkHref'],
    cards: { label: 'Video step', fields: ['heading', 'body', 'video', 'image', 'icon'], labels: { image: 'Poster image' }, max: 6 },
    create: () => ({ eyebrow: 'Label', heading: 'A new heading', body: 'A short introduction.', cards: [], cta: {} }),
  },
  guidanceSplit: {
    label: 'Photo + guidance',
    category: 'Content',
    description: 'Mulberry band with text, a highlighted line, a button, and a photo (Bridal page).',
    fields: ['eyebrow', 'heading', 'body', 'note', 'accent', 'linkLabel', 'linkHref', 'image', 'imageAlt', 'imagePosition'],
    labels: { body: 'Text before the highlight', note: 'Highlighted line', accent: 'Text after the highlight' },
    create: () => ({ eyebrow: 'A considered beginning', heading: 'A new heading', body: 'Write your text here.', note: '', accent: '', linkLabel: 'BOOK AN APPOINTMENT →', linkHref: '/book-appointment', image: SAMPLE_IMAGE }),
  },
  editorialFeature: {
    label: 'Editorial feature',
    category: 'Content',
    description: 'Large editorial photo with a title, introduction, and two links (Bridal page).',
    fields: ['eyebrow', 'heading', 'body', 'linkLabel', 'linkHref', 'secondaryLinkLabel', 'secondaryLinkHref', 'image', 'imageAlt', 'imagePosition'],
    create: () => ({ eyebrow: 'Label', heading: 'A new heading', body: 'Write your text here.', linkLabel: 'EXPLORE THE COLLECTION →', linkHref: '/shop', image: SAMPLE_IMAGE }),
  },
  listingHeader: {
    label: 'Shop page title',
    category: 'Banners',
    templateTypes: ['shop', 'collection-list'],
    description: 'The centered title and introduction at the top of the shop.',
    fields: ['eyebrow', 'heading', 'body'],
    create: () => ({ eyebrow: 'Shop', heading: 'The byShreen Collection', body: 'Write a short introduction.' }),
  },
  productGrid: {
    label: 'Product grid',
    category: 'Collections',
    templateTypes: ['shop'],
    description: 'All published products with the category filter. Products are managed under Products.',
    fields: ['eyebrow'],
    labels: { eyebrow: 'Label above the category filter' },
    create: () => ({ eyebrow: 'SHOP BY CATEGORY' }),
  },
  productInformation: {
    label: 'Product information',
    category: 'Product',
    templateTypes: ['product'],
    description: 'Product gallery, title, description, purchase options, and product details for the current product.',
    fields: ['eyebrow', 'heading', 'body'],
    layouts: [['gallery-left', 'Gallery on the left'], ['gallery-right', 'Gallery on the right']],
    labels: { eyebrow: 'Small label (leave empty for the store label)', heading: 'Title override (leave empty for product title)', body: 'Description override (leave empty for product description)' },
    cards: { label: 'Product information block', fields: [], max: 16 },
    create: () => ({ layout: 'gallery-left', eyebrow: '', heading: '', body: '', cards: PRODUCT_INFORMATION_DEFAULT_BLOCKS.map((block) => ({ ...block })) }),
  },
  featuredProduct: {
    label: 'Featured product',
    category: 'Product',
    templateTypes: ['home'],
    description: 'A single published product presented with its gallery, details, and a link to the product page.',
    fields: [],
    create: () => ({ settings: { productSlug: '', layout: 'media-left', imageRatio: 'portrait', showDescription: true, eyebrow: 'Featured piece', heading: '', buttonLabel: 'View product', colorScheme: 'ivory', paddingTop: 64, paddingBottom: 64 } }),
  },
  productStory: {
    label: 'Product story',
    category: 'Product',
    templateTypes: ['product'],
    description: 'An editorial statement below the product details.',
    fields: ['eyebrow', 'heading', 'body'],
    tones: ['ivory', 'paper', 'olive', 'olive-dark', 'mulberry', 'mulberry-dark'],
    create: () => ({ eyebrow: 'The byShreen standard', heading: 'Design with intention.\nSource with care.\nFinish without compromise.' }),
  },
  relatedProducts: {
    label: 'Related products',
    category: 'Product',
    templateTypes: ['product'],
    description: 'A row of products shoppers may also like.',
    fields: ['eyebrow', 'heading', 'count'],
    create: () => ({ eyebrow: 'Consider next', heading: 'You may also like.', count: 3 }),
  },
  collectionHero: {
    label: 'Collection banner',
    category: 'Collection',
    templateTypes: ['collection'],
    description: 'A large image banner with the current collection name and introduction.',
    fields: ['eyebrow', 'heading', 'body', 'image', 'imageAlt', 'imagePosition'],
    labels: { heading: 'Title override (leave empty for collection name)', body: 'Description override (leave empty for collection description)', image: 'Image override (leave empty for collection image)' },
    create: () => ({ eyebrow: 'Natural Diamonds · 14kt & 18kt Solid Gold', heading: '', body: '', image: '', imageAlt: '', imagePosition: '' }),
  },
  collectionProductGrid: {
    label: 'Collection product grid',
    category: 'Collection',
    templateTypes: ['collection'],
    description: 'The published products assigned to the current collection, or an empty-state message.',
    fields: ['eyebrow'],
    labels: { eyebrow: 'Label above the collection count' },
    create: () => ({ eyebrow: '' }),
  },
  collectionListGrid: {
    label: 'Collections list',
    category: 'Collection',
    templateTypes: ['collection-list'],
    description: 'The live collection cards shown on the Collections page.',
    fields: [],
    create: () => ({}),
  },
  blogPosts: {
    label: 'Blog posts',
    category: 'Storytelling',
    templateTypes: ['home', 'blog'],
    description: 'Published posts from the News blog, displayed in a grid, carousel, or editorial layout.',
    fields: ['layout', 'postCount'],
    sectionPresets: [
      { key: 'grid', label: 'Blog posts: Grid', description: 'An aligned grid of published articles.' },
      { key: 'carousel', label: 'Blog posts: Carousel', description: 'A horizontal, scrollable row of published articles.', postCount: 5 },
      { key: 'editorial', label: 'Blog posts: Editorial', description: 'A staggered editorial layout led by a featured article.' },
    ],
    nestedBlocks: true,
    nestedBlockTypes: ['blogTitle'],
    create: () => ({
      settings: { colorScheme: 'scheme1', layout: 'grid', postCount: 3, paddingTop: 0, paddingBottom: 48, customCss: '' },
      blocks: [
        { id: newId('blog-title'), type: 'blogTitle', label: 'Title', enabled: true, heading: '' },
        {
          id: newId('blog-post'),
          type: 'blogPost',
          label: 'Blog post',
          enabled: true,
          static: true,
          blocks: [
            { id: newId('blog-post-title'), type: 'blogPostTitle', label: 'Title', enabled: true, static: true, settings: { typographyPreset: 'heading3', color: 'heading', paddingTop: 0, paddingRight: 0, paddingBottom: 10, paddingLeft: 0 } },
            { id: newId('blog-post-details'), type: 'blogPostDetails', label: 'Details', enabled: true, static: true, settings: { showDate: true, showAuthor: true, typographyPreset: 'default', paddingTop: 0, paddingBottom: 0 } },
            { id: newId('blog-post-description'), type: 'blogPostDescription', label: 'Description', enabled: true, static: true, settings: { typographyPreset: 'default', paddingTop: 16, paddingBottom: 0 } },
            { id: newId('blog-post-image'), type: 'blogPostImage', label: 'Image', enabled: true, static: true, settings: { height: 'large', borderStyle: 'none', cornerRadius: 4 } },
          ],
        },
      ],
    }),
  },
  blogArticle: {
    label: 'Blog post',
    category: 'Blog post',
    templateTypes: ['blog-post'],
    description: 'The title, details, featured image, and full content of the current article.',
    fields: [],
    nestedBlocks: true,
    nestedBlockTypes: ['blogArticleTitle', 'blogArticleDetails', 'blogArticleImage', 'blogArticleExcerpt', 'blogArticleBody'],
    create: () => ({ blocks: [
      { id: newId('blog-article-image'), type: 'blogArticleImage', label: 'Featured image', enabled: true },
      { id: newId('blog-article-details'), type: 'blogArticleDetails', label: 'Details', enabled: true },
      { id: newId('blog-article-title'), type: 'blogArticleTitle', label: 'Title', enabled: true },
      { id: newId('blog-article-excerpt'), type: 'blogArticleExcerpt', label: 'Excerpt', enabled: true },
      { id: newId('blog-article-body'), type: 'blogArticleBody', label: 'Content', enabled: true },
    ] }),
  },
  blogArticleTitle: {
    label: 'Title',
    category: 'Blog post blocks',
    templateTypes: ['blog-post'],
    description: 'The current article title.',
    fields: [],
    childOnly: true,
    unique: true,
    create: () => ({}),
  },
  blogArticleDetails: {
    label: 'Details',
    category: 'Blog post blocks',
    templateTypes: ['blog-post'],
    description: 'The current article date and author.',
    fields: [],
    childOnly: true,
    unique: true,
    create: () => ({}),
  },
  blogArticleImage: {
    label: 'Featured image',
    category: 'Blog post blocks',
    templateTypes: ['blog-post'],
    description: 'The current article featured image.',
    fields: [],
    childOnly: true,
    unique: true,
    create: () => ({}),
  },
  blogArticleExcerpt: {
    label: 'Excerpt',
    category: 'Blog post blocks',
    templateTypes: ['blog-post'],
    description: 'The current article excerpt.',
    fields: [],
    childOnly: true,
    unique: true,
    create: () => ({}),
  },
  blogArticleBody: {
    label: 'Content',
    category: 'Blog post blocks',
    templateTypes: ['blog-post'],
    description: 'The full rich-text content of the current article.',
    fields: [],
    childOnly: true,
    unique: true,
    create: () => ({}),
  },
  blogTitle: {
    label: 'Title',
    category: 'Blog blocks',
    templateTypes: ['home', 'blog'],
    description: 'The current blog title, with an optional custom title.',
    fields: ['heading'],
    labels: { heading: 'Title' },
    unique: true,
    childOnly: true,
    create: () => ({ heading: '', settings: { width: 'fit', maxWidth: 'normal', typographyPreset: 'heading1', color: 'heading', backgroundEnabled: false, backgroundColor: '#fff6df', paddingTop: 48, paddingRight: 0, paddingBottom: 48, paddingLeft: 0 } }),
  },
  blogPost: {
    label: 'Blog post',
    category: 'Blog blocks',
    templateTypes: ['home', 'blog'],
    description: 'Repeats the following blocks for each published blog post.',
    fields: [],
    childOnly: true,
    create: () => ({ static: true, blocks: [
      { id: newId('blog-post-title'), type: 'blogPostTitle', label: 'Title', enabled: true, static: true, settings: { typographyPreset: 'heading3', color: 'heading', paddingTop: 0, paddingRight: 0, paddingBottom: 10, paddingLeft: 0 } },
      { id: newId('blog-post-details'), type: 'blogPostDetails', label: 'Details', enabled: true, static: true, settings: { showDate: false, showAuthor: false, typographyPreset: 'default', paddingTop: 0, paddingBottom: 0 } },
      { id: newId('blog-post-description'), type: 'blogPostDescription', label: 'Description', enabled: true, static: true, settings: { typographyPreset: 'default', paddingTop: 16, paddingBottom: 0 } },
      { id: newId('blog-post-image'), type: 'blogPostImage', label: 'Image', enabled: true, static: true, settings: { height: 'large', borderStyle: 'none', cornerRadius: 4 } },
    ] }),
  },
  blogPostTitle: {
    label: 'Title',
    category: 'Blog post blocks',
    templateTypes: ['home', 'blog'],
    description: 'The current article title.',
    fields: [],
    childOnly: true,
    create: () => ({}),
  },
  blogPostDetails: {
    label: 'Details',
    category: 'Blog post blocks',
    templateTypes: ['home', 'blog'],
    description: 'The current article date and author details.',
    fields: [],
    childOnly: true,
    create: () => ({}),
  },
  blogPostDescription: {
    label: 'Description',
    category: 'Blog post blocks',
    templateTypes: ['home', 'blog'],
    description: 'The current article description.',
    fields: [],
    childOnly: true,
    create: () => ({}),
  },
  blogPostImage: {
    label: 'Image',
    category: 'Blog post blocks',
    templateTypes: ['home', 'blog'],
    description: 'The current article image.',
    fields: [],
    childOnly: true,
    create: () => ({}),
  },
  searchHeader: {
    label: 'Search header',
    category: 'Search',
    templateTypes: ['search'],
    description: 'The search page title and query form. Search terms stay in the page URL.',
    fields: [],
    layouts: [['center', 'Centered'], ['left', 'Left aligned']],
    tones: ['ivory', 'paper', 'olive', 'mulberry'],
    cards: { label: 'Search block', fields: [], max: 4 },
    create: () => ({ layout: 'center', eyebrow: '', heading: '', body: '', note: '', linkLabel: '', cards: SEARCH_HEADER_DEFAULT_BLOCKS.map((block) => ({ ...block })) }),
  },
  searchResults: {
    label: 'Search results',
    category: 'Search',
    templateTypes: ['search'],
    description: 'Query-matched products and collections, with an empty state when nothing matches.',
    fields: ['note', 'heading', 'body', 'eyebrow', 'linkLabel', 'linkHref'],
    labels: { note: 'Message before a search', heading: 'No results heading', body: 'No results message', eyebrow: 'Recommended products heading', linkLabel: 'No results button text', linkHref: 'No results button link' },
    cards: { label: 'Search results block', fields: [], max: 4 },
    create: () => ({ note: 'Search by piece, collection, metal, or stone.', heading: 'Nothing found yet.', body: 'Try a broader search or contact the atelier for a personal recommendation.', eyebrow: 'You may also like.', linkLabel: 'Ask the atelier', linkHref: '/book-appointment', cards: SEARCH_RESULTS_DEFAULT_BLOCKS.map((block) => ({ ...block })) }),
  },
  cartItems: {
    label: 'Cart items',
    category: 'Cart',
    templateTypes: ['cart'],
    description: 'The shopper’s bag with editable quantities, remove controls, and a continue-shopping link.',
    fields: ['heading', 'body', 'linkLabel', 'linkHref'],
    labels: { heading: 'Section heading', body: 'Introductory text', linkLabel: 'Continue shopping label', linkHref: 'Continue shopping link' },
    create: () => ({ heading: 'Your bag.', body: '', linkLabel: 'Continue shopping', linkHref: '/shop' }),
  },
  cartSummary: {
    label: 'Order summary',
    category: 'Cart',
    templateTypes: ['cart'],
    description: 'The live subtotal and checkout action for the shopper’s current bag.',
    fields: ['heading', 'body', 'linkLabel', 'linkHref'],
    labels: { heading: 'Summary heading', body: 'Shipping and tax note', linkLabel: 'Checkout button label', linkHref: 'Checkout link' },
    create: () => ({ heading: 'Order summary', body: 'Taxes and shipping are calculated at checkout.', linkLabel: 'Checkout', linkHref: '/checkout' }),
  },
  cartRecommendations: {
    label: 'Cart recommendations',
    category: 'Cart',
    templateTypes: ['cart'],
    description: 'A row of available pieces shoppers can add to their bag or view before choosing options.',
    fields: ['eyebrow', 'heading', 'count'],
    labels: { eyebrow: 'Small label', heading: 'Section heading', count: 'Number of products' },
    create: () => ({ eyebrow: 'Consider next', heading: 'A little more to love.', count: 3 }),
  },
  collectionBespokeBand: {
    label: 'Bespoke reassurance',
    category: 'Collection',
    templateTypes: ['collection'],
    description: 'A reassurance panel with links to custom and appointment enquiries.',
    fields: ['eyebrow', 'heading', 'body', 'linkLabel', 'linkHref', 'secondaryLinkLabel', 'secondaryLinkHref'],
    tones: ['ivory', 'paper', 'olive', 'mulberry'],
    create: () => ({ eyebrow: 'Bespoke Fine Jewelry', heading: 'Looking for a personalized touch or specific gold purity?', body: 'Every byShreen design can be commissioned in your preferred choice of 14kt or 18kt yellow, white, or rose gold, or customized with specific diamond dimensions and hand-engravings.', linkLabel: 'CUSTOM INQUIRY →', linkHref: '/custom', secondaryLinkLabel: 'BOOK A PRIVATE CONSULTATION →', secondaryLinkHref: '/book-appointment' }),
  },
  customBand: {
    label: 'Custom band',
    category: 'Content',
    description: 'Text with a button and a link beside a photo (Shop page).',
    fields: ['eyebrow', 'heading', 'body', 'linkLabel', 'linkHref', 'secondaryLinkLabel', 'secondaryLinkHref', 'image', 'imageAlt', 'imagePosition'],
    create: () => ({ eyebrow: 'Custom Jewelry', heading: 'Your story.\n*Made into jewelry.*', body: 'Write your text here.', linkLabel: 'DESIGN SOMETHING CUSTOM →', linkHref: '/custom', secondaryLinkLabel: 'Book a Consultation →', secondaryLinkHref: '/book-appointment', image: SAMPLE_IMAGE }),
  },
  divider: {
    label: 'Divider',
    category: 'Layout',
    description: 'A horizontal rule to separate sections, like Shopify’s Divider.',
    fields: [],
    create: () => ({ settings: { colorScheme: 'inherit', thickness: 1, style: 'solid', paddingTop: 16, paddingBottom: 16 } }),
  },
  customHtml: {
    label: 'Custom HTML',
    category: 'Layout',
    description: 'Your own HTML and CSS, like Shopify’s custom section. Scripts are removed for security. Owners only.',
    fields: ['html', 'css'],
    tones: TEXT_TONES,
    layouts: [['contained', 'Page width'], ['full', 'Full width (edge to edge)']],
    ownerOnly: true,
    create: () => ({ layout: 'contained', html: '<h2>A new section</h2>\n<p>Write your HTML here.</p>', css: 'h2 { font-family: var(--serif); font-weight: 400; }' }),
  },
  customLiquid: {
    label: 'Custom Liquid',
    category: 'Layout',
    description: 'Add Liquid and HTML using the current product or collection’s public details. Owners only.',
    templateTypes: ['product', 'collection'],
    rootOnly: true,
    fields: ['liquid'],
    ownerOnly: true,
    create: () => ({ liquid: '<section class="custom-liquid__content">\n  <h2>{{ product.title }}</h2>\n  <p>{{ product.description }}</p>\n</section>' }),
  },
  group: {
    label: 'Group',
    category: 'Layout',
    description: 'A container for arranging and styling nested blocks together.',
    layouts: [['vertical', 'Vertical'], ['horizontal', 'Horizontal'], ['grid', 'Grid']],
    fields: ['groupGap'],
    nestedBlocks: true,
    create: () => ({ layout: 'vertical', groupGap: 'standard', blocks: [] }),
  },
  comparisonSlider: {
    label: 'Comparison slider',
    category: 'Image compare blocks',
    description: 'Choose two images and let visitors reveal each side with a draggable divider.',
    fields: ['image1', 'image1Alt', 'image2', 'image2Alt'],
    childOnly: true,
    create: () => ({ image1: '', image1Alt: '', image2: '', image2Alt: '', settings: { direction: 'horizontal', aspectRatio: 'auto', widthMode: 'fill', customWidth: 65, mobileWidthMode: 'fill', mobileCustomWidth: 100, textOnImages: false, inheritColorScheme: true, borderStyle: 'none', cornerRadius: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 } }),
  },
  testimonials: {
    label: 'Client stories',
    category: 'Collections',
    description: 'The carousel of client testimonials.',
    fields: ['eyebrow', 'heading', 'body'],
    tones: ['mulberry'],
    create: () => ({ eyebrow: 'Every piece starts with a story.', heading: 'Real people. Real moments.', body: 'A few words from the people who wear byShreen.' }),
  },
  proposalsGallery: {
    label: 'Proposals gallery',
    category: 'Collections',
    description: 'The grid of client proposal photos.',
    fields: ['eyebrow', 'heading', 'body', 'linkLabel', 'linkHref'],
    labels: { body: 'Subtitle (optional)', linkLabel: '“See more” link text (optional)' },
    tones: ['paper', 'olive', 'mulberry'],
    create: () => ({ tone: 'olive', eyebrow: 'byShreen Proposals', heading: 'Stories that started here.', linkLabel: 'SEE MORE BYSHREEN PROPOSALS →', linkHref: '/proposals' }),
  },
  featuredProducts: {
    label: 'Featured products',
    category: 'Collections',
    description: 'The newest products from the catalog.',
    fields: ['eyebrow', 'heading', 'body', 'count', 'linkLabel', 'linkHref'],
    create: () => ({ eyebrow: 'The Current Edit', heading: 'Jewelry to live in.', body: '', count: 8, linkLabel: 'SHOP ALL', linkHref: '/shop' }),
  },
  inquiryForm: {
    label: 'Enquiry form',
    category: 'Forms',
    description: 'The custom-jewelry enquiry form with an introduction.',
    fields: ['eyebrow', 'heading', 'body'],
    create: () => ({ eyebrow: 'BEGIN TODAY', heading: 'Ready to make something yours?', body: 'Tell us what’s on your mind. We’ll take it from there.' }),
  },
  emailSignup: {
    label: 'Email signup',
    category: 'Forms',
    description: 'A newsletter sign-up form for email updates.',
    fields: ['heading', 'body', 'linkLabel'],
    labels: { body: 'Description', linkLabel: 'Button text' },
    layouts: [['centered', 'Centered'], ['left', 'Left aligned']],
    tones: ['ivory', 'paper', 'olive', 'olive-dark', 'mulberry', 'mulberry-dark'],
    create: () => ({
      layout: 'centered',
      tone: 'ivory',
      heading: 'Subscribe to our emails',
      body: 'Be the first to know about new collections and special offers.',
      linkLabel: 'Sign up',
    }),
  },
  passwordSection: {
    label: 'Password',
    category: 'Template',
    templateTypes: ['password'],
    description: 'A storefront password page with a logo, message, and email signup.',
    fields: [],
    nestedBlocks: true,
    nestedBlockTypes: ['passwordLogo', 'passwordText', 'emailSignup'],
    create: () => ({
      settings: { direction: 'vertical', alignment: 'center', position: 'center', gap: 12, width: 'page', colorScheme: 'scheme1', backgroundMedia: 'none', borderStyle: 'none', cornerRadius: 0, paddingTop: 0, paddingRight: 24, paddingBottom: 0, paddingLeft: 24, customCss: '' },
      blocks: [
        { id: newId('password-logo'), type: 'passwordLogo', label: 'Logo', enabled: true, image: '', imageAlt: '' },
        { id: newId('password-heading'), type: 'passwordText', label: 'Text', enabled: true, body: 'Your store is coming soon.', settings: { style: 'heading' } },
        { id: newId('password-message'), type: 'passwordText', label: 'Text', enabled: true, body: 'Sign up to hear when we open.', settings: { style: 'body' } },
        { id: newId('password-email-signup'), type: 'emailSignup', label: 'Email signup', enabled: true, ...BLOCK_TYPES.emailSignup.create() },
      ],
    }),
    unique: true,
  },
  passwordLogo: {
    label: 'Logo',
    category: 'Password blocks',
    description: 'The password page logo. Leave the image empty to use the store logo.',
    fields: ['image', 'imageAlt'],
    childOnly: true,
    create: () => ({ image: '', imageAlt: '' }),
  },
  passwordText: {
    label: 'Text',
    category: 'Password blocks',
    description: 'A heading or message on the password page.',
    fields: ['body'],
    childOnly: true,
    create: () => ({ body: '', settings: { style: 'body' } }),
  },
  passwordFooter: {
    label: 'Password footer',
    category: 'Template',
    templateTypes: ['password'],
    description: 'The separate footer row with Shopify attribution and the password entry action.',
    fields: [],
    create: () => ({ static: true }),
    unique: true,
  },
  appointmentForm: {
    label: 'Appointment booking form',
    category: 'Forms',
    description: 'The appointment request form with the calendar and flower animation.',
    fields: ['body'],
    labels: { body: 'Location note' },
    create: () => ({ body: 'All appointments take place at the byShreen NYC office or virtually via video consultation.' }),
  },
  instagram: {
    label: 'Instagram feed',
    category: 'Collections',
    description: 'Your Instagram posts and reels. Add or reorder them under Admin → Instagram.',
    fields: [],
    create: () => ({}),
  },
  notFound: {
    label: '404',
    category: 'Template',
    templateTypes: ['404'],
    description: 'A customizable page-not-found message with editable heading, text, and button blocks.',
    fields: [],
    nestedBlocks: true,
    create: () => ({
      settings: { width: 'standard', height: 'small', alignment: 'center', position: 'center', gap: 20, colorScheme: 'ivory', paddingTop: 100, paddingBottom: 100, customCss: '' },
      blocks: NOT_FOUND_DEFAULT_BLOCKS.map((block) => ({ ...block })),
    }),
  },
  featuredCollection: {
    label: 'Featured collection',
    category: 'Template',
    templateTypes: ['home', '404'],
    description: 'A selected collection presented as a product grid, carousel, or editorial layout.',
    fields: [],
    nestedBlocks: true,
    nestedBlockTypes: ['featuredCollectionHeader', 'featuredCollectionProductCard'],
    create: () => ({ settings: { collectionHandle: 'all', layout: 'grid', mobileCarousel: false, productCount: 4, columns: 4, mobileColumns: 2, horizontalGap: 12, verticalGap: 12, heading: '', width: 'standard', alignment: 'left', gap: 28, colorScheme: 'paper', paddingTop: 48, paddingBottom: 64, customCss: '', blockSchemaVersion: FEATURED_COLLECTION_BLOCK_SCHEMA_VERSION }, blocks: createFeaturedCollectionBlocks() }),
  },
  featuredCollectionHeader: {
    label: 'Header',
    category: 'Featured collection blocks',
    description: 'A collection header with its dynamic collection title.',
    fields: [],
    childOnly: true,
    nestedBlocks: true,
    nestedBlockTypes: ['featuredCollectionButton', 'featuredCollectionHeading', 'featuredCollectionText', 'featuredCollectionTitle', 'featuredCollectionViewAll', 'featuredCollectionDivider', 'featuredCollectionSpacer', 'featuredCollectionGenerate'],
    create: () => ({ blocks: [{ id: newId('featured-collection-title'), type: 'featuredCollectionTitle', label: 'Collection title', enabled: true }] }),
  },
  featuredCollectionTitle: {
    label: 'Collection title',
    category: 'Featured collection blocks',
    description: 'The title for the selected collection.',
    fields: ['heading'],
    labels: { heading: 'Custom title (optional)' },
    childOnly: true,
    create: () => ({ heading: '' }),
  },
  featuredCollectionProductCard: {
    label: 'Product card',
    category: 'Featured collection blocks',
    description: 'Repeats for each product in the selected collection.',
    fields: [],
    childOnly: true,
    nestedBlocks: true,
    nestedBlockTypes: ['featuredCollectionHeading', 'featuredCollectionImage', 'featuredCollectionText', 'featuredCollectionCustomLiquid', 'featuredCollectionGroup', 'featuredCollectionBuyButtons', 'featuredCollectionMedia', 'featuredCollectionPrice', 'featuredCollectionReviewStars', 'featuredCollectionSku', 'featuredCollectionSwatches', 'featuredCollectionProductTitle'],
    create: () => {
      const productCard = createFeaturedCollectionProductCard();
      return { settings: productCard.settings, blocks: productCard.blocks };
    },
  },
  featuredCollectionGroup: {
    label: 'Group',
    category: 'Featured collection blocks',
    description: 'Arrange product-bound details together.',
    fields: [],
    childOnly: true,
    nestedBlocks: true,
    nestedBlockTypes: ['featuredCollectionHeading', 'featuredCollectionImage', 'featuredCollectionText', 'featuredCollectionCustomLiquid', 'featuredCollectionGroup', 'featuredCollectionPrice', 'featuredCollectionReviewStars', 'featuredCollectionSku', 'featuredCollectionSwatches', 'featuredCollectionProductTitle'],
    create: () => {
      const group = createFeaturedCollectionGroup();
      return { settings: group.settings, blocks: group.blocks };
    },
  },
  featuredCollectionMedia: {
    label: 'Media',
    category: 'Featured collection blocks',
    description: 'Product images with hover media and image ratio controls.',
    fields: [],
    childOnly: true,
    create: () => ({ settings: { aspectRatio: 'auto', showSecondaryImage: true, showViewLink: true, borderStyle: 'none', cornerRadius: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 } }),
  },
  featuredCollectionProductTitle: {
    label: 'Title',
    category: 'Featured collection blocks',
    description: 'The title of the product in this card.',
    fields: [],
    childOnly: true,
    create: () => ({ settings: { width: 'fill', maxWidth: 0, typographyPreset: 'heading', color: 'inherit', background: 'none', paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 } }),
  },
  featuredCollectionPrice: {
    label: 'Price',
    category: 'Featured collection blocks',
    description: 'The price or enquiry status of the product in this card.',
    fields: [],
    childOnly: true,
    create: () => ({ settings: { showSaleFirst: true, showInstallmentPrice: false, showTaxInformation: false, typographyPreset: 'caption', width: 'fit', alignment: 'left', color: 'inherit', paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 } }),
  },
  featuredCollectionHeading: {
    label: 'Heading',
    category: 'Featured collection blocks',
    description: 'A custom heading inside this block.',
    fields: ['heading'],
    childOnly: true,
    create: () => ({ heading: '' }),
  },
  featuredCollectionImage: {
    label: 'Image',
    category: 'Featured collection blocks',
    description: 'An image selected from the media library.',
    fields: ['image', 'imageAlt', 'imagePosition'],
    childOnly: true,
    create: () => ({ image: '', imageAlt: '', imagePosition: '' }),
  },
  featuredCollectionText: {
    label: 'Text',
    category: 'Featured collection blocks',
    description: 'Custom text content inside this block.',
    fields: ['body'],
    childOnly: true,
    create: () => ({ body: '' }),
  },
  featuredCollectionButton: {
    label: 'Button',
    category: 'Featured collection blocks',
    description: 'A button inside the collection header.',
    fields: ['linkLabel', 'linkHref'],
    labels: { linkLabel: 'Button text', linkHref: 'Button link' },
    childOnly: true,
    create: () => ({ linkLabel: 'Shop collection', linkHref: '/shop' }),
  },
  featuredCollectionViewAll: {
    label: 'View all button',
    category: 'Featured collection blocks',
    description: 'Links to the collection selected in the parent section.',
    fields: ['linkLabel'],
    labels: { linkLabel: 'Button text' },
    childOnly: true,
    create: () => ({ linkLabel: 'View all' }),
  },
  featuredCollectionDivider: {
    label: 'Divider',
    category: 'Featured collection blocks',
    description: 'A horizontal divider between header blocks.',
    fields: [],
    childOnly: true,
    create: () => ({}),
  },
  featuredCollectionSpacer: {
    label: 'Spacer',
    category: 'Featured collection blocks',
    description: 'Adjustable blank space between header blocks.',
    fields: ['spacerHeight'],
    childOnly: true,
    create: () => ({ spacerHeight: 24 }),
  },
  featuredCollectionGenerate: {
    label: 'Generate',
    category: 'Featured collection blocks',
    description: 'AI block generation is unavailable in this editor.',
    fields: [],
    childOnly: true,
    unavailableReason: 'Block generation is unavailable in this editor.',
    create: () => ({}),
  },
  featuredCollectionCustomLiquid: {
    label: 'Custom Liquid',
    category: 'Featured collection blocks',
    description: 'Liquid templates are unavailable because this editor has no Liquid runtime.',
    fields: [],
    childOnly: true,
    unavailableReason: 'Custom Liquid requires a Liquid runtime, which this editor does not provide.',
    create: () => ({}),
  },
  featuredCollectionBuyButtons: {
    label: 'Buy buttons',
    category: 'Featured collection blocks',
    description: 'Add the parent product to the bag or open its options.',
    fields: ['linkLabel'],
    labels: { linkLabel: 'Button label' },
    childOnly: true,
    create: () => ({ linkLabel: 'Add to bag' }),
  },
  featuredCollectionReviewStars: {
    label: 'Review stars',
    category: 'Featured collection blocks',
    description: 'Ratings are unavailable because no reviews integration is configured.',
    fields: [],
    childOnly: true,
    unavailableReason: 'Review stars need a reviews integration and rating data.',
    create: () => ({}),
  },
  featuredCollectionSku: {
    label: 'SKU',
    category: 'Featured collection blocks',
    description: 'The SKU from the parent product’s first active option.',
    fields: [],
    childOnly: true,
    create: () => ({ settings: { showLabel: true, typographyPreset: 'caption', width: 'fit', alignment: 'left', color: 'inherit', background: 'none', paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 } }),
  },
  featuredCollectionSwatches: {
    label: 'Swatches',
    category: 'Featured collection blocks',
    description: 'Displays the parent product’s active metal options.',
    fields: [],
    childOnly: true,
    create: () => ({ settings: { desktopAlignment: 'left', mobileAlignment: 'left', paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0 } }),
  },
  heading: {
    label: 'Heading',
    category: '404 content',
    description: 'A heading inside the 404 section.',
    fields: ['heading'],
    childOnly: true,
    create: () => ({ heading: 'Page not found' }),
  },
  heroEyebrow: {
    label: 'Text',
    category: 'Hero content blocks',
    description: 'Small text above the hero heading.',
    fields: ['eyebrow'],
    childOnly: true,
    create: () => ({ eyebrow: 'A short label' }),
  },
  heroHeading: {
    label: 'Heading',
    category: 'Hero content blocks',
    description: 'The main heading inside the hero.',
    fields: ['heading'],
    childOnly: true,
    create: () => ({ heading: 'A new heading' }),
  },
  heroText: {
    label: 'Text',
    category: 'Hero content blocks',
    description: 'A short paragraph inside the hero.',
    fields: ['body'],
    childOnly: true,
    create: () => ({ body: 'A short introduction.' }),
  },
  heroButton: {
    label: 'Button',
    category: 'Hero content blocks',
    description: 'A link button inside the hero.',
    fields: ['linkLabel', 'linkHref'],
    labels: { linkLabel: 'Button label', linkHref: 'Button link' },
    childOnly: true,
    create: () => ({ linkLabel: 'Shop now', linkHref: '/shop', settings: { variant: 'primary' } }),
  },
  text: {
    label: 'Text',
    category: '404 content',
    description: 'Explanatory text inside the 404 section.',
    fields: ['body'],
    childOnly: true,
    create: () => ({ body: "The page you're looking for doesn't exist or has moved." }),
  },
  button: {
    label: 'Button',
    category: '404 content',
    description: 'A link button inside the 404 section.',
    fields: ['linkLabel', 'linkHref'],
    childOnly: true,
    create: () => ({ linkLabel: 'Continue shopping', linkHref: '/shop' }),
  },
};

export function createBlock(type) {
  const block = { id: newId(type), type, ...BLOCK_TYPES[type].create() };
  if (type === 'heroVideo' || type === 'heroImage') {
    block.settings = {
      ...getHeroSectionDefaults(type),
      ...(block.settings || {}),
      media1ShowDifferentOnMobile: false,
      stackMediaOnMobile: false,
      heroContentSchemaVersion: HERO_CONTENT_BLOCK_SCHEMA_VERSION,
    };
    block.blocks = createHeroContentBlocks(block);
  }
  return block;
}

export function createSectionCard(block) {
  const cardConfig = BLOCK_TYPES[block.type]?.cards;
  if (!cardConfig) return null;
  const existingCards = block.cards || [];
  const template = existingCards[existingCards.length - 1] || {};
  const fields = Object.fromEntries(cardConfig.fields.map((field) => [
    field,
    field === 'image' ? '' : field === 'icon' || field === 'shape' ? template[field] || '' : '',
  ]));
  return { ...fields, id: newId('card'), heading: 'New item' };
}

export function getPath(object, path) {
  return path.split('.').reduce((value, key) => (value == null ? value : value[key]), object);
}

export function setPath(object, path, value) {
  const [head, ...rest] = path.split('.');
  if (!rest.length) return { ...object, [head]: value };
  return { ...object, [head]: setPath(object[head] || {}, rest.join('.'), value) };
}

export function blockSummary(block) {
  const text = block.heading || block.body || block.eyebrow || '';
  return String(text).replace(/\*/g, '').split('\n')[0].slice(0, 80);
}

/**
 * Read the shared hero Media 1 slot while keeping the older hero block fields
 * meaningful. In particular, `heroVideo.image` is a poster, never an image
 * slot value.
 */
export function getHeroMediaConfiguration(block) {
  const settings = block?.settings && typeof block.settings === 'object' && !Array.isArray(block.settings)
    ? block.settings
    : {};
  const savedType = settings.media1Type;
  const savedMobilePreference = settings.media1ShowDifferentOnMobile;
  const media2 = {
    type: settings.media2Type === 'video' ? 'video' : 'image',
    image: settings.media2Image || '',
    imageAlt: settings.media2ImageAlt || '',
    imagePosition: settings.media2ImagePosition || '',
    mobileImage: settings.media2MobileImage || '',
    mobileImagePosition: settings.media2MobileImagePosition || '',
    video: settings.media2Video || '',
    poster: settings.media2Poster || '',
    posterPosition: settings.media2PosterPosition || '',
    mobileVideo: settings.media2MobileVideo || '',
    mobilePoster: settings.media2MobilePoster || '',
    mobilePosterPosition: settings.media2MobilePosterPosition || '',
  };
  const hasLegacyMobileMedia = block?.type === 'heroVideo'
    ? Boolean(block.mobileVideo || block.mobileImage)
    : Boolean(block?.mobileImage);
  const inferredMobilePreference = Boolean(
    (savedType === 'image' || savedType === 'video'
      ? settings.media1MobileImage || settings.media1MobileVideo || settings.media1MobilePoster
      : hasLegacyMobileMedia)
    || media2.mobileImage || media2.mobileVideo || media2.mobilePoster,
  );
  const showDifferentOnMobile = typeof savedMobilePreference === 'boolean'
    ? savedMobilePreference
    : inferredMobilePreference;
  const stackMediaOnMobile = settings.stackMediaOnMobile === true;

  if (savedType === 'image' || savedType === 'video') {
    return {
      type: savedType,
      showDifferentOnMobile,
      stackMediaOnMobile,
      media2,
      image: settings.media1Image || '',
      imageAlt: settings.media1ImageAlt || '',
      imagePosition: settings.media1ImagePosition || '',
      mobileImage: settings.media1MobileImage || '',
      mobileImagePosition: settings.media1MobileImagePosition || '',
      video: settings.media1Video || '',
      // Poster is file-level cover (sidecar) first; section-level media1Poster is override.
      // HeroMediaLayers prefers `poster` but BlockRenderer may enrich via focalPointBySource/cover.
      poster: settings.media1Poster || '',
      posterPosition: settings.media1PosterPosition || '',
      mobileVideo: settings.media1MobileVideo || '',
      mobilePoster: settings.media1MobilePoster || '',
      mobilePosterPosition: settings.media1MobilePosterPosition || '',
      coverSource: settings.media1Video || '',
    };
  }

  if (block?.type === 'heroVideo') {
    return {
      type: 'video',
      showDifferentOnMobile,
      stackMediaOnMobile,
      media2,
      image: '',
      imageAlt: '',
      imagePosition: '',
      mobileImage: '',
      mobileImagePosition: '',
      video: block.video || '',
      poster: block.image || '',
      posterPosition: block.imagePosition || '',
      mobileVideo: block.mobileVideo || '',
      mobilePoster: block.mobileImage || '',
      mobilePosterPosition: block.mobileImagePosition || '',
    };
  }

  return {
    type: 'image',
    showDifferentOnMobile,
    stackMediaOnMobile,
    media2,
    image: block?.image || '',
    imageAlt: block?.imageAlt || '',
    imagePosition: block?.imagePosition || '',
    mobileImage: block?.mobileImage || '',
    mobileImagePosition: block?.mobileImagePosition || '',
    video: '',
    poster: '',
    posterPosition: '',
    mobileVideo: '',
    mobilePoster: '',
    mobilePosterPosition: '',
  };
}

/** Persist the whole Media 1 state the first time it is edited, so switching
 * types or clearing a media field never falls back to a legacy field. */
export function updateHeroMediaConfiguration(block, patch) {
  const configuration = { ...getHeroMediaConfiguration(block), ...patch };
  return {
    ...block,
    settings: {
      ...(block.settings && typeof block.settings === 'object' && !Array.isArray(block.settings) ? block.settings : {}),
      media1Type: configuration.type,
      media1ShowDifferentOnMobile: configuration.showDifferentOnMobile,
      stackMediaOnMobile: configuration.stackMediaOnMobile,
      media1Image: configuration.image,
      media1ImageAlt: configuration.imageAlt,
      media1ImagePosition: configuration.imagePosition,
      media1MobileImage: configuration.mobileImage,
      media1MobileImagePosition: configuration.mobileImagePosition,
      media1Video: configuration.video,
      media1Poster: configuration.poster,
      media1MobileVideo: configuration.mobileVideo,
      media1MobilePoster: configuration.mobilePoster,
      media2Type: configuration.media2.type,
      media2Image: configuration.media2.image,
      media2ImageAlt: configuration.media2.imageAlt,
      media2ImagePosition: configuration.media2.imagePosition,
      media2MobileImage: configuration.media2.mobileImage,
      media2MobileImagePosition: configuration.media2.mobileImagePosition,
      media2Video: configuration.media2.video,
      media2Poster: configuration.media2.poster,
      media2MobileVideo: configuration.media2.mobileVideo,
      media2MobilePoster: configuration.media2.mobilePoster,
    },
  };
}

// Recommended shape and size for each photo/video slot, measured from the live layout on a
// 1440px desktop and a 390px phone. `aspect` (width ÷ height) sizes the preview in the admin.
const GUIDES = {
  'heroVideo.video': { aspect: 16 / 9, ratio: '16:9 landscape', size: '1920 × 1080', note: 'MP4, 10–20 second loop, under 30 MB. No sound is played.' },
  'heroVideo.image': { aspect: 16 / 9, ratio: '16:9 landscape', size: '1920 × 1080', note: 'Use a frame from the video.' },
  'heroVideo.mobileVideo': { aspect: 9 / 16, ratio: '9:16 portrait (like a Reel)', size: '1080 × 1920', note: 'Phones show the hero tall and narrow, so a vertical video fills it best.' },
  'heroVideo.mobileImage': { aspect: 9 / 16, ratio: '9:16 portrait', size: '1080 × 1920', note: 'Use a frame from the phone video.' },
  'heroImage.image': { aspect: 2, ratio: '2:1 wide landscape', size: '2400 × 1200', note: 'Text sits on the lower left; keep faces toward the center or right.' },
  'heroImage.mobileImage': { aspect: 3 / 5, ratio: '3:5 portrait', size: '1080 × 1800', note: 'Phones show the hero tall; a portrait photo avoids cropping faces.' },
  'splitImage.image': { aspect: 1, ratio: '1:1 square', size: '1600 × 1600', note: 'Phones crop it slightly wider.' },
  'letter.image': { aspect: 1, ratio: '1:1 square', size: '1600 × 1600', note: 'Phones crop it slightly wider; keep the face centered.' },
  'guidanceSplit.image': { aspect: 1, ratio: '1:1 square', size: '1600 × 1600', note: 'Phones crop it slightly taller (4:5).' },
  'editorialFeature.image': { aspect: 1, ratio: '1:1 square', size: '1600 × 1600', note: 'Phones crop it slightly taller (4:5).' },
  'customBand.image': { aspect: 4 / 3, ratio: '4:3 landscape', size: '1600 × 1200', note: 'Phones crop it slightly wider (16:10).' },
  'imageCards.cards.image': { aspect: 3 / 4, ratio: '3:4 portrait', size: '1200 × 1600', note: 'Same shape on phones.' },
  'stepsList.cards.image': { aspect: 3 / 2, ratio: '3:2 landscape', size: '1500 × 1000', note: 'Same shape on phones.' },
  'processVideos.cards.video': { aspect: 16 / 10, ratio: '16:10 landscape', size: '1280 × 800', note: 'MP4 under 15 MB. Same shape on phones.' },
  'processVideos.cards.image': { aspect: 16 / 10, ratio: '16:10 landscape', size: '1280 × 800', note: 'Use a frame from the video.' },
  'storyChapter.cards.image.portrait': { aspect: 3 / 4, ratio: '3:4 portrait', size: '1200 × 1600', note: 'Same shape on phones.' },
  'storyChapter.cards.image.landscape': { aspect: 4 / 3, ratio: '4:3 landscape', size: '1600 × 1200', note: 'Same shape on phones.' },
};

/** The size guide for a field, e.g. mediaGuide('heroImage', 'image') or mediaGuide('imageCards', 'image', card). */
export function mediaGuide(type, field, card) {
  if (card) {
    if (type === 'storyChapter' && field === 'image') return GUIDES[`storyChapter.cards.image.${card.shape === 'portrait' ? 'portrait' : 'landscape'}`];
    return GUIDES[`${type}.cards.${field}`] || null;
  }
  return GUIDES[`${type}.${field}`] || null;
}
