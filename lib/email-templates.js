// Every email the site sends, with its default wording, the {{placeholders}} it understands, and how
// to build it from real data. Plain code: the server uses it to send, and Admin → Email templates uses
// it (with sample data) for the live preview. Order lines, totals, and addresses are always added
// automatically, so an edit can't remove the details a customer needs.

import { resolveAssetPath } from './asset-paths';
import { buttonHtml, detailsTableHtml, emailCodeFromWording, emailLayout, escapeHtml, htmlToText, logoHtml } from './email-layout';

export const money = (cents) => `$${(Number(cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const REQUEST_LABELS = { appointment: 'appointment request', bespoke: 'custom jewelry enquiry', contact: 'message', product: 'piece enquiry' };

function itemRows(order) {
  return (order.items || []).map((item) => [`${item.qty} × ${item.title}`, `${[item.variantTitle, item.size ? `Size ${item.size}` : ''].filter(Boolean).join(' · ')}\n${money(item.lineCents)}`]);
}

function totalRows(order) {
  return [
    ['Subtotal', money(order.subtotalCents)],
    ...(order.discountCents ? [[`Discount (${order.discount?.code})`, `−${money(order.discountCents)}`]] : []),
    [order.shipping?.name || 'Shipping', order.shippingCents ? money(order.shippingCents) : 'Free'],
    ...(order.taxCents ? [[order.tax?.name || 'Tax', money(order.taxCents)]] : []),
    ['Total', money(order.totalCents)],
  ];
}

function addressText(address = {}) {
  return [address.name, address.line1, address.line2, [address.city, address.region, address.postalCode].filter(Boolean).join(', '), address.country].filter(Boolean).join('\n');
}

const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || '';

// Placeholders shared by every email.
const STORE_VARS = [
  ['store_name', 'Your store name'],
  ['contact_email', 'Your contact email'],
];
const ORDER_VARS = [
  ['customer_name', 'Customer’s first name'],
  ['customer_full_name', 'Customer’s full name'],
  ['order_number', 'Order number, e.g. #1042'],
  ['order_total', 'Order total'],
  ...STORE_VARS,
];
const REQUEST_VARS = [
  ['client_name', 'Client’s first name'],
  ['client_full_name', 'Client’s full name'],
  ['client_email', 'Client’s email'],
  ['request_type', 'e.g. appointment request'],
  ...STORE_VARS,
];

function orderVars(order, settings) {
  const name = order.shippingAddress?.name || '';
  return {
    customer_name: firstName(name) || 'there',
    customer_full_name: name || order.email,
    customer_email: order.email,
    order_number: order.name || `#${order.number}`,
    order_total: money(order.totalCents),
    store_name: settings.storeName || 'byShreen',
    contact_email: settings.contactEmail,
  };
}

function requestVars(inquiry, settings) {
  return {
    client_name: firstName(inquiry.name) || 'there',
    client_full_name: inquiry.name,
    client_email: inquiry.email,
    request_type: REQUEST_LABELS[inquiry.requestType] || 'request',
    store_name: settings.storeName || 'byShreen',
    contact_email: settings.contactEmail,
  };
}

const madeToOrder = (order) => (order.items || []).some((item) => item.madeToOrder);
const CUSTOMER_FOOTER = 'Questions? Reply to this email or write to {{contact_email}}.';

/**
 * Each template: who receives it, when, default wording, placeholders, and build(data, settings, siteUrl)
 * returning { vars, rows, buttonUrl }.
 */
