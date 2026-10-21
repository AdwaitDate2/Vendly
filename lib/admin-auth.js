import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authenticateAdminUser, getActiveAdminUser, registerAdminUser } from './admin-users';

const SESSION_COOKIE = 'shopify_clone_session';
const SESSION_HOURS = 12;

function safeEqual(left, right) {
  const a = Buffer.from(left || '');
  const b = Buffer.from(right || '');
  return a.length === b.length && timingSafeEqual(a, b);
}

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || '';
  return secret.length >= 32 ? secret : '';
}

function sign(payload) {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

function cookieOptions(maxAge) {
  return { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge };
}

export function isAccountLoginConfigured() {
  return Boolean(sessionSecret() && process.env.MONGODB_URI);
}

export function isDeveloperTokenConfigured() {
  return false;
}

async function readAccountSession(cookieStore) {
  const value = cookieStore.get(SESSION_COOKIE)?.value;
  if (!value || !isAccountLoginConfigured()) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !safeEqual(signature, sign(payload))) return null;

  let data;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!data?.uid || !data.exp || data.exp < Date.now()) return null;

  const user = await getActiveAdminUser(data.uid);
  if (!user || user.sessionVersion !== data.sv) return null;
  return { id: user.id, role: user.role, name: user.name, email: user.email, siteSlug: user.siteSlug, kind: 'account' };
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return readAccountSession(cookieStore);
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  return session;
}

// Editors can do everything except manage the team and store settings, issue refunds, and
// permanently delete records (they can still archive).
const OWNER_ONLY = new Set(['team:manage', 'settings:manage', 'orders:refund', 'records:delete', 'code:edit']);

export function hasPermission(session, permission) {
  if (!session) return false;
  if (permission === 'team:manage') return false;
  if (session.role === 'owner') return true;
  return session.role === 'editor' && !OWNER_ONLY.has(permission);
}

export async function requireAdminPermission(permission) {
  const session = await requireAdminSession();
  if (!hasPermission(session, permission)) {
    const error = new Error(`Missing permission: ${permission}`);
    error.code = 'FORBIDDEN';
    throw error;
  }
  return session;
}

/** @returns {Promise<'ok' | 'invalid' | 'locked' | 'unconfigured'>} */
export async function signInWithPassword(email, password) {
  if (!isAccountLoginConfigured()) return 'unconfigured';
  const result = await authenticateAdminUser(email, password);
  if (!result.ok) return result.reason;

  const payload = Buffer.from(JSON.stringify({ uid: result.user.id, sv: result.user.sessionVersion, exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000 })).toString('base64url');
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, `${payload}.${sign(payload)}`, cookieOptions(SESSION_HOURS * 60 * 60));
  return 'ok';
}

export async function signInWithDeveloperToken(token) {
  return false;
}

export async function registerAndSignIn(input) {
  if (!isAccountLoginConfigured()) return { ok: false, reason: 'unconfigured' };
  const user = await registerAdminUser(input);
  await setAccountSession(user);
  return { ok: true, user };
}

async function setAccountSession(user) {
  const payload = Buffer.from(JSON.stringify({ uid: user.id, sv: user.sessionVersion, exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000 })).toString('base64url');
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, `${payload}.${sign(payload)}`, cookieOptions(SESSION_HOURS * 60 * 60));
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
