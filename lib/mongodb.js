import { MongoClient } from 'mongodb';
import { getServerEnv } from './env';
import { cookies, headers } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';

const globalForMongo = globalThis;

export function getMongoClient() {
  const { MONGODB_URI } = getServerEnv();

  if (!globalForMongo.__byshreenMongoClientPromise) {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    globalForMongo.__byshreenMongoClientPromise = client.connect().then(() => client).catch((error) => {
      // Forget the failed attempt so the next request reconnects instead of replaying this error forever.
      delete globalForMongo.__byshreenMongoClientPromise;
      client.close().catch(() => {});
      throw error;
    });
  }

  return globalForMongo.__byshreenMongoClientPromise;
}

/** True for errors that mean the database could not be reached (as opposed to a bad query). */
export function isDatabaseUnavailableError(error) {
  return /^Mongo(ServerSelection|Network|NetworkTimeout|Topology)/.test(String(error?.name || '')) || /ECONNREFUSED|ENOTFOUND|ETIMEDOUT/.test(String(error?.message || ''));
}

export async function getDb() {
  const { MONGODB_DB } = getServerEnv();
  const client = await getMongoClient();
  const tenantId = await getRequestTenantId();
  return tenantId ? client.db(`${MONGODB_DB}_tenant_${tenantId}`) : client.db(MONGODB_DB);
}

/** The shared database stores accounts and the public site-slug directory. */
export async function getAuthDb() {
  const { MONGODB_DB } = getServerEnv();
  const client = await getMongoClient();
  return client.db(MONGODB_DB);
}

async function getRequestTenantId() {
  try {
    const pathname = (await headers()).get('x-pathname') || '';
    const storeMatch = pathname.match(/^\/store\/([a-z0-9-]{1,80})(?:\/|$)/i);
    if (storeMatch) {
      return getTenantIdBySiteSlug(storeMatch[1]);
    }

    const cookieStore = await cookies();
    const sessionValue = cookieStore.get('shopify_clone_session')?.value;
    const secret = process.env.ADMIN_SESSION_SECRET || '';
    if (sessionValue && secret.length >= 32) {
      const [payload, signature] = sessionValue.split('.');
      const expectedSignature = createHmac('sha256', secret).update(payload || '').digest('base64url');
      const provided = Buffer.from(signature || '');
      const expected = Buffer.from(expectedSignature);
      if (provided.length === expected.length && timingSafeEqual(provided, expected)) {
        const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (/^[a-f0-9]{24}$/i.test(session.uid || '') && session.exp > Date.now()) return session.uid;
      }
    }

    return null;
  } catch {
    // Scripts and build-time work have no request cookies or headers and use the shared database.
    return null;
  }
}

export async function getTenantIdBySiteSlug(siteSlugInput) {
  const siteSlug = String(siteSlugInput || '').toLowerCase();
  if (!/^[a-z0-9-]{1,80}$/.test(siteSlug)) return null;
  const cache = globalThis.__shopifyCloneSiteOwnerCache || (globalThis.__shopifyCloneSiteOwnerCache = new Map());
  if (cache.has(siteSlug)) return cache.get(siteSlug);
  const db = await getAuthDb();
  const account = await db.collection('adminUsers').findOne({ siteSlug }, { projection: { _id: 1 } });
  const tenantId = account?._id?.toString() || null;
  cache.set(siteSlug, tenantId);
  return tenantId;
}

export async function closeMongoClient() {
  const promise = globalForMongo.__byshreenMongoClientPromise;
  if (!promise) return;
  const client = await promise;
  await client.close();
  delete globalForMongo.__byshreenMongoClientPromise;
}
