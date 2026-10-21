'use server';

import { revalidatePath } from 'next/cache';
import { logActivity } from './activity';
import { requireAdminPermission } from './admin-auth';
import { deleteDiscount, saveDiscount } from './discounts';
import { trackCancelledOrder, trackFulfilledOrder, trackRefundedOrder } from './klaviyo-events';
import { money, sendCancelledEmail, sendDeliveredEmail, sendInProductionEmail, sendRefundEmail, sendShippedEmail } from './order-emails';
import { addOrderNote, cancelOrder, getOrder, markShipped, recordRefund, saveCustomerNotes, setFulfillmentStatus } from './orders';
import { cancelPayment, refundPayment } from './payments';
import { getDb } from './mongodb';
import { composeShipping, composeCare } from './product-info';
import { DEFAULT_PRODUCT_INFO, saveStoreSettings, getStoreSettings } from './settings';

function errorMessage(error) {
  return error.issues ? error.issues[0].message : error.message;
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(String(value || ''));
  } catch {
    return fallback;
  }
}

function revalidateOrder(id) {
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
}

export async function updateFulfillmentAction(_previousState, formData) {
  const session = await requireAdminPermission('orders:manage');
  const id = String(formData.get('id') || '');
  try {
    const status = String(formData.get('status') || '');
    const before = await getOrder(id);
    const order = await setFulfillmentStatus(id, status, session.email);
    // Only a real change to "In production" or "Delivered" has a customer email.
    const email = before?.fulfillmentStatus !== status && formData.get('notify') === 'yes' ? { in_production: sendInProductionEmail, delivered: sendDeliveredEmail }[status] : null;
    if (email) await email(order);
    await logActivity({ actor: session.email, type: 'order', action: `Order ${order.name}: ${order.timeline[0].message.toLowerCase()}`, href: `/admin/orders/${id}` });
    revalidateOrder(id);
    return { ok: true, message: email ? 'Order updated and the customer emailed.' : 'Order updated.' };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function markShippedAction(_previousState, formData) {
  const session = await requireAdminPermission('orders:manage');
  const id = String(formData.get('id') || '');
  try {
    const order = await markShipped(id, { carrier: String(formData.get('carrier') || ''), number: String(formData.get('number') || ''), url: String(formData.get('url') || '') }, session.email);
    if (formData.get('notify') === 'yes') await sendShippedEmail(order);
    await trackFulfilledOrder(order);
    await logActivity({ actor: session.email, type: 'order', action: `Order ${order.name} marked shipped`, href: `/admin/orders/${id}` });
    revalidateOrder(id);
    return { ok: true, message: formData.get('notify') === 'yes' ? 'Marked shipped and emailed the customer.' : 'Marked shipped.' };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function addOrderNoteAction(_previousState, formData) {
  const session = await requireAdminPermission('orders:manage');
  const id = String(formData.get('id') || '');
  try {
    await addOrderNote(id, String(formData.get('body') || ''), session.email);
    revalidatePath(`/admin/orders/${id}`);
    return { ok: true, message: 'Note added.', reset: Date.now() };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function refundOrderAction(_previousState, formData) {
  const session = await requireAdminPermission('orders:refund');
  const id = String(formData.get('id') || '');
  try {
    const order = await getOrder(id);
    if (!order) return { ok: false, message: 'Order not found.' };
    if (!['paid', 'partially_refunded'].includes(order.paymentStatus)) return { ok: false, message: 'Only paid orders can be refunded.' };
    const refundable = order.totalCents - order.refundedCents;
    const amountCents = Math.round(Number(formData.get('amount')) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) return { ok: false, message: 'Enter an amount to refund.' };
    if (amountCents > refundable) return { ok: false, message: `You can refund up to ${money(refundable)}.` };
    const reason = String(formData.get('reason') || '').trim().slice(0, 300);
    const { refundId } = await refundPayment({ paymentId: order.payment?.id, amountCents, reason });
    const updated = await recordRefund(id, { amountCents, reason, refundId }, session.email);
    if (formData.get('notify') === 'yes') await sendRefundEmail(updated, amountCents);
    await trackRefundedOrder(updated, amountCents, reason);
    await logActivity({ actor: session.email, type: 'order', action: `Refunded ${money(amountCents)} on order ${order.name}`, details: reason, href: `/admin/orders/${id}` });
    revalidateOrder(id);
    return { ok: true, message: `Refunded ${money(amountCents)}.` };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function cancelOrderAction(_previousState, formData) {
  const session = await requireAdminPermission('orders:manage');
  const id = String(formData.get('id') || '');
  try {
    const current = await getOrder(id);
    if (!current) return { ok: false, message: 'Order not found.' };
    if (current.paymentStatus === 'paid' || current.paymentStatus === 'partially_refunded') {
      return { ok: false, message: 'Refund the payment first, then cancel the order.' };
    }
    if (current.paymentStatus === 'pending' && current.payment?.id) await cancelPayment(current.payment.id).catch(() => {});
    const order = await cancelOrder(id, { reason: String(formData.get('reason') || '').trim().slice(0, 300), restock: formData.get('restock') === 'yes' }, session.email);
    const notify = formData.get('notify') === 'yes';
    if (notify) await sendCancelledEmail(order);
    await trackCancelledOrder(order, order.cancelReason || '');
    await logActivity({ actor: session.email, type: 'order', action: `Cancelled order ${order.name}`, href: `/admin/orders/${id}` });
    revalidateOrder(id);
    return { ok: true, message: notify ? 'Order cancelled and the customer emailed.' : 'Order cancelled.' };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function saveCustomerNotesAction(_previousState, formData) {
  const session = await requireAdminPermission('customers:manage');
  const id = String(formData.get('id') || '');
  try {
    await saveCustomerNotes(id, { notes: String(formData.get('notes') || ''), tags: String(formData.get('tags') || '').split(',').map((tag) => tag.trim()).filter(Boolean) }, session.email);
    revalidatePath(`/admin/customers/${id}`);
    return { ok: true, message: 'Customer saved.' };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function saveDiscountAction(_previousState, formData) {
  const session = await requireAdminPermission('discounts:manage');
  try {
    const discount = await saveDiscount({
      id: String(formData.get('id') || '') || undefined,
      code: String(formData.get('code') || ''),
      type: String(formData.get('type') || 'percent'),
      value: String(formData.get('value') || ''),
      minSubtotal: String(formData.get('minSubtotal') || '0') || '0',
      usageLimit: String(formData.get('usageLimit') || '0') || '0',
      startsAt: String(formData.get('startsAt') || ''),
      endsAt: String(formData.get('endsAt') || ''),
      active: formData.get('active') === 'yes',
    }, session.email);
    await logActivity({ actor: session.email, type: 'order', action: `Saved discount ${discount.code}`, href: '/admin/discounts' });
    revalidatePath('/admin/discounts');
    return { ok: true, message: `${discount.code} saved.`, savedId: discount.id };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function deleteDiscountAction(_previousState, formData) {
  const session = await requireAdminPermission('discounts:manage');
  try {
    const discount = await deleteDiscount(String(formData.get('id') || ''), session.email);
    if (discount) await logActivity({ actor: session.email, type: 'order', action: `Deleted discount ${discount.code}` });
    revalidatePath('/admin/discounts');
    return { ok: true, message: 'Discount deleted.' };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function saveShippingSettingsAction(_previousState, formData) {
  const session = await requireAdminPermission('settings:manage');
  try {
    const rates = parseJson(formData.get('rates'), []).map((rate, index) => ({
      id: rate.id || `rate-${Date.now().toString(36)}-${index}`,
      name: rate.name,
      description: rate.description || '',
      priceCents: Math.round(Number(rate.price || 0) * 100),
      freeOverCents: Math.round(Number(rate.freeOver || 0) * 100),
      countries: String(rate.countries || '').split(/[,\s]+/).map((code) => code.trim()).filter(Boolean),
      active: rate.active !== false,
    }));
    await saveStoreSettings({ shipping: { rates } }, session.email);
    await logActivity({ actor: session.email, type: 'settings', action: 'Updated shipping rates' });
    revalidatePath('/admin/settings');
    revalidatePath('/checkout');
    return { ok: true, message: 'Shipping rates saved.' };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function saveTaxSettingsAction(_previousState, formData) {
  const session = await requireAdminPermission('settings:manage');
  try {
    const rates = parseJson(formData.get('rates'), []).map((rate) => ({ country: rate.country || 'US', region: rate.region || '', name: rate.name, ratePercent: rate.ratePercent }));
    await saveStoreSettings({ tax: { enabled: formData.get('enabled') === 'yes', shippingTaxable: formData.get('shippingTaxable') === 'yes', rates } }, session.email);
    await logActivity({ actor: session.email, type: 'settings', action: 'Updated tax rates' });
    revalidatePath('/admin/settings');
    return { ok: true, message: 'Tax settings saved.' };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function saveProductInfoAction(_previousState, formData) {
  const session = await requireAdminPermission('settings:manage');
  try {
    const text = (key) => String(formData.get(key) ?? '').replace(/\r\n/g, '\n');
    const productInfo = Object.fromEntries(Object.keys(DEFAULT_PRODUCT_INFO).map((key) => [key, text(key)]));
    await saveStoreSettings({ productInfo }, session.email);
    await logActivity({ actor: session.email, type: 'settings', action: 'Updated product page text' });
    revalidatePath('/admin/settings');
    revalidatePath('/shop', 'layout');
    return { ok: true, message: 'Product page text saved.' };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function resetProductShippingTextAction(_previousState) {
  const session = await requireAdminPermission('settings:manage');
  try {
    const { productInfo } = await getStoreSettings();
    const shippingText = composeShipping(productInfo);
    const db = await getDb();
    const result = await db.collection('products').updateMany({}, { $set: { shippingText } });
    await logActivity({ actor: session.email, type: 'settings', action: 'Reset shipping text on all products', label: `${result.modifiedCount} products updated` });
    revalidatePath('/shop', 'layout');
    return { ok: true, message: `Shipping & returns text reset on ${result.modifiedCount} products.` };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}

export async function resetProductCareTextAction(_previousState) {
  const session = await requireAdminPermission('settings:manage');
  try {
    const { productInfo } = await getStoreSettings();
    const careText = composeCare(productInfo);
    const db = await getDb();
    const result = await db.collection('products').updateMany({}, { $set: { careText } });
    await logActivity({ actor: session.email, type: 'settings', action: 'Reset care text on all products', label: `${result.modifiedCount} products updated` });
    revalidatePath('/shop', 'layout');
    return { ok: true, message: `Care instructions text reset on ${result.modifiedCount} products.` };
  } catch (error) {
    return { ok: false, message: errorMessage(error) };
  }
}
