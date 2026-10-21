// The byShreen email layout. Plain functions with no server imports, so the admin can render the exact
// same email in its live preview that customers receive.

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export const DEFAULT_EMAIL_COLORS = { accent: '#a84d5f', background: '#fff6df', label: '#6a6b44' };

function safeColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : fallback;
}

function safeUrl(value) {
  return /^(https?:\/\/|mailto:)/i.test(String(value || '')) ? value : '';
}

/** The key/value details table (order lines, totals, addresses). */
export function detailsTableHtml(rows = [], colors = {}) {
  const label = safeColor(colors.label, DEFAULT_EMAIL_COLORS.label);
  if (!rows.length) return '';
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0">${rows.map(([name, value]) => `<tr><td style="padding:6px 12px 6px 0;color:${label};font-size:13px;vertical-align:top;white-space:nowrap">${escapeHtml(name)}</td><td style="padding:6px 0;color:#332e27;font-size:14px">${escapeHtml(value).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>`;
}

/** A button link in the accent color. Returns '' without a safe link and a label. */
export function buttonHtml(button, colors = {}) {
  const accent = safeColor(colors.accent, DEFAULT_EMAIL_COLORS.accent);
  const url = safeUrl(button?.url);
  if (!url || !button?.label) return '';
  return `<p style="margin:20px 0 4px"><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 22px;background:${accent};color:#ffffff;text-decoration:none;font-size:13px;letter-spacing:.06em;border-radius:3px">${escapeHtml(button.label)}</a></p>`;
}

/** The logo image (email clients need a full https link and a PNG or JPG), or the byShreen wordmark. */
export function logoHtml(brand = {}, colors = {}) {
  const accent = safeColor(colors.accent, DEFAULT_EMAIL_COLORS.accent);
  const src = safeUrl(brand.logoUrl);
  const width = Math.min(320, Math.max(40, Number(brand.logoWidth) || 140));
  if (src) return `<p style="margin:0 0 20px"><img src="${escapeHtml(src)}" width="${width}" alt="${escapeHtml(brand.storeName || 'byShreen')}" style="display:block;width:${width}px;max-width:100%;height:auto;border:0" /></p>`;
  return `<p style="margin:0 0 18px;font-size:20px;color:${accent};font-family:Georgia,serif">${escapeHtml(brand.storeName || 'byShreen')}</p>`;
}

function paragraphsHtml(message) {
  return String(message || '').split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean)
    .map((part) => `<p style="margin:0 0 12px;color:#4a4a4a;font-size:14px;line-height:1.6">${escapeHtml(part).replace(/\n/g, '<br>')}</p>`).join('');
}

/**
 * Wraps content in the email frame. `content` is already-built HTML for the white card.
 */
function frameHtml(content, colors = {}) {
  const background = safeColor(colors.background, DEFAULT_EMAIL_COLORS.background);
  return `<div style="background:${background};padding:32px 16px;font-family:Helvetica,Arial,sans-serif"><div style="max-width:560px;margin:0 auto;background:#fff;padding:28px;border-radius:8px">${content}</div></div>`;
}

/**
 * Simple, readable email used by every byShreen email.
 * `message` may contain several paragraphs separated by a blank line. `button` is { label, url }.
 * `colors` { accent, background, label } and `brand` { logoUrl, logoWidth, storeName } come from
 * Admin → Email templates → Email design (falling back to the Theme, then the brand palette).
 */
export function emailLayout({ heading, intro = '', message = '', rows = [], button = null, footer = '', colors = {}, brand = {} }) {
  const body = String(message || intro || '');
  const content = `${logoHtml(brand, colors)}<h1 style="margin:0 0 12px;font-size:20px;color:#332e27">${escapeHtml(heading)}</h1>${paragraphsHtml(body)}${buttonHtml(button, colors)}${detailsTableHtml(rows, colors)}${footer ? `<p style="margin:18px 0 0;color:#8a8a8a;font-size:12px;line-height:1.5">${escapeHtml(footer)}</p>` : ''}`;
  const html = frameHtml(content, colors);
  const url = safeUrl(button?.url);
  const paragraphs = body.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const text = [heading, ...paragraphs, url && button?.label ? `${button.label}: ${url}` : '', ...rows.map(([name, value]) => `${name}: ${value}`), footer].filter(Boolean).join('\n\n');
  return { html, text };
}

/**
 * The same email as editable HTML code, with its wording kept as {{placeholders}} and the automatic
 * parts as block placeholders: {{logo}}, {{button}}, {{details_table}}. Used by "Edit code".
 */
export function emailCodeFromWording({ heading, message, footer, hasButton }) {
  const content = `{{logo}}\n<h1 style="margin:0 0 12px;font-size:20px;color:#332e27">${escapeHtml(heading)}</h1>\n${paragraphsHtml(message).replace(/<\/p>/g, '</p>\n')}${hasButton ? '{{button}}\n' : ''}{{details_table}}\n${footer ? `<p style="margin:18px 0 0;color:#8a8a8a;font-size:12px;line-height:1.5">${escapeHtml(footer)}</p>` : ''}`;
  return `<div style="background:{{background_color}};padding:32px 16px;font-family:Helvetica,Arial,sans-serif">\n<div style="max-width:560px;margin:0 auto;background:#fff;padding:28px;border-radius:8px">\n${content}\n</div>\n</div>`;
}

/** Plain-text version of an HTML email, for inboxes that don't show HTML. */
export function htmlToText(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2: $1')
    .replace(/<\/(p|h\d|tr|div|li)>/gi, '\n\n')
    .replace(/<\/td>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
