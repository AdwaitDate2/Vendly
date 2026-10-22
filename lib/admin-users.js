import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getAuthDb } from './mongodb';

const scrypt = promisify(scryptCallback);
const USER_COLLECTION = 'adminUsers';
const PROJECT_COLLECTION = 'websiteProjects';
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const KEY_LENGTH = 64;

export const adminUserInputSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(240),
  name: z.string().trim().min(1, 'Add a name.').max(120),
  password: z.string().min(10, 'Passwords must be at least 10 characters.').max(200),
  role: z.enum(['owner', 'editor']).default('owner'),
});

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, saltHex, keyHex] = String(stored || '').split('$');
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const derived = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(expected, derived);
}

// Verified against when the email is unknown so response time doesn't reveal which accounts exist.
const DUMMY_HASH = 'scrypt$00000000000000000000000000000000$' + '0'.repeat(KEY_LENGTH * 2);

export function serializeAdminUser(user) {
  if (!user) return null;
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role || 'owner',
    siteSlug: user.siteSlug || '',
    sessionVersion: user.sessionVersion || 1,
    active: user.active !== false,
    lastLoginAt: user.lastLoginAt || null,
    createdAt: user.createdAt || null,
  };
}

export const ROLES = { owner: 'Owner — full access, including the team', editor: 'Editor — products, pages, requests; no team management' };

export function generatePassword() {
  return randomBytes(12).toString('base64url');
}

export async function listAdminUsers() {
  const db = await getAuthDb();
  const users = await db.collection(USER_COLLECTION).find({}).sort({ active: -1, createdAt: 1 }).toArray();
  return users.map(serializeAdminUser);
}

async function countActiveOwners(db) {
  return db.collection(USER_COLLECTION).countDocuments({ role: 'owner', active: true });
}

/** Creates a new admin with a generated password; returns the user and the one-time password. */
export async function inviteAdminUser({ email, name, role }) {
  const normalized = String(email || '').trim().toLowerCase();
  const db = await getAuthDb();
  if (await db.collection(USER_COLLECTION).findOne({ email: normalized })) throw new Error('Someone with that email already has an account.');
  const password = generatePassword();
  const user = await upsertAdminUser({ email: normalized, name, role, password });
  return { user, password };
}

/** New password for an account; signs it out everywhere but does not change whether it is active. */
export async function resetAdminPassword(id) {
  const user = await getAdminUserAny(id);
  if (!user) throw new Error('Account not found.');
  const password = generatePassword();
  const db = await getAuthDb();
  await db.collection(USER_COLLECTION).updateOne({ _id: new ObjectId(id) }, {
    $set: { passwordHash: await hashPassword(password), failedLogins: 0, lockedUntil: null, passwordUpdatedAt: new Date(), updatedAt: new Date() },
    $inc: { sessionVersion: 1 },
  });
  return { user, password };
}

export async function updateAdminUser(id, { role, active }, actorId) {
  if (!ObjectId.isValid(id)) throw new Error('Account not found.');
  const db = await getAuthDb();
  const user = await db.collection(USER_COLLECTION).findOne({ _id: new ObjectId(id) });
  if (!user) throw new Error('Account not found.');
  const nextRole = role ?? user.role ?? 'owner';
  const nextActive = active ?? user.active !== false;
  if (id === actorId && (!nextActive || nextRole !== 'owner')) throw new Error('You can’t deactivate or demote your own account.');
  if (user.role === 'owner' && user.active !== false && (!nextActive || nextRole !== 'owner') && (await countActiveOwners(db)) <= 1) {
    throw new Error('At least one active owner is required.');
  }
  await db.collection(USER_COLLECTION).updateOne({ _id: user._id }, {
    $set: { role: nextRole, active: nextActive, updatedAt: new Date() },
    ...(nextActive ? {} : { $inc: { sessionVersion: 1 } }),
  });
  return serializeAdminUser({ ...user, role: nextRole, active: nextActive });
}

async function getAdminUserAny(id) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getAuthDb();
  return serializeAdminUser(await db.collection(USER_COLLECTION).findOne({ _id: new ObjectId(id) }));
}

