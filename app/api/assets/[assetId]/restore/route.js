export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createStorage } from '@/lib/storage';
import { assetBelongsToAccount, sanitizeAssetForApi } from '@/lib/storage-proxy';
import { getAdminSession } from '@/lib/admin-auth';

export async function POST(request, context) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { assetId } = await context.params;
  const storage = createStorage();
  const currentAsset = await storage.assets.get(assetId);
  if (!assetBelongsToAccount(currentAsset, session.id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const asset = await storage.assets.restore(assetId);
  return NextResponse.json(sanitizeAssetForApi(asset));
}
