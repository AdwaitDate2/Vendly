import { z } from 'zod';
import { faqCategories } from '../data/faq.js';
import { guideToSections } from './content-guides.js';
import { BLOCK_PAGES, DEFAULT_PAGE_BLOCKS } from './page-blocks.js';
import { DEFAULT_HEADER_SECTION, navigationPresentationFromSections } from './header-settings.js';
import {
  LEGACY_THEME_SECTION_SOURCES,
  THEME_SECTION_GROUPS_SCHEMA_VERSION,
  resolveThemeSectionGroups,
} from './theme-section-groups.js';
import { getDb } from './mongodb';

const CONTENT_COLLECTION = 'siteContent';
const REVISION_COLLECTION = 'contentRevisions';

export const contentKeys = [
  'navigation',
  'home',
  'about',
  'global',
  'announcementBars',
  'footerGroups',
  'clientCare',
  'shipping',
  'returns',
  'faq',
  'care',
  'sizeGuide',
  'materialsSourcing',
  'repairsWarranty',
  'privacy',
  'terms',
  'accessibility',
  'cookies',
  'privacyChoices',
  'bespoke',
  'contact',
  'appointments',
  'bridal',
  'shop',
];

export const contentRouteMap = {
  navigation: '/',
  home: '/',
  about: '/our-story',
  bridal: '/bridal',
  shop: '/shop',
  global: '/',
  clientCare: '/client-care',
  shipping: '/shipping-returns',
  returns: '/shipping-returns',
  faq: '/faq',
  care: '/repairs-care',
  sizeGuide: '/size-guide',
  materialsSourcing: '/craftsmanship',
  repairsWarranty: '/repairs-care',
  privacy: '/privacy',
  terms: '/terms',
  accessibility: '/accessibility',
  cookies: '/cookies',
  privacyChoices: '/privacy-choices',
  bespoke: '/custom',
  contact: '/book-appointment',
  appointments: '/book-appointment',
};

const statusSchema = z.enum(['draft', 'published', 'archived']);

const str = (max) => z.string().trim().max(max).default('');

// Keep editor-authored settings and nested blocks bounded before they enter the
// saved content document. Legacy section/card fields remain their own schema.
const MAX_NESTED_BLOCK_DEPTH = 5;
const MAX_CHILD_BLOCKS = 24;
const MAX_TOTAL_NESTED_BLOCKS = 1000;
const MAX_SETTINGS_DEPTH = 5;
const MAX_SETTINGS_CONTAINER_ENTRIES = 100;
const MAX_SETTINGS_NODES = 2000;
const settingKeySchema = z.string().min(1).max(100);

function boundedRecord(valueSchema) {
  return z.record(settingKeySchema, valueSchema).superRefine((value, context) => {
    if (Object.keys(value).length > MAX_SETTINGS_CONTAINER_ENTRIES) {
      context.addIssue({
        code: 'custom',
        message: `Settings objects may contain at most ${MAX_SETTINGS_CONTAINER_ENTRIES} entries.`,
      });
    }
  });
}

function createBoundedJsonValueSchema(remainingDepth) {
  const primitiveSchema = z.union([
    z.string().max(10000),
    z.number().finite(),
    z.boolean(),
    z.null(),
  ]);

  if (remainingDepth <= 0) return primitiveSchema;

  const nestedValueSchema = createBoundedJsonValueSchema(remainingDepth - 1);
  return z.union([
    primitiveSchema,
    z.array(nestedValueSchema).max(MAX_SETTINGS_CONTAINER_ENTRIES),
    boundedRecord(nestedValueSchema),
  ]);
}

function prevalidateSettingsBounds(settings, context) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return settings;

  let settingsNodeCount = 0;
  let hasBoundsIssue = false;
  const activeContainers = new Set();
  const addBoundsIssue = (path, message) => {
    context.addIssue({ code: 'custom', path, message });
    hasBoundsIssue = true;
  };

  function visitValue(value, depth, path) {
    if (hasBoundsIssue) return;
    settingsNodeCount += 1;
    if (settingsNodeCount > MAX_SETTINGS_NODES) {
      addBoundsIssue(path, `Settings data may contain at most ${MAX_SETTINGS_NODES} values.`);
      return;
    }

    if (!value || typeof value !== 'object') return;
    if (depth > MAX_SETTINGS_DEPTH) {
      addBoundsIssue(path, `Settings data may be at most ${MAX_SETTINGS_DEPTH} levels deep.`);
      return;
    }

    if (activeContainers.has(value)) {
      addBoundsIssue(path, 'Settings data cannot contain circular references.');
      return;
    }

    const isArray = Array.isArray(value);
    const entries = isArray ? value : Object.entries(value);
    if (entries.length > MAX_SETTINGS_CONTAINER_ENTRIES) {
      addBoundsIssue(
        path,
        `Settings containers may contain at most ${MAX_SETTINGS_CONTAINER_ENTRIES} entries.`,
      );
      return;
    }

    activeContainers.add(value);
    if (isArray) {
      value.forEach((child, childIndex) => visitValue(child, depth + 1, [...path, childIndex]));
    } else {
      entries.forEach(([key, child]) => {
        if (key === 'customCss' && (typeof child !== 'string' || child.length > 500)) {
          addBoundsIssue([...path, key], 'Section Custom CSS must be a string of at most 500 characters.');
          return;
        }
        visitValue(child, depth + 1, [...path, key]);
      });
    }
    activeContainers.delete(value);
  }

  const settingEntries = Object.entries(settings);
  if (settingEntries.length > MAX_SETTINGS_CONTAINER_ENTRIES) {
    addBoundsIssue([], `Settings objects may contain at most ${MAX_SETTINGS_CONTAINER_ENTRIES} entries.`);
    return z.NEVER;
  }

  settingEntries.forEach(([key, value]) => visitValue(value, 1, [key]));
  return hasBoundsIssue ? z.NEVER : settings;
}

const genericSettingsSchema = z.preprocess(
  prevalidateSettingsBounds,
  boundedRecord(createBoundedJsonValueSchema(MAX_SETTINGS_DEPTH)),
);

