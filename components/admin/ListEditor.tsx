'use client';

import { useEffect, useState } from 'react';
import SortableList, { moveItem } from './SortableList';
import { newId } from '@/lib/blocks';
import SectionDesign from './SectionDesign';

const FIELDS = {
  faq: [['eyebrow', 'Category', 'text'], ['heading', 'Question', 'text'], ['body', 'Answer', 'textarea'], ['note', 'Closing line (optional)', 'text'], ['linkLabel', 'Button text (optional)', 'text'], ['linkHref', 'Button link', 'text'], ['secondaryLinkLabel', 'Second button text (optional)', 'text'], ['secondaryLinkHref', 'Second button link', 'text']],
  default: [['eyebrow', 'Small label', 'text'], ['heading', 'Heading', 'text'], ['body', 'Text', 'textarea'], ['items', 'Bullet list (one per line, optional)', 'list'], ['linkLabel', 'Button text (optional)', 'text'], ['linkHref', 'Button link', 'text']],
};

const EMPTY = { eyebrow: '', heading: '', body: '', note: '', items: [], linkLabel: '', linkHref: '', secondaryLinkLabel: '', secondaryLinkHref: '' };

export default function ListEditor({ contentKey, items, onChange, fullScreen = false, selectedId = null, onSelect }) {
  const [expandedId, setExpandedId] = useState(null);
  const fields = FIELDS[contentKey] || FIELDS.default;
  const noun = contentKey === 'faq' ? 'question' : 'section';

  useEffect(() => {
    if (!selectedId) return;
    setExpandedId(selectedId);
    requestAnimationFrame(() => document.querySelector(`[data-editor-section-id="${CSS.escape(selectedId)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }, [selectedId]);

  const update = (index, field, value) => onChange(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  const add = (position) => {
    const neighbour = items[position - 1] || items[0] || {};
    const item = { ...EMPTY, id: newId(noun), eyebrow: contentKey === 'faq' ? neighbour.eyebrow || '' : '', heading: contentKey === 'faq' ? 'New question' : 'New section' };
    const next = [...items];
    next.splice(position, 0, item);
    onChange(next);
    setExpandedId(item.id);
  };
  const remove = (index) => {
    if (!window.confirm(`Delete this ${noun}? You can undo by not saving.`)) return;
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="admin-block-editor">
      <SortableList
        items={items}
        onReorder={(from, to) => onChange(moveItem(items, from, to))}
        renderItem={(item, index, handle) => {
          const expanded = expandedId === item.id;
          return (
            <section className={`admin-block${expanded ? ' is-expanded' : ''}`} data-editor-section-id={item.id} onFocusCapture={() => onSelect?.(item.id)}>
              <div className="admin-block__head">
                <span {...handle}>⋮⋮</span>
                <button type="button" className="admin-block__title" onClick={() => setExpandedId(expanded ? null : item.id)} aria-expanded={expanded}>
                  <span className="admin-block__type">{contentKey === 'faq' ? item.eyebrow || 'General' : `Section ${index + 1}`}</span>
                  <span className="admin-block__summary">{item.heading || 'Untitled'}</span>
                </button>
                <div className="admin-block__tools">
                  <button type="button" onClick={() => onChange(moveItem(items, index, index - 1))} disabled={index === 0} aria-label="Move up">↑</button>
                  <button type="button" onClick={() => onChange(moveItem(items, index, index + 1))} disabled={index === items.length - 1} aria-label="Move down">↓</button>
                  <button type="button" onClick={() => remove(index)}>Delete</button>
                </div>
              </div>
              {expanded ? (
                <div className="admin-block__body">
                  {fields.map(([field, label, kind]) => (
                    <label className="admin-field" key={field}>
                      <span>{label}</span>
                      {kind === 'textarea' ? (
                        <textarea rows={Math.min(14, Math.max(4, String(item[field] || '').split('\n').length + 1))} value={item[field] || ''} onChange={(event) => update(index, field, event.target.value)} />
                      ) : kind === 'list' ? (
                        <textarea rows={4} value={(item[field] || []).join('\n')} onChange={(event) => update(index, field, event.target.value.split('\n').map((line) => line.trim()).filter(Boolean))} />
                      ) : (
                        <input value={item[field] || ''} onChange={(event) => update(index, field, event.target.value)} />
                      )}
                    </label>
                  ))}
                  {fullScreen ? <SectionDesign design={item.design} onChange={(design) => update(index, 'design', design)} /> : null}
                </div>
              ) : null}
            </section>
          );
        }}
      />
      <button type="button" className="admin-button admin-button--ghost" onClick={() => add(items.length)}>+ Add {noun}</button>
    </div>
  );
}
