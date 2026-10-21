import { resolveAssetPath } from './asset-paths';

const MANAGED_IMAGE_SOURCE = /^\/api\/assets\/(ast_[A-Za-z0-9_-]+)$/i;
const MEDIA_SOURCE_FIELD = /(?:image|poster)$/i;

export function canonicalManagedImageSource(source) {
  const rawSource = resolveAssetPath(String(source || '').trim()).split(/[?#]/, 1)[0];
  if (MANAGED_IMAGE_SOURCE.test(rawSource)) return rawSource;
  try {
    const parsedUrl = new URL(rawSource);
    if (!['http:', 'https:'].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) return '';
    const managedPath = parsedUrl.pathname;
    return MANAGED_IMAGE_SOURCE.test(managedPath) ? managedPath : '';
  } catch {
    return '';
  }
}

export function normalizeMediaFocalPoint(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (!Number.isFinite(value.x) || !Number.isFinite(value.y)
    || value.x < 0 || value.x > 1 || value.y < 0 || value.y > 1) return null;
  return { x: value.x, y: value.y };
}

export function mediaFocalPointObjectPosition(value) {
  const focalPoint = normalizeMediaFocalPoint(value);
  if (!focalPoint) return '';
  return `${focalPoint.x * 100}% ${focalPoint.y * 100}%`;
}

/** Collect unique managed image/poster sources for one batched focal metadata read. */
export function collectMediaImageSources(value) {
  const sources = new Set();
  const visit = (current, parentKey = '') => {
    if (typeof current === 'string') {
      if (MEDIA_SOURCE_FIELD.test(parentKey)) {
        const canonicalSource = canonicalManagedImageSource(current);
        if (canonicalSource) sources.add(canonicalSource);
      }
      return;
    }
    if (Array.isArray(current)) {
      for (const entry of current) visit(entry, parentKey);
      return;
    }
    if (!current || typeof current !== 'object') return;
    for (const [key, entry] of Object.entries(current)) {
      if (key === 'images' && Array.isArray(entry)) {
        for (const source of entry) visit(source, 'image');
      } else visit(entry, key);
    }
  };
  visit(value);
  return [...sources];
}

/** Add only metadata-backed positions; existing block/product positions remain authoritative. */
export function applyMediaFocalPoints(value, focalPointBySource = {}) {
  if (Array.isArray(value)) return value.map((entry) => applyMediaFocalPoints(entry, focalPointBySource));
  if (!value || typeof value !== 'object') return value;

  const result = Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, applyMediaFocalPoints(entry, focalPointBySource)]));
  for (const [sourceField, sourceValue] of Object.entries(value)) {
    if (typeof sourceValue !== 'string' || !MEDIA_SOURCE_FIELD.test(sourceField)) continue;
    const focalPoint = normalizeMediaFocalPoint(focalPointBySource[canonicalManagedImageSource(sourceValue)]);
    if (!focalPoint) continue;
    const positionField = `${sourceField}Position`;
    if (typeof value[positionField] === 'string' && value[positionField].trim()) continue;
    result[positionField] = mediaFocalPointObjectPosition(focalPoint);
  }

  if (Array.isArray(value.images)) {
    const positions = Array.isArray(value.imagePositions) ? [...value.imagePositions] : [];
    value.images.forEach((source, index) => {
      if (typeof positions[index] === 'string' && positions[index].trim()) return;
      const focalPoint = normalizeMediaFocalPoint(focalPointBySource[canonicalManagedImageSource(source)]);
      if (focalPoint) positions[index] = mediaFocalPointObjectPosition(focalPoint);
    });
    if (positions.length) result.imagePositions = positions;
  }

  if (typeof value.image === 'string' && !String(value.heroPosition || '').trim()
    && !(typeof value.imagePosition === 'string' && value.imagePosition.trim())) {
    const focalPoint = normalizeMediaFocalPoint(focalPointBySource[canonicalManagedImageSource(value.image)]);
    if (focalPoint) result.heroPosition = mediaFocalPointObjectPosition(focalPoint);
  }
  return result;
}
