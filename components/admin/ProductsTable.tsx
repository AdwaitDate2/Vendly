// @ts-nocheck
'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { bulkUpdateProductStatusAction } from '@/lib/admin-actions';
import { deleteProductsAction } from '@/lib/delete-actions';
import DeleteButton from './DeleteButton';

function statusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function ProductsTable({ items, total, error, canDelete = false }) {
  const [selected, setSelected] = useState(() => new Set());
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  // Statuses from before the last bulk change, so it can be undone: { published: [ids], draft: [ids] }.
  const [undo, setUndo] = useState(null);
  const router = useRouter();

  const allSelected = items.length > 0 && selected.size === items.length;
  const someSelected = selected.size > 0 && !allSelected;

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((item) => item.id)));
  }

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function runBulkAction(status) {
    const count = selectedIds.length;
    if (status === 'archived' && !window.confirm(`Archive ${count} product${count === 1 ? '' : 's'}? ${count === 1 ? 'It' : 'They'} will disappear from the website.`)) return;
    if (status === 'published' && !window.confirm(`Publish ${count} product${count === 1 ? '' : 's'}? ${count === 1 ? 'It' : 'They'} will appear on the website straight away.`)) return;
    const previous = {};
    for (const item of items) {
      if (selected.has(item.id) && item.status !== status) (previous[item.status] ||= []).push(item.id);
    }
    setMessage('');
    setUndo(null);
    startTransition(async () => {
      try {
        const result = await bulkUpdateProductStatusAction(selectedIds, status);
        setMessage(result.message);
        setUndo(Object.keys(previous).length ? previous : null);
        setSelected(new Set());
      } catch {
        setMessage('Those changes didn’t save. Check your connection and try again.');
      }
      router.refresh();
    });
  }

  function undoBulkAction() {
    const previous = undo;
    setUndo(null);
    startTransition(async () => {
      try {
        for (const [status, ids] of Object.entries(previous)) await bulkUpdateProductStatusAction(ids, status);
        setMessage('Change undone.');
      } catch {
        setMessage('Couldn’t undo. Set each product’s status again from its page.');
      }
      router.refresh();
    });
  }

  return (
    <div className="admin-card admin-table-card">
      <div className="admin-table-meta">
        <span>{total} {total === 1 ? 'product' : 'products'}</span>
        <span>Updated recently <span aria-hidden="true">⌄</span></span>
      </div>
      <div className="admin-table-scroll">
        <table className="admin-table admin-table--products">
          <thead>
            <tr>
              <th scope="col">
                <input
                  type="checkbox"
                  aria-label="Select all products"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={toggleAll}
                />
              </th>
              <th scope="col">Product</th>
              <th scope="col">Collection</th>
              <th scope="col">Price</th>
              <th scope="col">Status</th>
              <th scope="col">Updated</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {items.map((product) => (
              <tr key={product.id} className={selected.has(product.id) ? 'is-selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${product.title}`}
                    checked={selected.has(product.id)}
                    onChange={() => toggleOne(product.id)}
                  />
                </td>
                <td>
                  <Link href={`/admin/products/${product.id}`} className="admin-product-cell">
                    <span className="admin-product-thumb">{product.images?.[0] ? <Image src={product.images[0]} alt="" width={46} height={52} /> : null}</span>
                    <span><strong>{product.shortTitle || product.title}</strong><small>{product.slug}</small></span>
                  </Link>
                </td>
                <td>{product.category || '—'}</td>
                <td>{product.saleMode === 'enquire' ? 'Enquiry only' : `$${Number(product.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}</td>
                <td><span className={`admin-status admin-status--${product.status}`}>{statusLabel(product.status)}</span></td>
                <td>{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
                <td className="admin-table-actions"><Link href={`/admin/products/${product.id}`} className="admin-row-action">Edit</Link>{canDelete ? <DeleteButton kind="product" id={product.id} name={product.title} variant="link" /> : null}</td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td colSpan="7">
                  <div className="admin-empty">
                    <span>◇</span>
                    <h2>{error ? 'Catalog unavailable' : 'No products here yet'}</h2>
                    <p>{error ? 'Your products are safe. Reload the page in a moment to see them.' : 'Add your first product, or import several from a spreadsheet.'}</p>
                    {!error ? <Link href="/admin/products/new" className="admin-text-link">Create a product →</Link> : null}
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selected.size > 0 ? (
        <div className="admin-bulk-bar" role="toolbar" aria-label="Bulk product actions">
          <span className="admin-bulk-bar__count">{selected.size} selected</span>
          <div className="admin-bulk-bar__actions">
            <Link href={`/admin/products/bulk-edit?ids=${selectedIds.join(',')}`} className="admin-button">Bulk edit</Link>
            <a href={`/admin/products/export?ids=${selectedIds.join(',')}`} className="admin-button admin-button--ghost">Export</a>
            <button type="button" className="admin-button admin-button--ghost" disabled={pending} onClick={() => runBulkAction('published')}>Publish</button>
            <button type="button" className="admin-button admin-button--ghost" disabled={pending} onClick={() => runBulkAction('draft')}>Move to draft</button>
            <button type="button" className="admin-button admin-button--danger" disabled={pending} onClick={() => runBulkAction('archived')}>Archive</button>
            {canDelete ? <button type="button" className="admin-button admin-button--ghost admin-button--danger" disabled={pending} onClick={() => {
              const count = selectedIds.length;
              if (!window.confirm(`Delete ${count} product${count === 1 ? '' : 's'} permanently? Past orders keep their details. You can restore ${count === 1 ? 'it' : 'them'} from Recently deleted for 90 days.`)) return;
              startTransition(async () => {
                const result = await deleteProductsAction(selectedIds);
                setUndo(null);
                setMessage(result.message);
                if (result.ok) setSelected(new Set());
                router.refresh();
              });
            }}>Delete</button> : null}
            <button type="button" className="admin-button admin-button--ghost" disabled={pending} onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        </div>
      ) : null}

      {message ? <div className="admin-bulk-toast" role="status">{message}{undo ? <button type="button" className="admin-text-button" disabled={pending} onClick={undoBulkAction}>Undo</button> : null}</div> : null}
    </div>
  );
}
