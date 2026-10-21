import Link from 'next/link';
import { Fragment } from 'react';
import { headingId, safeHref, sanitizeRichDoc } from '@/lib/rich-text';

function textOf(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text;
  return (node.content || []).map(textOf).join('');
}

/** Headings (H2 only) with their anchor ids, in order, for a table of contents. */
export function richTextOutline(doc) {
  const used = new Set();
  const outline = [];
  for (const node of doc?.content || []) {
    if (node.type !== 'heading') continue;
    const id = headingId(textOf(node), used);
    if (node.attrs?.level !== 3) outline.push({ id, text: textOf(node) });
  }
  return outline;
}

function renderText(node, key) {
  if (node.type === 'hardBreak') return <br key={key} />;
  let element = node.text;
  for (const mark of node.marks || []) {
    if (mark.type === 'bold') element = <strong>{element}</strong>;
    else if (mark.type === 'italic') element = <em>{element}</em>;
    else if (mark.type === 'underline') element = <u>{element}</u>;
    else if (mark.type === 'link') {
      const href = safeHref(mark.attrs?.href);
      if (!href) continue;
      element = href.startsWith('/') && !href.startsWith('//')
        ? <Link href={href}>{element}</Link>
        : <a href={href} {...(/^https?:/i.test(href) ? { target: '_blank', rel: 'noreferrer' } : {})}>{element}</a>;
    }
  }
  return <Fragment key={key}>{element}</Fragment>;
}

function renderBlock(node, key, ids) {
  const children = (node.content || []).map((child, index) => (child.type === 'text' || child.type === 'hardBreak' ? renderText(child, index) : renderBlock(child, index, ids)));
  switch (node.type) {
    case 'paragraph': return children.length ? <p key={key}>{children}</p> : null;
    case 'heading': {
      const id = ids.get(node);
      return node.attrs?.level === 3 ? <h3 key={key} id={id}>{children}</h3> : <h2 key={key} id={id}>{children}</h2>;
    }
    case 'bulletList': return <ul key={key}>{children}</ul>;
    case 'orderedList': return <ol key={key} start={node.attrs?.start}>{children}</ol>;
    case 'listItem': return <li key={key}>{children}</li>;
    case 'blockquote': return <blockquote key={key}>{children}</blockquote>;
    case 'horizontalRule': return <hr key={key} />;
    default: return null;
  }
}

/** Renders a sanitized rich-text document. Never uses raw HTML. */
export default function RichTextContent({ doc, className = 'rich-text' }) {
  const used = new Set();
  const ids = new Map();
  for (const node of doc?.content || []) if (node.type === 'heading') ids.set(node, headingId(textOf(node), used));
  return <div className={className}>{(doc?.content || []).map((node, index) => renderBlock(node, index, ids))}</div>;
}

/** Renders safe inline marks and line breaks without adding block wrappers. */
export function RichTextInlineContent({ doc }) {
  const sanitizedDoc = sanitizeRichDoc(doc);
  const paragraphs = (sanitizedDoc.content || []).filter((node) => node.type === 'paragraph');
  return <>{paragraphs.map((paragraph, paragraphIndex) => <Fragment key={paragraphIndex}>
    {(paragraph.content || []).map((node, nodeIndex) => renderText(node, nodeIndex))}
    {paragraphIndex < paragraphs.length - 1 ? <br /> : null}
  </Fragment>)}</>;
}