export const EMAIL_TEMPLATES = [
  {
    key: 'orderConfirmation',
    label: 'Order confirmation',
    audience: 'customer',
    when: 'Right after a customer pays for an order.',
    setting: 'customerOrderEmails',
    defaults: { subject: 'Your byShreen order {{order_number}}', heading: 'Thank you — order {{order_number}} is confirmed', message: 'Thank you for choosing byShreen, {{customer_name}}. {{timeline_note}}', buttonLabel: '', footer: CUSTOMER_FOOTER },
    variables: [...ORDER_VARS, ['timeline_note', 'Made-to-order timing sentence (filled in automatically)']],
    build: (order, settings) => ({
      vars: { ...orderVars(order, settings), timeline_note: madeToOrder(order) ? 'Your piece is now being made for you. Made-to-order pieces are crafted in 5–7 weeks, and we will email you tracking details as soon as it ships.' : 'We are preparing your order and will email you tracking details as soon as it ships.' },
      rows: [...itemRows(order), ...totalRows(order), ['Shipping to', addressText(order.shippingAddress)]],
    }),
    to: (order) => order.email,
  },
  {
    key: 'orderInProduction',
    label: 'Order in production',
    audience: 'customer',
    when: 'When you move an order to “In production”.',
    setting: 'customerOrderEmails',
    defaults: { subject: 'Your byShreen order {{order_number}} is in production', heading: 'Your piece is being made — order {{order_number}}', message: '{{timeline_note}}', buttonLabel: '', footer: CUSTOMER_FOOTER },
    variables: [...ORDER_VARS, ['timeline_note', 'Timing sentence (filled in automatically)']],
    build: (order, settings) => ({
      vars: { ...orderVars(order, settings), timeline_note: madeToOrder(order) ? 'Our jeweller has started crafting your piece. Made-to-order pieces take 5–7 weeks, and we will email you tracking details as soon as it ships.' : 'We are preparing your order now, and will email you tracking details as soon as it ships.' },
      rows: itemRows(order),
    }),
    to: (order) => order.email,
  },
  {
    key: 'orderShipped',
    label: 'Order shipped',
    audience: 'customer',
    when: 'When you mark an order as shipped (with “Email the customer” ticked).',
    setting: 'customerOrderEmails',
    defaults: { subject: 'Your byShreen order {{order_number}} has shipped', heading: 'Your order {{order_number}} is on its way', message: 'Your piece has shipped, fully insured. A signature will be needed on delivery.', buttonLabel: 'Track your package', footer: CUSTOMER_FOOTER },
    variables: [...ORDER_VARS, ['tracking_carrier', 'Carrier, e.g. FedEx'], ['tracking_number', 'Tracking number'], ['tracking_link', 'Tracking link']],
    hasButton: true,
    build: (order, settings) => {
      const { carrier = '', number = '', url = '' } = order.tracking || {};
      return {
        vars: { ...orderVars(order, settings), tracking_carrier: carrier, tracking_number: number, tracking_link: url },
        rows: [...(carrier ? [['Carrier', carrier]] : []), ...(number ? [['Tracking number', number]] : []), ...itemRows(order), ['Shipping to', addressText(order.shippingAddress)]],
        buttonUrl: url,
      };
    },
    to: (order) => order.email,
  },
  {
    key: 'orderDelivered',
    label: 'Order delivered',
    audience: 'customer',
    when: 'When you mark an order as delivered.',
    setting: 'customerOrderEmails',
    defaults: { subject: 'Your byShreen order {{order_number}} has been delivered', heading: 'Your order {{order_number}} has been delivered', message: 'We hope it is everything you imagined. Our care guide explains how to keep your piece at its best.', buttonLabel: 'Read the care guide', footer: CUSTOMER_FOOTER },
    variables: ORDER_VARS,
    hasButton: true,
    build: (order, settings, siteUrl) => ({ vars: orderVars(order, settings), rows: itemRows(order), buttonUrl: siteUrl('/repairs-care') }),
    to: (order) => order.email,
  },
  {
    key: 'orderCancelled',
    label: 'Order cancelled',
    audience: 'customer',
    when: 'When you cancel an order.',
    setting: 'customerOrderEmails',
    defaults: { subject: 'Your byShreen order {{order_number}} has been cancelled', heading: 'Order {{order_number}} has been cancelled', message: '{{refund_note}}', buttonLabel: '', footer: CUSTOMER_FOOTER },
    variables: [...ORDER_VARS, ['refund_note', 'Refund sentence (filled in automatically)']],
    build: (order, settings) => {
      const refunded = Number(order.refundedCents || 0);
      return {
        vars: { ...orderVars(order, settings), refund_note: refunded ? `Your order has been cancelled and ${money(refunded)} has been refunded to your original payment method. It usually appears within 5–10 business days.` : 'Your order has been cancelled. No payment was taken.' },
        rows: itemRows(order),
      };
    },
    to: (order) => order.email,
  },
  {
    key: 'orderRefund',
    label: 'Refund issued',
    audience: 'customer',
    when: 'When you refund an order (with “Email the customer” ticked).',
    setting: 'customerOrderEmails',
    defaults: { subject: 'Refund for byShreen order {{order_number}}', heading: 'A refund of {{refund_amount}} is on its way', message: 'We have refunded {{refund_amount}} for order {{order_number}} to your original payment method. It usually appears within 5–10 business days.', buttonLabel: '', footer: CUSTOMER_FOOTER },
    variables: [...ORDER_VARS, ['refund_amount', 'Amount refunded']],
    build: (order, settings) => ({ vars: { ...orderVars(order, settings), refund_amount: money(order.refundAmountCents) }, rows: [] }),
    to: (order) => order.email,
  },
  {
    key: 'requestReceived',
    label: 'Request received',
    audience: 'customer',
    when: 'Right after someone books an appointment or sends an enquiry.',
    setting: 'customerRequestEmails',
    defaults: { subject: 'We have received your {{request_type}} — byShreen', heading: 'Thank you, {{client_full_name}} — we have your {{request_type}}', message: '{{thank_you_message}}', buttonLabel: '', footer: 'To add anything, reply to this email or write to {{contact_email}}.' },
    variables: [...REQUEST_VARS, ['thank_you_message', 'The thank-you text from the booking page']],
    build: (inquiry, settings) => ({
      vars: { ...requestVars(inquiry, settings), thank_you_message: inquiry.thankYou || 'Thank you for reaching out. We have received your note and will reply to you personally.' },
      rows: [['Type', inquiry.topic || REQUEST_LABELS[inquiry.requestType] || 'Request'], ...(inquiry.interest ? [['Looking for', inquiry.interest]] : []), ...(inquiry.timeline ? [['Timeline', inquiry.timeline]] : []), ['Your message', inquiry.message]],
    }),
    to: (inquiry) => inquiry.email,
  },
  {
    key: 'newOrderAlert',
    label: 'New order alert',
    audience: 'team',
    when: 'To you, whenever an order is paid.',
    setting: 'newOrder',
    defaults: { subject: 'New order {{order_number}} · {{order_total}}', heading: 'New order {{order_number}} · {{order_total}}', message: '{{customer_full_name}} just placed an order.', buttonLabel: 'Open in admin', footer: '' },
    variables: ORDER_VARS,
    hasButton: true,
    build: (order, settings, siteUrl) => ({
      vars: orderVars(order, settings),
      rows: [...itemRows(order), ...totalRows(order), ['Customer', `${order.email}${order.phone ? `\n${order.phone}` : ''}`], ['Ship to', addressText(order.shippingAddress)], ...(order.customerNote ? [['Note', order.customerNote]] : [])],
      buttonUrl: siteUrl(`/admin/orders/${order.id}`),
    }),
    to: (_order, settings) => settings.notifications.recipients,
    replyTo: (order) => order.email,
  },
  {
    key: 'newRequestAlert',
    label: 'New request alert',
    audience: 'team',
    when: 'To you, whenever an appointment request or enquiry arrives.',
    setting: 'newRequest',
    defaults: { subject: 'New {{request_type}}: {{client_full_name}}', heading: 'New {{request_type}} from {{client_full_name}}', message: 'A new request just came in through the website.', buttonLabel: 'Open in admin', footer: 'Reply directly to this email to answer the client.' },
    variables: REQUEST_VARS,
    hasButton: true,
    build: (inquiry, settings, siteUrl) => ({
      vars: requestVars(inquiry, settings),
      rows: [['Name', inquiry.name], ['Email', inquiry.email], ['Phone', inquiry.phone || '—'], ['Type', inquiry.topic || REQUEST_LABELS[inquiry.requestType] || 'Request'], ...(inquiry.interest ? [['Looking for', inquiry.interest]] : []), ...(inquiry.budget ? [['Budget', inquiry.budget]] : []), ...(inquiry.timeline ? [['Timeline', inquiry.timeline]] : []), ['Message', inquiry.message]],
      buttonUrl: siteUrl(`/admin/inquiries/${inquiry.id}`),
    }),
    to: (_inquiry, settings) => settings.notifications.recipients,
    replyTo: (inquiry) => inquiry.email,
  },
];