const blockCardFields = {
  id: z.string().trim().min(1).max(80),
  type: str(40),
  label: z.string().trim().max(100).default(''),
  enabled: z.boolean().default(true),
  eyebrow: str(120),
  heading: str(240),
  body: str(3000),
  note: str(600),
  accent: str(600),
  tone: str(30),
  layout: str(30),
  count: z.coerce.number().int().min(0).max(48).default(0),
  image: str(600),
  imageAlt: str(300),
  imagePosition: str(60),
  mobileImage: str(600),
  mobileImagePosition: str(60),
  video: str(600),
  mobileVideo: str(600),
  icon: str(400),
  shape: str(20),
  showAvailability: z.boolean().optional(),
  showPriceFilter: z.boolean().optional(),
  showSorting: z.boolean().optional(),
  autoLoad: z.boolean().optional(),
  fullWidthMobile: z.boolean().optional(),
  cardSize: str(20),
  mobileCardSize: str(20),
  groupGap: str(20),
  linkLabel: str(120),
  linkHref: str(400),
  secondaryLinkLabel: str(120),
  secondaryLinkHref: str(400),
  dynamicSource: str(120),
  collectionRefs: z.array(z.string().trim().min(1).max(120)).max(24).default([]),
  static: z.boolean().optional(),
  design: z.object({
    width: z.enum(['default', 'narrow', 'standard', 'wide', 'full']).default('default'),
    spacing: z.enum(['default', 'compact', 'standard', 'spacious']).default('default'),
    align: z.enum(['default', 'left', 'center', 'right']).default('default'),
    background: z.enum(['default', 'ivory', 'paper', 'olive', 'mulberry']).default('default'),
    headingSize: z.enum(['default', 'small', 'standard', 'large']).default('default'),
  }).prefault({}),
};

function createNestedBlockSchema(remainingDepth = MAX_NESTED_BLOCK_DEPTH) {
  const nestedBlocksSchema = remainingDepth > 1
    ? z.array(createNestedBlockSchema(remainingDepth - 1)).max(MAX_CHILD_BLOCKS).default([])
    // An explicit empty-only schema rejects excessive nesting rather than
    // silently stripping a `blocks` property at the depth limit.
    : z.array(z.never()).max(0).default([]);

  return z.object({
    ...blockCardFields,
    settings: genericSettingsSchema.default({}),
    blocks: nestedBlocksSchema,
  });
}

const blockCardSchema = createNestedBlockSchema();

export const contentSectionSchema = z.object({
  id: z.string().trim().min(1).max(80),
  type: str(40),
  label: z.string().trim().max(100).default(''),
  enabled: z.boolean().default(true),
  tone: str(30),
  layout: str(30),
  accent: str(600),
  image: str(600),
  imageAlt: str(300),
  imagePosition: str(60),
  dynamicSource: str(120),
  video: str(600),
  mobileImage: str(600),
  mobileImagePosition: str(60),
  mobileVideo: str(600),
  settings: genericSettingsSchema.default({}),
  groupGap: str(20),
  blocks: z.array(blockCardSchema).max(MAX_CHILD_BLOCKS).default([]),
  html: str(20000),
  css: str(10000),
  liquid: str(12000),
  count: z.coerce.number().int().min(0).max(48).default(0),
  cards: z.array(blockCardSchema).max(24).default([]),
  cta: z.object({ eyebrow: str(120), heading: str(240), body: str(1000), linkLabel: str(120), linkHref: str(400) }).prefault({}),
  eyebrow: z.string().trim().max(120).default(''),
  heading: z.string().trim().max(240).default(''),
  body: z.string().trim().max(5000).default(''),
  note: z.string().trim().max(600).default(''),
  items: z.array(z.string().trim().min(1).max(500)).max(16).default([]),
  collectionRefs: z.array(z.string().trim().min(1).max(120)).max(24).default([]),
  linkLabel: z.string().trim().max(120).default(''),
  linkHref: z.string().trim().max(400).default(''),
  secondaryLinkLabel: z.string().trim().max(120).default(''),
  secondaryLinkHref: z.string().trim().max(400).default(''),
  design: z.object({
    width: z.enum(['default', 'narrow', 'standard', 'wide', 'full']).default('default'),
    spacing: z.enum(['default', 'compact', 'standard', 'spacious']).default('default'),
    align: z.enum(['default', 'left', 'center', 'right']).default('default'),
    background: z.enum(['default', 'ivory', 'paper', 'olive', 'mulberry']).default('default'),
    headingSize: z.enum(['default', 'small', 'standard', 'large']).default('default'),
  }).prefault({}),
});

function prevalidateNestedBlockBounds(sections, context, pathPrefix = ['sections'], collectionLabel = 'page') {
  if (!Array.isArray(sections)) return sections;

  let nestedBlockCount = 0;
  let hasBoundsIssue = false;
  const activeBlocks = new Set();
  const addBoundsIssue = (path, message) => {
    context.addIssue({ code: 'custom', path, message });
    hasBoundsIssue = true;
  };

  if (sections.length > 60) {
    addBoundsIssue(
      pathPrefix,
      collectionLabel === 'page'
        ? 'A page may contain at most 60 sections.'
        : 'A section group may contain at most 60 sections.',
    );
    return z.NEVER;
  }

  function visitBlock(block, depth, path) {
    if (depth > MAX_NESTED_BLOCK_DEPTH) {
      addBoundsIssue(path, `Nested blocks may be at most ${MAX_NESTED_BLOCK_DEPTH} levels deep.`);
      return;
    }

    if (!block || typeof block !== 'object' || Array.isArray(block)) return;
    if (activeBlocks.has(block)) {
      addBoundsIssue(path, 'Nested block data cannot contain circular references.');
      return;
    }

    nestedBlockCount += 1;
    if (nestedBlockCount > MAX_TOTAL_NESTED_BLOCKS) {
      addBoundsIssue(path, `A page may contain at most ${MAX_TOTAL_NESTED_BLOCKS} nested blocks.`);
      return;
    }

    activeBlocks.add(block);
    if (Array.isArray(block.blocks)) {
      if (block.blocks.length > MAX_CHILD_BLOCKS) {
        addBoundsIssue(
          [...path, 'blocks'],
          `A block may contain at most ${MAX_CHILD_BLOCKS} child blocks.`,
        );
      } else {
        block.blocks.forEach((child, childIndex) => {
          visitBlock(child, depth + 1, [...path, 'blocks', childIndex]);
        });
      }
    }
    activeBlocks.delete(block);
  }

  sections.forEach((section, sectionIndex) => {
    if (!section || typeof section !== 'object' || Array.isArray(section)) return;

    if (Array.isArray(section.blocks)) {
      if (section.blocks.length > MAX_CHILD_BLOCKS) {
        addBoundsIssue(
          [...pathPrefix, sectionIndex, 'blocks'],
          `A section may contain at most ${MAX_CHILD_BLOCKS} blocks.`,
        );
      } else {
        section.blocks.forEach((block, blockIndex) => {
          visitBlock(block, 1, [...pathPrefix, sectionIndex, 'blocks', blockIndex]);
        });
      }
    }

    if (Array.isArray(section.cards)) {
      if (section.cards.length > MAX_CHILD_BLOCKS) {
        addBoundsIssue(
          [...pathPrefix, sectionIndex, 'cards'],
          `A section may contain at most ${MAX_CHILD_BLOCKS} cards.`,
        );
      } else {
        section.cards.forEach((card, cardIndex) => {
          if (!card || typeof card !== 'object' || !Array.isArray(card.blocks)) return;
          if (card.blocks.length > MAX_CHILD_BLOCKS) {
            addBoundsIssue(
              [...pathPrefix, sectionIndex, 'cards', cardIndex, 'blocks'],
              `A block may contain at most ${MAX_CHILD_BLOCKS} child blocks.`,
            );
          } else {
            card.blocks.forEach((block, blockIndex) => {
              visitBlock(block, 1, [...pathPrefix, sectionIndex, 'cards', cardIndex, 'blocks', blockIndex]);
            });
          }
        });
      }
    }
  });

  return hasBoundsIssue ? z.NEVER : sections;
}

