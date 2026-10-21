'use client';

import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { importProductsAction, previewProductImportAction } from '@/lib/admin-actions';
import { PRODUCT_COLUMNS, csvToProductRows, toCsv } from '@/lib/csv';

const MAX_ROWS = 500;
const ACTION_LABELS = { create: ['New', 'published'], update: ['Update', 'draft'], error: ['Needs fixing', 'error'] };

function downloadTemplate() {
  const csv = toCsv([PRODUCT_COLUMNS.map((column) => column.header), PRODUCT_COLUMNS.map((column) => column.example)]);
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: 'byshreen-products-template.csv' });
  link.click();
  URL.revokeObjectURL(url);
}

export default function ProductImport({ collections }) {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [unknown, setUnknown] = useState([]);
  const [plan, setPlan] = useState(null);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [pending, startTransition] = useTransition();
  const input = useRef(null);

  const readFile = async (file) => {
    if (!file) return;
    setMessage(''); setPlan(null); setResult(null);
    if (!/\.csv$/i.test(file.name)) { setMessage('Please choose a .csv file. In Excel or Google Sheets use File → Download / Save as → CSV.'); return; }
    const parsed = csvToProductRows(await file.text());
    if (!parsed.recognised.includes('title')) { setMessage('The file needs a “Title” column. Start from the template to get the right headers.'); return; }
    if (!parsed.rows.length) { setMessage('The file has headers but no product rows.'); return; }
    if (parsed.rows.length > MAX_ROWS) { setMessage(`The file has ${parsed.rows.length} rows; import up to ${MAX_ROWS} at a time.`); return; }
    setFileName(file.name); setRows(parsed.rows); setUnknown(parsed.unknown);
    startTransition(async () => {
      const response = await previewProductImportAction(parsed.rows);
      if (response.ok) setPlan(response.plan); else setMessage(response.message);
    });
  };

  const counts = plan ? { create: plan.filter((item) => item.action === 'create').length, update: plan.filter((item) => item.action === 'update').length, error: plan.filter((item) => item.action === 'error').length } : null;
  const importable = counts ? counts.create + counts.update : 0;

  const runImport = () => {
    if (!window.confirm(`Import ${importable} product${importable === 1 ? '' : 's'}? ${counts.error ? `${counts.error} row${counts.error === 1 ? '' : 's'} with problems will be skipped.` : ''}`)) return;
    startTransition(async () => {
      const response = await importProductsAction(rows);
      if (response.ok) { setResult(response); setPlan(null); } else setMessage(response.message);
    });
  };

  const reset = () => { setFileName(''); setRows([]); setPlan(null); setResult(null); setMessage(''); if (input.current) input.current.value = ''; };

  return (
    <div className="admin-import">
      <section className="admin-card">
        <div className="admin-card__heading"><div><h2>1. Download the template</h2></div></div>
        <p className="admin-field-help">Fill it in with Excel, Numbers, or Google Sheets, one product per row, then save as CSV. To update products you already have, use the same title or URL slug; only the cells you fill in are changed.</p>
        <div className="admin-import__actions"><button type="button" className="admin-button admin-button--ghost" onClick={downloadTemplate}>Download CSV template</button></div>
        <details className="admin-seo">
          <summary>What goes in each column</summary>
          <table className="admin-import__columns">
            <tbody>
              {PRODUCT_COLUMNS.map((column) => <tr key={column.key}><th scope="row">{column.header}</th><td>{column.help}</td></tr>)}
              <tr><th scope="row">Collections</th><td>{collections.map((item) => `${item.name} (${item.slug})`).join(', ') || 'None yet'}</td></tr>
            </tbody>
          </table>
        </details>
      </section>

      <section className="admin-card">
        <div className="admin-card__heading"><div><h2>2. Upload your file</h2></div></div>
        <label
          className={`admin-dropzone${dragOver ? ' is-over' : ''}`}
          onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => { event.preventDefault(); setDragOver(false); readFile(event.dataTransfer.files?.[0]); }}
        >
          <input ref={input} type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => readFile(event.target.files?.[0])} />
          <strong>{fileName || 'Drop a CSV file here, or click to choose'}</strong>
          <span>{pending && !result ? 'Checking your file…' : fileName ? `${rows.length} product row${rows.length === 1 ? '' : 's'} found` : `Up to ${MAX_ROWS} products per file`}</span>
        </label>
        {message ? <div className="admin-form-message" role="alert">{message}</div> : null}
        {unknown.length ? <p className="admin-field-help">These columns weren’t recognised and will be ignored: {unknown.join(', ')}.</p> : null}
      </section>

      {plan ? (
        <section className="admin-card admin-table-card">
          <div className="admin-card__heading admin-import__summary">
            <div><h2>3. Review before importing</h2></div>
            <div className="admin-import__counts">
              <span className="admin-status admin-status--published">{counts.create} new</span>
              <span className="admin-status admin-status--draft">{counts.update} updates</span>
              {counts.error ? <span className="admin-status admin-status--error">{counts.error} need fixing</span> : null}
            </div>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-table admin-table--compact">
              <thead><tr><th>Row</th><th>Product</th><th>Collection</th><th>Price</th><th>Status</th><th>Photos</th><th>Result</th></tr></thead>
              <tbody>
                {plan.map((item) => (
                  <tr key={item.row} className={item.action === 'error' ? 'is-error' : ''}>
                    <td>{item.row}</td>
                    <td><strong>{item.title || '—'}</strong><small className="admin-table-sub">{item.slug}</small></td>
                    <td>{item.collection || '—'}</td>
                    <td>{item.price == null ? '—' : `$${Number(item.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}</td>
                    <td>{item.status}</td>
                    <td>{item.imageCount}</td>
                    <td>
                      <span className={`admin-status admin-status--${ACTION_LABELS[item.action][1]}`}>{ACTION_LABELS[item.action][0]}</span>
                      {item.errors.length ? <ul className="admin-import__errors">{item.errors.map((error) => <li key={error}>{error}</li>)}</ul> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {result ? (
        <section className="admin-card">
          <div className="admin-card__heading"><div><h2>Import finished</h2></div></div>
          <p>{result.created} created · {result.updated} updated{result.skipped ? ` · ${result.skipped} skipped` : ''}</p>
          {result.results.filter((item) => item.errors?.length).map((item) => <p key={item.row} className="admin-field-error">Row {item.row}: {item.errors.join(' ')}</p>)}
          <p className="admin-field-help">New products are saved as drafts unless the file said Published. Review them before publishing.</p>
          <div className="admin-import__actions">
            <Link href="/admin/products" className="admin-button">View products</Link>
            <button type="button" className="admin-button admin-button--ghost" onClick={reset}>Import another file</button>
          </div>
        </section>
      ) : null}

      {plan ? (
        <div className="admin-savebar">
          <span className="admin-savebar__status">{importable ? `${importable} product${importable === 1 ? '' : 's'} ready to import` : 'Fix the rows marked “Needs fixing”, then upload again.'}</span>
          <button type="button" className="admin-button admin-button--ghost" onClick={reset}>Cancel</button>
          <button type="button" className="admin-button" disabled={!importable || pending} onClick={runImport}>{pending ? 'Importing…' : `Import ${importable} product${importable === 1 ? '' : 's'}`}</button>
        </div>
      ) : null}
    </div>
  );
}
