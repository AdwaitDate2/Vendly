import test from 'node:test';
import assert from 'node:assert/strict';
import { collectionInputSchema } from '../lib/catalog.js';
import { contentSaveSchema, getContentRoute, getContentFallback } from '../lib/content.js';
import { inquiryInputSchema } from '../lib/leads.js';
import { inventoryAdjustmentSchema } from '../lib/inventory.js';

test('collection input normalizes editor values', () => {
  const result = collectionInputSchema.safeParse({
    name: 'Rings',
    slug: 'rings',
    image: '/api/assets/ast_JE5LVxK1Sqn5UbG52QPidd3T',
    note: 'Solitaire, stack & sculptural forms',
    sortOrder: '3',
    status: 'published',
  });
  assert.equal(result.success, true);
  assert.equal(result.data.sortOrder, 3);
  assert.equal(result.data.seoTitle, '');
});

test('inventory adjustments require a signed non-zero delta and reason', () => {
  const valid = inventoryAdjustmentSchema.safeParse({ productId: '507f1f77bcf86cd799439011', variantId: 'default', version: '1', delta: '-2', reason: 'damage' });
  assert.equal(valid.success, true);
  assert.equal(valid.data.delta, -2);
  const invalid = inventoryAdjustmentSchema.safeParse({ productId: '507f1f77bcf86cd799439011', variantId: 'default', version: '1', delta: '0', reason: 'other' });
  assert.equal(invalid.success, false);
});

test('public content routes and policy publish validation are explicit', () => {
  const fallback = getContentFallback('privacy');
  assert.equal(getContentRoute('privacy'), '/privacy');
  assert.equal(fallback.status, 'draft');
  const result = contentSaveSchema.safeParse({ key: 'privacy', title: fallback.title, intro: fallback.intro, status: 'draft', seoTitle: fallback.seoTitle, seoDescription: fallback.seoDescription, sections: [] });
  assert.equal(result.success, true);
});

test('inquiry input requires consent and useful context', () => {
  const result = inquiryInputSchema.safeParse({ requestType: 'contact', name: 'A Client', email: 'client@example.com', topic: 'Sizing', message: 'I would like help choosing a size for a gift.', consent: 'yes' });
  assert.equal(result.success, true);
  const missingConsent = inquiryInputSchema.safeParse({ requestType: 'contact', name: 'A Client', email: 'client@example.com', message: 'I would like help choosing a size for a gift.' });
  assert.equal(missingConsent.success, false);
});
