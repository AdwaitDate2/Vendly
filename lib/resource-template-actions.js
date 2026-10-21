'use server';

import { revalidatePath } from 'next/cache';
import { logActivity } from './activity';
import { hasPermission, requireAdminPermission } from './admin-auth';
import { getBlogPostById } from './blog-posts';
import {
  assignResourceTemplate,
  createResourceTemplate,
  createResourceTemplateInputSchema,
  discardResourceTemplateDraft,
  getResourceTemplateEditorData,
  publishResourceTemplate,
  resourceTemplateInputSchema,
  saveResourceTemplateDraft,
} from './resource-templates';

function editorPath(resourceType, templateKey = 'default') {
  return `/admin/editor/templates/${resourceType}/${templateKey}`;
}

function permissionForResource(resourceType) {
  if (resourceType === 'product') return 'product:write';
  if (resourceType === 'collection' || resourceType === 'collection-list') return 'collection:write';
  if (resourceType === 'blog' || resourceType === 'blog-post' || resourceType === 'search' || resourceType === 'cart' || resourceType === '404' || resourceType === 'password' || resourceType === 'gift-card') return 'content:write';
  return null;
}

function parseSections(formData) {
  try {
    const sections = JSON.parse(String(formData.get('sections') || '[]'));
    return Array.isArray(sections) ? sections : null;
  } catch {
    return null;
  }
}

function resourceInputFromForm(formData) {
  const resourceType = String(formData.get('resourceType') || '');
  return {
    resourceType,
    resourceHandle: String(formData.get('resourceHandle') || '').trim() || undefined,
    templateKey: String(formData.get('templateKey') || 'default').trim(),
    sections: parseSections(formData),
    expectedVersion: String(formData.get('version') || '').trim() || undefined,
  };
}

function actionError(error, fallback) {
  return { message: error?.message || fallback, saved: false, errors: {} };
}

const CUSTOM_LIQUID_OWNER_MESSAGE = 'Only an owner can add or change Custom Liquid. Undo those code changes, or ask the studio owner.';
const SECTION_CSS_OWNER_MESSAGE = 'Only an owner can add or change section Custom CSS. Undo those code changes, or ask the studio owner.';

