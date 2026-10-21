const DATABASE_NAME = 'byshreen-admin-editor-recovery';
const DATABASE_VERSION = 1;
const STORE_NAME = 'sessions';
export const EDITOR_RECOVERY_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_RECOVERY_BYTES = 8 * 1024 * 1024;

function openRecoveryDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB is unavailable'));
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open recovery storage'));
    request.onblocked = () => reject(new Error('Recovery storage is blocked'));
  });
}

function runRequest(mode, operation) {
  return openRecoveryDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = operation(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Recovery storage request failed'));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => { database.close(); reject(transaction.error || new Error('Recovery storage transaction failed')); };
    transaction.onabort = () => { database.close(); reject(transaction.error || new Error('Recovery storage transaction was aborted')); };
  }));
}

export function editorRecoveryKey(adminIdentity, editorTarget) {
  if (!adminIdentity || !editorTarget) return null;
  return `${encodeURIComponent(String(adminIdentity))}::${encodeURIComponent(String(editorTarget))}`;
}

export function validateRecoveryRecord(record, expectedKey, now = Date.now()) {
  if (!record || record.schemaVersion !== 1 || record.key !== expectedKey) return false;
  if (!Number.isFinite(record.createdAt) || !Number.isFinite(record.updatedAt)
    || record.createdAt > now + 5 * 60 * 1000 || record.updatedAt > now + 5 * 60 * 1000
    || now - record.createdAt > EDITOR_RECOVERY_TTL_MS || now - record.updatedAt > EDITOR_RECOVERY_TTL_MS) return false;
  if (!record.snapshot || typeof record.snapshot !== 'object' || !record.snapshot.page || !Array.isArray(record.snapshot.page.sections)) return false;
  if (record.snapshot.pending && ['page', 'global', 'navigation', 'theme'].some((key) => typeof record.snapshot.pending[key] !== 'boolean')) return false;
  if (record.snapshot.baseline && !Number.isFinite(Number(record.snapshot.baseline.pageVersion))) return false;
  try {
    return new Blob([JSON.stringify(record)]).size <= MAX_RECOVERY_BYTES;
  } catch {
    return false;
  }
}

export async function readEditorRecovery(key) {
  if (!key) return null;
  const record = await runRequest('readonly', (store) => store.get(key));
  if (!validateRecoveryRecord(record, key)) {
    if (record) await removeEditorRecovery(key);
    return null;
  }
  return record;
}

export async function writeEditorRecovery(key, snapshot) {
  if (!key || !snapshot || !Array.isArray(snapshot.page?.sections)) return false;
  const serializedSnapshot = JSON.stringify(snapshot);
  if (new Blob([serializedSnapshot]).size > MAX_RECOVERY_BYTES) return false;
  const previous = await readEditorRecovery(key).catch(() => null);
  const now = Date.now();
  const record = {
    schemaVersion: 1,
    key,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
    snapshot,
  };
  if (!validateRecoveryRecord(record, key, now)) return false;
  await runRequest('readwrite', (store) => store.put(record));
  return true;
}

export async function removeEditorRecovery(key) {
  if (!key) return;
  await runRequest('readwrite', (store) => store.delete(key));
}

export function recoveryHasStaleBaseline(record, currentBaseline) {
  const baseline = record?.snapshot?.baseline;
  if (!baseline || !currentBaseline) return false;
  const pending = record.snapshot.pending || { page: true, global: true, navigation: true, theme: true };
  return (pending.page && baseline.pageVersion !== currentBaseline.pageVersion)
    || (pending.global && baseline.globalVersion !== currentBaseline.globalVersion)
    || (pending.navigation && baseline.navigationVersion !== currentBaseline.navigationVersion)
    || (pending.theme && baseline.themeSignature !== currentBaseline.themeSignature);
}
