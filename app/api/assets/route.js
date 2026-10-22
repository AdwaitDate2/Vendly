export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createStorage } from '@/lib/storage';
import { getMediaDisplayNamesBySources } from '@/lib/media-metadata';
import { getAdminSession } from '@/lib/admin-auth';
import { accountAssetFolder, sanitizeAssetForApi } from '@/lib/storage-proxy';

// Storage keeps folders as "/name/" and matches them exactly, so "/name" or "name" would list nothing.
function normalizeFolder(value) {
  const parts = String(value ?? '').split(/[/\\]+/).filter(Boolean);
  return parts.length ? `/${parts.join('/')}/` : undefined;
}

export async function GET(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const storage = createStorage();
  const list = await storage.assets.list({
    folder: normalizeFolder(accountAssetFolder(session.projectId || session.id, searchParams.get('folder'))),
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    cursor: searchParams.get('cursor') ?? undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
    status: searchParams.get('status') || undefined,
    visibility: searchParams.get('visibility') || undefined,
    search: searchParams.get('search') ?? undefined,
    includeDeleted: searchParams.get('includeDeleted') === 'true',
  });

  const sanitizedItems = list.items.map(sanitizeAssetForApi);
  let displayNameBySource = {};
  try {
    displayNameBySource = await getMediaDisplayNamesBySources(sanitizedItems.map((asset) => asset.urls.public));
  } catch {
    // Keep media browsing available if the optional editable-name metadata store is unavailable.
  }

  return NextResponse.json({
    ...list,
    items: sanitizedItems.map((asset) => ({
      ...asset,
      displayName: displayNameBySource[asset.urls.public] || asset.originalName || '',
    })),
  });
}
