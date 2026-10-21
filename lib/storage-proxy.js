import { getAdminSession } from './admin-auth';

/**
 * Fail-closed caller auth for mutating / private asset routes.
 * Accepts Bearer ASSETS_API_AUTH_SECRET, or an active admin preview session.
 * Never accepts KENMARK_STORAGE_KEY from callers.
 * @param {Request} request
 * @param {{ getSession?: () => Promise<unknown> }} [options] Session lookup, replaceable in tests.
 * @returns {Promise<boolean>}
 */
export async function validateCallerAuth(request, { getSession = getAdminSession } = {}) {
  const secret = process.env.ASSETS_API_AUTH_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth === `Bearer ${secret}`) return true;
  }

  const session = await getSession();
  if (session) return true;

  // Fail closed until ASSETS_API_AUTH_SECRET or admin session is available.
  return false;
}

export function accountAssetFolder(accountId, folder) {
  const accountFolder = `/accounts/${String(accountId || '').replace(/[^a-z0-9_-]/gi, '')}`;
  const normalizedFolder = String(folder || '').split(/[/\\]+/).filter((part) => part && part !== '.' && part !== '..').join('/');
  return normalizedFolder ? `${accountFolder}/${normalizedFolder}` : accountFolder;
}

export function assetBelongsToAccount(asset, accountId) {
  const accountFolder = `/accounts/${String(accountId || '').replace(/[^a-z0-9_-]/gi, '')}/`;
  const folder = `/${String(asset?.folder || '').replace(/^\/+|\/+$/g, '')}/`;
  return Boolean(accountId) && folder.startsWith(accountFolder);
}

/**
 * @param {{ uploadUrl: string, uploadToken: string, requiredHeaders?: Record<string, string> }} session
 * @param {ArrayBuffer | Buffer | ReadableStream} body
 * @returns {Promise<Response>}
 */
export async function putOriginalToSession(session, body) {
  const headers = {
    Authorization: `Upload ${session.uploadToken}`,
    'Content-Type': 'application/octet-stream',
    ...(session.requiredHeaders || {}),
  };
  return fetch(session.uploadUrl, { method: 'PUT', headers, body: /** @type {BodyInit} */ (body) });
}

const FORWARD_HEADERS = ['content-type', 'content-length', 'content-disposition', 'content-range', 'accept-ranges'];

/**
 * Stream Storage bytes through the app domain — never redirect to Storage.
 * @param {Response} upstream
 * @returns {Response}
 */
export function streamFromUrl(upstream) {
  const headers = new Headers();
  for (const name of FORWARD_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}

/**
 * Strip Storage hostnames/tokens; expose same-origin app paths only.
 * @param {import('@kenmark/storage').Asset} asset
 */
export function sanitizeAssetForApi(asset) {
  const { publicUrl: _publicUrl, ...rest } = asset;
  return {
    ...rest,
    urls: {
      public: `/api/assets/${asset.id}`,
      download: `/api/assets/${asset.id}/download`,
    },
  };
}
