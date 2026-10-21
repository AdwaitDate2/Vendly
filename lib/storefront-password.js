import { createHmac, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { cookies } from 'next/headers';
import { getDb } from './mongodb';
import { hashPassword, verifyPassword } from './admin-users';

const GATE_COLLECTION = 'storefrontGateSettings';
const ATTEMPTS_COLLECTION = 'storefrontGateAttempts';
const GATE_ID = 'store';
const ACCESS_COOKIE = 'byshreen_storefront_access';
const ACCESS_DURATION_SECONDS = 60 * 60 * 24 * 30;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 5;
const DUMMY_PASSWORD_HASH = `scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`;

let attemptIndexPromise;

function signingSecret() {
  return [process.env.ADMIN_SESSION_SECRET, process.env.ADMIN_PREVIEW_TOKEN]
    .find((secret) => typeof secret === 'string' && secret.length >= 32) || '';
}

export function isStorefrontAttemptRateLimitConfigured(requestHeaders) {
  const headerName = process.env.STOREFRONT_TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase() || '';
  if (!/^[a-z0-9-]+$/.test(headerName)) return false;
  const clientAddress = requestHeaders?.get(headerName)?.trim() || '';
  return Boolean(isIP(clientAddress));
}

function constantTimeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

async function ensureAttemptIndexes(db) {
  if (!attemptIndexPromise) {
    attemptIndexPromise = db.collection(ATTEMPTS_COLLECTION)
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'storefront_password_attempts_expiry' })
      .catch((error) => {
        attemptIndexPromise = null;
        throw error;
      });
  }
  return attemptIndexPromise;
}

async function loadGateRecord(db) {
  return db.collection(GATE_COLLECTION).findOne({ _id: GATE_ID });
}

/** Returns only browser-safe status. The stored hash and cookie version never leave this module. */
export async function getStorefrontPasswordState() {
  try {
    const db = await getDb();
    const record = await db.collection(GATE_COLLECTION).findOne(
      { _id: GATE_ID },
      { projection: { passwordHash: 1 } },
    );
    return { available: true, configured: Boolean(record?.passwordHash) };
  } catch {
    // If the gate state cannot be read, public requests fail closed as password-protected.
    return { available: false, configured: null };
  }
}

export function isStorefrontPasswordSigningConfigured() {
  return Boolean(signingSecret());
}

/** Stores only a scrypt hash. Every set or disable advances the version and revokes old cookies. */
export async function updateStorefrontPassword(password, actor = '') {
  if (!signingSecret()) throw new Error('Storefront password signing is not configured.');
  const db = await getDb();
  const now = new Date();
  const enabled = typeof password === 'string' && password.length > 0;
  const passwordHash = enabled ? await hashPassword(password) : undefined;
  const update = {
    $set: { updatedAt: now, updatedBy: String(actor || '') },
    $inc: { version: 1 },
  };
  if (enabled) update.$set.passwordHash = passwordHash;
  else update.$unset = { passwordHash: '' };
  await db.collection(GATE_COLLECTION).updateOne(
    { _id: GATE_ID },
    update,
    { upsert: true },
  );
  return { configured: enabled };
}

function hashClientAddress(address, secret) {
  const normalizedAddress = String(address || '').trim().slice(0, 256) || 'unknown';
  return createHmac('sha256', secret).update(`storefront-password-attempt:${normalizedAddress}`).digest('hex');
}

async function consumeAttempt(db, clientAddress, secret) {
  await ensureAttemptIndexes(db);
  const now = new Date();
  const expiredWindowStart = new Date(now.getTime() - ATTEMPT_WINDOW_MS);
  const attemptId = hashClientAddress(clientAddress, secret);
  const collection = db.collection(ATTEMPTS_COLLECTION);
  await collection.updateOne(
    { _id: attemptId },
    [
      { $set: { _windowExpired: { $or: [
        { $eq: [{ $ifNull: ['$windowStartedAt', null] }, null] },
        { $lte: ['$windowStartedAt', expiredWindowStart] },
      ] } } },
      { $set: {
        windowStartedAt: { $cond: ['$_windowExpired', now, '$windowStartedAt'] },
        attempts: { $cond: ['$_windowExpired', 1, { $add: [{ $ifNull: ['$attempts', 0] }, 1] }] },
      } },
      { $set: { expiresAt: { $add: ['$windowStartedAt', ATTEMPT_WINDOW_MS * 2] } } },
      { $unset: '_windowExpired' },
    ],
    { upsert: true },
  );
  const attempt = await collection.findOne({ _id: attemptId }, { projection: { attempts: 1 } });
  return Number(attempt?.attempts || 0) <= MAX_ATTEMPTS_PER_WINDOW;
}

async function setAccessCookie(version, secret) {
  const payload = Buffer.from(JSON.stringify({
    audience: 'storefront-password',
    version,
    expiresAt: Date.now() + ACCESS_DURATION_SECONDS * 1000,
  })).toString('base64url');
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, `${payload}.${sign(payload, secret)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ACCESS_DURATION_SECONDS,
  });
}

/** Checks the current hash with scrypt, rate limits by a keyed address digest, then issues a versioned cookie. */
export async function verifyStorefrontPasswordAndGrantAccess(password, clientAddress) {
  const submittedPassword = String(password || '');
  const candidateIsWithinLimit = submittedPassword.length <= 200;
  const candidate = candidateIsWithinLimit ? submittedPassword : submittedPassword.slice(0, 200);
  const secret = signingSecret();
  let db;
  let record;
  try {
    if (!secret) throw new Error('Signing secret is unavailable.');
    db = await getDb();
    record = await loadGateRecord(db);
    if (!(await consumeAttempt(db, clientAddress, secret))) {
      await verifyPassword(candidate, DUMMY_PASSWORD_HASH).catch(() => false);
      return false;
    }
  } catch {
    await verifyPassword(candidate, DUMMY_PASSWORD_HASH).catch(() => false);
    return false;
  }

  const storedHash = record?.passwordHash || DUMMY_PASSWORD_HASH;
  const validPassword = await verifyPassword(candidate, storedHash).catch(() => false);
  if (!candidateIsWithinLimit || !record?.passwordHash || !validPassword) return false;

  try {
    await setAccessCookie(Number(record.version || 0), secret);
    return true;
  } catch {
    return false;
  }
}

/** Validates a distinct storefront cookie against the live password version. */
export async function hasValidStorefrontAccessCookie() {
  const secret = signingSecret();
  if (!secret) return false;

  try {
    const db = await getDb();
    const record = await loadGateRecord(db);
    if (!record?.passwordHash) return false;

    const cookieStore = await cookies();
    const value = cookieStore.get(ACCESS_COOKIE)?.value || '';
    const [payload, signature, extra] = value.split('.');
    if (!payload || !signature || extra) return false;
    if (!constantTimeEqual(signature, sign(payload, secret))) return false;

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data?.audience === 'storefront-password'
      && Number.isSafeInteger(data.version)
      && data.version === Number(record.version || 0)
      && Number.isSafeInteger(data.expiresAt)
      && data.expiresAt > Date.now();
  } catch {
    return false;
  }
}
