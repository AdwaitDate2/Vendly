import { z } from 'zod';
import { escapeHtml, logoHtml, DEFAULT_EMAIL_COLORS } from './email-layout';
import { resolveAssetPath } from './asset-paths';
import { docToText, safeHref, sanitizeRichDoc } from './rich-text';
import { siteUrl } from './site-url';

/**
 * Validation schema for composing or sending a newsletter.
 */
export const newsletterCampaignSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().max(200).default(''),
  subject: z.string().trim().min(2, 'Please enter a subject line.').max(200),
  preheader: z.string().trim().max(300).default(''),
  heading: z.string().trim().min(2, 'Please enter an email heading.').max(240),
  buttonLabel: z.string().trim().max(80).default(''),
  buttonUrl: z.string().trim().max(500).default(''),
  richDoc: z.any(),
});

/**
 * Converts inline rich-text marks (bold, italic, underline, link) to email HTML.
 */
function renderInlineToHtml(node, colors) {
  if (node.type === 'hardBreak') return '<br>';
  if (node.type !== 'text' || !node.text) return '';
  let text = escapeHtml(node.text);
  const accent = colors.accent || DEFAULT_EMAIL_COLORS.accent;

  for (const mark of node.marks || []) {
    if (mark.type === 'bold') {
      text = `<strong style="font-weight:600;color:#24201a">${text}</strong>`;
    } else if (mark.type === 'italic') {
      text = `<em style="font-style:italic">${text}</em>`;
    } else if (mark.type === 'underline') {
      text = `<u style="text-decoration:underline">${text}</u>`;
    } else if (mark.type === 'link') {
      const rawHref = mark.attrs?.href || '';
      const href = safeHref(rawHref);
      if (href) {
        const fullHref = href.startsWith('/') ? siteUrl(href) : href;
        text = `<a href="${escapeHtml(fullHref)}" style="color:${escapeHtml(accent)};text-decoration:underline">${text}</a>`;
      }
    }
  }
  return text;
}

/**
 * Converts a block node (paragraph, heading, list, blockquote, hr) to email HTML.
 */
function renderBlockToHtml(node, colors) {
  const accent = colors.accent || DEFAULT_EMAIL_COLORS.accent;
  const children = Array.isArray(node.content) ? node.content : [];

  switch (node.type) {
    case 'paragraph': {
      const inner = children.map((c) => renderInlineToHtml(c, colors)).join('');
      return `<p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.65;font-family:Helvetica,Arial,sans-serif">${inner || '&nbsp;'}</p>`;
    }
    case 'heading': {
      const isH3 = node.attrs?.level === 3;
      const inner = children.map((c) => renderInlineToHtml(c, colors)).join('');
      if (isH3) {
        return `<h3 style="margin:20px 0 8px;color:#332e27;font-size:16px;font-family:Georgia,serif;font-weight:normal;line-height:1.35">${inner}</h3>`;
      }
      return `<h2 style="margin:28px 0 12px;color:#332e27;font-size:19px;font-family:Georgia,serif;font-weight:normal;line-height:1.3;border-bottom:1px solid #f0ebe2;padding-bottom:6px">${inner}</h2>`;
    }
    case 'bulletList': {
      const items = children.map((c) => renderBlockToHtml(c, colors)).join('');
      return `<ul style="margin:0 0 18px 20px;padding:0;color:#4a4a4a;font-size:15px;line-height:1.65;font-family:Helvetica,Arial,sans-serif">${items}</ul>`;
    }
    case 'orderedList': {
      const start = Number(node.attrs?.start) || 1;
      const items = children.map((c) => renderBlockToHtml(c, colors)).join('');
      return `<ol style="margin:0 0 18px 20px;padding:0;color:#4a4a4a;font-size:15px;line-height:1.65;font-family:Helvetica,Arial,sans-serif"${start > 1 ? ` start="${start}"` : ''}>${items}</ol>`;
    }
    case 'listItem': {
      const inner = children.map((c) => {
        if (c.type === 'paragraph') {
          return (c.content || []).map((child) => renderInlineToHtml(child, colors)).join('');
        }
        return renderBlockToHtml(c, colors);
      }).join('');
      return `<li style="margin-bottom:6px;padding-left:4px">${inner}</li>`;
    }
    case 'blockquote': {
      const inner = children.map((c) => {
        if (c.type === 'paragraph') {
          return (c.content || []).map((child) => renderInlineToHtml(child, colors)).join('');
        }
        return renderBlockToHtml(c, colors);
      }).join('<br>');
      return `<blockquote style="margin:22px 0;padding:14px 20px;border-left:3px solid ${escapeHtml(accent)};background:#fcfbf9;color:#332e27;font-style:italic;font-family:Georgia,serif;font-size:15px;line-height:1.65">${inner}</blockquote>`;
    }
    case 'horizontalRule':
      return `<hr style="border:0;border-top:1px solid #ede8de;margin:28px 0" />`;
    default:
      return '';
  }
}

