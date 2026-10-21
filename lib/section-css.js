import postcss from 'postcss';

export const MAX_SECTION_CUSTOM_CSS_LENGTH = 500;

const ALLOWED_AT_RULES = new Set(['media', 'container', 'layer', 'supports']);
const ALLOWED_URL_PREFIX = 'https://cdn.shopify.com/';

function splitSelectorList(selector) {
  const selectors = [];
  let current = '';
  let parentheses = 0;
  let brackets = 0;
  let quote = '';
  let escaped = false;

  for (const character of selector) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === '\\') {
      current += character;
      escaped = true;
      continue;
    }
    if (quote) {
      current += character;
      if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      current += character;
      continue;
    }
    if (character === '(') parentheses += 1;
    if (character === ')') parentheses -= 1;
    if (character === '[') brackets += 1;
    if (character === ']') brackets -= 1;
    if (character === ',' && parentheses === 0 && brackets === 0) {
      if (!current.trim()) throw new Error('Empty selector');
      selectors.push(current.trim());
      current = '';
      continue;
    }
    current += character;
  }
  if (quote || parentheses !== 0 || brackets !== 0 || escaped || !current.trim()) throw new Error('Malformed selector');
  selectors.push(current.trim());
  return selectors;
}

function validateUrls(value) {
  if (value.includes('\\')) throw new Error('CSS escapes are not supported');
  const canonicalValue = value.replace(/\/\*[\s\S]*?\*\//g, '');
  const urlFunctionPattern = /url\s*\(/gi;
  let match;
  while ((match = urlFunctionPattern.exec(canonicalValue))) {
    const closeParenthesis = canonicalValue.indexOf(')', match.index + match[0].length);
    if (closeParenthesis < 0) throw new Error('Malformed URL');
    const url = canonicalValue.slice(match.index + match[0].length, closeParenthesis).trim().replace(/^(["'])(.*)\1$/, '$2');
    if (!url.startsWith(ALLOWED_URL_PREFIX) || /["'()\s]/.test(url.slice(ALLOWED_URL_PREFIX.length))) {
      throw new Error('CSS URLs must use cdn.shopify.com');
    }
    urlFunctionPattern.lastIndex = closeParenthesis + 1;
  }
}

function validateSelector(selector, scopeClass) {
  const normalized = selector.replace(/\/\*[\s\S]*?\*\//g, '');
  if (/(^|[\s>+~,(])(?::root|:host(?:-context)?|html|body|shopify-section)(?=$|[\s>+~.#:[,(])/i.test(normalized)) {
    throw new Error('Global and section wrapper selectors are not supported');
  }
  if (normalized.includes(scopeClass)) throw new Error('The generated section scope cannot be selected directly');
  if (normalized.includes('&')) throw new Error('The generated section scope cannot be selected directly');
  return `.${scopeClass} ${normalized}`;
}

function validateAndScopeNode(container, scopeClass) {
  container.nodes?.forEach((node) => {
    if (node.type === 'atrule') {
      const name = node.name.toLowerCase();
      if (!ALLOWED_AT_RULES.has(name) || !node.nodes || node.parent?.type === 'rule') throw new Error(`Unsupported CSS at-rule: @${name}`);
      validateUrls(node.params || '');
      validateAndScopeNode(node, scopeClass);
      return;
    }
    if (node.type === 'rule') {
      if (node.parent?.type === 'rule') throw new Error('Nested CSS rules are not supported');
      const selectors = splitSelectorList(node.selector).map((selector) => validateSelector(selector, scopeClass));
      node.selector = selectors.join(', ');
      validateAndScopeNode(node, scopeClass);
      return;
    }
    if (node.type === 'decl') {
      if (node.parent?.type !== 'rule') throw new Error('Declarations must be scoped by a selector');
      if (node.prop.toLowerCase() === 'content' || node.prop.includes('\\')) throw new Error('The content property is not supported');
      validateUrls(node.value || '');
      if (/<|\/style/i.test(node.value || '')) throw new Error('Unsafe CSS value');
      return;
    }
    if (node.type !== 'comment') throw new Error('Unsupported CSS syntax');
  });
}

/** Returns safe section-scoped CSS; invalid or disallowed CSS fails closed to an empty string. */
export function compileSectionCss(css, scopeClass) {
  const source = String(css || '');
  if (!source.trim() || source.length > MAX_SECTION_CUSTOM_CSS_LENGTH || !/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(scopeClass || '')) return '';
  if (/<\/style/i.test(source)) return '';
  try {
    const root = postcss.parse(source, { from: undefined });
    validateAndScopeNode(root, scopeClass);
    return root.toString();
  } catch {
    return '';
  }
}

export function sectionCssScope(sectionId) {
  const stableId = String(sectionId || 'section').replace(/[^a-zA-Z0-9_-]/g, '');
  return `theme-section-${stableId || 'section'}`;
}
