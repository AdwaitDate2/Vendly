'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { archiveCollection, archiveProduct, bulkSetProductStatus, collectionInputSchema, productInputSchema, saveCollection, saveProduct } from './catalog';
import { destroyAdminSession, hasPermission, registerAndSignIn, requireAdminPermission, signInWithDeveloperToken, signInWithPassword } from './admin-auth';
import { contentKeys, contentSaveSchema, getContentRoute, getEditableContent, isBlockPage, saveContent } from './content';
import { commitProductImport, planProductImport, saveBulkProductEdits } from './product-bulk';
import { createCustomPage, deleteCustomPage, getCustomPageById, saveCustomPage } from './custom-pages';
import { adjustInventory, inventoryAdjustmentSchema } from './inventory';
import { updateInquiry } from './leads';
import { runRequestStep } from './request-flow';
import { composeCare, composeShipping, isSharedText } from './product-info';
import { logActivity } from './activity';
import { getStoreSettings, saveStoreSettings } from './settings';
import { updateStorefrontPassword } from './storefront-password';
import { ROLES, inviteAdminUser, resetAdminPassword, updateAdminUser } from './admin-users';

// Products, collections, and site-wide text appear on many routes, so refresh every page.
function revalidateStorefront() {
  revalidatePath('/', 'layout');
}

const LOGIN_MESSAGES = {
  invalid: 'That email and password combination is not valid.',
  locked: 'Too many attempts. This account is locked for 15 minutes.',
  unconfigured: 'Account login is not configured on this server yet.',
};

export async function loginAdmin(_previousState, formData) {
  const token = String(formData.get('token') || '');
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');

  if (token && !email) {
    if (!(await signInWithDeveloperToken(token))) return { message: 'That developer token is not valid.', errors: {} };
    redirect('/dashboard');
  }

  if (!email || !password) return { message: 'Enter your email and password.', errors: {}, email };

  let result;
  try {
    result = await signInWithPassword(email, password);
  } catch {
    return { message: 'We could not reach the database. Try again in a moment.', errors: {}, email };
  }
  if (result !== 'ok') return { message: LOGIN_MESSAGES[result], errors: {}, email };

  await logActivity({ actor: email.trim().toLowerCase(), type: 'auth', action: 'Signed in' });
  redirect('/dashboard');
}

export async function logoutAdmin() {
  await destroyAdminSession();
  redirect('/admin/login');
}

export async function registerStoreOwner(_previousState, formData) {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  if (!name || !email || !password) return { message: 'Enter your name, email, and password.', errors: {} };

  try {
    const result = await registerAndSignIn({ name, email, password });
    if (!result.ok) return { message: 'Account registration is not configured. Set the database and session secret first.', errors: {} };
  } catch (error) {
    if (error?.name === 'ZodError') return { message: error.issues?.[0]?.message || 'Check your account details.', errors: {} };
    if (/already exists/i.test(error?.message || '')) return { message: error.message, errors: {}, email };
    return { message: 'We could not create your account. Check the database connection and try again.', errors: {}, email };
  }
  redirect('/dashboard');
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(String(value || ''));
  } catch {
    return fallback;
  }
}

function sectionValidationDetails(issues = [], sections = []) {
  const issue = issues.find((entry) => entry.path?.[0] === 'sections');
  if (!issue) return null;
  const sectionIndex = Number(issue.path[1]);
  const fieldPath = issue.path.slice(2).map(String).join('.');
  const field = fieldPath.split('.').filter((part) => !/^\d+$/.test(part)).at(-1) || 'section';
  const limitMessage = issue.code === 'too_big' && issue.maximum !== undefined
    ? `Keep this to ${issue.maximum} ${issue.origin === 'array' ? 'items' : 'characters'} or fewer.`
    : issue.code === 'too_small' && issue.minimum !== undefined
      ? `Enter at least ${issue.minimum} ${issue.origin === 'array' ? 'items' : 'characters'}.`
      : issue.message || 'Check this section.';
  return {
    sectionIndex: Number.isInteger(sectionIndex) ? sectionIndex : null,
    sectionId: Number.isInteger(sectionIndex) ? sections[sectionIndex]?.id || '' : '',
    fieldPath,
    field,
    message: limitMessage,
  };
}

