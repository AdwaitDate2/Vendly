import { z } from 'zod';
import { getDb } from './mongodb';
import { appointmentSettingsSchema } from './appointment-slots';
import { COLOR_SCHEME_GROUPS, COLOR_SCHEME_NUMBERS, DEFAULT_COLOR_SCHEMES, DEFAULT_TYPOGRAPHY, getThemeFontStyles, THEME_COLORS, THEME_FONT_FAMILIES, THEME_FONT_ROLES, THEME_FONT_STYLES, THEME_TYPOGRAPHY_PRESETS } from './theme';

const SETTINGS_COLLECTION = 'storeSettings';
const SETTINGS_ID = 'store';

const emailList = z.array(z.string().trim().toLowerCase().email('Enter valid email addresses.')).max(10);
const countryList = z.array(z.string().trim().toUpperCase().length(2, 'Use two-letter country codes, e.g. US.')).max(60);
const themeHexColorSchema = (label) => z.string().trim().toLowerCase().regex(/^#[0-9a-f]{6}$/, `${label} must be a color like #a84d5f.`);
const themeColorValueSchema = (label) => z.string().trim().toLowerCase().regex(/^(#[0-9a-f]{6}|transparent)$/, `${label} must be a color like #a84d5f or transparent.`);

/**
 * Shopify color schemes are persisted at `theme.colorSchemes.schemeN`, with 35 role values
 * in Base, Primary button, Secondary button, Inputs, Variants, and Selected variants.
 * Values are normalized six-digit hex colors or the canonical `transparent` CSS token.
 * Defaults let legacy records with only the seven brand colors load without a migration.
 */
export const colorSchemesSettingsSchema = z.object(Object.fromEntries(COLOR_SCHEME_NUMBERS.map((number) => {
  const schemeKey = `scheme${number}`;
  const defaults = DEFAULT_COLOR_SCHEMES[schemeKey];
  const schemeSchema = z.object(Object.fromEntries(COLOR_SCHEME_GROUPS.map((group) => [
    group.key,
    z.object(Object.fromEntries(group.roles.map(({ key: role, label }) => [
      role,
      themeColorValueSchema(`Scheme ${number} ${group.label} ${label.toLowerCase()}`).default(defaults[group.key][role]),
    ]))).default(defaults[group.key]),
  ])));
  return [schemeKey, schemeSchema.default(defaults)];
}))).default(DEFAULT_COLOR_SCHEMES);

const typographyFontSchema = z.object({
  family: z.enum(THEME_FONT_FAMILIES.map(({ value }) => value)),
  style: z.enum(THEME_FONT_STYLES),
}).superRefine(({ family, style }, context) => {
  if (!getThemeFontStyles(family).includes(style)) context.addIssue({ code: 'custom', path: ['style'], message: `${style} is not available for ${family}.` });
});
const typographyPresetSchemas = Object.fromEntries(THEME_TYPOGRAPHY_PRESETS.map((preset) => {
  if (preset === 'paragraph') return [preset, z.object({
    size: z.coerce.number().min(8).max(96).default(DEFAULT_TYPOGRAPHY.presets.paragraph.size),
    lineHeight: z.coerce.number().min(0.8).max(3).default(DEFAULT_TYPOGRAPHY.presets.paragraph.lineHeight),
  }).default(DEFAULT_TYPOGRAPHY.presets.paragraph)];
  const defaults = DEFAULT_TYPOGRAPHY.presets[preset];
  return [preset, z.object({
    font: z.enum(THEME_FONT_ROLES).default(defaults.font),
    size: z.coerce.number().min(8).max(160).default(defaults.size),
    lineHeight: z.coerce.number().min(0.8).max(3).default(defaults.lineHeight),
    letterSpacing: z.string().trim().regex(/^-?(?:\d+\.?\d*|\.\d+)(?:px|em|rem)$/).refine((value) => Math.abs(Number.parseFloat(value)) <= 1, 'Letter spacing must be between -1 and 1 CSS units.').default(defaults.letterSpacing),
    case: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).default(defaults.case),
  }).default(defaults)];
}));
export const typographySettingsSchema = z.object({
  fonts: z.object(Object.fromEntries(THEME_FONT_ROLES.map((role) => [role, typographyFontSchema.default(DEFAULT_TYPOGRAPHY.fonts[role])]))).default(DEFAULT_TYPOGRAPHY.fonts),
  presets: z.object(typographyPresetSchemas).default(DEFAULT_TYPOGRAPHY.presets),
}).default(DEFAULT_TYPOGRAPHY);

export const themeSettingsSchema = z.object({
  ...Object.fromEntries(THEME_COLORS.map((color) => [color.key, themeHexColorSchema(color.label).default(color.default)])),
  colorSchemes: colorSchemesSettingsSchema,
  typography: typographySettingsSchema,
}).prefault({});

export const shippingRateSchema = z.object({
  id: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1, 'Name each shipping rate.').max(80),
  description: z.string().trim().max(160).default(''),
  priceCents: z.coerce.number().int().min(0).max(1000000),
  // 0 means the rate is never free.
  freeOverCents: z.coerce.number().int().min(0).max(100000000).default(0),
  // Empty means every country.
  countries: countryList.default([]),
  active: z.boolean().default(true),
});

export const taxRateSchema = z.object({
  country: z.string().trim().toUpperCase().length(2, 'Use two-letter country codes, e.g. US.'),
  // Empty means the whole country.
  region: z.string().trim().toUpperCase().max(10).default(''),
  name: z.string().trim().min(1, 'Name each tax rate.').max(80),
  ratePercent: z.coerce.number().min(0).max(30),
});

// Starting values only: the owner sets the real rates under Settings.
// Free shipping on all orders; paid options (e.g. express) can be added under Settings.
// Wording shown in the product page sections (Admin → Settings → Product page text).
// **bold** and {email} (the store contact email, as a link) work in the shipping text.
export const DEFAULT_PRODUCT_INFO = {
  diamondNote: '(E/F color, VVS/VS clarity)',
  careIntro: 'Treat your byShreen jewelry with care to keep it beautiful for years to come.',
  careBullets: 'Remove jewelry before showering, swimming, exercising, or sleeping.\nAvoid contact with perfumes, lotions, and harsh chemicals.\nStore each piece separately in a soft pouch or jewelry box to prevent scratching.\nClean gently with a soft, lint-free cloth.\nFor a deeper clean or professional care, contact us — we’re always happy to help.',
  careSignoff: 'Made to be worn. Made to last. Made to be passed down.',
  shippingHeading: 'Made to order, just for you.',
  shippingTag: 'Free shipping on all orders',
  shippingBody: 'Every byShreen piece is made to order and carefully crafted with your piece in mind. Please allow **5–7 weeks** for production before your jewelry is shipped.\n\nOnce your order is ready, you’ll receive tracking information via email. We ship internationally.\n\nIf you would like to return or exchange your piece, please contact us at {email} and we’ll be happy to assist you with the next steps.',
  shippingNote: 'As all byShreen pieces are made to order, return and exchange eligibility may vary by piece.',
};

export const DEFAULT_COMING_SOON = {
  heading: 'Welcome to byShreen',
  showLogo: true,
  blocks: [
    { id: 'intro', type: 'text', text: 'Our website is coming together. In the meantime, let’s create something just for you.', label: '', url: '' },
    { id: 'contact', type: 'text', text: 'For custom jewelry and creations, email Shreen or send a DM on Instagram.', label: '', url: '' },
  ],
};

// Links may go to a web page, an email address, a phone number, or a page on this site.
const safeUrl = (value) => /^(https?:\/\/|mailto:|tel:|\/)/i.test(value);

export const comingSoonBlockSchema = z.object({
  id: z.string().trim().min(1).max(40),
  type: z.enum(['text', 'link', 'button']),
  text: z.string().trim().max(1000).default(''),
  label: z.string().trim().max(80).default(''),
  url: z.string().trim().max(500).default('').transform((value) => (value && !/^[a-z][a-z0-9+.-]*:|^\//i.test(value) ? (value.includes('@') ? `mailto:${value}` : `https://${value}`) : value)),
}).refine((block) => block.type === 'text' || !block.url || safeUrl(block.url), { message: 'Links must start with https://, mailto:, tel: or /.', path: ['url'] });

export const DEFAULT_SHIPPING_RATES = [
  { id: 'insured-us', name: 'Free insured shipping', description: 'Fully insured, signature required', priceCents: 0, freeOverCents: 0, countries: ['US'], active: true },
];
export const DEFAULT_TAX_RATES = [{ country: 'US', region: 'NY', name: 'New York sales tax', ratePercent: 8.875 }];

export const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(1).max(120).default('byShreen'),
  contactEmail: z.string().trim().toLowerCase().email('Enter a valid contact email.').default('shreen@byshreen.com'),
  phone: z.string().trim().max(40).default(''),
  address: z.object({
    line1: z.string().trim().max(120).default(''),
    line2: z.string().trim().max(120).default(''),
    city: z.string().trim().max(80).default('New York'),
    region: z.string().trim().max(40).default('NY'),
    postalCode: z.string().trim().max(20).default(''),
    country: z.string().trim().length(2).default('US'),
  }).prefault({}),
  notifications: z.object({
    recipients: emailList.default(['shreen@byshreen.com']),
    newRequest: z.boolean().default(true),
    newOrder: z.boolean().default(true),
    customerOrderEmails: z.boolean().default(true),
    customerRequestEmails: z.boolean().default(true),
  }).prefault({}),
  shipping: z.object({
    rates: z.array(shippingRateSchema).max(20).default(DEFAULT_SHIPPING_RATES),
  }).prefault({}),
  theme: themeSettingsSchema,
  // Admin → Email templates → Email design. Empty colors follow the site Theme.
  emailDesign: z.object({
    logo: z.string().trim().max(600).default(''),
    logoWidth: z.coerce.number().int().min(40).max(320).default(140),
    accentColor: z.string().trim().toLowerCase().regex(/^(#[0-9a-f]{6})?$/, 'Use a color like #a84d5f.').default(''),
    backgroundColor: z.string().trim().toLowerCase().regex(/^(#[0-9a-f]{6})?$/, 'Use a color like #fff6df.').default(''),
  }).prefault({}),
  appointments: appointmentSettingsSchema.prefault({}),
  productInfo: z.object({
    diamondNote: z.string().trim().max(200).default(DEFAULT_PRODUCT_INFO.diamondNote),
    careIntro: z.string().trim().max(500).default(DEFAULT_PRODUCT_INFO.careIntro),
    careBullets: z.string().trim().max(2000).default(DEFAULT_PRODUCT_INFO.careBullets),
    careSignoff: z.string().trim().max(300).default(DEFAULT_PRODUCT_INFO.careSignoff),
    shippingHeading: z.string().trim().max(200).default(DEFAULT_PRODUCT_INFO.shippingHeading),
    shippingTag: z.string().trim().max(80).default(DEFAULT_PRODUCT_INFO.shippingTag),
    shippingBody: z.string().trim().max(4000).default(DEFAULT_PRODUCT_INFO.shippingBody),
    shippingNote: z.string().trim().max(500).default(DEFAULT_PRODUCT_INFO.shippingNote),
  }).prefault({}),
  // Admin → Coming soon. While enabled, visitors see only the landing page (admins can still browse the site).
  comingSoon: z.object({
    enabled: z.boolean().default(false),
    heading: z.string().trim().max(120).default(DEFAULT_COMING_SOON.heading),
    showLogo: z.boolean().default(true),
    blocks: z.array(comingSoonBlockSchema).max(20).default(DEFAULT_COMING_SOON.blocks),
  }).prefault({}),
  tax: z.object({
    enabled: z.boolean().default(true),
    shippingTaxable: z.boolean().default(false),
    rates: z.array(taxRateSchema).max(60).default(DEFAULT_TAX_RATES),
  }).prefault({}),
});

export const DEFAULT_SETTINGS = storeSettingsSchema.parse({});

/** Store settings merged over defaults, so new settings always have a value. */
export async function getStoreSettings() {
  try {
    const db = await getDb();
    const saved = await db.collection(SETTINGS_COLLECTION).findOne({ _id: SETTINGS_ID });
    if (!saved) return DEFAULT_SETTINGS;
    const { _id, updatedAt, updatedBy, ...rest } = saved;
    const parsed = storeSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, ...rest, address: { ...DEFAULT_SETTINGS.address, ...rest.address }, notifications: { ...DEFAULT_SETTINGS.notifications, ...rest.notifications } });
    return parsed.success ? { ...rest, ...parsed.data } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Reads the public gate switch separately so the root layout can fail closed on a database outage. */
export async function getComingSoonGateSettings() {
  try {
    const db = await getDb();
    const saved = await db.collection(SETTINGS_COLLECTION).findOne(
      { _id: SETTINGS_ID },
      { projection: { comingSoon: 1 } },
    );
    const parsed = storeSettingsSchema.shape.comingSoon.safeParse(saved?.comingSoon || {});
    if (!parsed.success) return { available: false, page: DEFAULT_SETTINGS.comingSoon };
    return { available: true, page: parsed.data };
  } catch {
    return { available: false, page: DEFAULT_SETTINGS.comingSoon };
  }
}

export async function ensureStoreSettingsIndexes() {
  const db = await getDb();
  await db.collection(SETTINGS_COLLECTION)
    .createIndex({ themeDraftUpdatedAt: -1 }, { name: 'store_theme_draft_updated' }).catch(() => {});
  await db.collection('themeRevisions')
    .createIndex({ createdAt: -1 }, { name: 'theme_revisions_time' }).catch(() => {});
  return { settings: SETTINGS_COLLECTION, themeRevisions: 'themeRevisions' };
}

/** Versioned theme draft: holds editor draft separately so save ≠ publish (Shopify parity). */
export async function getThemeDraft() {
  try {
    const db = await getDb();
    const saved = await db.collection(SETTINGS_COLLECTION).findOne({ _id: SETTINGS_ID }, { projection: { theme: 1, themeDraft: 1, themeDraftUpdatedAt: 1, themeDraftUpdatedBy: 1, themeVersion: 1 } });
    if (!saved) return { theme: DEFAULT_SETTINGS.theme, draft: null, version: 0 };
    const parsedTheme = themeSettingsSchema.safeParse(saved.theme);
    const theme = parsedTheme.success ? parsedTheme.data : DEFAULT_SETTINGS.theme;
    const draft = saved.themeDraft ? (themeSettingsSchema.safeParse(saved.themeDraft).success ? themeSettingsSchema.parse(saved.themeDraft) : null) : null;
    return { theme, draft, version: typeof saved.themeVersion === 'number' ? saved.themeVersion : 0, draftUpdatedAt: saved.themeDraftUpdatedAt || null };
  } catch {
    return { theme: DEFAULT_SETTINGS.theme, draft: null, version: 0 };
  }
}

export async function saveThemeDraft(themeDraft, actor, expectedVersion) {
  const parsed = themeSettingsSchema.parse(themeDraft);
  const db = await getDb();
  const now = new Date();
  const current = await db.collection(SETTINGS_COLLECTION).findOne({ _id: SETTINGS_ID }, { projection: { themeVersion: 1 } });
  const currentVersion = typeof current?.themeVersion === 'number' ? current.themeVersion : 0;
  if (typeof expectedVersion === 'number' && expectedVersion !== currentVersion) {
    const error = new Error('Theme changed in another session. Reload before saving.');
    error.code = 'VERSION_CONFLICT';
    throw error;
  }
  await db.collection(SETTINGS_COLLECTION).updateOne(
    { _id: SETTINGS_ID, ...(typeof expectedVersion === 'number' && current ? { themeVersion: expectedVersion } : {}) },
    { $set: { themeDraft: parsed, themeDraftUpdatedAt: now, themeDraftUpdatedBy: actor, updatedAt: now, updatedBy: actor }, $inc: { themeVersion: 1 }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  );
  await db.collection('themeRevisions').insertOne({ kind: 'draft', theme: parsed, createdAt: now, createdBy: actor });
  return { theme: parsed, version: currentVersion + 1 };
}

export async function publishThemeDraft(actor, expectedVersion) {
  const db = await getDb();
  const saved = await db.collection(SETTINGS_COLLECTION).findOne({ _id: SETTINGS_ID });
  const draft = saved?.themeDraft ? themeSettingsSchema.parse(saved.themeDraft) : null;
  if (!draft) throw new Error('No theme draft to publish.');
  const currentVersion = typeof saved?.themeVersion === 'number' ? saved.themeVersion : 0;
  if (typeof expectedVersion === 'number' && expectedVersion !== currentVersion) {
    const error = new Error('Theme changed in another session. Reload before saving.');
    error.code = 'VERSION_CONFLICT';
    throw error;
  }
  const now = new Date();
  await db.collection(SETTINGS_COLLECTION).updateOne(
    { _id: SETTINGS_ID, ...(typeof expectedVersion === 'number' ? { themeVersion: expectedVersion } : {}) },
    { $set: { theme: draft, themeDraft: null, themeDraftUpdatedAt: null, themePublishedAt: now, themePublishedBy: actor, updatedAt: now, updatedBy: actor }, $inc: { themeVersion: 1 } },
  );
  await db.collection('themeRevisions').insertOne({ kind: 'published', theme: draft, createdAt: now, createdBy: actor });
  return getStoreSettings();
}

/** Saves one group of settings (e.g. `notifications`) without touching the others. */
export async function saveStoreSettings(patch, actor) {
  const current = await getStoreSettings();
  const next = { ...current, ...patch };
  const parsed = storeSettingsSchema.parse({ ...next, address: { ...current.address, ...patch.address }, notifications: { ...current.notifications, ...patch.notifications } });
  const extra = Object.fromEntries(Object.entries(next).filter(([key]) => !(key in parsed)));
  const db = await getDb();
  // Non-theme patches keep themeVersion semantics but do not write themeDraft
  await db.collection(SETTINGS_COLLECTION).updateOne({ _id: SETTINGS_ID }, { $set: { ...extra, ...parsed, updatedAt: new Date(), updatedBy: actor } }, { upsert: true });
  return getStoreSettings();
}
