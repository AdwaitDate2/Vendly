import test from 'node:test';
import assert from 'node:assert/strict';
import type { Asset } from '@kenmark/storage';
import { sanitizeAssetForApi, streamFromUrl, validateCallerAuth } from '../lib/storage-proxy.js';

test('sanitizeAssetForApi strips publicUrl and generates proxied endpoints', () => {
  const rawAsset: Asset = {
    id: 'ast_test123',
    projectId: 'prj_test',
    projectSlug: 'test-project',
    originalName: 'hero.jpg',
    contentType: 'image/jpeg',
    detectedContentType: null,
    sizeBytes: 1024,
    derivativeBytes: 0,
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    visibility: 'public',
    processingMode: 'raw',
    status: 'ready',
    folder: '/',
    metadata: {},
    image: null,
    variants: [],
    processingError: null,
    deletedAt: null,
    purgeAfter: null,
    publicUrl: 'https://storage-internal.example.com/assets/ast_test123/original.jpg',
    createdAt: '2026-09-16T12:00:00.000Z',
    updatedAt: '2026-09-16T12:00:00.000Z',
  };

  const sanitized = sanitizeAssetForApi(rawAsset);

  assert.equal(sanitized.id, 'ast_test123');
  assert.equal(sanitized.originalName, 'hero.jpg');
  assert.equal(sanitized.urls.public, '/api/assets/ast_test123');
  assert.equal(sanitized.urls.download, '/api/assets/ast_test123/download');
  assert.equal('publicUrl' in sanitized, false);
});

test('streamFromUrl forwards allowed headers without exposing upstream metadata', () => {
  const upstreamHeaders = new Headers({
    'content-type': 'image/webp',
    'content-length': '2048',
    'content-disposition': 'inline; filename="photo.webp"',
    'x-amz-request-id': 'secret-request-id',
    'server': 'StorageServer/1.0',
  });

  const mockUpstream = new Response(new Uint8Array([1, 2, 3]), {
    status: 200,
    headers: upstreamHeaders,
  });

  const streamed = streamFromUrl(mockUpstream);

  assert.equal(streamed.status, 200);
  assert.equal(streamed.headers.get('content-type'), 'image/webp');
  assert.equal(streamed.headers.get('content-length'), '2048');
  assert.equal(streamed.headers.get('content-disposition'), 'inline; filename="photo.webp"');
  assert.equal(streamed.headers.get('x-amz-request-id'), null);
  assert.equal(streamed.headers.get('server'), null);
});

test('validateCallerAuth fails closed when no secret or session is provided', async () => {
  const req = new Request('http://localhost:3000/api/assets/upload', {
    method: 'POST',
    headers: {},
  });

  // No admin session: the lookup is injected because cookies() only works inside a Next.js request.
  const authorized = await validateCallerAuth(req, { getSession: async () => null });
  assert.equal(authorized, false);
});

test('validateCallerAuth rejects a wrong bearer secret', async () => {
  const previous = process.env.ASSETS_API_AUTH_SECRET;
  process.env.ASSETS_API_AUTH_SECRET = 'expected-secret';
  try {
    const req = new Request('http://localhost:3000/api/assets/upload', { method: 'POST', headers: { authorization: 'Bearer wrong' } });
    assert.equal(await validateCallerAuth(req, { getSession: async () => null }), false);
    const ok = new Request('http://localhost:3000/api/assets/upload', { method: 'POST', headers: { authorization: 'Bearer expected-secret' } });
    assert.equal(await validateCallerAuth(ok, { getSession: async () => null }), true);
  } finally {
    if (previous === undefined) delete process.env.ASSETS_API_AUTH_SECRET;
    else process.env.ASSETS_API_AUTH_SECRET = previous;
  }
});