function formToProduct(formData) {
  // An empty price must fail validation rather than silently become $0.
  const variants = parseJson(formData.get('variants'), undefined)?.map((variant) => ({ ...variant, price: variant.price === '' ? Number.NaN : variant.price }));
  return {
    variants,
    sizeOption: parseJson(formData.get('sizeOption'), undefined),
    tags: String(formData.get('tags') || '').split(',').map((tag) => tag.trim()).filter(Boolean),
    seoTitle: String(formData.get('seoTitle') || ''),
    seoDescription: String(formData.get('seoDescription') || ''),
    madeToOrder: formData.get('madeToOrder') === 'yes',
    saleMode: formData.get('saleMode') === 'enquire' ? 'enquire' : 'buy',
    hiddenSections: ['details', 'care', 'shipping'].filter((key) => !formData.getAll('showSections').includes(key)),
    detailsExtra: String(formData.get('detailsExtra') || ''),
    careText: String(formData.get('careText') || ''),
    shippingText: String(formData.get('shippingText') || ''),
    id: String(formData.get('id') || ''),
    version: String(formData.get('version') || '') || undefined,
    title: String(formData.get('title') || ''),
    shortTitle: String(formData.get('shortTitle') || ''),
    slug: String(formData.get('slug') || ''),
    price: formData.get('saleMode') === 'enquire' ? '0' : Array.isArray(variants) && variants.length ? variants[0].price : String(formData.get('price') || ''),
    category: String(formData.get('category') || ''),
    metal: String(formData.get('metal') || ''),
    stone: String(formData.get('stone') || ''),
    caratWeight: String(formData.get('caratWeight') || ''),
    description: String(formData.get('description') || ''),
    status: String(formData.get('saveIntent') || formData.get('status') || 'draft'),
    images: String(formData.get('images') || '').split(/[,\n]/).map((image) => image.trim()).filter(Boolean),
  };
}

function formToCollection(formData) {
  return {
    id: String(formData.get('id') || ''),
    version: String(formData.get('version') || '') || undefined,
    name: String(formData.get('name') || ''),
    slug: String(formData.get('slug') || ''),
    image: String(formData.get('image') || ''),
    note: String(formData.get('note') || ''),
    sortOrder: String(formData.get('sortOrder') || '0'),
    status: String(formData.get('status') || 'draft'),
    seoTitle: String(formData.get('seoTitle') || ''),
    seoDescription: String(formData.get('seoDescription') || ''),
  };
}

export async function saveProductAction(previousState, formData) {
  const session = await requireAdminPermission('product:write');
  const raw = formToProduct(formData);
  // Text identical to the shared wording is not an override, so it keeps following Settings.
  const { productInfo } = await getStoreSettings();
  if (isSharedText(raw.careText, composeCare(productInfo))) raw.careText = '';
  if (isSharedText(raw.shippingText, composeShipping(productInfo))) raw.shippingText = '';
  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { message: 'Review the highlighted fields.', errors: parsed.error.flatten().fieldErrors };
  }

  let product;
  try {
    product = await saveProduct(parsed.data);
  } catch (error) {
    if (error.code === 11000) return { message: 'A product with that slug already exists.', errors: { slug: ['Choose a unique slug.'] } };
    if (error.code === 'VERSION_CONFLICT') return { message: error.message, errors: {} };
    return { message: error.message || 'Unable to save product.', errors: {} };
  }
  revalidatePath('/admin');
  revalidatePath('/admin/products');
  revalidateStorefront();
  await logActivity({ actor: session.email, type: 'product', action: parsed.data.id ? 'Updated product' : 'Created product', label: product.title, href: `/admin/products/${product.id}` });
  redirect(`/admin/products/${product.id}`);
}

export async function previewProductImportAction(rows) {
  const session = await requireAdminPermission('product:write');
  try {
    return { ok: true, plan: await planProductImport(rows) };
  } catch (error) {
    return { ok: false, message: error.message || 'Could not read the file.' };
  }
}

export async function importProductsAction(rows) {
  const session = await requireAdminPermission('product:write');
  try {
    const summary = await commitProductImport(rows);
    await logActivity({ actor: session.email, type: 'product', action: 'Imported products from CSV', details: `${summary.created} created, ${summary.updated} updated, ${summary.skipped} skipped` });
    revalidatePath('/admin/products');
    revalidateStorefront();
    return { ok: true, ...summary };
  } catch (error) {
    return { ok: false, message: error.message || 'Import failed.' };
  }
}

export async function bulkSaveProductsAction(changes) {
  const session = await requireAdminPermission('product:write');
  try {
    const results = await saveBulkProductEdits(changes);
    await logActivity({ actor: session.email, type: 'product', action: 'Bulk edited products', details: `${results.filter((item) => item.ok).length} saved, ${results.filter((item) => !item.ok).length} failed` });
    revalidatePath('/admin/products');
    revalidateStorefront();
    return { ok: true, results };
  } catch (error) {
    return { ok: false, message: error.message || 'Could not save changes.' };
  }
}

