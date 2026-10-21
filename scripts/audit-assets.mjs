import fs from 'node:fs';
import path from 'node:path';

const manifestRaw = fs.readFileSync('scripts/asset-manifest.json', 'utf8');
const manifest = JSON.parse(manifestRaw);
const manifestKeys = new Set(Object.keys(manifest));

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === '.impeccable') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, fileList);
    } else if (/\.(js|jsx|ts|tsx|json|md)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allFiles = walk('.');
const missing = new Map();

const imgRegex = /['"](\/images\/[a-zA-Z0-9_\-./]+\.(?:jpg|jpeg|png|webp|avif|gif|svg))['"]/g;
const vidRegex = /['"](\/videos\/[a-zA-Z0-9_\-./]+\.(?:mp4|webm))['"]/g;

for (const f of allFiles) {
  if (
    f.includes('scripts' + path.sep + 'asset-manifest.json') ||
    f.includes('lib' + path.sep + 'asset-paths.js') ||
    f.includes('scripts' + path.sep + 'audit-assets.mjs')
  ) {
    continue;
  }
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    const assetPath = match[1];
    if (!manifestKeys.has(assetPath)) {
      if (!missing.has(assetPath)) missing.set(assetPath, new Set());
      missing.get(assetPath).add(f);
    }
  }
  while ((match = vidRegex.exec(content)) !== null) {
    const assetPath = match[1];
    if (!manifestKeys.has(assetPath)) {
      if (!missing.has(assetPath)) missing.set(assetPath, new Set());
      missing.get(assetPath).add(f);
    }
  }
}

console.log('=== AUDIT RESULTS: ASSET PATHS NOT IN MANIFEST ===');
for (const [assetPath, files] of missing.entries()) {
  const localExists = fs.existsSync(path.join('.', 'public', assetPath.replace(/^\//, '')));
  console.log(`PATH: ${assetPath} | Exists in local public: ${localExists}`);
  for (const f of files) console.log(`  Used in: ${f}`);
}