/**
 * Converts a TipTap / ProseMirror rich text document to email-safe HTML.
 */
export function richDocToEmailHtml(doc, colors = {}) {
  const sanitized = sanitizeRichDoc(doc);
  const blocks = sanitized.content || [];
  return blocks.map((b) => renderBlockToHtml(b, colors)).join('\n');
}

/**
 * Builds the complete newsletter HTML and plain-text output.
 */
export function buildNewsletterEmail({
  subject,
  preheader = '',
  heading,
  richDoc,
  buttonLabel = '',
  buttonUrl = '',
  footerNote = '',
  recipientEmail = '',
  unsubscribeUrl: customUnsubscribeUrl = '',
  settings = {},
}) {
  const theme = settings.theme || {};
  const design = settings.emailDesign || {};
  const colors = {
    accent: design.accentColor || theme.mulberry || DEFAULT_EMAIL_COLORS.accent,
    background: design.backgroundColor || theme.paper || DEFAULT_EMAIL_COLORS.background,
    label: theme.ink || DEFAULT_EMAIL_COLORS.label,
  };

  const fallbackOrigin = settings.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || 'https://byshreen.com';
  const logoPath = design.logo ? resolveAssetPath(design.logo) : '';
  const logo = logoPath ? (/^https?:/i.test(logoPath) ? logoPath : siteUrl(logoPath, fallbackOrigin)) : '';
  const brand = { logoUrl: logo, logoWidth: design.logoWidth, storeName: settings.storeName || 'byShreen' };

  const bodyHtml = richDocToEmailHtml(richDoc, colors);
  const plainBody = docToText(sanitizeRichDoc(richDoc));

  const resolvedButtonUrl = buttonUrl ? (buttonUrl.startsWith('/') ? siteUrl(buttonUrl, fallbackOrigin) : buttonUrl) : '';
  const button = buttonLabel && resolvedButtonUrl ? { label: buttonLabel, url: resolvedButtonUrl } : null;

  const unsubscribeUrl = customUnsubscribeUrl || (recipientEmail ? siteUrl(`/unsubscribe?email=${encodeURIComponent(recipientEmail)}`, fallbackOrigin) : siteUrl('/unsubscribe', fallbackOrigin));
  const storeName = settings.storeName || 'byShreen';
  const contactEmail = settings.contactEmail || 'concierge@byshreen.com';

  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0px;overflow:hidden;mso-hide:all;font-size:1px;color:#ffffff;line-height:1px;opacity:0;">${escapeHtml(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>`
    : '';

  const ctaButtonHtml = button
    ? `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:28px 0 16px"><tr><td align="left"><a href="${escapeHtml(button.url)}" style="display:inline-block;padding:13px 26px;background:${escapeHtml(colors.accent)};color:#ffffff;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:500;border-radius:2px">${escapeHtml(button.label)}</a></td></tr></table>`
    : '';

  const footerHtml = `
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #ede8de;color:#8a857b;font-size:12px;line-height:1.6;font-family:Helvetica,Arial,sans-serif">
      ${footerNote ? `<p style="margin:0 0 10px;color:#6b675e">${escapeHtml(footerNote)}</p>` : ''}
      <p style="margin:0 0 6px">Sent with care by <strong>${escapeHtml(storeName)}</strong> · <a href="mailto:${escapeHtml(contactEmail)}" style="color:#8a857b;text-decoration:underline">${escapeHtml(contactEmail)}</a></p>
      <p style="margin:0">You received this email because you subscribed to our private newsletter. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#8a857b;text-decoration:underline">Unsubscribe here</a>.</p>
    </div>
  `;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${escapeHtml(colors.background)};font-family:Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheaderHtml}
  <div style="background:${escapeHtml(colors.background)};padding:36px 16px;">
    <div style="max-width:580px;margin:0 auto;background:#ffffff;padding:36px 32px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
      ${logoHtml(brand, colors)}
      <h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;color:#332e27;font-family:Georgia,serif;font-weight:normal">${escapeHtml(heading)}</h1>
      <div style="color:#4a4a4a;font-size:15px;line-height:1.65">
        ${bodyHtml}
      </div>
      ${ctaButtonHtml}
      ${footerHtml}
    </div>
  </div>
</body>
</html>`;

  const text = [
    heading,
    '',
    plainBody,
    button ? `\n${button.label}: ${button.url}` : '',
    '',
    '---',
    `${storeName} · ${contactEmail}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].filter((line) => line !== undefined).join('\n');

  return { subject, html, text, colors, brand };
}
