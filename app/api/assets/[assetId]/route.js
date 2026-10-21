export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { KenmarkStorageError, UpdateAssetSchema } from '@kenmark/storage';
import { createStorage } from '@/lib/storage';
import { assetBelongsToAccount, sanitizeAssetForApi, streamFromUrl } from '@/lib/storage-proxy';
import { findMediaUsage } from '@/lib/media-usage';
import { getAdminSession } from '@/lib/admin-auth';

/**
 * Public proxied serve — no caller auth; requires visibility=public and not deleted.
 * Embed as `/api/assets/{assetId}` only (never Storage hostnames).
 */
export async function GET(request, context) {
  const { assetId } = await context.params;
  const storage = createStorage();
  const asset = await storage.assets.get(assetId);

  if (asset.status === 'deleted' || asset.visibility !== 'public') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let upstreamUrl = asset.publicUrl;
  if (!upstreamUrl) {
    const signed = await storage.assets.signedUrl(assetId, {
      variant: 'original',
      expiresIn: 300,
    });
    upstreamUrl = signed.url;
  }

  // Pass byte-range requests through: Safari and iOS will only play video that supports them.
  const range = request.headers.get('range');
  const upstream = await fetch(upstreamUrl, range ? { headers: { Range: range } } : undefined);
  if (!upstream.ok) {
    return NextResponse.json({ error: 'Upstream failed' }, { status: 502 });
  }

  const streamed = streamFromUrl(upstream);
  // Asset IDs are never reused for different content, so the response can be cached indefinitely.
  streamed.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return streamed;
}

export async function PATCH(request, context) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { assetId } = await context.params;
  const body = await request.json();
  const { visibility } = UpdateAssetSchema.parse(body);
  const storage = createStorage();
  const currentAsset = await storage.assets.get(assetId);
  if (!assetBelongsToAccount(currentAsset, session.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const asset = await storage.assets.update(assetId, { visibility });
  // Note: public → private updates origin immediately; CDN/browser caches may retain old public copies.
  return NextResponse.json(sanitizeAssetForApi(asset));
}

export async function DELETE(request, context) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { assetId } = await context.params;
  const storage = createStorage();
  const asset = await storage.assets.get(assetId);
  if (!assetBelongsToAccount(asset, session.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  let usage;
  try {
    usage = await findMediaUsage(`/api/assets/${assetId}`);
  } catch {
    return NextResponse.json({ error: 'Could not verify whether this file is in use. Try again.' }, { status: 503 });
  }
  if (usage.length) {
    return NextResponse.json({ error: 'This file is still in use and cannot be deleted.', usage }, { status: 409 });
  }

  try {
    await storage.assets.delete(assetId);
  } catch (err) {
    // Already deleted or unknown: report it instead of crashing the route.
    const status = err instanceof KenmarkStorageError && err.status >= 400 && err.status < 500 ? err.status : 502;
    return NextResponse.json({ error: err?.message || 'Delete failed', code: err?.code }, { status });
  }
  return new NextResponse(null, { status: 204 });
}
