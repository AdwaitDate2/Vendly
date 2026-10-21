'use client';

import { useEffect, useMemo, useState } from 'react';
import { publicMediaFocalPointsBySourcesAction } from '@/lib/media-actions';
import { collectMediaImageSources } from '@/lib/media-focal-points';

const focalPointBatchCache = new Map();

function readMediaFocalPoints(sources) {
  const cacheKey = [...sources].sort().join('|');
  if (!cacheKey) return Promise.resolve({});
  if (focalPointBatchCache.has(cacheKey)) return focalPointBatchCache.get(cacheKey);

  const pendingRead = publicMediaFocalPointsBySourcesAction(sources.slice(0, 50))
    .then((result) => {
      if (!result.ok) {
        focalPointBatchCache.delete(cacheKey);
        return {};
      }
      return result.focalPointBySource;
    })
    .catch(() => {
      focalPointBatchCache.delete(cacheKey);
      return {};
    });
  focalPointBatchCache.set(cacheKey, pendingRead);
  if (focalPointBatchCache.size > 24) focalPointBatchCache.delete(focalPointBatchCache.keys().next().value);
  return pendingRead;
}

/** Read current cart item focus metadata in one cached batch, ignoring unmanaged URLs. */
export default function useCartMediaFocalPoints(items) {
  const [focalPointBySource, setFocalPointBySource] = useState({});
  const sources = useMemo(() => collectMediaImageSources(items).slice(0, 50), [items]);
  const sourceSignature = sources.join('|');

  useEffect(() => {
    let active = true;
    const loadFocalPoints = async () => {
      if (!sources.length) {
        if (active) setFocalPointBySource({});
        return;
      }
      const nextFocalPointBySource = await readMediaFocalPoints(sources);
      if (active) setFocalPointBySource(nextFocalPointBySource);
    };
    loadFocalPoints();
    return () => { active = false; };
  }, [sourceSignature, sources]);

  return focalPointBySource;
}
