'use server';

import { revalidatePath } from 'next/cache';
import { logActivity } from './activity';
import { requireAdminPermission } from './admin-auth';
import { deleteCollection, deleteProducts, deleteRecord, restoreDeletedRecord } from './deletions';

const ACTIVITY = { product: 'product', collection: 'collection', inquiry: 'inquiry', subscriber: 'inquiry', customer: 'order' };
const LIST_PATHS = { product: '/admin/products', collection: '/admin/collections', inquiry: '/admin/inquiries', subscriber: '/admin/subscribers', customer: '/admin/customers' };

function refresh(kind) {
  revalidatePath(LIST_PATHS[kind]);
  revalidatePath('/admin');
  revalidatePath('/admin/deleted');
  // Products and collections appear across the storefront.
  if (kind === 'product' || kind === 'collection') revalidatePath('/', 'layout');
}

/** Permanently deletes products (one or many). Owner only. */
export async function deleteProductsAction(ids) {
  const session = await requireAdminPermission('records:delete');
  try {
    const names = await deleteProducts(ids, session.email);
    if (!names.length) return { ok: false, message: 'Those products were already deleted.' };
    await logActivity({ actor: session.email, type: 'product', action: `Deleted ${names.length} product${names.length === 1 ? '' : 's'}`, label: names.slice(0, 3).join(', ') + (names.length > 3 ? '…' : ''), href: '/admin/deleted' });
    refresh('product');
    return { ok: true, message: `Deleted ${names.length === 1 ? `“${names[0]}”` : `${names.length} products`}. You can restore ${names.length === 1 ? 'it' : 'them'} from Recently deleted for 90 days.`, count: names.length };
  } catch (error) {
    return { ok: false, message: error.message || 'Could not delete.' };
  }
}

export async function deleteCollectionAction(id) {
  const session = await requireAdminPermission('records:delete');
  try {
    const name = await deleteCollection(id, session.email);
    await logActivity({ actor: session.email, type: 'collection', action: 'Deleted collection', label: name, href: '/admin/deleted' });
    refresh('collection');
    return { ok: true, message: `Deleted “${name}”.` };
  } catch (error) {
    return { ok: false, message: error.message || 'Could not delete.', inUse: error.code === 'IN_USE' ? { slug: error.slug, products: error.products } : null };
  }
}

/** Deletes a request, subscriber, or customer profile. */
export async function deleteRecordAction(kind, id) {
  const session = await requireAdminPermission('records:delete');
  try {
    const label = await deleteRecord(kind, id, session.email);
    await logActivity({ actor: session.email, type: ACTIVITY[kind] || 'settings', action: `Deleted ${kind === 'inquiry' ? 'request' : kind}`, label, href: '/admin/deleted' });
    refresh(kind);
    return { ok: true, message: `Deleted ${label}.` };
  } catch (error) {
    return { ok: false, message: error.message || 'Could not delete.' };
  }
}

export async function restoreDeletedAction(id) {
  const session = await requireAdminPermission('records:delete');
  try {
    const restored = await restoreDeletedRecord(id, session.email);
    await logActivity({ actor: session.email, type: ACTIVITY[restored.kind] || 'settings', action: 'Restored a deleted item', label: restored.label, href: restored.href });
    refresh(restored.kind);
    return { ok: true, message: `Restored ${restored.label}.`, href: restored.href };
  } catch (error) {
    return { ok: false, message: error.message || 'Could not restore.' };
  }
}
