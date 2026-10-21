export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { KenmarkStorageError } from '@kenmark/storage';
import { createStorage } from '@/lib/storage';
import { getAdminSession } from '@/lib/admin-auth';
import { accountAssetFolder, putOriginalToSession, sanitizeAssetForApi } from '@/lib/storage-proxy';

export async function POST(request) {
  const account = await getAdminSession();
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const visibility = String(form.get('visibility') || 'private');
    const rawFolder = form.get('folder');
    let folder;
    if (typeof rawFolder === 'string' && rawFolder.trim()) {
      const cleaned = rawFolder.split(/[/\\]+/).filter(Boolean).join('/');
      folder = accountAssetFolder(account.id, cleaned);
    }
    const storage = createStorage();
    const session = await storage.uploads.create({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      visibility: visibility === 'public' ? 'public' : 'private',
      ...(folder ? { folder } : {}),
    });

    const putRes = await putOriginalToSession(session, await file.arrayBuffer());
    if (!putRes.ok) {
      const detail = await putRes.text().catch(() => '');
      return NextResponse.json({ error: 'Upload failed', detail: detail.slice(0, 300) }, { status: 502 });
    }

    const asset = await putRes.json();
    return NextResponse.json(sanitizeAssetForApi(asset), { status: 201 });
  } catch (err) {
    if (err instanceof KenmarkStorageError) {
      return NextResponse.json(
        { error: err.message, code: err.code, details: err.details },
        { status: err.status || 502 },
      );
    }
    console.error('[assets/upload]', err);
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 });
  }
}
