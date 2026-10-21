import { KenmarkStorage } from '@kenmark/storage/server';

/** @type {import('@kenmark/storage/server').KenmarkStorage | undefined} */
let storage;

/**
 * Server-only Kenmark Storage client. Uses project API key — never expose to callers.
 * @returns {import('@kenmark/storage/server').KenmarkStorage}
 */
export function createStorage() {
  if (!storage) {
    const baseUrl = process.env.KENMARK_STORAGE_URL;
    const apiKey = process.env.KENMARK_STORAGE_KEY;
    if (!baseUrl || !apiKey) {
      throw new Error('KENMARK_STORAGE_URL and KENMARK_STORAGE_KEY are required for asset APIs.');
    }
    storage = new KenmarkStorage({ baseUrl, apiKey });
  }
  return storage;
}
