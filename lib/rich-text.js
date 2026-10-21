// Rich text for policies, stored as a Tiptap/ProseMirror-style JSON tree (never raw HTML), so saved
// content can only ever contain the node types and link schemes allowed here. Plain data only: this
// file is shared by the admin editor, the server, and the storefront renderer.

const BLOCK_TYPES = new Set(['paragraph', 'heading', 'bulletList', 'orderedList', 'listItem', 'blockquote', 'horizontalRule']);
const MARK_TYPES = new Set(['bold', 'italic', 'underline', 'link']);
const MAX_NODES = 5000;
const MAX_TEXT = 200000;

export const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };

/** Only web, email, phone, on-site, and in-page links are allowed. Returns '' for anything else. */
export function safeHref(value) {
  const href = String(value || '').trim();
  if (!href || href.length > 500) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) return href;
  if (href.startsWith('/') && !href.startsWith('//')) return href;
  if (href.startsWith('#')) return href;
  return '';
}

/**
 * Returns a cleaned copy of a rich-text document: unknown nodes and marks are dropped, headings are
 * limited to H2/H3, and unsafe links are removed. Returns EMPTY_DOC for anything unusable.
 */
export function sanitizeRichDoc(input) {
  let nodes = 0;
  let text = 0;

  const cleanMarks = (marks) => {
    if (!Array.isArray(marks)) return undefined;
    const out = [];
    for (const mark of marks) {
      if (!mark || !MARK_TYPES.has(mark.type)) continue;
      if (mark.type === 'link') {
        const href = safeHref(mark.attrs?.href);
        if (href) out.push({ type: 'link', attrs: { href } });
      } else out.push({ type: mark.type });
    }
    return out.length ? out : undefined;
  };

  const cleanInline = (node) => {
    if (node?.type === 'hardBreak') return { type: 'hardBreak' };
    if (node?.type !== 'text' || typeof node.text !== 'string' || !node.text) return null;
    text += node.text.length;
    const marks = cleanMarks(node.marks);
    return marks ? { type: 'text', text: node.text, marks } : { type: 'text', text: node.text };
  };

  const cleanBlock = (node, depth) => {
    if (!node || !BLOCK_TYPES.has(node.type) || depth > 8) return null;
    nodes += 1;
    if (nodes > MAX_NODES || text > MAX_TEXT) return null;
    if (node.type === 'horizontalRule') return { type: 'horizontalRule' };
    const children = Array.isArray(node.content) ? node.content : [];
    if (node.type === 'paragraph' || node.type === 'heading') {
      const content = children.map(cleanInline).filter(Boolean);
      const out = { type: node.type };
      if (node.type === 'heading') out.attrs = { level: node.attrs?.level === 3 ? 3 : 2 };
      if (content.length) out.content = content;
      return out;
    }
    const allowedChildren = node.type === 'bulletList' || node.type === 'orderedList' ? ['listItem'] : ['paragraph', 'heading', 'bulletList', 'orderedList', 'blockquote', 'horizontalRule'];
    const content = children.filter((child) => allowedChildren.includes(child?.type)).map((child) => cleanBlock(child, depth + 1)).filter(Boolean);
    if (!content.length) return node.type === 'listItem' ? { type: 'listItem', content: [{ type: 'paragraph' }] } : null;
    const out = { type: node.type, content };
    if (node.type === 'orderedList') {
      const start = Number(node.attrs?.start);
      if (Number.isInteger(start) && start > 1 && start < 1000) out.attrs = { start };
    }
    return out;
  };

  const blocks = Array.isArray(input?.content) ? input.content.map((node) => cleanBlock(node, 0)).filter(Boolean) : [];
  return blocks.length ? { type: 'doc', content: blocks } : EMPTY_DOC;
}

/** Plain text of a document, for search snippets, meta descriptions, and "is it empty?" checks. */
export function docToText(doc) {
  const parts = [];
  const walk = (node) => {
    if (!node) return;
    if (node.type === 'text') parts.push(node.text);
    if (node.type === 'hardBreak') parts.push(' ');
    (node.content || []).forEach(walk);
    if (BLOCK_TYPES.has(node.type)) parts.push('\n');
  };
  walk(doc);
  return parts.join('').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}

/** Stable anchor ids for headings, used by the table of contents. */
export function headingId(text, used = new Set()) {
  const base = String(text || 'section').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section';
  let id = base;
  for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
  used.add(id);
  return id;
}

// ─── Plain-text → document, used to load the client's copy as starting content ────────────────
// Syntax: "## Heading", "### Subheading", "- bullet", "1. item", "---" divider, "> quote",
// blank line between paragraphs, **bold**, *italic*, [label](href). Bare emails become mailto links.

function inline(textValue) {
  const out = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
  let last = 0;
  let match;
  while ((match = pattern.exec(textValue))) {
    if (match.index > last) out.push({ type: 'text', text: textValue.slice(last, match.index) });
    if (match[1]) out.push({ type: 'text', text: match[1], marks: [{ type: 'bold' }] });
    else if (match[2]) out.push({ type: 'text', text: match[2], marks: [{ type: 'italic' }] });
    else if (match[3]) out.push({ type: 'text', text: match[3], marks: [{ type: 'link', attrs: { href: match[4] } }] });
    else if (match[5]) out.push({ type: 'text', text: match[5], marks: [{ type: 'link', attrs: { href: `mailto:${match[5]}` } }] });
    last = pattern.lastIndex;
  }
  if (last < textValue.length) out.push({ type: 'text', text: textValue.slice(last) });
  return out;
}

export function textToDoc(source) {
  const blocks = [];
  let paragraph = [];
  let list = null;
  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', content: inline(paragraph.join(' ')) });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };
  for (const raw of String(source || '').split('\n')) {
    const line = raw.trim();
    const bullet = line.match(/^[-•]\s+(.*)$/);
    const numbered = line.match(/^(\d+)\.\s+(.*)$/);
    if (!line) { flushParagraph(); flushList(); continue; }
    if (bullet || numbered) {
      flushParagraph();
      const type = bullet ? 'bulletList' : 'orderedList';
      if (list && list.type !== type) flushList();
      if (!list) list = { type, content: [], ...(numbered && Number(numbered[1]) > 1 ? { attrs: { start: Number(numbered[1]) } } : {}) };
      list.content.push({ type: 'listItem', content: [{ type: 'paragraph', content: inline(bullet ? bullet[1] : numbered[2]) }] });
      continue;
    }
    flushList();
    if (line === '---') { flushParagraph(); blocks.push({ type: 'horizontalRule' }); continue; }
    const heading = line.match(/^(#{2,3})\s+(.*)$/);
    if (heading) { flushParagraph(); blocks.push({ type: 'heading', attrs: { level: heading[1].length }, content: inline(heading[2]) }); continue; }
    if (line.startsWith('> ')) { flushParagraph(); blocks.push({ type: 'blockquote', content: [{ type: 'paragraph', content: inline(line.slice(2)) }] }); continue; }
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return sanitizeRichDoc({ type: 'doc', content: blocks });
}
