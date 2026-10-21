import { readFile, writeFile } from 'node:fs/promises';

async function main() {
  const raw = await readFile('scripts/asset-manifest.json', 'utf8');
  const manifest = JSON.parse(raw);

  const entries = Object.entries(manifest)
    .map(([key, value]) => `  '${key}': '${value.src}',`)
    .join('\n');

  const code = `/**
 * Legacy \`/public\` paths → proxied Kenmark Storage URLs.
 * Generated from scripts/asset-manifest.json (upload via scripts/upload-asset.mjs).
 * SVG icons remain under \`/icons/*\` until MIME allowlist includes image/svg+xml.
 */
export const ASSET_PATH_MAP = {
${entries}
};

export const HERO_IMAGE = ASSET_PATH_MAP['/images/hero.jpg'] || ASSET_PATH_MAP['/images/selection-2/bridal-hero.webp'];
export const STORY_IMAGE = ASSET_PATH_MAP['/images/story.webp'];
export const FOUNDER_IMAGE = ASSET_PATH_MAP['/images/founder.webp'] || ASSET_PATH_MAP['/images/selection-2/founder-portrait.webp'];

/** @param {string | null | undefined} src */
export function resolveAssetPath(src) {
  if (!src) return src;
  return ASSET_PATH_MAP[src] || src;
}

/** @param {string[] | null | undefined} sources */
export function resolveAssetPaths(sources) {
  if (!Array.isArray(sources)) return sources;
  return sources.map((src) => resolveAssetPath(src));
}
`;

  await writeFile('lib/asset-paths.js', code, 'utf8');
  console.log('Successfully updated lib/asset-paths.js!');
}

main();
