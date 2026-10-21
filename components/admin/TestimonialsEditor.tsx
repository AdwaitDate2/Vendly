'use client';

import { useActionState, useEffect, useState } from 'react';
import { saveTestimonialsAction } from '@/lib/testimonial-actions';
import SortableList, { moveItem } from './SortableList';

function emptyTestimonial() {
  return { id: crypto.randomUUID(), name: '', quote: '', tag: '', piece: '' };
}

export default function TestimonialsEditor({ initialTestimonials }) {
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [dirty, setDirty] = useState(false);
  const [state, saveAction, saving] = useActionState(saveTestimonialsAction, {});

  useEffect(() => {
    if (state?.ok) setDirty(false);
  }, [state]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const change = (updater) => { setTestimonials(updater); setDirty(true); };
  const update = (id, patch) => change((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const remove = (id) => change((prev) => prev.filter((t) => t.id !== id));
  const add = () => change((prev) => [emptyTestimonial(), ...prev]);

  return (
    <div className="admin-instagram">
      <div className="admin-card">
        <div className="admin-card__heading">
          <div>
            <h2>Client testimonials</h2>
            <p className="admin-field-help">These appear in the &ldquo;Client stories&rdquo; carousel on any page that includes that section. Drag ⋮⋮ to reorder.</p>
          </div>
          <button type="button" className="admin-button" onClick={add}>Add testimonial</button>
        </div>
      </div>

      <form action={saveAction} className="admin-instagram__form">
        <input type="hidden" name="testimonials" value={JSON.stringify(testimonials)} />

        <section className="admin-card">
          {testimonials.length === 0 ? (
            <p className="admin-field-help">No testimonials yet. Click &ldquo;Add testimonial&rdquo; above to create the first one.</p>
          ) : (
            <SortableList
              items={testimonials}
              onReorder={(from, to) => change((prev) => moveItem(prev, from, to))}
              className="admin-instagram__list"
              renderItem={(testimonial, _index, handle) => (
                <div className="admin-instagram__post admin-testimonial-item">
                  <span {...handle} className="admin-testimonial-item__handle">⋮⋮</span>
                  <div className="admin-testimonial-item__fields">
                    <div className="admin-field-row">
                      <label className="admin-field">
                        <span>Client name</span>
                        <input
                          type="text"
                          value={testimonial.name}
                          placeholder="e.g. Irum"
                          onChange={(e) => update(testimonial.id, { name: e.target.value })}
                        />
                      </label>
                      <label className="admin-field">
                        <span>Label / tag</span>
                        <input
                          type="text"
                          value={testimonial.tag}
                          placeholder="e.g. Bespoke Commission"
                          onChange={(e) => update(testimonial.id, { tag: e.target.value })}
                        />
                      </label>
                      <label className="admin-field">
                        <span>Jewelry piece</span>
                        <input
                          type="text"
                          value={testimonial.piece}
                          placeholder="e.g. Engagement Ring"
                          onChange={(e) => update(testimonial.id, { piece: e.target.value })}
                        />
                      </label>
                    </div>
                    <label className="admin-field">
                      <span>Quote</span>
                      <textarea
                        rows={3}
                        value={testimonial.quote}
                        placeholder="What they said…"
                        onChange={(e) => update(testimonial.id, { quote: e.target.value })}
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    className="admin-instagram__remove"
                    onClick={() => remove(testimonial.id)}
                    aria-label={`Remove testimonial from ${testimonial.name || 'unnamed client'}`}
                  >
                    ×
                  </button>
                </div>
              )}
            />
          )}
        </section>

        <div className="admin-savebar">
          {state?.message ? (
            <span className={`admin-savebar__status${state.ok ? '' : ' is-error'}`} role="status">{state.message}</span>
          ) : null}
          {dirty ? <span className="admin-savebar__dirty">Unsaved changes</span> : null}
          <button type="submit" className="admin-button" disabled={!dirty || saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
