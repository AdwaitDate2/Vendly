#!/usr/bin/env node
/**
 * Upload one or more files through the app proxy (not Storage directly).
 *
 * Usage:
 *   pnpm exec dotenv -e .env -- node scripts/upload-asset.mjs ./photo.jpg --visibility public
 *   node --env-file=.env scripts/upload-asset.mjs ./a.jpg ./b.png --visibility private
 *
 * Requires ASSETS_API_AUTH_SECRET (Bearer) — never send KENMARK_STORAGE_KEY.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE = process.env.ASSETS_UPLOAD_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL;
const SECRET = process.env.ASSETS_API_AUTH_SECRET;

if (!BASE) {
  throw new Error('Set ASSETS_UPLOAD_BASE_URL, NEXT_PUBLIC_SITE_URL, or PUBLIC_SITE_URL before uploading assets.');
}

const EXT_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
};

function mimeFor(filePath) {
  return EXT_MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function usage() {
  console.error(`Usage: node scripts/upload-asset.mjs <file|dir>... [--visibility public|private] [--recursive] [--continue]
Env: ASSETS_API_AUTH_SECRET (required), ASSETS_UPLOAD_BASE_URL or NEXT_PUBLIC_SITE_URL`);
  process.exit(1);
}

async function collectFiles(entries, recursive) {
  const files = [];
  for (const entry of entries) {
    const abs = path.resolve(entry);
    const info = await stat(abs);
    if (info.isFile()) {
      files.push(abs);
      continue;
    }
    if (info.isDirectory()) {
      const kids = await readdir(abs);
      for (const kid of kids) {
        const child = path.join(abs, kid);
        const childInfo = await stat(child);
        if (childInfo.isFile()) files.push(child);
        else if (recursive && childInfo.isDirectory()) {
          files.push(...(await collectFiles([child], true)));
        }
      }
    }
  }
  return files;
}

function normalizeFolder(folder) {
  if (!folder) return '';
  const cleaned = folder.split(/[/\\]+/).filter(Boolean).join('/');
  return cleaned ? `/${cleaned}` : '';
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function uploadOne(filePath, visibility, folder, maxRetries = 5) {
  const buf = await readFile(filePath);
  const contentType = mimeFor(filePath);
  const normalizedFolder = normalizeFolder(folder);

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const form = new FormData();
    form.append('file', new Blob([buf], { type: contentType }), path.basename(filePath));
    form.append('visibility', visibility);
    if (normalizedFolder) form.append('folder', normalizedFolder);

    const res = await fetch(`${BASE.replace(/\/$/, '')}/api/assets/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SECRET}` },
      body: form,
    });

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    if (res.status === 429 || res.status === 502) {
      if (attempt < maxRetries) {
        const waitMs = attempt * 5000;
        console.warn(`[429/502] Rate limited on ${path.basename(filePath)}, retrying in ${waitMs / 1000}s (attempt ${attempt}/${maxRetries})...`);
        await sleep(waitMs);
        continue;
      }
    }

    if (!res.ok) {
      throw new Error(`${path.basename(filePath)} → ${res.status} ${JSON.stringify(json)}`);
    }
    const label = normalizedFolder
      ? `${normalizedFolder.replace(/^\//, '')}/${path.basename(filePath)}`
      : path.basename(filePath);
    console.log(`${label} → ${json.id} ${json.urls?.public || ''}`);
    return json;
  }
}

async function main() {
  // pnpm may inject a literal "--" into argv
  const argv = process.argv.slice(2).filter((a) => a !== '--');
  if (!argv.length) usage();
  if (!SECRET) {
    console.error('ASSETS_API_AUTH_SECRET is required.');
    process.exit(1);
  }

  let visibility = 'private';
  let recursive = false;
  let continueOnError = false;
  const paths = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--visibility') {
      visibility = argv[++i] === 'public' ? 'public' : 'private';
      continue;
    }
    if (arg === '--recursive') {
      recursive = true;
      continue;
    }
    if (arg === '--continue') {
      continueOnError = true;
      continue;
    }
    if (arg.startsWith('-')) usage();
    paths.push(arg);
  }

  if (!paths.length) usage();
  const roots = paths.map((p) => path.resolve(p));
  const files = await collectFiles(paths, recursive);
  if (!files.length) {
    console.error('No files found.');
    process.exit(1);
  }

  let ok = 0;
  let failed = 0;
  for (const file of files) {
    const publicRoot = roots.find((r) => path.basename(r) === 'public');
    let folder = '';
    if (publicRoot && file.startsWith(publicRoot + path.sep)) {
      const rel = path.relative(publicRoot, path.dirname(file));
      folder = rel && rel !== '.' ? rel.split(path.sep).join('/') : '';
    } else {
      const root = roots.find((r) => file === r || file.startsWith(r + path.sep));
      if (root && file !== root) {
        const rel = path.relative(root, path.dirname(file));
        folder = rel && rel !== '.' ? rel.split(path.sep).join('/') : '';
      }
    }
    try {
      await uploadOne(file, visibility, folder);
      ok += 1;
      await sleep(250);
    } catch (err) {
      failed += 1;
      console.error(err.message || err);
      if (!continueOnError) process.exit(1);
    }
  }
  console.log(`Done: ${ok} uploaded, ${failed} failed.`);
  if (failed) process.exit(1);
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isDirect) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}
