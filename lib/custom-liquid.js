import { Liquid } from 'liquidjs';
import { customHtmlScope, sanitizeCustomHtml } from './custom-html';

export const CUSTOM_LIQUID_MAX_SOURCE_LENGTH = 12000;
export const CUSTOM_LIQUID_MAX_OUTPUT_LENGTH = 40000;

const RESOURCE_TEXT_LIMITS = {
  title: 300,
  description: 5000,
  handle: 180,
  image: 1000,
};

function boundedString(value, limit) {
  return typeof value === 'string' ? value.slice(0, limit) : '';
}

function imageUrl(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  return typeof value.url === 'string' ? value.url : typeof value.src === 'string' ? value.src : '';
}

function safeHandle(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]+$/.test(value) ? value : '';
}

/** Project a resource into the small, public shape available to a Custom Liquid template. */
export function customLiquidResourceContext(resourceType, resource) {
  if (!resource || !['product', 'collection'].includes(resourceType)) return {};
  const handle = safeHandle(resource.handle);
  if (resourceType === 'product') {
    const featuredImage = imageUrl(resource.featuredImage || resource.featured_image || resource.images?.[0]);
    return {
      product: Object.freeze({
        title: boundedString(resource.title, RESOURCE_TEXT_LIMITS.title),
        description: boundedString(resource.description, RESOURCE_TEXT_LIMITS.description),
        handle,
        url: handle ? `/shop/${handle}` : '',
        featured_image: boundedString(featuredImage, RESOURCE_TEXT_LIMITS.image),
      }),
    };
  }

  const collectionImage = imageUrl(resource.image);
  return {
    collection: Object.freeze({
      title: boundedString(resource.title || resource.name, RESOURCE_TEXT_LIMITS.title),
      description: boundedString(resource.description || resource.note, RESOURCE_TEXT_LIMITS.description),
      handle,
      url: handle ? `/collections/${handle}` : '',
      image: boundedString(collectionImage, RESOURCE_TEXT_LIMITS.image),
    }),
  };
}

function createLiquidEngine() {
  const engine = new Liquid({
    strictVariables: true,
    strictFilters: true,
    ownPropertyOnly: true,
    outputEscape: 'escape',
    dynamicPartials: false,
    relativeReference: false,
    parseLimit: CUSTOM_LIQUID_MAX_SOURCE_LENGTH,
    renderLimit: 40,
    memoryLimit: 60000,
    cache: false,
  });

  // Templates are self-contained. Do not allow includes, layouts, or raw output to bypass
  // the bounded context and default HTML escaping.
  delete engine.tags.include;
  delete engine.tags.render;
  delete engine.tags.layout;
  delete engine.tags.raw;
  engine.unregisterFilter('raw');
  return engine;
}

const liquidEngine = createLiquidEngine();

/** Render safe, self-contained Liquid into sanitized HTML for the resource template preview/storefront. */
export function renderCustomLiquid(source, resourceType, resource) {
  const templateSource = typeof source === 'string' ? source : '';
  if (templateSource.length > CUSTOM_LIQUID_MAX_SOURCE_LENGTH) {
    throw new Error(`Liquid source is limited to ${CUSTOM_LIQUID_MAX_SOURCE_LENGTH.toLocaleString()} characters.`);
  }

  const parsed = liquidEngine.parse(templateSource);
  const output = liquidEngine.renderSync(parsed, customLiquidResourceContext(resourceType, resource), {
    strictVariables: true,
    ownPropertyOnly: true,
    templateLimit: 1000,
    renderLimit: 40,
    memoryLimit: 60000,
  });
  const rendered = String(output || '');
  if (rendered.length > CUSTOM_LIQUID_MAX_OUTPUT_LENGTH) {
    throw new Error(`Liquid output is limited to ${CUSTOM_LIQUID_MAX_OUTPUT_LENGTH.toLocaleString()} characters.`);
  }

  return sanitizeCustomHtml(rendered);
}

export function customLiquidScope(id) {
  return customHtmlScope(`liquid-${id || 'section'}`);
}
