// Fixed-shape entries (site-wide text and form messages). Each block lists only the fields
// that are rendered; `values` is the current copy and doubles as the fallback for empty fields.
// Shared by the admin editor (client) and the storefront (server), so keep it plain data.

export const FIELD_LABELS = {
  eyebrow: 'Small label',
  heading: 'Heading',
  body: 'Text',
  note: 'Accent line',
  items: 'List (one per line)',
  linkLabel: 'Button text',
  linkHref: 'Button link',
  secondaryLinkLabel: 'Second button text',
  secondaryLinkHref: 'Second button link',
};

export const EDITOR_HELP = 'Leave a line blank between paragraphs. Press Enter inside a heading for a line break. Wrap words in *asterisks* for italics. Emptying a field restores the original copy.';

export const CONTENT_GUIDES = {
  contact: [
    { id: 'thankYou', label: 'Form thank-you message', values: { body: 'Thank you. Your note has been received. The atelier will be in touch.' }, labels: { body: 'Message shown after a form is sent' } },
    { id: 'email', label: 'Contact email', values: { heading: 'info@byshreen.com' }, labels: { heading: 'Email shown if a form fails to send' } },
  ],

  global: [
    { id: 'announcement', label: 'Announcement bar (top of every page)', values: { body: 'Fine diamond jewelry · Natural diamonds · 14kt & 18kt gold' } },
    { id: 'newsletter', label: 'Newsletter sign-up (above footer)', values: { eyebrow: 'JOIN THE FAMILY', heading: 'Come along for the journey.', body: 'New jewelry, behind-the-scenes moments, and stories from byShreen.' } },
    { id: 'footer', label: 'Footer', values: { body: 'Fine jewelry crafted with natural diamonds, generations of expertise, and a personal touch.', note: 'Private viewings by appointment · Natural diamonds' }, labels: { body: 'Tagline', note: 'Small line under the tagline' } },
  ],
};

export function guideToSections(key) {
  return (CONTENT_GUIDES[key] || []).map(({ id, values }) => ({ id, ...values }));
}