export const EMAIL_TEMPLATE_KEYS = EMAIL_TEMPLATES.map((template) => template.key);
export const EDITABLE_FIELDS = ['subject', 'heading', 'message', 'buttonLabel', 'footer'];

// Placeholders that insert a whole piece of the email; only used when editing the HTML code.
export const BLOCK_PLACEHOLDERS = [
  ['logo', 'Your logo (set under Email design)'],
  ['button', 'The button (uses “Button text” and the link)'],
  ['details_table', 'Order lines, totals, and addresses'],
  ['accent_color', 'Accent color, e.g. for your own links'],
  ['background_color', 'Email background color'],
];

/** Starting HTML for "Edit code": the current simple design, with its wording as placeholders. */
export function starterCode(key, wording) {
  const meta = emailTemplateMeta(key);
  return emailCodeFromWording({ heading: wording.heading ?? meta.defaults.heading, message: wording.message ?? meta.defaults.message, footer: wording.footer ?? meta.defaults.footer, hasButton: meta.hasButton });
}

/** Email design (logo + colors), falling back to the site Theme and then the brand palette. */
export function emailColors(settings) {
  const theme = settings.theme || {};
  const design = settings.emailDesign || {};
  return { accent: design.accentColor || theme.mulberry, background: design.backgroundColor || theme.paper, label: theme.ink };
}

