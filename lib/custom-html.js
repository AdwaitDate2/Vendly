import sanitizeHtml from 'sanitize-html';

// Custom HTML blocks let the owner add their own markup to a page. Everything is cleaned before it is
// shown: no scripts, no event handlers, no javascript: links, and embeds only from known video/map sites.
// The block's CSS is nested under the block's own class, so it can't restyle the rest of the site.

const EMBED_HOSTS = ['www.youtube.com', 'www.youtube-nocookie.com', 'youtube.com', 'player.vimeo.com', 'www.google.com', 'maps.google.com'];

const OPTIONS = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    'img', 'figure', 'figcaption', 'picture', 'source', 'video', 'audio', 'iframe',
    'section', 'article', 'header', 'footer', 'aside', 'main', 'nav', 'h1', 'h2', 'span', 'small', 'mark', 'del', 'ins', 'sup', 'sub', 'details', 'summary', 'button',
  ],
  allowedAttributes: {
    '*': ['class', 'id', 'style', 'title', 'role', 'lang', 'dir', 'aria-*', 'data-*'],
    a: ['href', 'target', 'rel', 'name'],
    img: ['src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'decoding'],
    source: ['src', 'srcset', 'type', 'media', 'sizes'],
    video: ['src', 'poster', 'controls', 'autoplay', 'muted', 'loop', 'playsinline', 'preload', 'width', 'height'],
    audio: ['src', 'controls', 'loop', 'preload'],
    iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'loading', 'title', 'frameborder', 'referrerpolicy'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan', 'scope'],
    ol: ['start', 'type', 'reversed'],
    details: ['open'],
    button: ['type'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'], source: ['http', 'https'], video: ['http', 'https'], audio: ['http', 'https'] },
  allowProtocolRelative: false,
  allowedIframeHostnames: EMBED_HOSTS,
  transformTags: {
    // Links that open a new tab can't reach back into this page.
    a: (tagName, attribs) => ({ tagName, attribs: attribs.target === '_blank' ? { ...attribs, rel: 'noopener noreferrer' } : attribs }),
    button: (tagName, attribs) => ({ tagName, attribs: { ...attribs, type: 'button' } }),
  },
};

export function sanitizeCustomHtml(html) {
  return sanitizeHtml(String(html || ''), OPTIONS);
}

/** Pulls @keyframes / @font-face out (they can't be nested) and returns [nestable, topLevel]. */
function splitAtRules(css) {
  const top = [];
  let rest = '';
  let index = 0;
  const pattern = /@(-webkit-)?(keyframes|font-face)\b/gi;
  let match;
  while ((match = pattern.exec(css))) {
    const open = css.indexOf('{', match.index);
    if (open < 0) break;
    let depth = 0;
    let end = open;
    for (; end < css.length; end += 1) {
      if (css[end] === '{') depth += 1;
      else if (css[end] === '}') { depth -= 1; if (depth === 0) break; }
    }
    rest += css.slice(index, match.index);
    top.push(css.slice(match.index, end + 1));
    index = end + 1;
    pattern.lastIndex = index;
  }
  rest += css.slice(index);
  return [rest, top.join('\n')];
}

/** The block's CSS, nested under `.scope` so every rule only matches inside the block. */
export function scopeCustomCss(css, scope) {
  const cleaned = String(css || '')
    .replace(/<\/?style[^>]*>/gi, '')
    .replace(/<!--|-->/g, '')
    .replace(/@import[^;]*;?/gi, '')
    .replace(/@charset[^;]*;?/gi, '')
    .replace(/expression\s*\(/gi, '(')
    .replace(/javascript:/gi, '')
    .replace(/</g, '\\3c ');
  if (!cleaned.trim()) return '';
  const [nestable, topLevel] = splitAtRules(cleaned);
  return `${topLevel}\n.${scope} {\n${nestable}\n}`;
}

export function customHtmlScope(id) {
  return `custom-html-${String(id || 'block').replace(/[^a-zA-Z0-9_-]/g, '')}`;
}