export async function archiveProductAction(formData) {
  const session = await requireAdminPermission('product:write');
  try {
    await archiveProduct(String(formData.get('id') || ''), Number(formData.get('version') || 0));
    await logActivity({ actor: session.email, type: 'product', action: 'Archived product', href: `/admin/products/${String(formData.get('id') || '')}` });
    revalidatePath('/admin');
    revalidatePath('/admin/products');
    revalidateStorefront();
    return redirect('/admin/products?archived=1');
  } catch (error) {
    if (error?.digest?.startsWith?.('NEXT_REDIRECT')) throw error;
    redirect(`/admin/products/${String(formData.get('id') || '')}?error=${encodeURIComponent(error.message || 'Unable to archive')}`);
  }
}

export async function bulkUpdateProductStatusAction(ids, status) {
  const session = await requireAdminPermission('product:write');
  if (!Array.isArray(ids) || !ids.length) return { message: 'No products selected.', matched: 0 };
  const result = await bulkSetProductStatus(ids, status);
  await logActivity({ actor: session.email, type: 'product', action: `Set ${result.matched} product${result.matched === 1 ? '' : 's'} to ${status}` });
  revalidatePath('/admin');
  revalidatePath('/admin/products');
  revalidateStorefront();
  return { message: `Updated ${result.matched} product${result.matched === 1 ? '' : 's'}.`, matched: result.matched };
}

export async function saveCollectionAction(_previousState, formData) {
  const session = await requireAdminPermission('collection:write');
  const raw = formToCollection(formData);
  const parsed = collectionInputSchema.safeParse(raw);
  if (!parsed.success) return { message: 'Review the collection fields.', errors: parsed.error.flatten().fieldErrors };

  let collection;
  try {
    collection = await saveCollection(parsed.data);
  } catch (error) {
    if (error.code === 11000) return { message: 'A collection with that slug already exists.', errors: { slug: ['Choose a unique slug.'] } };
    if (error.code === 'COLLECTION_SLUG_LOCKED') return { message: error.message, errors: { slug: [error.message] } };
    if (error.code === 'VERSION_CONFLICT') return { message: error.message, errors: {} };
    return { message: error.message || 'Unable to save the collection.', errors: {} };
  }
  revalidatePath('/admin');
  revalidatePath('/admin/collections');
  revalidatePath('/admin/collections/' + collection.id);
  revalidateStorefront();
  await logActivity({ actor: session.email, type: 'collection', action: raw.id ? 'Updated collection' : 'Created collection', label: collection.name, href: '/admin/collections/' + collection.id });
  redirect('/admin/collections/' + collection.id);
}

export async function archiveCollectionAction(formData) {
  const session = await requireAdminPermission('collection:write');
  const id = String(formData.get('id') || '');
  try {
    await archiveCollection(id, Number(formData.get('version') || 0));
    await logActivity({ actor: session.email, type: 'collection', action: 'Archived collection', href: '/admin/collections/' + id });
    revalidatePath('/admin');
    revalidatePath('/admin/collections');
    revalidateStorefront();
    return redirect('/admin/collections?archived=1');
  } catch (error) {
    if (error?.digest?.startsWith?.('NEXT_REDIRECT')) throw error;
    redirect('/admin/collections/' + id + '?error=' + encodeURIComponent(error.message || 'Unable to archive'));
  }
}

const REASON_LABELS = { restock: 'new stock', correction: 'count correction', damage: 'damaged', return: 'returned', sale: 'sold in person', reserve: 'reserved', release: 'released', other: 'other' };