export function emailTemplateMeta(key) {
  return EMAIL_TEMPLATES.find((template) => template.key === key) || null;
}

/** Replaces {{placeholder}} with its value. Unknown placeholders become empty. */
export function fillTemplate(text, vars) {
  return String(text || '').replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, name) => String(vars[name.toLowerCase()] ?? ''));
}

/** Placeholders written in a template that the email doesn't know, so the admin can warn about typos. */
export function unknownPlaceholders(template, values) {
  const known = new Set([...template.variables, ...(values.mode === 'code' ? BLOCK_PLACEHOLDERS : [])].map(([name]) => name));
  const found = new Set();
  for (const field of [...EDITABLE_FIELDS, ...(values.mode === 'code' ? ['html'] : [])]) for (const [, name] of String(values[field] || '').matchAll(/\{\{\s*([a-z_]+)\s*\}\}/gi)) if (!known.has(name.toLowerCase())) found.add(name);
  return [...found];
}

/**
 * Builds the finished email. `wording` is the saved (or default) text, `data` the order or request,
 * `settings` the store settings, `siteUrl` a function turning a path into a full link.
 */
export function buildEmail(key, { wording, data, settings, siteUrl }) {
  const meta = emailTemplateMeta(key);
  const { vars, rows, buttonUrl } = meta.build(data, settings, siteUrl);
  const text = (field) => fillTemplate(wording[field] ?? meta.defaults[field], vars).trim();
  const colors = emailColors(settings);
  const design = settings.emailDesign || {};
  // Site photos live in Kenmark Storage; resolve them so inboxes get a working, full https link.
  const logoPath = design.logo ? resolveAssetPath(design.logo) : '';
  const logo = logoPath ? (/^https?:/i.test(logoPath) ? logoPath : siteUrl(logoPath)) : '';
  const brand = { logoUrl: logo, logoWidth: design.logoWidth, storeName: settings.storeName };
  const button = meta.hasButton && buttonUrl && text('buttonLabel') ? { label: text('buttonLabel'), url: buttonUrl } : null;
  const prefix = data.test ? '[TEST] ' : '';
  const subject = `${prefix}${text('subject')}`;

  if (wording.mode === 'code' && String(wording.html || '').trim()) {
    // One pass: blocks become HTML, everything else is escaped text, so customer-typed values
    // (a name, a note) can never add HTML or trigger another placeholder.
    const blocks = { logo: logoHtml(brand, colors), button: buttonHtml(button, colors), details_table: detailsTableHtml(rows, colors), accent_color: escapeHtml(colors.accent || ''), background_color: escapeHtml(colors.background || '') };
    const html = String(wording.html).replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, raw) => {
      const name = raw.toLowerCase();
      if (name in blocks) return blocks[name];
      return escapeHtml(vars[name] ?? '');
    });
    return { subject, html, text: htmlToText(html) };
  }

  const layout = emailLayout({ heading: text('heading'), message: text('message'), rows, button, footer: text('footer'), colors, brand });
  return { subject, ...layout };
}

// Sample data for the admin preview and test emails.
const SAMPLE_ORDER = {
  id: 'sample', number: 1042, name: '#1042', email: 'client@example.com', phone: '(212) 555-0199',
  items: [{ qty: 1, title: 'Solitaire Engagement Ring', variantTitle: '18kt Gold', size: '6', lineCents: 118300, madeToOrder: true }],
  subtotalCents: 118300, discountCents: 0, shipping: { name: 'Free insured shipping' }, shippingCents: 0, tax: { name: 'New York sales tax' }, taxCents: 10499, totalCents: 128799,
  shippingAddress: { name: 'Ava Patel', line1: '120 Madison Avenue', line2: 'Apt 5B', city: 'New York', region: 'NY', postalCode: '10016', country: 'US' },
  tracking: { carrier: 'FedEx', number: '7712 3456 7890', url: 'https://www.fedex.com/fedextrack/?trknbr=771234567890' },
  refundedCents: 128799, refundAmountCents: 50000, customerNote: 'Please gift wrap.',
};
const SAMPLE_REQUEST = { id: 'sample', requestType: 'appointment', name: 'Ava Patel', email: 'client@example.com', phone: '(212) 555-0199', topic: 'Engagement Ring · In person (NYC Office)', interest: 'engagement-ring', budget: '5000-10000', timeline: '3-6-months', message: 'We’d love to see oval diamonds between 1.5 and 2 carats.', thankYou: 'Thank you for reaching out. We have received your note and will reply to you personally within one business day.' };

export function sampleDataFor(key) {
  return ['requestReceived', 'newRequestAlert'].includes(key) ? SAMPLE_REQUEST : SAMPLE_ORDER;
}