const legacyThemeSectionReferenceSchema = z.object({
  id: z.string().trim().min(1).max(80),
  type: z.literal('legacyReference'),
  source: z.enum(LEGACY_THEME_SECTION_SOURCES),
  label: z.string().trim().max(100).default(''),
  enabled: z.boolean().default(true),
  settings: genericSettingsSchema.default({}),
});

const regularThemeSectionSchema = contentSectionSchema.refine(
  (section) => section.type !== 'legacyReference',
  { message: 'Legacy reference sections need a valid legacy source.', path: ['source'] },
);

const themeGroupSectionSchema = z.union([
  legacyThemeSectionReferenceSchema,
  regularThemeSectionSchema,
]);

function themeSectionGroupSectionsSchema(groupKey) {
  return z.preprocess(
    (sections, context) => prevalidateNestedBlockBounds(
      sections,
      context,
      ['themeSectionGroups', groupKey],
      'group',
    ),
    z.array(themeGroupSectionSchema).max(60),
  );
}

const themeSectionGroupsSchema = z.object({
  schemaVersion: z.literal(THEME_SECTION_GROUPS_SCHEMA_VERSION),
  header: themeSectionGroupSectionsSchema('header'),
  footer: themeSectionGroupSectionsSchema('footer'),
});

export const contentInputSchema = z.object({
  key: z.enum(contentKeys),
  title: z.string().trim().min(2).max(180),
  intro: z.string().trim().max(1200).default(''),
  status: statusSchema,
  seoTitle: z.string().trim().max(180).default(''),
  seoDescription: z.string().trim().max(320).default(''),
  sections: z.preprocess(prevalidateNestedBlockBounds, z.array(contentSectionSchema).max(60)),
  themeSectionGroups: themeSectionGroupsSchema.optional(),
});

export const contentSaveSchema = contentInputSchema.extend({
  id: z.string().optional(),
  version: z.coerce.number().int().nonnegative().optional(),
});

function section(id, values = {}) {
  return {
    id,
    eyebrow: '',
    heading: '',
    body: '',
    note: '',
    items: [],
    linkLabel: '',
    linkHref: '',
    secondaryLinkLabel: '',
    secondaryLinkHref: '',
    ...values,
  };
}