export async function adjustInventoryAction(_previousState, formData) {
  const session = await requireAdminPermission('inventory:write');
  // mode: add | remove | set. The alert level is optional and can be saved on its own.
  const mode = String(formData.get('mode') || 'add');
  const amount = String(formData.get('amount') ?? formData.get('delta') ?? '').trim();
  const threshold = String(formData.get('lowStockThreshold') ?? '').trim();
  const input = {
    productId: String(formData.get('productId') || ''),
    variantId: String(formData.get('variantId') || ''),
    version: String(formData.get('version') || ''),
    reason: String(formData.get('reason') || (mode === 'add' ? 'restock' : 'correction')),
    note: String(formData.get('note') || ''),
    ...(amount ? (mode === 'set' ? { setTo: amount } : { delta: mode === 'remove' ? String(-Math.abs(Number(amount))) : amount }) : {}),
    ...(threshold ? { lowStockThreshold: threshold } : {}),
  };
  const parsed = inventoryAdjustmentSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { message: issue?.message === 'Enter a non-zero adjustment.' || issue?.message === 'Enter a quantity.' ? 'Enter how many pieces.' : issue?.message || 'Check the quantity.', errors: parsed.error.flatten().fieldErrors };
  }
  try {
    const result = await adjustInventory(parsed.data, session.email);
    const label = [result.productTitle, result.variantTitle].filter(Boolean).join(' · ') || result.sku;
    await logActivity({ actor: session.email, type: 'inventory', action: result.delta ? 'Updated stock' : 'Changed low-stock alert', label, details: result.delta ? `${result.beforeQuantity} → ${result.afterQuantity} (${REASON_LABELS[parsed.data.reason] || parsed.data.reason})` : `Alert at ${result.lowStockThreshold}`, href: '/admin/inventory/' + parsed.data.productId });
    revalidatePath('/admin');
    revalidatePath('/admin/inventory');
    revalidatePath('/admin/inventory/' + parsed.data.productId);
    // Ready-to-ship pieces show as available or sold out on the website.
    revalidateStorefront();
    const parts = [];
    if (result.delta) parts.push(`Stock ${result.beforeQuantity} → ${result.afterQuantity}`);
    if (result.thresholdChanged) parts.push(`alert at ${result.lowStockThreshold} or fewer`);
    return { message: `${parts.join(', ')}.`.replace(/^./, (c) => c.toUpperCase()), errors: {}, saved: true, at: Date.now() };
  } catch (error) {
    if (error.code === 'VERSION_CONFLICT') return { message: 'This product changed since the page loaded (for example an order came in). Reload and try again.', errors: {} };
    if (error.code === 'INSUFFICIENT_STOCK') return { message: 'You can’t remove more pieces than are in stock.', errors: { delta: [error.message] } };
    if (error.code === 'NO_CHANGE') return { message: error.message, errors: {} };
    return { message: error.message || 'Unable to update stock.', errors: {} };
  }
}

function formToContent(formData) {
  let sections = [];
  try {
    sections = JSON.parse(String(formData.get('sections') || '[]'));
  } catch {
    sections = null;
  }
  return {
    id: String(formData.get('id') || ''),
    version: String(formData.get('version') || '') || undefined,
    key: String(formData.get('key') || ''),
    title: String(formData.get('title') || ''),
    intro: String(formData.get('intro') || ''),
    status: String(formData.get('status') || 'draft'),
    seoTitle: String(formData.get('seoTitle') || ''),
    seoDescription: String(formData.get('seoDescription') || ''),
    sections,
  };
}

// Only owners may add or change Custom HTML blocks; editors can still move or remove them.
const CODE_ONLY_OWNERS = 'Only an owner can add or change Custom HTML blocks. Undo those changes, or ask the studio owner.';
const SECTION_CSS_ONLY_OWNERS = 'Only an owner can add or change section Custom CSS. Undo those code changes, or ask the studio owner.';
function customHtmlChanged(before = [], after = []) {
  const key = (section) => `${String(section.html || '').trim()}\u0000${String(section.css || '').trim()}`;
  const previous = new Map(before.filter((section) => section?.type === 'customHtml').map((section) => [section.id, key(section)]));
  return after.filter((section) => section?.type === 'customHtml').some((section) => previous.get(section.id) !== key(section));
}
function sectionCustomCssChanged(before = [], after = []) {
  const collectCssByPath = (sections) => {
    const values = new Map();
    const visit = (block, path) => {
      if (block?.settings && Object.hasOwn(block.settings, 'customCss')) values.set(path, String(block.settings.customCss || '').trim());
      for (const childKey of ['blocks', 'cards']) {
        if (!Array.isArray(block?.[childKey])) continue;
        block[childKey].forEach((child, index) => visit(child, `${path}/${childKey}/${child?.id || index}`));
      }
    };
    sections.forEach((section, index) => visit(section, `section/${section?.id || index}`));
    return values;
  };
  const previous = collectCssByPath(before);
  return [...collectCssByPath(after)].some(([path, css]) => previous.get(path) !== css);
}

