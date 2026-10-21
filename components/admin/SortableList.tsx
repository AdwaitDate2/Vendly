'use client';

import { useState } from 'react';

export function moveItem(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Vertical list reordered by dragging a handle. Dragging is only enabled while the handle is
 * held, so text inside items can still be selected normally.
 */
export default function SortableList({ items, onReorder, renderItem, className = '' }) {
  const [armed, setArmed] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const [reorderAnnouncement, setReorderAnnouncement] = useState('');

  const reset = () => { setArmed(null); setDragging(null); setOver(null); };
  const moveWithKeyboard = (event, index, item) => {
    const direction = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
    if (!direction) return;

    event.preventDefault();
    const nextIndex = index + direction;
    const itemLabel = item.displayName || item.label || item.heading || item.title || `item ${index + 1}`;
    if (nextIndex < 0 || nextIndex >= items.length) {
      setReorderAnnouncement(`${itemLabel} is already ${direction < 0 ? 'first' : 'last'}.`);
      return;
    }

    onReorder(index, nextIndex);
    setReorderAnnouncement(`Moved ${itemLabel} to position ${nextIndex + 1} of ${items.length}.`);
  };

  return (
    <div className={`admin-sortable ${className}`}>
      {items.map((item, index) => {
        const itemLabel = item.displayName || item.label || item.heading || item.title || `item ${index + 1}`;
        return <div
          key={item.id}
          className={`admin-sortable__item${dragging === index ? ' is-dragging' : ''}${over === index && dragging !== null && dragging !== index ? (dragging < index ? ' is-over-after' : ' is-over-before') : ''}`}
          draggable={armed === index}
          onDragStart={(event) => { setDragging(index); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(index)); }}
          onDragOver={(event) => { if (dragging === null) return; event.preventDefault(); setOver(index); }}
          onDrop={(event) => { event.preventDefault(); if (dragging !== null) onReorder(dragging, index); reset(); }}
          onDragEnd={reset}
        >
          {renderItem(item, index, {
            onPointerDown: () => setArmed(index),
            onPointerUp: () => setArmed(null),
            onPointerCancel: () => setArmed(null),
            onKeyDown: (event) => moveWithKeyboard(event, index, item),
            className: 'admin-drag-handle',
            role: 'button',
            tabIndex: 0,
            title: 'Drag or use the arrow keys to reorder',
            'aria-label': `Reorder ${itemLabel}. Use the up and down arrow keys to move it.`,
          })}
        </div>
      })}
      <span className="sr-only" role="status" aria-live="polite">{reorderAnnouncement}</span>
    </div>
  );
}