const menuLink = (label, href) => ({ id: `link-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, heading: label, linkHref: href });

export const DEFAULT_NAVIGATION = [
  { id: 'main', type: 'menu', layout: 'main', heading: 'Main menu', cards: [menuLink('Shop', '/shop'), menuLink('Bridal', '/bridal'), menuLink('Custom', '/custom'), menuLink('Our Story', '/our-story'), menuLink('Craftsmanship', '/craftsmanship'), menuLink('Contact', '/book-appointment')] },
  { id: 'footer-shop', type: 'menu', layout: 'footer', heading: 'Shop', cards: [menuLink('Rings', '/collections/rings'), menuLink('Earrings', '/collections/earrings'), menuLink('Necklaces', '/collections/necklaces'), menuLink('Bracelets', '/collections/bracelets'), menuLink('Indian & Traditional', '/collections/traditional-reimagined'), menuLink('All Jewelry', '/shop')] },
  { id: 'footer-byshreen', type: 'menu', layout: 'footer', heading: 'byShreen', cards: [menuLink('Our Story', '/our-story'), menuLink('Custom Jewelry', '/custom'), menuLink('Bridal', '/bridal'), menuLink('Craftsmanship', '/craftsmanship'), menuLink('Proposals', '/proposals')] },
  { id: 'footer-care', type: 'menu', layout: 'footer', heading: 'Client Care', cards: [menuLink('FAQs', '/faq'), menuLink('Contact / Book an Appointment', '/book-appointment'), menuLink('Shipping & Returns', '/shipping-returns'), menuLink('Repairs & Care', '/repairs-care')] },
  { id: 'footer-legal', type: 'menu', layout: 'footer', heading: 'Legal', cards: [menuLink('Privacy Policy', '/privacy'), menuLink('Terms & Conditions', '/terms')] },
  { id: 'social', type: 'menu', layout: 'social', heading: 'Social links', cards: [menuLink('Instagram', 'https://www.instagram.com/byshreen/'), menuLink('Facebook', 'https://www.facebook.com/share/1DJfoxcxt7/?mibextid=wwXIfr'), menuLink('Threads', 'https://www.threads.net/@byshreen'), menuLink('TikTok', 'https://www.tiktok.com/@byshreen')] },
];

function guidedSections(key) {
  return guideToSections(key).map(({ id, ...values }) => section(id, values));
}

function faqSections() {
  return faqCategories.flatMap((category) => category.items.map((item) => section(item.id, {
    eyebrow: category.name,
    heading: item.question,
    body: (item.paragraphs || [item.answer]).join('\n\n'),
    note: item.signoff || '',
    linkLabel: item.actionHref ? item.actionLabel || 'Learn more →' : '',
    linkHref: item.actionHref || '',
    secondaryLinkLabel: item.secondaryActionHref ? item.secondaryActionLabel || 'Explore →' : '',
    secondaryLinkHref: item.secondaryActionHref || '',
  })));
}

const defaults = {
  navigation: {
    key: 'navigation',
    title: 'Navigation',
    intro: 'Header menu, footer link columns, and social links.',
    status: 'published',
    seoTitle: '',
    seoDescription: '',
    sections: DEFAULT_NAVIGATION,
  },
  home: {
    key: 'home',
    title: 'Homepage',
    intro: 'Family-led fine diamond jewelry backed by generations of diamond expertise.',
    status: 'published',
    seoTitle: 'byShreen — Fine Diamond Jewelry',
    seoDescription: 'Family-led fine diamond jewelry backed by generations of diamond expertise.',
    sections: DEFAULT_PAGE_BLOCKS.home,
  },
  bridal: {
    key: 'bridal',
    title: 'Bridal',
    intro: 'For the beginning of forever.',
    status: 'published',
    seoTitle: 'Bridal — byShreen',
    seoDescription: 'For the beginning of forever. Engagement rings, wedding bands, and bridal jewelry designed with intention.',
    sections: DEFAULT_PAGE_BLOCKS.bridal,
  },
  shop: {
    key: 'shop',
    title: 'Shop',
    intro: 'The byShreen Collection.',
    status: 'published',
    seoTitle: 'The byShreen Collection',
    seoDescription: 'Natural diamond jewelry designed to become part of your everyday — from understated pieces to modern statements and traditional jewels reimagined.',
    sections: DEFAULT_PAGE_BLOCKS.shop,
  },
  about: {
    key: 'about',
    title: 'Our story',
    intro: 'Jewelry started as something shared at home. It became a way to bring decades of diamond knowledge into pieces that feel personal, wearable and made with intention.',
    status: 'published',
    seoTitle: 'Our Story — byShreen',
    seoDescription: 'Decades of diamond expertise. A new generation of jewelry design. A family built around diamonds.',
    sections: DEFAULT_PAGE_BLOCKS.about,
  },
  global: {
    key: 'global',
    title: 'Site-wide text (header, newsletter, footer)',
    intro: 'Announcement bar, newsletter sign-up, and footer text shown on every page.',
    status: 'published',
    seoTitle: 'byShreen — Fine Diamond Jewelry',
    seoDescription: 'Family-led fine diamond jewelry backed by generations of diamond expertise.',
    sections: guidedSections('global'),
  },
  clientCare: {
    key: 'clientCare',
    title: 'Client care',
    intro: 'Thoughtful guidance for choosing, receiving, wearing, and caring for a byShreen piece.',
    status: 'published',
    seoTitle: 'Client care — byShreen',
    seoDescription: 'Shipping, returns, care, sizing, sourcing, and support from byShreen.',
    sections: [
      section('shipping', { eyebrow: 'Delivery', heading: 'Shipping & delivery', body: 'Delivery timelines, international shipping, and tracking your order.', linkLabel: 'Shipping & returns', linkHref: '/shipping-returns' }),
      section('returns', { eyebrow: 'Confidence', heading: 'Returns & exchanges', body: 'Eligible pieces may be returned or exchanged within 10 days of delivery. Custom and made-to-order pieces are final sale.', linkLabel: 'Read the returns policy', linkHref: '/shipping-returns#returns-and-exchanges' }),
      section('care', { eyebrow: 'Long life', heading: 'Repairs & care', body: 'Repairs, resizing, our lifetime warranty on manufacturing defects, and simple care habits.', linkLabel: 'Repairs & care', linkHref: '/repairs-care' }),
      section('help', { eyebrow: 'Personal help', heading: 'Need a considered answer?', body: 'Contact the team for sizing, sourcing, bespoke, and aftercare questions.', linkLabel: 'Contact the atelier', linkHref: '/book-appointment' }),
    ],
  },
  shipping: {
    key: 'shipping',
    title: 'Shipping',
    intro: 'We want your byShreen experience to feel just as thoughtful from the moment you place your order to the moment you receive your jewelry.',
    status: 'published',
    seoTitle: 'Shipping — byShreen',
    seoDescription: 'Delivery timelines, international shipping, and order tracking for byShreen jewelry.',
    sections: [
      section('arrival', { eyebrow: 'Delivery', heading: 'When will my jewelry arrive?', body: 'Every byShreen piece is carefully prepared before it makes its way to you.\n\nFor pieces that are already completed and ready to ship, please allow approximately 8–10 days for delivery.\n\nFor made-to-order and custom jewelry, additional production time is required. Your estimated timeline will be discussed with you before your piece goes into production.\n\nPlease note: production time and shipping time are separate. Custom pieces may require additional time depending on the design, diamond sourcing, and production process.' }),
      section('destinations', { eyebrow: 'Destinations', heading: 'Where do you ship?', body: 'We ship within the United States and internationally.\n\nInternational orders may be subject to customs duties, import taxes, brokerage fees, or other charges imposed by the destination country. These charges are the responsibility of the customer and are not included in the purchase price unless otherwise stated at checkout.' }),
      section('packaging', { eyebrow: 'Packaging', heading: 'How will my jewelry be shipped?', body: 'Your jewelry is carefully packaged and securely prepared before leaving byShreen.\n\nOnce your order ships, you will receive tracking information where available so you can follow your package.' }),
      section('tracking', { eyebrow: 'Tracking', heading: 'Can I track my order?', body: 'Yes. Once your order has shipped, you’ll receive a shipping confirmation with tracking information.\n\nPlease allow some time for tracking information to update after your package has been collected by the carrier.' }),
      section('delays', { eyebrow: 'Delays', heading: 'What if my package is delayed?', body: 'Once a package has been handed over to the shipping carrier, delivery times may be affected by circumstances outside of our control, including weather, holidays, customs processing, or carrier delays.\n\nIf your package appears to be significantly delayed or there is an issue with delivery, please contact us and we’ll do our best to help.', linkLabel: 'Contact us', linkHref: '/book-appointment' }),
    ],
  },
  returns: {
    key: 'returns',
    title: 'Returns & Exchanges',
    intro: 'We want every byShreen piece to feel completely right. We offer a transparent, considered return and exchange policy for our clients.',
    status: 'published',
    seoTitle: 'Returns & Exchanges — byShreen',
    seoDescription: 'Current returns and exchange guidance from byShreen.',
    sections: [
      section('readyToWear', { eyebrow: 'Ready-to-Wear', heading: '14-Day Return Window', body: 'Unworn collection pieces in pristine condition with all original packaging, certificates, and documentation may be returned or exchanged within 14 days of delivery. Returned items are inspected by our gemological team upon receipt before refunds are processed.' }),
      section('bespoke', { eyebrow: 'Custom Commissions', heading: 'Bespoke & Made-to-Order Pieces', body: 'Because bespoke commissions, custom rings, and personalized pieces are designed and handcrafted uniquely for you, they are final sale and non-refundable. However, we provide complimentary sizing and fine adjustments to ensure your piece is absolute perfection.' }),
      section('process', { eyebrow: 'Process', heading: 'How to Initiate a Return', body: 'To begin a return, contact our atelier with your order number. We will provide an insured return shipping label and detailed packing instructions to ensure safe transit back to our New York studio.', linkLabel: 'Contact us', linkHref: '/book-appointment' }),
    ],
  },
  faq: {
    key: 'faq',
    title: 'Frequently asked questions',
    intro: 'A considered starting point for questions about our natural diamonds, custom design process, materials, and lifelong care.',
    status: 'published',
    seoTitle: 'FAQ — byShreen',
    seoDescription: 'Frequently asked questions regarding byShreen natural diamonds, custom jewelry commissions, gold options, appointments, and lifelong aftercare.',
    sections: faqSections(),
  },
  care: {
    key: 'care',
    title: 'Care for your piece',
    intro: 'Fine jewelry is made to live with you. A few gentle habits help protect its finish and brilliance.',
    status: 'published',
    seoTitle: 'Jewelry care — byShreen',
    seoDescription: 'Guidance for caring for your byShreen fine jewelry.',
    sections: [
      section('everyday', { eyebrow: 'Everyday care', heading: 'Keep it considered', body: 'Remove jewelry before swimming, bathing, exercising, or using household chemicals. Put pieces on after cosmetics and fragrance have settled.' }),
      section('storage', { eyebrow: 'Storage', heading: 'Give each piece its own space', body: 'Store jewelry dry and separately where possible. Soft pouches or lined compartments help reduce scratches and tangling.' }),
      section('service', { eyebrow: 'Personal help', heading: 'When in doubt, ask', body: 'The atelier can help with care questions, inspections, repairs, and bespoke aftercare.', linkLabel: 'Ask the atelier', linkHref: '/book-appointment' }),
    ],
  },
  sizeGuide: {
    key: 'sizeGuide',
    title: 'Size guide',
    intro: 'A considered fit makes a piece feel like it has always belonged to you. Contact the atelier when you would like personal sizing help.',
    status: 'published',
    seoTitle: 'Size guide — byShreen',
    seoDescription: 'Sizing guidance and personal support from byShreen.',
    sections: [
      section('ring', { eyebrow: 'Rings', heading: 'Measure with care', body: 'Measure at the end of the day when fingers are warm, and avoid measuring immediately after exercise or in unusual temperatures.' }),
      section('fit', { eyebrow: 'Fit', heading: 'Between sizes?', body: 'A wider band can feel different from a delicate band. If you are between sizes or choosing a gift, contact the atelier before ordering.', linkLabel: 'Contact us', linkHref: '/book-appointment' }),
    ],
  },
  materialsSourcing: {
    key: 'materialsSourcing',
    title: 'Craftsmanship page',
    intro: 'Closer to the source. Closer to the story. byShreen brings family manufacturing experience into a more personal design process.',
    status: 'published',
    seoTitle: 'Craftsmanship — byShreen',
    seoDescription: 'Quality you can see. Craftsmanship you can feel.',
    sections: DEFAULT_PAGE_BLOCKS.materialsSourcing,
  },
  repairsWarranty: {
    key: 'repairsWarranty',
    title: 'Repairs & Care',
    intro: 'Made to last. Here to care for it. Fine jewelry is meant to be worn, loved, and lived in. And while we create every byShreen piece with longevity in mind, we know that life happens. A piece may need to be resized, a stone may need attention, or your jewelry may simply need a little care after years of being worn. Whatever it is, we’re here to help.',
    status: 'published',
    seoTitle: 'Repairs & Care — byShreen',
    seoDescription: 'Repairs, resizing, lifetime warranty, and jewelry care from byShreen.',
    sections: [
      section('longRun', { eyebrow: 'Our promise', heading: 'Your jeweler for the long run.', body: 'At byShreen, we believe our relationship with you doesn’t end when your jewelry arrives.\n\nWe’re a family business, and we want to be the jeweler you come back to for every chapter — whether you need a simple adjustment today or want to care for a piece you’ve loved for years.\n\nIf something doesn’t feel quite right, reach out to us first. We’ll take a look at your piece, understand what’s needed, and help determine the best way forward.' }),
      section('repairs', { eyebrow: 'Repairs & Servicing', heading: 'Need a little TLC?', body: 'Over time, fine jewelry can naturally require maintenance. Every piece is different, so repairs are assessed individually.\n\nDepending on the piece, we may be able to help with:', items: ['Resizing', 'Stone tightening or replacement', 'Setting repairs', 'Chain repairs', 'Clasp repairs', 'Prong repairs', 'Polishing and refinishing', 'Cleaning', 'Other jewelry adjustments or servicing'], linkLabel: 'Repair request →', linkHref: '/book-appointment' }),
      section('resizing', { eyebrow: 'Resizing', heading: 'Because the perfect fit can change.', body: 'If your ring needs to be adjusted, we’re happy to assess whether resizing is possible.\n\nThe ability to resize a piece depends on its design, materials, setting, and how much of an adjustment is needed.\n\nPlease contact us before sending your jewelry for resizing. We’ll let you know what’s possible and provide an estimate before any work begins.' }),
      section('warranty', { eyebrow: 'Warranty', heading: 'Our promise of quality.', body: 'Every byShreen piece is carefully inspected before it makes its way to you.\n\nOur warranty covers manufacturing defects in materials and workmanship for life, subject to the terms below.\n\nIf you believe your jewelry has a manufacturing issue, please contact us so we can inspect the piece and determine the appropriate next step.', linkLabel: 'Warranty request →', linkHref: '/book-appointment' }),
      section('covered', { eyebrow: 'Coverage', heading: 'What the warranty covers', body: 'Our warranty is intended to cover issues that result from the original manufacturing or workmanship of your byShreen piece. All warranty claims are subject to inspection and assessment by byShreen. If an issue is determined to be covered under warranty, we will work with you to determine an appropriate solution.\n\nDepending on the circumstances, this may include:', items: ['Manufacturing defects', 'Issues with workmanship', 'Certain setting or structural issues resulting from the original construction of the piece'] }),
      section('notCovered', { eyebrow: 'Exclusions', heading: 'What the warranty doesn’t cover', body: 'Our warranty does not cover damage resulting from normal wear and tear, accidents, or improper care. Natural wear is part of owning and loving fine jewelry. If you’re ever unsure whether something is covered, please reach out — we’d rather you ask us than worry about it yourself.\n\nThis may include:', items: ['Scratches and surface wear', 'Dents or deformation caused by impact', 'Damage from accidents', 'Damage caused by improper use or storage', 'Damage caused by exposure to chemicals or harsh substances', 'Loss or theft of jewelry', 'Lost stones resulting from accidental damage or wear', 'Repairs or modifications performed by another jeweler', 'Normal deterioration over time'] }),
      section('process', { eyebrow: 'The process', heading: 'What happens when you send us a piece?', body: 'Every repair is handled with the same care we give a new piece.', items: ['01 — Assess: We’ll examine your jewelry and understand what needs attention.', '02 — Recommend: We’ll explain what we recommend, whether there’s a cost involved, and how long the work is expected to take.', '03 — Restore: Once you’ve approved the work, we’ll take care of your piece and return it to you ready to wear again.'] }),
      section('care', { eyebrow: 'Care', heading: 'Caring for your jewelry', body: 'A little care goes a long way. To help your jewelry stay beautiful:', items: ['Store it carefully — keep pieces separated when possible to prevent scratching and tangling.', 'Remove when appropriate — take jewelry off before activities that could expose it to impact, chemicals, or excessive wear.', 'Keep it away from harsh chemicals — perfume, lotions, cleaning products, chlorine, and other chemicals can affect certain metals and gemstones.', 'Have it checked — if you wear a piece regularly, occasional professional inspection can help identify loose stones, worn prongs, or other issues before they become bigger problems.'] }),
      section('contact', { eyebrow: 'We’re here for every chapter', heading: 'Have a byShreen piece that needs attention?', body: 'Whether you’ve had your jewelry for six months or six years, we’re happy to hear from you.\n\nSend us a note and tell us what you’re experiencing. If helpful, include a few photos of the piece so we can get a better idea of what may be needed.\n\nYour jewelry becomes part of your story — and taking care of it is part of ours.', linkLabel: 'Request a repair →', linkHref: '/book-appointment' }),
    ],
  },
  privacy: {
    key: 'privacy',
    title: 'Privacy Policy',
    intro: 'byShreen respects your privacy and is committed to protecting your personal information. This notice outlines how we collect, safeguard, and handle your data.',
    status: 'draft',
    seoTitle: 'Privacy Policy — byShreen',
    seoDescription: 'Privacy policy and data protection information for byShreen visitors and clients.',
    sections: [
      section('collection', { eyebrow: 'Collection', heading: 'Information We Collect', body: 'We collect personal information you provide when scheduling studio appointments, inquiring about bespoke commissions, subscribing to our private atelier notes, or making purchases. This includes your name, email, phone number, shipping address, and appointment notes.' }),
      section('use', { eyebrow: 'Purpose', heading: 'How We Use Your Information', body: 'We use your information exclusively to fulfill orders, coordinate private appointments, communicate regarding custom designs, provide client support, and send occasional announcements on new natural diamond acquisitions if you have opted in. We never sell your personal information.' }),
      section('security', { eyebrow: 'Protection', heading: 'Data Security & Trusted Partners', body: 'We employ robust technical and organizational security measures to protect your data. We partner only with trusted providers (such as secure payment processors and insured carriers) under strict confidentiality agreements to facilitate our services.' }),
      section('rights', { eyebrow: 'Choices', heading: 'Your Rights & Privacy Choices', body: 'You may request access to, correction of, or deletion of your personal data at any time. You can unsubscribe from marketing communications by clicking the unsubscribe link in our emails or by contacting our atelier directly.', linkLabel: 'Email info@byshreen.com', linkHref: 'mailto:info@byshreen.com' }),
    ],
  },
  terms: {
    key: 'terms',
    title: 'Terms & Conditions',
    intro: 'These Terms and Conditions govern your access to and use of byShreen’s website, digital services, and private atelier purchases.',
    status: 'published',
    seoTitle: 'Terms & Conditions — byShreen',
    seoDescription: 'Terms and conditions for the byShreen website and services.',
    sections: [
      section('general', { eyebrow: 'Acceptance', heading: 'Agreement to Terms', body: 'By accessing this site, booking an appointment, or commissioning jewelry with byShreen, you acknowledge and agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, please refrain from using our services.' }),
      section('products', { eyebrow: 'Natural Diamonds & Purity', heading: 'Product Descriptions & Natural Diamonds', body: 'byShreen deals exclusively in genuine natural diamonds and solid 14kt and 18kt gold. We make every effort to display the colors, proportions, and details of our jewelry as accurately as possible. Due to the unique nature of natural gemstones, slight individual variations occur.' }),
      section('customOrders', { eyebrow: 'Bespoke Terms', heading: 'Custom & Bespoke Commissions', body: 'Bespoke designs require client sign-off on sketches, stone selections, and specifications prior to casting and production. Due to the personalized nature of bespoke jewelry, deposits and payments on custom commissions are non-refundable.' }),
      section('intellectualProperty', { eyebrow: 'Ownership', heading: 'Intellectual Property', body: 'All designs, brand trademarks, logos, copy, imagery, and video content on this website are the proprietary intellectual property of byShreen and are protected under copyright and trademark laws.' }),
      section('governingLaw', { eyebrow: 'Jurisdiction', heading: 'Governing Law', body: 'These Terms are governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law principles. Any dispute arising under these terms shall be subject to the exclusive jurisdiction of the state and federal courts located in New York, NY.' }),
    ],
  },
  accessibility: {
    key: 'accessibility',
    title: 'Accessibility Statement',
    intro: 'byShreen is dedicated to ensuring digital accessibility for all clients and visitors, regardless of ability or technology.',
    status: 'published',
    seoTitle: 'Accessibility Statement — byShreen',
    seoDescription: 'Accessibility commitment and feedback contact for byShreen.',
    sections: [
      section('commitment', { eyebrow: 'Standards', heading: 'Our Accessibility Commitment', body: 'We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. Our development team continuously evaluates and updates our digital platform to optimize keyboard navigation, color contrast, and screen reader compatibility.' }),
      section('feedback', { eyebrow: 'Support', heading: 'Accommodations & Feedback', body: 'If you encounter an accessibility barrier or need personalized assistance booking an appointment or reviewing a piece, contact the atelier with the page, device, and task you were trying to complete.', linkLabel: 'Contact us', linkHref: '/book-appointment' }),
    ],
  },
  cookies: {
    key: 'cookies',
    title: 'Cookie choices',
    intro: 'We use essential cookies and minimal analytical tools to provide a seamless, secure experience on byShreen.',
    status: 'published',
    seoTitle: 'Cookie choices — byShreen',
    seoDescription: 'Cookie information and choices for byShreen.',
    sections: [
      section('essential', { eyebrow: 'Core Functionality', heading: 'Essential Cookies', body: 'These cookies are necessary for the website to function properly, enabling navigation, shopping bag persistence, and secure form submissions. They cannot be deactivated.' }),
      section('performance', { eyebrow: 'Experience', heading: 'Performance & Analytics', body: 'With your consent, we may use anonymized analytics cookies to understand how visitors interact with our gallery and collection pages, helping us continuously refine the atelier experience.' }),
      section('control', { eyebrow: 'Preferences', heading: 'Managing Your Cookie Choices', body: 'You can adjust your browser settings at any time to block or notify you about cookies. Note that disabling certain cookies may affect how features on our site function.' }),
    ],
  },
  privacyChoices: {
    key: 'privacyChoices',
    title: 'Privacy choices',
    intro: 'Privacy choice guidance will be published when the applicable regions and data practices are confirmed.',
    status: 'draft',
    seoTitle: 'Privacy choices — byShreen',
    seoDescription: 'Privacy choices and data rights for byShreen visitors.',
    sections: [],
  },
  bespoke: {
    key: 'bespoke',
    title: 'Custom jewelry page',
    intro: 'A personal process with the clarity and access of a family-run diamond house.',
    status: 'published',
    seoTitle: 'Custom Jewelry — byShreen',
    seoDescription: 'Made for your story. Begin a personal jewelry commission with byShreen.',
    sections: DEFAULT_PAGE_BLOCKS.bespoke,
  },
  contact: {
    key: 'contact',
    title: 'Enquiry forms',
    intro: 'For collection questions, bespoke ideas, sizing, sourcing, or aftercare, send a note and the team will respond personally.',
    status: 'published',
    seoTitle: 'Contact — byShreen',
    seoDescription: 'Contact the byShreen atelier about jewelry, bespoke design, and care.',
    sections: guidedSections('contact'),
  },
  appointments: {
    key: 'appointments',
    title: 'Book an appointment page',
    intro: 'Request a thoughtful conversation about a piece, a gift, or a bespoke idea.',
    status: 'published',
    seoTitle: 'Book an Appointment — byShreen',
    seoDescription: "Let's talk jewelry. Book a private appointment at the byShreen NYC office.",
    sections: DEFAULT_PAGE_BLOCKS.appointments,
  },
};

function cloneDefault(key) {
  const value = defaults[key] || defaults.contact;
  return JSON.parse(JSON.stringify(value));
}

function safeKey(key) {
  return contentKeys.includes(key) ? key : null;
}

function serializeContent(document) {
  if (!document) return null;
  const payload = document.draftPayload || document;
  return {
    ...payload,
    key: document.key || payload.key,
    id: document._id?.toString() || document.id,
    version: document.version || 0,
    status: document.status || payload.status || 'draft',
    reviewStatus: document.reviewStatus || 'not-required',
    updatedAt: document.updatedAt || null,
    updatedBy: document.updatedBy || null,
    publishedAt: document.publishedAt || null,
  };
}

function toPublicPayload(document) {
  const payload = document?.publishedPayload || document;
  if (!payload || payload.status !== 'published') return null;
  return {
    key: payload.key,
    title: payload.title,
    intro: payload.intro,
    sections: payload.sections || [],
    ...(payload.themeSectionGroups ? { themeSectionGroups: payload.themeSectionGroups } : {}),
    seoTitle: payload.seoTitle,
    seoDescription: payload.seoDescription,
    status: 'published',
    publishedAt: document.publishedAt || null,
  };
}

export function getContentFallback(key) {
  const normalizedKey = safeKey(key) || 'contact';
  return cloneDefault(normalizedKey);
}

export function getContentRoute(key) {
  return contentRouteMap[safeKey(key) || 'contact'];
}

export async function getPublicContent(key) {
  const fallback = getContentFallback(key);
  if (!process.env.MONGODB_URI && process.env.CONTENT_SOURCE !== 'mongodb' && process.env.CATALOG_SOURCE !== 'mongodb') return fallback;

  try {
    const db = await getDb();
    const document = await db.collection(CONTENT_COLLECTION).findOne({ key: fallback.key });
    return toPublicPayload(document) || fallback;
  } catch {
    return fallback;
  }
}

const TEXT_FIELDS = ['eyebrow', 'heading', 'body', 'note', 'linkLabel', 'linkHref', 'secondaryLinkLabel', 'secondaryLinkHref'];

function mergeSection(saved = {}, fallback = {}) {
  const merged = { id: fallback.id || saved.id };
  for (const field of TEXT_FIELDS) merged[field] = String(saved[field] || '').trim() ? saved[field] : fallback[field] || '';
  merged.items = saved.items?.length ? saved.items : fallback.items || [];
  return merged;
}

/**
 * Published content for a page whose layout lives in code. Every block the page expects is
 * always present: fields left empty in the admin fall back to the original copy.
 */
export async function getPageContent(key) {
  const fallback = getContentFallback(key);
  const content = await getPublicContent(key);
  const saved = new Map((content.sections || []).map((item) => [item.id, item]));
  const sections = Object.fromEntries(fallback.sections.map((item) => [item.id, mergeSection(saved.get(item.id), item)]));
  return {
    title: content.title || fallback.title,
    intro: content.intro || fallback.intro,
    seoTitle: content.seoTitle || fallback.seoTitle,
    seoDescription: content.seoDescription || fallback.seoDescription,
    sections,
  };
}

/** Blocks for a page-builder page; falls back to the original layout if nothing valid is saved. */
export async function getPageBlocks(key) {
  const content = await getPublicContent(key);
  const blocks = (content.sections || []).filter((item) => item.type);
  return blocks.length ? blocks : getContentFallback(key).sections;
}

export function isBlockPage(key) {
  return Boolean(BLOCK_PAGES[key]);
}

/** Menus for the header and footer: { main: [...links], footer: [{ title, links }], social: [...links] }. */
export async function getNavigation() {
  const content = await getPublicContent('navigation');
  const menus = (content.sections || []).filter((item) => item.type === 'menu');
  const source = menus.length ? menus : DEFAULT_NAVIGATION;
  const headerSection = (content.sections || []).find((item) => item.id === DEFAULT_HEADER_SECTION.id || item.type === 'header');
  return {
    ...navigationPresentationFromSections([...source, ...(headerSection ? [headerSection] : [])]),
    themeSectionGroups: resolveThemeSectionGroups(content.themeSectionGroups),
  };
}

export async function getContentMetadata(key) {
  const fallback = getContentFallback(key);
  const content = await getPublicContent(key);
  return {
    title: content.seoTitle || fallback.seoTitle || content.title,
    description: content.seoDescription || fallback.seoDescription || content.intro,
  };
}

export async function getAdminContent(key) {
  const fallback = getContentFallback(key);
  try {
    const db = await getDb();
    const document = await db.collection(CONTENT_COLLECTION).findOne({ key: fallback.key });
    return document ? serializeContent(document) : { ...fallback, version: 0, reviewStatus: 'not-required' };
  } catch {
    return { ...fallback, version: 0, reviewStatus: 'not-required', source: 'fallback' };
  }
}

/** Admin content ready for editing: block pages without valid saved blocks start from the default layout. */
export async function getEditableContent(key) {
  const content = await getAdminContent(key);
  if (key === 'navigation') {
    const hasHeaderSection = (content.sections || []).some((item) => item.id === DEFAULT_HEADER_SECTION.id || item.type === 'header');
    return {
      ...content,
      sections: hasHeaderSection
        ? content.sections
        : [...(content.sections || []), DEFAULT_HEADER_SECTION],
      themeSectionGroups: resolveThemeSectionGroups(content.themeSectionGroups),
    };
  }
  if (isBlockPage(key) && !(content.sections || []).some((item) => item.type)) {
    return { ...content, sections: getContentFallback(key).sections };
  }
  return content;
}

export async function listContentEntries() {
  const fallbackEntries = contentKeys.map((key) => getContentFallback(key));
  try {
    const db = await getDb();
    const documents = await db.collection(CONTENT_COLLECTION).find({}).sort({ updatedAt: -1, key: 1 }).toArray();
    const byKey = new Map(documents.map((document) => [document.key, serializeContent(document)]));
    return fallbackEntries.map((entry) => byKey.get(entry.key) || { ...entry, version: 0, reviewStatus: 'not-required' });
  } catch {
    return fallbackEntries.map((entry) => ({ ...entry, version: 0, reviewStatus: 'not-required', source: 'fallback' }));
  }
}

export async function saveContent(input, actor = 'local-preview') {
  const parsed = contentSaveSchema.parse(input);
  const db = await getDb();
  const now = new Date();
  const collection = db.collection(CONTENT_COLLECTION);
  const current = await collection.findOne({ key: parsed.key });
  const payload = {
    key: parsed.key,
    title: parsed.title,
    intro: parsed.intro,
    status: parsed.status,
    seoTitle: parsed.seoTitle,
    seoDescription: parsed.seoDescription,
    sections: parsed.sections,
  };
  if (parsed.key === 'navigation') {
    const savedThemeSectionGroups = parsed.themeSectionGroups
      ?? current?.draftPayload?.themeSectionGroups
      ?? current?.publishedPayload?.themeSectionGroups
      ?? current?.themeSectionGroups;
    if (savedThemeSectionGroups) payload.themeSectionGroups = savedThemeSectionGroups;
  }
  const filter = { key: parsed.key };
  // A page that has never been saved has no stored version yet: its first save creates the record.
  const firstSave = !current && !parsed.version;
  if (typeof parsed.version === 'number' && !firstSave) filter.version = parsed.version;
  const update = {
    $set: {
      key: parsed.key,
      draftPayload: payload,
      status: parsed.status,
      updatedAt: now,
      updatedBy: actor,
    },
    $inc: { version: 1 },
    $setOnInsert: { createdAt: now, createdBy: actor },
  };

  if (parsed.status === 'published') {
    update.$set.publishedPayload = payload;
    update.$set.publishedAt = now;
    update.$set.publishedBy = actor;
  } else if (!current) {
    update.$set.publishedPayload = null;
    update.$set.publishedAt = null;
  }

  const result = await collection.updateOne(filter, update, { upsert: firstSave || (!parsed.id && typeof parsed.version !== 'number') });
  if (result.matchedCount !== 1 && !result.upsertedCount) {
    const error = new Error('This content changed in another session. Reload before saving.');
    error.code = 'VERSION_CONFLICT';
    throw error;
  }

  await db.collection(REVISION_COLLECTION).insertOne({
    resourceType: 'siteContent',
    resourceKey: parsed.key,
    status: parsed.status,
    payload,
    createdAt: now,
    createdBy: actor,
  });

  return getAdminContent(parsed.key);
}

export async function ensureContentIndexes() {
  const db = await getDb();
  await db.collection(CONTENT_COLLECTION).createIndex({ key: 1 }, { unique: true, name: 'site_content_key_unique' });
  await db.collection(CONTENT_COLLECTION).createIndex({ status: 1, updatedAt: -1 }, { name: 'site_content_status_updated' });
  await db.collection(REVISION_COLLECTION).createIndex({ resourceKey: 1, createdAt: -1 }, { name: 'content_revisions_resource_time' });
  return { content: CONTENT_COLLECTION, revisions: REVISION_COLLECTION };
}

export async function seedContent({ dryRun = false } = {}) {
  const now = new Date();
  const operations = contentKeys.map((key) => {
    const fallback = getContentFallback(key);
    const payload = {
      key: fallback.key,
      title: fallback.title,
      intro: fallback.intro,
      status: fallback.status,
      seoTitle: fallback.seoTitle,
      seoDescription: fallback.seoDescription,
      sections: fallback.sections,
    };
    return {
      updateOne: {
        filter: { key },
        update: {
          $setOnInsert: {
            key,
            draftPayload: payload,
            publishedPayload: fallback.status === 'published' ? payload : null,
            status: fallback.status,
            createdAt: now,
            createdBy: 'content-seed',
            version: 1,
            publishedAt: fallback.status === 'published' ? now : null,
          },
        },
        upsert: true,
      },
    };
  });
  if (dryRun) return { dryRun: true, entries: operations.length, writes: 0 };
  const db = await getDb();
  const result = await db.collection(CONTENT_COLLECTION).bulkWrite(operations, { ordered: false });
  return { dryRun: false, entries: operations.length, upserted: result.upsertedCount, modified: result.modifiedCount };
}
