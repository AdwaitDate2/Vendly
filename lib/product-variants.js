// Product option model shared by the storefront, cart, checkout, and admin. Plain data only.

export const DEFAULT_RING_SIZES = ['3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'];
export const EIGHTEEN_KT_MARKUP = 1.15;

function colorOf(metal) {
  const lower = String(metal || '').toLowerCase();
  if (lower.includes('yellow')) return 'Yellow ';
  if (lower.includes('white')) return 'White ';
  if (lower.includes('rose')) return 'Rose ';
  return '';
}

export function variantId(title) {
  return String(title || 'option').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'option';
}

/** The metal options a product had before variants existed: 14kt at its price, 18kt at +15%. */
export function legacyMetalVariants(product) {
  const base = Math.round(Number(product.priceCents ?? Math.round(Number(product.price || 0) * 100)));
  const color = colorOf(product.metal);
  const stock = (product.variants || [])[0] || {};
  const skuBase = String(stock.sku || product.slug || '').replace(/-DEFAULT$/i, '').toUpperCase();
  return [
    { id: '14kt', title: `14kt ${color}Gold`, priceCents: base, sku: skuBase ? `${skuBase}-14K` : '', barcode: '', quantity: Number(stock.quantity || 0), lowStockThreshold: Number(stock.lowStockThreshold ?? 1), active: true },
    { id: '18kt', title: `18kt ${color}Gold`, priceCents: Math.round((base * EIGHTEEN_KT_MARKUP) / 100) * 100, sku: skuBase ? `${skuBase}-18K` : '', barcode: '', quantity: 0, lowStockThreshold: 1, active: true },
  ];
}

/** True when a product still has the single placeholder variant from before metal options existed. */
export function hasLegacyVariants(product) {
  const variants = product.variants || [];
  return !variants.length || (variants.length === 1 && variants[0].id === 'default');
}

/** Normalises any product (database, static fallback, or old record) to the option model. */
export function withOptions(product) {
  if (!product) return product;
  const variants = (hasLegacyVariants(product) ? legacyMetalVariants(product) : product.variants).map((variant) => ({
    ...variant,
    id: String(variant.id),
    title: variant.title || variant.id,
    priceCents: Number(variant.priceCents || 0),
    price: Number(variant.priceCents || 0) / 100,
    active: variant.active !== false,
  }));
  const active = variants.filter((variant) => variant.active);
  const cheapest = active.length ? Math.min(...active.map((variant) => variant.priceCents)) : Number(product.priceCents || 0);
  const sizeOption = product.sizeOption || { enabled: product.category === 'rings', label: 'Ring size', values: DEFAULT_RING_SIZES };
  return {
    ...product,
    variants,
    priceCents: cheapest,
    price: cheapest / 100,
    sizeOption: { enabled: Boolean(sizeOption.enabled), label: sizeOption.label || 'Ring size', values: sizeOption.values?.length ? sizeOption.values : DEFAULT_RING_SIZES },
    madeToOrder: product.madeToOrder !== false,
    tags: Array.isArray(product.tags) ? product.tags : [],
  };
}

/** Whether a variant can be bought right now. */
export function isPurchasable(product, variant) {
  if (product.saleMode === 'enquire') return false;
  if (!variant || !variant.active) return false;
  return product.madeToOrder !== false || Number(variant.quantity || 0) > 0;
}
