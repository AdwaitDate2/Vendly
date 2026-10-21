import { z } from 'zod';
import { evaluateDiscountCode } from './discounts';
import { isPurchasable } from './product-variants';
import { getPurchasableProduct } from './public-catalog';
import { getStoreSettings } from './settings';

const MAX_LINES = 20;

export const cartLineSchema = z.object({
  slug: z.string().trim().min(1).max(180),
  variantId: z.string().trim().max(80).default(''),
  size: z.string().trim().max(12).default(''),
  qty: z.coerce.number().int().min(1).max(10),
});

export const addressSchema = z.object({
  name: z.string().trim().min(2, 'Enter the full name for delivery.').max(120),
  line1: z.string().trim().min(3, 'Enter a street address.').max(160),
  line2: z.string().trim().max(160).default(''),
  city: z.string().trim().min(2, 'Enter a city.').max(80),
  region: z.string().trim().toUpperCase().max(40).default(''),
  postalCode: z.string().trim().min(3, 'Enter a ZIP or postal code.').max(20),
  country: z.string().trim().toUpperCase().length(2).default('US'),
});

export const checkoutInputSchema = z.object({
  lines: z.array(cartLineSchema).min(1, 'Your bag is empty.').max(MAX_LINES),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
  phone: z.string().trim().max(40).default(''),
  address: addressSchema,
  shippingRateId: z.string().trim().max(40).default(''),
  discountCode: z.string().trim().max(40).default(''),
  note: z.string().trim().max(1000).default(''),
  marketingOptIn: z.boolean().default(false),
}).superRefine((value, context) => {
  if (value.address.country === 'US' && !/^[A-Z]{2}$/.test(value.address.region)) context.addIssue({ code: 'custom', path: ['address', 'region'], message: 'Choose a state.' });
});

function shippingRatesFor(settings, country, subtotalCents) {
  return settings.shipping.rates
    .filter((rate) => rate.active && (!rate.countries.length || rate.countries.includes(country)))
    .map((rate) => ({ ...rate, amountCents: rate.freeOverCents && subtotalCents >= rate.freeOverCents ? 0 : rate.priceCents }));
}

function taxRateFor(settings, country, region) {
  if (!settings.tax.enabled) return null;
  const rates = settings.tax.rates.filter((rate) => rate.country === country);
  return rates.find((rate) => rate.region && rate.region === region) || rates.find((rate) => !rate.region) || null;
}

/**
 * Prices a bag from the catalog. Prices sent by the browser are never used.
 * `problems` lists lines that cannot be bought as-is; checkout must not continue while it has entries.
 */
export async function priceCart({ lines, address = {}, shippingRateId = '', discountCode = '' }) {
  const settings = await getStoreSettings();
  const items = [];
  const problems = [];

  for (const line of lines.slice(0, MAX_LINES)) {
    const product = await getPurchasableProduct(line.slug);
    if (!product) {
      problems.push({ slug: line.slug, message: 'One piece in your bag is no longer available.' });
      continue;
    }
    const name = product.shortTitle || product.title;
    const variant = product.variants.find((item) => item.id === line.variantId) || (!line.variantId ? product.variants.find((item) => item.active) : null);
    if (!isPurchasable(product, variant)) {
      problems.push({ slug: line.slug, message: `${name}${variant ? ` in ${variant.title}` : ''} is no longer available.` });
      continue;
    }
    if (product.madeToOrder === false && line.qty > Number(variant.quantity || 0)) {
      problems.push({ slug: line.slug, message: `Only ${variant.quantity} of ${name} in ${variant.title} left.` });
      continue;
    }
    const size = product.sizeOption.enabled ? line.size : '';
    if (product.sizeOption.enabled && !product.sizeOption.values.includes(size)) {
      problems.push({ slug: line.slug, message: `Choose a ${product.sizeOption.label.toLowerCase()} for ${name}.` });
      continue;
    }
    items.push({
      productId: product.id || product.slug,
      slug: product.slug,
      title: name,
      variantId: variant.id,
      variantTitle: variant.title,
      sku: variant.sku || '',
      size,
      image: product.images?.[0] || product.image || '',
      madeToOrder: product.madeToOrder !== false,
      unitCents: variant.priceCents,
      qty: line.qty,
      lineCents: variant.priceCents * line.qty,
    });
  }

  const subtotalCents = items.reduce((sum, item) => sum + item.lineCents, 0);

  let discount = null;
  let discountCents = 0;
  let discountError = '';
  if (discountCode) {
    const result = await evaluateDiscountCode(discountCode, subtotalCents);
    if (result.error) discountError = result.error;
    else {
      discount = { id: result.discount.id, code: result.discount.code, type: result.discount.type, value: result.discount.value };
      discountCents = result.amountCents;
    }
  }

  const country = address.country || 'US';
  const shippingRates = shippingRatesFor(settings, country, subtotalCents - discountCents);
  const shippingRate = shippingRates.find((rate) => rate.id === shippingRateId) || shippingRates[0] || null;
  const shippingCents = shippingRate?.amountCents || 0;

  const taxRate = taxRateFor(settings, country, address.region || '');
  const taxableCents = subtotalCents - discountCents + (settings.tax.shippingTaxable ? shippingCents : 0);
  const taxCents = taxRate ? Math.round((taxableCents * taxRate.ratePercent) / 100) : 0;

  return {
    currency: 'usd',
    items,
    problems,
    subtotalCents,
    discount,
    discountCents,
    discountError,
    shippingRates: shippingRates.map(({ id, name, description, amountCents }) => ({ id, name, description, amountCents })),
    shipping: shippingRate ? { id: shippingRate.id, name: shippingRate.name, amountCents: shippingCents } : null,
    shippingCents,
    tax: taxRate ? { name: taxRate.name, ratePercent: taxRate.ratePercent } : null,
    taxCents,
    totalCents: subtotalCents - discountCents + shippingCents + taxCents,
  };
}