export async function saveContentAction(_previousState, formData) {
  const session = await requireAdminPermission('content:write');
  const raw = formToContent(formData);
  if (['privacy', 'terms', 'cookies', 'privacyChoices'].includes(raw.key) && raw.status === 'published') {
    return { message: 'Policy content needs business/legal approval before it can be published.', errors: {} };
  }
  const parsed = contentSaveSchema.safeParse(raw);
  if (!parsed.success) return { message: 'Review the highlighted page content and try again.', errors: parsed.error.flatten().fieldErrors, sectionIssue: sectionValidationDetails(parsed.error.issues, raw.sections || []) };
  if (!hasPermission(session, 'code:edit')) {
    const current = await getEditableContent(parsed.data.key);
    if (customHtmlChanged(current.sections, parsed.data.sections)) return { message: CODE_ONLY_OWNERS, errors: {} };
    if (sectionCustomCssChanged(current.sections, parsed.data.sections)) return { message: SECTION_CSS_ONLY_OWNERS, errors: {} };
  }
  try {
    const content = await saveContent(parsed.data, session.email);
    revalidatePath('/admin/content');
    revalidatePath('/admin/content/' + parsed.data.key);
    if (parsed.data.key === 'global' || parsed.data.key === 'navigation') revalidateStorefront();
    else revalidatePath(getContentRoute(parsed.data.key));
    await logActivity({ actor: session.email, type: 'content', action: `Saved ${parsed.data.status === 'published' ? 'and published ' : 'draft of '}page content`, label: content.title, href: '/admin/content/' + parsed.data.key });
    return { message: 'Saved ' + content.title + '.', errors: {}, saved: true };
  } catch (error) {
    if (error.code === 'VERSION_CONFLICT') return { message: error.message, errors: {} };
    return { message: error.message || 'Unable to save content.', errors: {} };
  }
}

/** Save one shared theme-editor record without coupling its version to the page draft. */
export async function saveSharedContentAction(input) {
  const session = await requireAdminPermission('content:write');
  if (!['global', 'navigation'].includes(input?.key)) return { ok: false, message: 'Choose a shared content record to save.' };
  const parsed = contentSaveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message || 'Review the shared content and try again.' };

  if (!hasPermission(session, 'code:edit')) {
    const current = await getEditableContent(parsed.data.key);
    if (customHtmlChanged(current.sections, parsed.data.sections)) return { ok: false, message: CODE_ONLY_OWNERS };
    if (sectionCustomCssChanged(current.sections, parsed.data.sections)) return { ok: false, message: SECTION_CSS_ONLY_OWNERS };
  }

  try {
    const content = await saveContent(parsed.data, session.email);
    revalidatePath('/admin/content');
    revalidatePath('/admin/content/' + parsed.data.key);
    revalidateStorefront();
    await logActivity({ actor: session.email, type: 'content', action: `Saved ${parsed.data.status === 'published' ? 'and published ' : 'draft of '}shared content`, label: content.title, href: '/admin/content/' + parsed.data.key });
    return { ok: true, message: `Saved ${content.title}.`, content };
  } catch (error) {
    return { ok: false, message: error.message || 'Unable to save shared content.' };
  }
}

