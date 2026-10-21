import test from 'node:test';
import assert from 'node:assert/strict';
import { NEWSLETTER_PRESETS, getPresetById } from '../lib/newsletter-presets.js';
import {
  buildNewsletterEmail,
  createUnsubscribeToken,
  newsletterCampaignSchema,
  richDocToEmailHtml,
  verifyUnsubscribeToken,
} from '../lib/newsletter.js';
import { docToText } from '../lib/rich-text.js';

test('newsletter presets are valid, complete, and properly categorized', () => {
  assert.ok(NEWSLETTER_PRESETS.length >= 6, 'Should contain at least 6 presets');
  for (const preset of NEWSLETTER_PRESETS) {
    assert.ok(preset.id, 'Preset must have an id');
    assert.ok(preset.name, 'Preset must have a name');
    assert.ok(preset.subject, 'Preset must have a subject');
    assert.ok(preset.heading, 'Preset must have a heading');
    assert.ok(preset.doc?.type === 'doc', 'Preset doc must be a valid ProseMirror document');
    assert.ok(Array.isArray(preset.doc?.content), 'Preset doc must have content array');
  }

  const newCollection = getPresetById('new-collection');
  assert.equal(newCollection.id, 'new-collection');
  assert.ok(newCollection.subject.includes('High Jewellery'));
});

test('richDocToEmailHtml converts ProseMirror nodes and marks into styled email HTML', () => {
  const sampleDoc = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Exclusive Preview' }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Welcome to our ' },
          { type: 'text', text: 'atelier', marks: [{ type: 'bold' }] },
          { type: 'text', text: ' where we craft ' },
          { type: 'text', text: 'rare pieces', marks: [{ type: 'italic' }, { type: 'underline' }] },
          { type: 'text', text: '. ' },
          { type: 'text', text: 'Learn more', marks: [{ type: 'link', attrs: { href: 'https://byshreen.com/craftsmanship' } }] },
        ],
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: '18kt Solid Gold' }] }],
          },
          {
            type: 'listItem',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ethical Diamonds' }] }],
          },
        ],
      },
      {
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Timeless beauty.' }],
          },
        ],
      },
      {
        type: 'horizontalRule',
      },
    ],
  };

  const html = richDocToEmailHtml(sampleDoc, { accent: '#a84d5f' });
  assert.ok(html.includes('<h2'), 'Should render H2 heading');
  assert.ok(html.includes('Exclusive Preview'), 'Should contain heading text');
  assert.ok(html.includes('<strong'), 'Should render bold mark');
  assert.ok(html.includes('<em'), 'Should render italic mark');
  assert.ok(html.includes('<u'), 'Should render underline mark');
  assert.ok(html.includes('<a href="https://byshreen.com/craftsmanship"'), 'Should render link');
  assert.ok(html.includes('<ul'), 'Should render bullet list');
  assert.ok(html.includes('<li'), 'Should render list items');
  assert.ok(html.includes('<blockquote'), 'Should render blockquote');
  assert.ok(html.includes('<hr'), 'Should render horizontal rule');
});

test('buildNewsletterEmail produces complete luxury email frame with preheader and unsubscribe link', () => {
  const preset = getPresetById('new-collection');
  const result = buildNewsletterEmail({
    subject: preset.subject,
    preheader: preset.preheader,
    heading: preset.heading,
    richDoc: preset.doc,
    buttonLabel: preset.buttonLabel,
    buttonUrl: preset.buttonUrl,
    recipientEmail: 'client@example.com',
    settings: {
      storeName: 'byShreen',
      contactEmail: 'hello@byshreen.com',
      theme: { mulberry: '#a84d5f', paper: '#faf8f5' },
    },
  });

  assert.equal(result.subject, preset.subject);
  assert.ok(result.html.includes('byShreen'), 'Must include brand name');
  assert.ok(result.html.includes(preset.heading), 'Must include heading');
  assert.ok(result.html.includes(preset.buttonLabel), 'Must include CTA button label');
  assert.ok(result.html.includes('/unsubscribe?email=client%40example.com'), 'Must include unsubscribe link');
  assert.ok(result.text.includes('Unsubscribe:'), 'Plain text must include unsubscribe link');
});

test('unsubscribe tokens are cryptographically verified and tamper-proof', () => {
  const email = 'subscriber@example.com';
  const token = createUnsubscribeToken(email);
  assert.ok(token && typeof token === 'string', 'Token should be a non-empty string');

  assert.equal(verifyUnsubscribeToken(email, token), true, 'Valid email and token should verify');
  assert.equal(verifyUnsubscribeToken('SUBSCRIBER@example.com', token), true, 'Case-insensitive email should verify');
  assert.equal(verifyUnsubscribeToken('other@example.com', token), false, 'Different email should fail verification');
  assert.equal(verifyUnsubscribeToken(email, 'invalid_token'), false, 'Corrupted token should fail verification');
});

test('newsletterCampaignSchema validates correct inputs and rejects missing fields', () => {
  const valid = newsletterCampaignSchema.safeParse({
    subject: 'Autumn Edit',
    preheader: 'A private preview',
    heading: 'The Autumn Edit',
    buttonLabel: 'View Pieces',
    buttonUrl: '/shop',
    richDoc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }] },
  });
  assert.equal(valid.success, true);

  const missingSubject = newsletterCampaignSchema.safeParse({
    subject: '',
    heading: 'The Autumn Edit',
    richDoc: { type: 'doc', content: [] },
  });
  assert.equal(missingSubject.success, false);
});