function customLiquidChanged(before = [], after = []) {
  const previousSources = new Map(before.filter((section) => section?.type === 'customLiquid').map((section) => [section.id, String(section.liquid || '').trim()]));
  return after.filter((section) => section?.type === 'customLiquid')
    .some((section) => previousSources.get(section.id) !== String(section.liquid || '').trim());
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

function hasNestedCustomLiquid(blocks = []) {
  return blocks.some((block) => {
    if (block?.type === 'customLiquid') return true;
    return ['blocks', 'cards'].some((key) => Array.isArray(block?.[key]) && hasNestedCustomLiquid(block[key]));
  });
}

function sectionsContainCustomLiquid(sections = []) {
  return sections.some((section) => section?.type === 'customLiquid'
    || hasNestedCustomLiquid(section?.blocks || [])
    || hasNestedCustomLiquid(section?.cards || []));
}

export async function getResourceTemplateEditorAction({ resourceType, resourceHandle, templateKey } = {}) {
  const permission = permissionForResource(resourceType);
  if (!permission) return { ok: false, message: 'Choose a product, collection, collections list, blog, blog post, search, cart, 404, Password, or Gift card template.' };
  await requireAdminPermission(permission);
  try {
    return { ok: true, ...(await getResourceTemplateEditorData({ resourceType, resourceHandle, templateKey })) };
  } catch (error) {
    return { ok: false, message: error.message || 'Could not load this resource template.' };
  }
}

/** ContentForm-compatible server action for resource templates. Publishing the template never changes product or collection status. */
export async function saveResourceTemplateEditorAction(_previousState, formData) {
  const input = resourceInputFromForm(formData);
  const permission = permissionForResource(input.resourceType);
  if (!permission) return { message: 'Choose a product, collection, collections list, blog, search, cart, 404, Password, or Gift card template.', saved: false, errors: {} };
  const session = await requireAdminPermission(permission);
  const parsed = resourceTemplateInputSchema.safeParse(input);
  if (!parsed.success) return { message: 'Review the template sections and try again.', saved: false, errors: parsed.error.flatten().fieldErrors };
  if (parsed.data.sections.some((section) => section.type === 'customLiquid') && !['product', 'collection'].includes(parsed.data.resourceType)) {
    return { message: 'Custom Liquid is available only on product and collection templates.', saved: false, errors: {} };
  }
  if (parsed.data.sections.some((section) => hasNestedCustomLiquid(section.blocks || []) || hasNestedCustomLiquid(section.cards || []))) {
    return { message: 'Custom Liquid can only be added as a top-level product or collection section.', saved: false, errors: {} };
  }
  if (!hasPermission(session, 'code:edit')) {
    let current;
    try {
      current = await getResourceTemplateEditorData({ resourceType: parsed.data.resourceType, resourceHandle: parsed.data.resourceHandle, templateKey: parsed.data.templateKey });
    } catch (error) {
      return actionError(error, 'Unable to verify Custom Liquid permissions. Reload before saving.');
    }
    const hasCustomLiquid = sectionsContainCustomLiquid(current.template?.draft?.sections || [])
      || sectionsContainCustomLiquid(parsed.data.sections);
    if (hasCustomLiquid && parsed.data.expectedVersion === undefined) {
      return { message: 'Reload this template before saving changes that include Custom Liquid.', saved: false, errors: {} };
    }
    if (customLiquidChanged(current.template?.draft?.sections || [], parsed.data.sections)) {
      return { message: CUSTOM_LIQUID_OWNER_MESSAGE, saved: false, errors: {} };
    }
    if (sectionCustomCssChanged(current.template?.draft?.sections || [], parsed.data.sections)) {
      return { message: SECTION_CSS_OWNER_MESSAGE, saved: false, errors: {} };
    }
  }

  try {
    const savedDraft = await saveResourceTemplateDraft(parsed.data, session.email);
    const shouldPublish = String(formData.get('saveIntent') || 'draft') === 'published';
    if (shouldPublish) {
      await publishResourceTemplate({
        resourceType: parsed.data.resourceType,
        templateKey: parsed.data.templateKey,
        expectedVersion: savedDraft.version,
      }, session.email);
    }

    revalidatePath(editorPath(parsed.data.resourceType, parsed.data.templateKey));
    if (parsed.data.resourceHandle) {
      const article = parsed.data.resourceType === 'blog-post' && parsed.data.resourceHandle
        ? await getBlogPostById(parsed.data.resourceHandle).catch(() => null)
        : null;
      const route = parsed.data.resourceType === 'search'
        ? '/search'
        : parsed.data.resourceType === 'cart'
          ? '/cart'
          : parsed.data.resourceType === '404'
            ? '/404'
            : parsed.data.resourceType === 'password' || parsed.data.resourceType === 'gift-card'
              ? ''
        : parsed.data.resourceType === 'blog'
          ? `/blogs/${parsed.data.resourceHandle}`
          : parsed.data.resourceType === 'blog-post'
            ? article?.route
        : parsed.data.resourceType === 'product'
        ? `/shop/${parsed.data.resourceHandle}`
        : parsed.data.resourceType === 'collection-list'
          ? '/collections'
          : `/collections/${parsed.data.resourceHandle}`;
      if (route) revalidatePath(route);
    }
    if (shouldPublish) revalidatePath('/', 'layout');
    await logActivity({
      actor: session.email,
      type: 'content',
      action: shouldPublish ? 'Published resource template' : 'Saved resource template draft',
      label: `${parsed.data.resourceType}: ${parsed.data.templateKey}`,
      href: editorPath(parsed.data.resourceType, parsed.data.templateKey),
    });
    return {
      message: shouldPublish ? 'Template published.' : 'Template draft saved.',
      saved: true,
      version: savedDraft.version,
      published: shouldPublish,
      errors: {},
    };
  } catch (error) {
    if (error.code === 'VERSION_CONFLICT') return actionError(error, 'This template changed in another session. Reload before saving.');
    if (error.code === 11000) return { message: 'This template was created in another session. Reload before saving.', saved: false, errors: {} };
    if (error.issues) return { message: 'Review the template sections and try again.', saved: false, errors: error.flatten?.().fieldErrors || {} };
    return actionError(error, 'Unable to save this resource template.');
  }
}

export async function createResourceTemplateAction(input) {
  const permission = permissionForResource(input?.resourceType);
  if (!permission || ['search', 'cart', '404', 'password', 'gift-card'].includes(input?.resourceType)) return { ok: false, message: `${input?.resourceType === '404' ? '404' : input?.resourceType === 'password' ? 'Password' : input?.resourceType === 'cart' ? 'Cart' : input?.resourceType === 'gift-card' ? 'Gift card' : 'Search'} uses a single template and cannot have additional templates.` };
  const session = await requireAdminPermission(permission);
  try {
    const parsedInput = createResourceTemplateInputSchema.safeParse(input);
    if (!parsedInput.success) return { ok: false, message: parsedInput.error.issues[0]?.message || 'Review the template details and try again.' };
    const parsed = parsedInput.data;
    const sourceData = await getResourceTemplateEditorData({ resourceType: parsed.resourceType, resourceHandle: parsed.resourceHandle, templateKey: parsed.sourceTemplateKey });
    const sections = parsed.sections || sourceData.template?.draft?.sections || sourceData.template?.published?.sections || sourceData.template?.sections || [];
    const containsTopLevelCustomLiquid = sections.some((section) => section?.type === 'customLiquid');
    if (containsTopLevelCustomLiquid && !['product', 'collection'].includes(parsed.resourceType)) {
      return { ok: false, message: 'Custom Liquid is available only on product and collection templates.' };
    }
    if (sections.some((section) => hasNestedCustomLiquid(section?.blocks || []) || hasNestedCustomLiquid(section?.cards || []))) {
      return { ok: false, message: 'Custom Liquid can only be added as a top-level product or collection section.' };
    }
    if (!hasPermission(session, 'code:edit') && sectionsContainCustomLiquid(sections)) {
      return { ok: false, message: CUSTOM_LIQUID_OWNER_MESSAGE };
    }
    if (!hasPermission(session, 'code:edit') && sectionCustomCssChanged(sourceData.template?.draft?.sections || sourceData.template?.published?.sections || sourceData.template?.sections || [], sections)) {
      return { ok: false, message: SECTION_CSS_OWNER_MESSAGE };
    }
    const template = await createResourceTemplate(parsed, session.email);
    revalidatePath(editorPath(parsed.resourceType, template.key));
    await logActivity({ actor: session.email, type: 'content', action: 'Created resource template', label: `${parsed.resourceType}: ${template.name}`, href: editorPath(parsed.resourceType, template.key) });
    return { ok: true, template };
  } catch (error) {
    if (error.code === 11000) return { ok: false, message: 'A template with that name already exists.' };
    return { ok: false, message: error.message || 'Could not create this resource template.' };
  }
}

export async function assignResourceTemplateAction(input) {
  const permission = permissionForResource(input?.resourceType);
  if (!permission || ['search', 'cart', '404', 'password', 'gift-card'].includes(input?.resourceType)) return { ok: false, message: `${input?.resourceType === '404' ? '404' : input?.resourceType === 'password' ? 'Password' : input?.resourceType === 'cart' ? 'Cart' : input?.resourceType === 'gift-card' ? 'Gift card' : 'Search'} does not support template assignment.` };
  const session = await requireAdminPermission(permission);
  try {
    const assignment = await assignResourceTemplate(input, session.email);
    const article = assignment.resourceType === 'blog-post'
      ? await getBlogPostById(assignment.resourceHandle).catch(() => null)
      : null;
    const route = assignment.resourceType === 'product'
      ? `/shop/${assignment.resourceHandle}`
      : assignment.resourceType === 'cart'
        ? '/cart'
        : assignment.resourceType === 'collection-list'
          ? '/collections'
        : assignment.resourceType === 'blog'
          ? `/blogs/${assignment.resourceHandle}`
          : assignment.resourceType === 'blog-post'
            ? article?.route
            : `/collections/${assignment.resourceHandle}`;
    if (route) revalidatePath(route);
    revalidatePath(editorPath(assignment.resourceType, assignment.templateKey));
    await logActivity({ actor: session.email, type: 'content', action: 'Assigned resource template', label: `${assignment.resourceType}: ${assignment.resourceHandle} → ${assignment.templateKey}`, href: editorPath(assignment.resourceType, assignment.templateKey) });
    return { ok: true, assignment };
  } catch (error) {
    return { ok: false, message: error.message || 'Could not assign this template.' };
  }
}

export async function discardResourceTemplateDraftAction(input) {
  const permission = permissionForResource(input?.resourceType);
  if (!permission) return { ok: false, message: 'Choose a product, collection, collections list, blog, blog post, or Password template.' };
  const session = await requireAdminPermission(permission);
  try {
    const result = await discardResourceTemplateDraft(input, session.email);
    revalidatePath(editorPath(result.resourceType, result.templateKey));
    await logActivity({ actor: session.email, type: 'content', action: 'Discarded resource template draft', label: `${result.resourceType}: ${result.templateKey}`, href: editorPath(result.resourceType, result.templateKey) });
    return { ok: true, ...result };
  } catch (error) {
    return { ok: false, message: error.message || 'Could not discard this template draft.' };
  }
}

export async function readResourceTemplateEditorDataAction(input) {
  return getResourceTemplateEditorAction(input);
}
