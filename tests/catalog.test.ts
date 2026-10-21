import test from 'node:test';
import assert from 'node:assert/strict';
import { productInputSchema, serializeProduct } from '../lib/catalog.js';

test('product input accepts a valid jewelry record', () => {
  const result = productInputSchema.safeParse({
    title: 'Diamond solitaire ring',
    slug: 'diamond-solitaire-ring',
    price: '1299.50',
    category: 'rings',
    metal: '14K Yellow Gold',
    stone: 'Natural Diamond',
    description: 'A considered solitaire with a sculptural profile for everyday wear.',
    status: 'draft',
    images: ['/api/assets/ast_example_solitaire'],
  });

  assert.equal(result.success, true);
  assert.equal(result.data.price, 1299.5);
});

test('product input rejects a missing image and negative price', () => {
  const result = productInputSchema.safeParse({
    title: 'Diamond ring',
    price: '-1',
    category: 'rings',
    metal: '14K Gold',
    stone: 'Diamond',
    description: 'A long enough description for a product record.',
    status: 'draft',
    images: [],
  });

  assert.equal(result.success, false);
  assert.ok(result.error.flatten().fieldErrors.price);
  assert.ok(result.error.flatten().fieldErrors.images);
});

test('serialized Mongo product exposes display price and stable string id', () => {
  const product = serializeProduct({
    _id: { toString: () => 'abc123' },
    priceCents: 102900,
    variants: [{ id: 'default' }],
  });

  assert.equal(product.id, 'abc123');
  assert.equal(product.price, 1029);
  assert.equal(product._id, undefined);
});

test('legacy single-variant product becomes 14kt and 18kt metal options', () => {
  const product = serializeProduct({
    _id: { toString: () => 'abc123' },
    metal: '14K Yellow Gold',
    priceCents: 102900,
    variants: [{ id: 'default', quantity: 2 }],
  });

  assert.deepEqual(product.variants.map((variant) => variant.id), ['14kt', '18kt']);
  assert.equal(product.variants[0].title, '14kt Yellow Gold');
  assert.equal(product.variants[0].quantity, 2);
  assert.equal(product.variants[1].priceCents, 118300);
  assert.equal(product.priceCents, 102900);
});