export async function moveContentSectionAction({ sourceKey, targetKey, sectionId, sourceDraft }) {
  const session = await requireAdminPermission('content:write');
  const sectionFamily = (key) => isBlockPage(key) ? 'blocks' : key === 'faq' ? 'faq' : ['clientCare', 'sizeGuide'].includes(key) ? 'content' : null;
  if (!contentKeys.includes(sourceKey) || !contentKeys.includes(targetKey) || sourceKey === targetKey || !sectionFamily(sourceKey) || sectionFamily(sourceKey) !== sectionFamily(targetKey)) {
    return { message: 'Sections can only move between compatible page types.', errors: {} };
  }

  const excludedKeys = ['shipping', 'returns', 'care', 'repairsWarranty', 'privacy', 'terms', 'accessibility', 'cookies', 'privacyChoices'];
  if (excludedKeys.includes(sourceKey) || excludedKeys.includes(targetKey)) return { message: 'This page type has its own editor and cannot receive sections.', errors: {} };

  const sourceCurrent = await getEditableContent(sourceKey);
  const targetCurrent = await getEditableContent(targetKey);
  if (Number(sourceDraft?.version) !== Number(sourceCurrent.version || 0)) return { message: 'The source page changed in another session. Reload it before moving this section.', errors: {} };
  const movingSection = sourceDraft?.sections?.find((section) => section.id === sectionId);
  if (!movingSection) return { message: 'That section is no longer on this page. Reload and try again.', errors: {} };

  const sourceInput = contentSaveSchema.safeParse({
    ...sourceDraft,
    key: sourceKey,
    id: sourceCurrent.id,
    version: sourceCurrent.version || 0,
    status: 'draft',
    sections: sourceDraft.sections.filter((section) => section.id !== sectionId),
  });
  const targetSection = { ...movingSection, id: `${movingSection.id}-${Date.now().toString(36)}`.slice(0, 80) };
  const targetInput = contentSaveSchema.safeParse({
    key: targetKey,
    id: targetCurrent.id,
    version: targetCurrent.version || 0,
    title: targetCurrent.title,
    intro: targetCurrent.intro,
    status: 'draft',
    seoTitle: targetCurrent.seoTitle,
    seoDescription: targetCurrent.seoDescription,
    sections: [...(targetCurrent.sections || []), targetSection],
  });
  if (!sourceInput.success || !targetInput.success) return { message: 'One of these pages has content that needs attention before the section can move.', errors: {} };
  if (!hasPermission(session, 'code:edit')) {
    if (customHtmlChanged([], [targetSection])) return { message: CODE_ONLY_OWNERS, errors: {} };
    if (sectionCustomCssChanged([], [targetSection])) return { message: SECTION_CSS_ONLY_OWNERS, errors: {} };
  }

  try {
    // Save the destination first so a source-page conflict never loses the section.
    await saveContent(targetInput.data, session.email);
    try {
      await saveContent(sourceInput.data, session.email);
    } catch (error) {
      return { message: `The section was copied to ${targetCurrent.title} as a draft, but the source page changed before it could be removed. Reload both pages to finish the move.`, errors: {} };
    }
    revalidatePath('/admin/content');
    revalidatePath(getContentRoute(sourceKey));
    revalidatePath(getContentRoute(targetKey));
    revalidatePath('/admin/editor/' + sourceKey);
    revalidatePath('/admin/editor/' + targetKey);
    try {
      await logActivity({ actor: session.email, type: 'content', action: 'Moved page section', label: `${movingSection.heading || movingSection.type || 'Section'} to ${targetCurrent.title}`, href: `/admin/editor/${targetKey}` });
    } catch {
      // A failed audit write must not report a completed draft move as failed.
    }
    return { message: 'Moved as a draft.', targetKey };
  } catch (error) {
    return { message: error.message || 'Could not move this section. Reload and try again.', errors: {} };
  }
}

export async function createCustomPageAction(_previousState, formData) {
  const session = await requireAdminPermission('content:write');
  let page;
  try {
    page = await createCustomPage({ title: String(formData.get('title') || '') }, session.email);
  } catch (error) {
    return { message: error.issues ? error.issues[0].message : error.message || 'Could not create the page.' };
  }
  revalidatePath('/admin/content');
  await logActivity({ actor: session.email, type: 'content', action: 'Created page', label: page.title, href: `/admin/content/pages/${page.id}` });
  redirect(`/admin/content/pages/${page.id}`);
}

export async function saveCustomPageAction(_previousState, formData) {
  const session = await requireAdminPermission('content:write');
  let sections = null;
  try { sections = JSON.parse(String(formData.get('sections') || '[]')); } catch { sections = null; }
  if (!hasPermission(session, 'code:edit') && Array.isArray(sections)) {
    const current = await getCustomPageById(String(formData.get('id') || ''));
    if (customHtmlChanged(current?.sections, sections)) return { message: CODE_ONLY_OWNERS, errors: {} };
    if (sectionCustomCssChanged(current?.sections, sections)) return { message: SECTION_CSS_ONLY_OWNERS, errors: {} };
  }
  try {
    const { page, previousSlug } = await saveCustomPage({
      id: String(formData.get('id') || ''),
      version: String(formData.get('version') || '') || undefined,
      title: String(formData.get('title') || ''),
      slug: String(formData.get('slug') || ''),
      status: String(formData.get('status') || 'draft'),
      seoTitle: String(formData.get('seoTitle') || ''),
      seoDescription: String(formData.get('seoDescription') || ''),
      sections,
    }, session.email);
    revalidatePath('/admin/content');
    revalidatePath(`/admin/content/pages/${page.id}`);
    revalidatePath(`/pages/${page.slug}`);
    if (previousSlug !== page.slug) revalidatePath(`/pages/${previousSlug}`);
    await logActivity({ actor: session.email, type: 'content', action: 'Saved page', label: page.title, href: `/admin/content/pages/${page.id}` });
    return { message: `Saved ${page.title}.${page.status === 'published' ? ` Live at ${page.route}` : ''}`, errors: {}, saved: true };
  } catch (error) {
    if (error.issues) {
      const sectionIssue = sectionValidationDetails(error.issues, sections || []);
      return {
        message: sectionIssue ? 'Review the highlighted page content and try again.' : error.issues[0].message,
        errors: sectionIssue ? { sections: [sectionIssue.message] } : {},
        sectionIssue,
      };
    }
    return { message: error.message || 'Unable to save the page.', errors: {} };
  }
}

