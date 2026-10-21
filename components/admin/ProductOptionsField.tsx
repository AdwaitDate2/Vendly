// @ts-nocheck
'use client';

import { useState } from 'react';
import { moveItem } from './SortableList';
import { DEFAULT_RING_SIZES } from '@/lib/product-variants';

const newRow = (title = '', price = '') => ({ key: `${Date.now()}-${Math.random()}`, id: '', title, price, sku: '', barcode: '' });

export default function ProductOptionsField({ product, errors = {} }) {
  const [rows, setRows] = useState(() => (product?.variants?.length
    ? product.variants.map((variant) => ({ key: variant.id, id: variant.id, title: variant.title, price: variant.price, sku: variant.sku || '', barcode: variant.barcode || '', quantity: variant.quantity }))
    : [newRow('14kt Gold'), newRow('18kt Gold')]));
  const [sizesEnabled, setSizesEnabled] = useState(product?.sizeOption?.enabled ?? false);
  const [sizes, setSizes] = useState((product?.sizeOption?.values?.length ? product.sizeOption.values : DEFAULT_RING_SIZES).join(', '));

  const update = (index, field, value) => setRows((current) => current.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  const variants = rows.map(({ id, title, price, sku, barcode }) => ({ id, title: title.trim(), price: price === '' ? '' : Number(price), sku, barcode }));
  const sizeValues = sizes.split(/[,\n]+/).map((value) => value.trim()).filter(Boolean);

  return (
    <div className="admin-options">
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />
      <input type="hidden" name="sizeOption" value={JSON.stringify({ enabled: sizesEnabled, label: 'Ring size', values: sizeValues })} />

      <div className="admin-table-scroll">
        <table className="admin-table admin-options__table">
          <thead><tr><th>Metal option</th><th>Price (USD)</th><th>SKU</th><th>Barcode</th><th>In stock</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.key}>
                <td><input aria-label="Metal option name" value={row.title} placeholder="18kt Yellow Gold" onChange={(event) => update(index, 'title', event.target.value)} /></td>
                <td><input aria-label="Price" type="number" min="0" step="0.01" value={row.price} placeholder="0.00" onChange={(event) => update(index, 'price', event.target.value)} /></td>
                <td><input aria-label="SKU" value={row.sku} onChange={(event) => update(index, 'sku', event.target.value)} /></td>
                <td><input aria-label="Barcode" value={row.barcode} onChange={(event) => update(index, 'barcode', event.target.value)} /></td>
                <td className="admin-options__stock">{row.quantity ?? '—'}</td>
                <td className="admin-options__actions">
                  <button type="button" onClick={() => setRows((current) => moveItem(current, index, index - 1))} disabled={index === 0} aria-label="Move up">↑</button>
                  <button type="button" onClick={() => setRows((current) => current.filter((_, i) => i !== index))} disabled={rows.length === 1} aria-label="Remove option">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="admin-button admin-button--ghost" onClick={() => setRows((current) => [...current, newRow()])} disabled={rows.length >= 12}>+ Add metal option</button>
      <p className="admin-field-help">The first option is selected by default. Stock counts are managed on the Inventory page.</p>
      {errors.variants ? <span className="admin-field-error">{errors.variants[0]}</span> : null}

      <label className="admin-check">
        <input type="checkbox" checked={sizesEnabled} onChange={(event) => setSizesEnabled(event.target.checked)} />
        <span>Ask for a ring size</span>
      </label>
      {sizesEnabled ? (
        <label className="admin-field">
          <span>Ring sizes offered (US)</span>
          <textarea rows={2} value={sizes} onChange={(event) => setSizes(event.target.value)} />
          <span className="admin-field-help">Separate sizes with commas. Size does not change the price.</span>
        </label>
      ) : null}
    </div>
  );
}
