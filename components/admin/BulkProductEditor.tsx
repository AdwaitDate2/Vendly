// @ts-nocheck
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { thumbnailUrl } from './ImagePicker';
import { bulkSaveProductsAction } from '@/lib/admin-actions';

const STATUSES = [['draft', 'Draft'], ['published', 'Published'], ['archived', 'Archived']];

function editableRow(product) {
  return {
    id: product.id,
    version: product.version || 0,
    image: product.images?.[0] || '',
    title: product.title || '',
    shortTitle: product.shortTitle && product.shortTitle !== product.title ? product.shortTitle : '',
    price: product.variants?.[0]?.price ?? product.price ?? '',
    category: product.category || '',
    status: product.status || 'draft',
    metal: product.metal || '',
    stone: product.stone || '',
    caratWeight: product.caratWeight || '',
    description: product.description || '',
    shippingText: product.shippingText || '',
    careText: product.careText || '',
    detailsExtra: product.detailsExtra || '',
  };
}

export default function BulkProductEditor({ products, collections, sharedText = {} }) {
  const columns = useMemo(() => [
    { key: 'title', label: 'Title', width: 260 },
    { key: 'shortTitle', label: 'Card title', width: 190, placeholder: 'Same as title' },
    { key: 'price', label: 'Price, first metal (USD)', width: 150, type: 'number' },
    { key: 'category', label: 'Collection', width: 170, options: collections.map((item) => [item.slug, item.name]) },
    { key: 'status', label: 'Status', width: 130, options: STATUSES },
    { key: 'metal', label: 'Metal', width: 190 },
    { key: 'stone', label: 'Stone', width: 160 },
    { key: 'caratWeight', label: 'Carat', width: 90, placeholder: '—' },
    { key: 'description', label: 'Description', width: 360, multiline: true },
    { key: 'detailsExtra', label: 'Extra product details', width: 280, multiline: true, placeholder: 'Band width: 2mm\nSetting: Six-prong' },
    { key: 'careText', label: 'Care instructions', width: 360, multiline: true },
    { key: 'shippingText', label: 'Shipping & returns', width: 360, multiline: true },
  ], [collections]);

  const toRow = (product) => {
    const row = editableRow(product);
    if (!row.shippingText && sharedText.shipping) row.shippingText = sharedText.shipping;
    if (!row.careText && sharedText.care) row.careText = sharedText.care;
    return row;
  };
  const [original, setOriginal] = useState(() => Object.fromEntries(products.map((product) => [product.id, toRow(product)])));
  const [rows, setRows] = useState(() => products.map(toRow));
  const [filter, setFilter] = useState('');
  const [fillValues, setFillValues] = useState(() => Object.fromEntries(columns.map((col) => [col.key, ''])));
  const [rowErrors, setRowErrors] = useState({});
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();

  const changed = (row, key) => String(row[key]) !== String(original[row.id]?.[key]);
  const dirtyRows = rows.filter((row) => columns.some((column) => changed(row, column.key)));
  const dirtyCells = rows.reduce((total, row) => total + columns.filter((column) => changed(row, column.key)).length, 0);

  useEffect(() => {
    if (!dirtyRows.length) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirtyRows.length]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? rows.filter((row) => [row.title, row.shortTitle, row.category, row.metal, row.status].join(' ').toLowerCase().includes(q)) : rows;
  }, [rows, filter]);

  const update = (id, key, value) => setRows((current) => current.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  const fillAll = (key, value) => setRows((current) => current.map((row) => ({ ...row, [key]: value })));
  const discard = () => { setRows(products.map((product) => original[product.id] || editableRow(product))); setRowErrors({}); setMessage(''); };

  const save = () => {
    const changes = dirtyRows.map((row) => ({
      id: row.id,
      version: row.version,
      fields: Object.fromEntries(columns.filter((column) => changed(row, column.key)).map((column) => [column.key, column.key === 'price' ? Number(row.price) : row[column.key]])),
    }));
    setMessage('');
    startTransition(async () => {
      const response = await bulkSaveProductsAction(changes);
      if (!response.ok) { setMessage(response.message); return; }
      const errors = {};
      const savedIds = new Set();
      for (const result of response.results) {
        if (result.ok) savedIds.add(result.id);
        else errors[result.id] = result.errors.join(' ');
      }
      setRowErrors(errors);
      setRows((current) => current.map((row) => (savedIds.has(row.id) ? { ...row, version: response.results.find((item) => item.id === row.id).version } : row)));
      setOriginal((current) => {
        const next = { ...current };
        for (const row of rows) if (savedIds.has(row.id)) next[row.id] = { ...row, version: response.results.find((item) => item.id === row.id).version };
        return next;
      });
      const failed = Object.keys(errors).length;
      setMessage(`Saved ${savedIds.size} product${savedIds.size === 1 ? '' : 's'}.${failed ? ` ${failed} could not be saved — see the highlighted rows.` : ''}`);
    });
  };

  return (
    <div className="admin-bulk-editor">
      <div className="admin-card admin-bulk-editor__toolbar">
        <label className="admin-field"><span>Filter rows</span><input type="search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Title, collection, metal, status…" /></label>
      </div>

      <div className="admin-card admin-table-card">
        <div className="admin-table-scroll admin-bulk-editor__scroll">
          <table className="admin-table admin-bulk-grid">
            <thead>
              <tr>
                <th className="admin-bulk-grid__sticky" style={{ width: 64 }}>Photo</th>
                {columns.map((column) => <th key={column.key} style={{ minWidth: column.width }}>{column.label}</th>)}
              </tr>
              <tr className="admin-bulk-grid__fill-row">
                <th className="admin-bulk-grid__sticky admin-bulk-grid__fill-label">Fill all ↓</th>
                {columns.map((column) => (
                  <th key={column.key}>
                    <div className="admin-bulk-grid__fill-cell">
                      {column.options ? (
                        <select
                          aria-label={`Fill all: ${column.label}`}
                          value={fillValues[column.key]}
                          onChange={(e) => setFillValues((prev) => ({ ...prev, [column.key]: e.target.value }))}
                        >
                          <option value="">Choose…</option>
                          {column.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      ) : (
                        <input
                          aria-label={`Fill all: ${column.label}`}
                          type={column.type || 'text'}
                          step={column.type === 'number' ? '0.01' : undefined}
                          value={fillValues[column.key]}
                          placeholder={`Fill all ${rows.length}…`}
                          onChange={(e) => setFillValues((prev) => ({ ...prev, [column.key]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter' && fillValues[column.key] !== '') { fillAll(column.key, fillValues[column.key]); e.preventDefault(); } }}
                        />
                      )}
                      <button
                        type="button"
                        className="admin-bulk-grid__fill-btn"
                        disabled={!fillValues[column.key]}
                        onClick={() => fillAll(column.key, fillValues[column.key])}
                        title={`Apply to all ${rows.length} products`}
                      >
                        ↓ All
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} className={rowErrors[row.id] ? 'is-error' : ''}>
                  <td className="admin-bulk-grid__sticky">
                    <Link href={`/admin/products/${row.id}`} title="Open full editor">{row.image ? <Image src={thumbnailUrl(row.image, 96)} alt="" width={44} height={44} unoptimized /> : <span className="admin-bulk-grid__noimg" />}</Link>
                  </td>
                  {columns.map((column) => {
                    const className = changed(row, column.key) ? 'is-changed' : '';
                    const onChange = (event) => update(row.id, column.key, event.target.value);
                    return (
                      <td key={column.key} className={className}>
                        {column.options ? (
                          <select aria-label={`${column.label} for ${row.title}`} value={row[column.key]} onChange={onChange}>
                            {!column.options.some(([value]) => value === row[column.key]) ? <option value={row[column.key]}>{row[column.key] || 'Choose…'}</option> : null}
                            {column.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                          </select>
                        ) : column.multiline ? (
                          <textarea aria-label={`${column.label} for ${row.title}`} rows={2} value={row[column.key]} onChange={onChange} />
                        ) : (
                          <input aria-label={`${column.label} for ${row.title}`} type={column.type || 'text'} step={column.type === 'number' ? '0.01' : undefined} value={row[column.key]} placeholder={column.placeholder} onChange={onChange} />
                        )}
                        {column.key === 'title' && rowErrors[row.id] ? <span className="admin-field-error">{rowErrors[row.id]}</span> : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-savebar">
        {message ? <span className={Object.keys(rowErrors).length ? 'admin-savebar__status is-error' : 'admin-savebar__status'} role="status">{message}</span> : null}
        {dirtyCells ? <span className="admin-savebar__dirty">{dirtyCells} change{dirtyCells === 1 ? '' : 's'} in {dirtyRows.length} product{dirtyRows.length === 1 ? '' : 's'}</span> : null}
        <button type="button" className="admin-button admin-button--ghost" disabled={!dirtyCells || pending} onClick={discard}>Discard</button>
        <button type="button" className="admin-button" disabled={!dirtyCells || pending} onClick={save}>{pending ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  );
}