export async function deleteCustomPageAction(formData) {
  const session = await requireAdminPermission('content:write');
  const slug = await deleteCustomPage(String(formData.get('id') || ''), session.email);
  await logActivity({ actor: session.email, type: 'content', action: 'Deleted page', label: `/pages/${slug}` });
  revalidatePath('/admin/content');
  revalidatePath(`/pages/${slug}`);
  redirect('/admin/content?deleted=1');
}

export async function updateInquiryAction(_previousState, formData) {
  const session = await requireAdminPermission('inquiry:write');
  const id = String(formData.get('id') || '');
  try {
    await updateInquiry(id, {
      status: String(formData.get('status') || 'new'),
      assignee: String(formData.get('assignee') || ''),
      nextFollowUpAt: String(formData.get('nextFollowUpAt') || ''),
      internalNotes: String(formData.get('internalNotes') || ''),
      version: Number(formData.get('version') || 0),
    });
    revalidatePath('/admin/inquiries');
    revalidatePath('/admin/inquiries/' + id);
    await logActivity({ actor: session.email, type: 'inquiry', action: 'Updated request', details: `Status: ${String(formData.get('status') || 'new')}`, href: '/admin/inquiries/' + id });
    return { message: 'Inquiry updated.', saved: true, errors: {} };
  } catch (error) {
    return { message: error.message || 'Unable to update inquiry.', saved: false, errors: {} };
  }
}

export async function requestStepAction(_previousState, formData) {
  const session = await requireAdminPermission('inquiry:write');
  const id = String(formData.get('id') || '');
  const intent = String(formData.get('intent') || '');
  try {
    const result = await runRequestStep(id, {
      intent,
      notify: formData.get('notify') !== 'no',
      date: String(formData.get('date') || ''),
      time: String(formData.get('time') || ''),
      subject: String(formData.get('subject') || ''),
      message: String(formData.get('message') || ''),
    }, session.email);
    await logActivity({ actor: session.email, type: 'inquiry', action: `Request: ${intent}`, href: '/admin/inquiries/' + id });
    revalidatePath('/admin/inquiries');
    revalidatePath('/admin/appointments');
    revalidatePath('/admin/inquiries/' + id);
    revalidatePath('/book-appointment');
    return { ok: true, message: result.message, at: Date.now() };
  } catch (error) {
    return { ok: false, message: error.issues ? error.issues[0].message : error.message || 'Could not complete that step.', at: Date.now() };
  }
}

export async function inviteAdminAction(_previousState, formData) {
  const session = await requireAdminPermission('team:manage');
  const role = String(formData.get('role') || 'editor');
  try {
    const { user, password } = await inviteAdminUser({ email: String(formData.get('email') || ''), name: String(formData.get('name') || ''), role: ROLES[role] ? role : 'editor' });
    await logActivity({ actor: session.email, type: 'team', action: 'Added team member', label: `${user.name} (${user.email})`, details: `Role: ${user.role}` });
    revalidatePath('/admin/team');
    return { ok: true, message: `Account created for ${user.email}.`, password, email: user.email };
  } catch (error) {
    return { ok: false, message: error.issues ? error.issues[0].message : error.message };
  }
}

