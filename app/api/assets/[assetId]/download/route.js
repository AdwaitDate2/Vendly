export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createStorage } from '@/lib/storage';
import { assetBelongsToAccount, streamFromUrl } from '@/lib/storage-proxy';
import { getAdminSession } from '@/lib/admin-auth';

export async function GET(request, context) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { assetId } = await context.params;
  const storage = createStorage();
  const asset = await storage.assets.get(assetId);
  if (!assetBelongsToAccount(asset, session.projectId || session.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (asset.status === 'deleted') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { url } = await storage.assets.signedUrl(assetId, {
    variant: 'original',
    expiresIn: 300,
    download: true,
  });

  const upstream = await fetch(url);
  if (!upstream.ok) {
    return NextResponse.json({ error: 'Upstream failed' }, { status: 502 });
  }

  const streamed = streamFromUrl(upstream);
  streamed.headers.set('Cache-Control', 'private, no-store');
  return streamed;
}