export async function upsertAdminUser(input) {
  const parsed = adminUserInputSchema.parse(input);
  const db = await getAuthDb();
  const now = new Date();
  const passwordHash = await hashPassword(parsed.password);
  await db.collection(USER_COLLECTION).updateOne(
    { email: parsed.email },
    {
      $set: { email: parsed.email, name: parsed.name, role: parsed.role, passwordHash, active: true, failedLogins: 0, lockedUntil: null, passwordUpdatedAt: now, updatedAt: now },
      // Bumping the session version signs out every existing session after a password reset.
      $inc: { sessionVersion: 1 },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
  return serializeAdminUser(await db.collection(USER_COLLECTION).findOne({ email: parsed.email }));
}

export async function authenticateAdminUser(email, password) {
  const normalized = String(email || '').trim().toLowerCase();
  const db = await getAuthDb();
  const collection = db.collection(USER_COLLECTION);
  const user = normalized ? await collection.findOne({ email: normalized, active: true }) : null;

  if (!user) {
    await verifyPassword(String(password || ''), DUMMY_HASH);
    return { ok: false, reason: 'invalid' };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false, reason: 'locked' };
  }

  if (!(await verifyPassword(String(password || ''), user.passwordHash))) {
    const failedLogins = (user.failedLogins || 0) + 1;
    const locked = failedLogins >= MAX_FAILED_LOGINS;
    await collection.updateOne(
      { _id: user._id },
      { $set: locked ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) } : { failedLogins } },
    );
    return { ok: false, reason: locked ? 'locked' : 'invalid' };
  }

  await collection.updateOne({ _id: user._id }, { $set: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  return { ok: true, user: serializeAdminUser(user) };
}

export async function getActiveAdminUser(id) {
  if (!ObjectId.isValid(id)) return null;
  const db = await getAuthDb();
  return serializeAdminUser(await db.collection(USER_COLLECTION).findOne({ _id: new ObjectId(id), active: true }));
}

export async function ensureAdminUserIndexes() {
  const db = await getAuthDb();
  await db.collection(USER_COLLECTION).createIndex({ email: 1 }, { unique: true, name: 'admin_users_email_unique' });
  await db.collection(USER_COLLECTION).createIndex({ siteSlug: 1 }, { unique: true, name: 'admin_users_site_slug_unique', sparse: true });
  await db.collection(PROJECT_COLLECTION).createIndex({ ownerId: 1, createdAt: 1 }, { name: 'website_projects_owner_created' });
  await db.collection(PROJECT_COLLECTION).createIndex({ siteSlug: 1 }, { unique: true, name: 'website_projects_site_slug_unique' });
}

function createSiteSlug(name) {
  const baseName = String(name || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 42) || 'my-store';
  return `${baseName}-${randomBytes(3).toString('hex')}`;
}

function serializeAdminProject(project) {
  if (!project) return null;
  return {
    id: project._id.toString(),
    ownerId: project.ownerId?.toString() || '',
    name: project.name,
    siteSlug: project.siteSlug,
    createdAt: project.createdAt || null,
    updatedAt: project.updatedAt || project.createdAt || null,
  };
}

/** Preserves an existing account's tenant as its first project without moving any site data. */
export async function ensureInitialAdminProject(ownerIdInput, { blankCanvas = false } = {}) {
  if (!ObjectId.isValid(ownerIdInput)) return null;
  const ownerId = new ObjectId(ownerIdInput);
  const db = await getAuthDb();
  const user = await db.collection(USER_COLLECTION).findOne({ _id: ownerId, role: 'owner', active: { $ne: false } });
  if (!user?.siteSlug) return null;

  await ensureAdminUserIndexes();
  const projects = db.collection(PROJECT_COLLECTION);
  const now = new Date();
  await projects.updateOne(
    { _id: ownerId },
    {
      $setOnInsert: {
        ownerId,
        name: 'My first website',
        siteSlug: user.siteSlug,
        createdAt: user.createdAt || now,
        updatedAt: now,
        legacyAccountTenant: true,
        ...(blankCanvas ? { blankCanvas: true } : {}),
      },
    },
    { upsert: true },
  );
  return serializeAdminProject(await projects.findOne({ _id: ownerId, ownerId }));
}

export async function listAdminProjects(ownerIdInput) {
  const initialProject = await ensureInitialAdminProject(ownerIdInput);
  if (!initialProject) return [];
  const db = await getAuthDb();
  const projects = await db.collection(PROJECT_COLLECTION)
    .find({ ownerId: new ObjectId(ownerIdInput) })
    .sort({ createdAt: 1, _id: 1 })
    .toArray();
  return projects.map(serializeAdminProject);
}

export async function getAdminProjectForOwner(ownerIdInput, projectIdInput) {
  if (!ObjectId.isValid(ownerIdInput) || !ObjectId.isValid(projectIdInput)) return null;
  const db = await getAuthDb();
  return serializeAdminProject(await db.collection(PROJECT_COLLECTION).findOne({
    _id: new ObjectId(projectIdInput),
    ownerId: new ObjectId(ownerIdInput),
  }));
}

export async function createAdminProject(ownerIdInput, nameInput) {
  if (!ObjectId.isValid(ownerIdInput)) throw new Error('Your account could not be verified. Sign in again.');
  const name = String(nameInput || '').trim();
  if (!name || name.length > 80) throw new Error('Project names must be between 1 and 80 characters.');

  const db = await getAuthDb();
  const ownerId = new ObjectId(ownerIdInput);
  const user = await db.collection(USER_COLLECTION).findOne({ _id: ownerId, role: 'owner', active: { $ne: false } });
  if (!user) throw new Error('Only an account owner can create a website project.');

  await ensureAdminUserIndexes();
  const now = new Date();
  const project = {
    _id: new ObjectId(),
    ownerId,
    name,
    siteSlug: createSiteSlug(name),
    blankCanvas: true,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection(PROJECT_COLLECTION).insertOne(project);
  globalThis.__shopifyCloneSiteOwnerCache?.delete(project.siteSlug);
  return serializeAdminProject(project);
}

/** Creates a public owner account for the standalone site editor. */
export async function registerAdminUser(input) {
  const parsed = adminUserInputSchema.parse({ ...input, role: 'owner' });
  const db = await getAuthDb();
  const collection = db.collection(USER_COLLECTION);
  await ensureAdminUserIndexes();
  const now = new Date();
  const user = {
    email: parsed.email,
    name: parsed.name,
    role: 'owner',
    siteSlug: createSiteSlug(parsed.name),
    passwordHash: await hashPassword(parsed.password),
    active: true,
    failedLogins: 0,
    lockedUntil: null,
    sessionVersion: 1,
    createdAt: now,
    updatedAt: now,
    passwordUpdatedAt: now,
  };

  try {
    const result = await collection.insertOne(user);
    globalThis.__shopifyCloneSiteOwnerCache?.delete(user.siteSlug);
    await ensureInitialAdminProject(result.insertedId.toString(), { blankCanvas: true });
    return serializeAdminUser({ ...user, _id: result.insertedId });
  } catch (error) {
    if (error?.code === 11000) throw new Error('An account with that email already exists.');
    throw error;
  }
}
