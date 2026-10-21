// Minimal RFC 4180 CSV reader/writer: quoted cells, escaped quotes, commas and line breaks inside quotes.

export function parseCsv(text) {
  const input = String(text || '').replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += char;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((cells) => cells.some((value) => value.trim() !== ''));
}

export function toCsv(rows) {
  return rows.map((cells) => cells.map((value) => {
    const text = value == null ? '' : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }).join(',')).join('\r\n');
}

export const PRODUCT_COLUMNS = [
  { key: 'title', header: 'Title', help: 'Required. Full product name.', example: 'Diamond Solitaire Ring' },
  { key: 'shortTitle', header: 'Card title', help: 'Optional short name shown on product cards.', example: 'Solitaire Ring' },
  { key: 'slug', header: 'URL slug', help: 'Optional. Matches an existing product to update it; created from the title if blank.', example: '' },
  { key: 'price', header: 'Price', help: 'Required for new products. Price of the first metal option in USD, e.g. 1250. Edit other metal prices on the product page.', example: '1250' },
  { key: 'collection', header: 'Collection', help: 'Required. Collection name or slug, e.g. Rings.', example: 'rings' },
  { key: 'status', header: 'Status', help: 'Draft, Published, or Archived. Defaults to Draft.', example: 'Draft' },
  { key: 'metal', header: 'Metal', help: 'Required, e.g. 14kt & 18kt Gold.', example: '14kt & 18kt Gold' },
  { key: 'stone', header: 'Stone', help: 'Defaults to Natural Diamond.', example: 'Natural Diamond' },
  { key: 'caratWeight', header: 'Carat weight', help: 'Optional, e.g. 1.25.', example: '1.25' },
  { key: 'description', header: 'Description', help: 'Required. At least 20 characters.', example: 'A refined solitaire with a contemporary profile, handcrafted in solid gold.' },
  { key: 'images', header: 'Images', help: 'Required for new products. Image links separated by | (the first is the main photo).', example: '/images/selection-2/product-diamond-solitaire-engagement-ring-1.webp|/images/selection-2/product-diamond-solitaire-engagement-ring-2.webp' },
];

function normalizeHeader(value) {
  return String(value).toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z]/g, '');
}

const HEADER_ALIASES = Object.fromEntries(PRODUCT_COLUMNS.flatMap((column) => [[normalizeHeader(column.header), column.key], [normalizeHeader(column.key), column.key]]).concat([
  ['metaloptionsreferenceonly', null], ['tags', null],
  ['name', 'title'], ['producttitle', 'title'], ['handle', 'slug'], ['category', 'collection'], ['carat', 'caratWeight'], ['carats', 'caratWeight'], ['image', 'images'], ['photos', 'images'], ['cardname', 'shortTitle'],
]));

/** Turns CSV text into product row objects keyed by column, plus any headers that were not recognised. */
export function csvToProductRows(text) {
  const [header = [], ...body] = parseCsv(text);
  const keys = header.map((name) => HEADER_ALIASES[normalizeHeader(name)] || null);
  // Columns mapped to null (e.g. export-only reference columns) are known and skipped quietly.
  const unknown = header.filter((name) => name.trim() && !(normalizeHeader(name) in HEADER_ALIASES));
  const rows = body.map((cells) => Object.fromEntries(keys.map((key, index) => [key, cells[index] ?? '']).filter(([key]) => key)));
  return { rows, unknown, recognised: keys.filter(Boolean) };
}
