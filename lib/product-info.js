// The product page sections (care, shipping) as one editable text. Shared store wording is turned into
// this format so the product editor can show exactly what the website shows.
//   "# Heading | Tag"   a heading, with an optional short tag beside it        "- item"   a bullet        blank line   new paragraph
//   **bold**   *italic*   {email}  the store contact email

const lines = (text) => String(text || '').split('\n').map((line) => line.trim()).filter(Boolean);

export function composeCare(info) {
  return [info.careIntro, lines(info.careBullets).map((line) => `- ${line}`).join('\n'), info.careSignoff].map((part) => String(part || '').trim()).filter(Boolean).join('\n\n');
}

export function composeShipping(info) {
  const note = String(info.shippingNote || '').trim();
  return [info.shippingHeading ? `# ${String(info.shippingHeading).trim()}${String(info.shippingTag || '').trim() ? ` | ${String(info.shippingTag).trim()}` : ''}` : '', String(info.shippingBody || '').trim(), note ? `*${note}*` : ''].filter(Boolean).join('\n\n');
}

const normalize = (text) => String(text || '').replace(/\r\n/g, '\n').split('\n').map((line) => line.trim()).join('\n').trim();

/** True when the text is the shared wording, so it should keep following Settings. */
export function isSharedText(text, shared) {
  return normalize(text) === normalize(shared);
}

/** Splits text into headings, bullet lists and paragraphs. */
export function parseBlocks(text) {
  return String(text || '').split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean).map((block) => {
    const rows = block.split('\n').map((row) => row.trim()).filter(Boolean);
    if (rows.length === 1 && rows[0].startsWith('# ')) return { type: 'heading', text: rows[0].slice(2).split(' | ')[0].trim(), tag: rows[0].slice(2).split(' | ').slice(1).join(' | ').trim() };
    if (rows.every((row) => row.startsWith('- '))) return { type: 'list', items: rows.map((row) => row.slice(2).trim()) };
    return { type: 'paragraph', text: rows.join(' ') };
  });
}