export async function resetAdminPasswordAction(_previousState, formData) {
  const session = await requireAdminPermission('team:manage');
  try {
    const { user, password } = await resetAdminPassword(String(formData.get('id') || ''));
    await logActivity({ actor: session.email, type: 'team', action: 'Reset password', label: user.email });
    return { ok: true, message: `New password for ${user.email}. Their other sessions were signed out.`, password, email: user.email };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export async function updateAdminUserAction(_previousState, formData) {
  const session = await requireAdminPermission('team:manage');
  const role = formData.get('role');
  const active = formData.get('active');
  try {
    const user = await updateAdminUser(String(formData.get('id') || ''), {
      role: role && ROLES[role] ? String(role) : undefined,
      active: active === null ? undefined : active === 'true',
    }, session.id);
    await logActivity({ actor: session.email, type: 'team', action: user.active ? `Set role to ${user.role}` : 'Deactivated account', label: user.email });
    revalidatePath('/admin/team');
    return { ok: true, message: `${user.email} updated.` };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export async function saveStoreDetailsAction(_previousState, formData) {
  const session = await requireAdminPermission('settings:manage');
  try {
    await saveStoreSettings({
      storeName: String(formData.get('storeName') || ''),
      contactEmail: String(formData.get('contactEmail') || ''),
      phone: String(formData.get('phone') || ''),
      address: {
        line1: String(formData.get('line1') || ''),
        line2: String(formData.get('line2') || ''),
        city: String(formData.get('city') || ''),
        region: String(formData.get('region') || ''),
        postalCode: String(formData.get('postalCode') || ''),
        country: String(formData.get('country') || 'US').toUpperCase(),
      },
    }, session.email);
    await logActivity({ actor: session.email, type: 'settings', action: 'Updated store details' });
    revalidatePath('/admin/settings');
    return { ok: true, message: 'Store details saved.' };
  } catch (error) {
    return { ok: false, message: error.issues ? error.issues[0].message : error.message };
  }
}

export async function saveNotificationSettingsAction(_previousState, formData) {
  const session = await requireAdminPermission('settings:manage');
  try {
    await saveStoreSettings({
      notifications: {
        recipients: String(formData.get('recipients') || '').split(/[,\s]+/).map((value) => value.trim()).filter(Boolean),
        newRequest: formData.get('newRequest') === 'yes',
        newOrder: formData.get('newOrder') === 'yes',
        customerOrderEmails: formData.get('customerOrderEmails') === 'yes',
        customerRequestEmails: formData.get('customerRequestEmails') === 'yes',
      },
    }, session.email);
    await logActivity({ actor: session.email, type: 'settings', action: 'Updated notification settings' });
    revalidatePath('/admin/settings');
    return { ok: true, message: 'Notification settings saved.' };
  } catch (error) {
    return { ok: false, message: error.issues ? error.issues[0].message : error.message };
  }
}

export async function saveComingSoonAction(_previousState, formData) {
  const session = await requireAdminPermission('settings:manage');
  try {
    const enabled = formData.get('enabled') === 'yes';
    // A form opened before an update may not send these fields; never treat that as "clear everything".
    if (!formData.has('blocks')) return { ok: false, message: 'This page is out of date. Reload it and try again.' };
    let blocks;
    try { blocks = JSON.parse(String(formData.get('blocks'))); } catch { blocks = []; }
    await saveStoreSettings({
      comingSoon: {
        enabled,
        heading: String(formData.get('heading') || ''),
        showLogo: formData.get('showLogo') === 'yes',
        // Only paragraphs are editable; empty ones are dropped rather than saved as blank lines.
        blocks: (Array.isArray(blocks) ? blocks : []).filter((block) => block.type === 'text' && String(block.text || '').trim()),
      },
    }, session.email);
    await logActivity({ actor: session.email, type: 'settings', action: enabled ? 'Turned on the coming soon page' : 'Updated the coming soon page (site is live)' });
    revalidatePath('/', 'layout');
    return { ok: true, message: enabled
      ? 'Saved. Visitors see the Password template when a storefront password is configured; otherwise they see this landing page.'
      : 'Saved. The full website is live.' };
  } catch (error) {
    return { ok: false, message: error.issues ? error.issues[0].message : error.message };
  }
}

export async function saveStorefrontPasswordAction(_previousState, formData) {
  const session = await requireAdminPermission('settings:manage');
  const intent = String(formData.get('intent') || 'set');
  const submittedPassword = String(formData.get('password') || '');
  if (intent !== 'disable' && (submittedPassword.length < 10 || submittedPassword.length > 200)) {
    return { ok: false, message: 'Use a password between 10 and 200 characters.' };
  }

  try {
    const { configured } = await updateStorefrontPassword(intent === 'disable' ? '' : submittedPassword, session.email);
    await logActivity({ actor: session.email, type: 'settings', action: configured ? 'Changed storefront password' : 'Disabled storefront password' });
    revalidatePath('/', 'layout');
    revalidatePath('/admin/coming-soon');
    return {
      ok: true,
      message: configured
        ? 'Storefront password saved. With coming-soon mode enabled, visitors will see the published Password template.'
        : 'Storefront password disabled. Coming-soon mode will use its existing landing page.',
    };
  } catch (error) {
    return { ok: false, message: error?.issues?.[0]?.message || 'Unable to save the storefront password.' };
  }
}
