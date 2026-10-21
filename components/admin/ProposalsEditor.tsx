'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { saveProposalsAction } from '@/lib/proposal-actions';
import { ImageLibraryModal, thumbnailUrl } from './ImagePicker';
import SortableList, { moveItem } from './SortableList';

function emptyProposal() {
  return { id: crypto.randomUUID(), name: '', date: '', story: '', image: '', focus: '' };
}

export default function ProposalsEditor({ initialProposals }) {
  const [proposals, setProposals] = useState(initialProposals);
  const [pickerFor, setPickerFor] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [state, saveAction, saving] = useActionState(saveProposalsAction, {});

  useEffect(() => {
    if (state?.ok) setDirty(false);
  }, [state]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const change = (updater) => { setProposals(updater); setDirty(true); };
  const update = (id, patch) => change((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const remove = (id) => change((prev) => prev.filter((p) => p.id !== id));
  const add = () => change((prev) => [emptyProposal(), ...prev]);

  const missingImage = proposals.some((p) => !p.image && !p.slug);

  return (
    <div className="admin-instagram">
      <div className="admin-card">
        <div className="admin-card__heading">
          <div>
            <h2>Proposal stories</h2>
            <p className="admin-field-help">Each story appears as a tile on the Proposals page. Drag ⋮⋮ to reorder.</p>
          </div>
          <button type="button" className="admin-button" onClick={add}>Add story</button>
        </div>
      </div>

      <form action={saveAction} className="admin-instagram__form">
        <input type="hidden" name="proposals" value={JSON.stringify(proposals)} />

        <section className="admin-card">
          {proposals.length === 0 ? (
            <p className="admin-field-help">No stories yet. Click &ldquo;Add story&rdquo; above to create the first one.</p>
          ) : (
            <SortableList
              items={proposals}
              onReorder={(from, to) => change((prev) => moveItem(prev, from, to))}
              className="admin-instagram__list"
              renderItem={(proposal, index, handle) => (
                <div className="admin-instagram__post">
                  <span {...handle}>⋮⋮</span>
                  <button
                    type="button"
                    className="admin-instagram__cover"
                    onClick={() => setPickerFor(proposal.id)}
                    title="Change photo"
                  >
                    {proposal.image || proposal.slug ? (
                      <Image
                        src={thumbnailUrl(proposal.image || `/images/proposals/${proposal.slug}.webp`, 256)}
                        alt=""
                        fill
                        sizes="92px"
                        unoptimized
                      />
                    ) : (
                      <span>Add photo</span>
                    )}
                  </button>
                  <div className="admin-instagram__fields">
                    <div className="admin-field-row">
                      <label className="admin-field">
                        <span>Couple&rsquo;s names</span>
                        <input
                          value={proposal.name}
                          maxLength={100}
                          placeholder="e.g. Riya &amp; Satyajit"
                          onChange={(e) => update(proposal.id, { name: e.target.value })}
                        />
                      </label>
                      <label className="admin-field">
                        <span>Date</span>
                        <input
                          value={proposal.date}
                          maxLength={50}
                          placeholder="e.g. August 2026"
                          onChange={(e) => update(proposal.id, { date: e.target.value })}
                        />
                      </label>
                    </div>
                    <label className="admin-field">
                      <span>Short story</span>
                      <textarea
                        rows={3}
                        value={proposal.story}
                        maxLength={400}
                        placeholder="A brief description of this commission…"
                        onChange={(e) => update(proposal.id, { story: e.target.value })}
                      />
                    </label>
                    <label className="admin-field">
                      <span>Image focus (optional)</span>
                      <input
                        value={proposal.focus}
                        maxLength={50}
                        placeholder="e.g. center 40%"
                        onChange={(e) => update(proposal.id, { focus: e.target.value })}
                      />
                    </label>
                    {!proposal.image && !proposal.slug ? (
                      <p className="admin-field-error">Add a photo before saving.</p>
                    ) : null}
                  </div>
                  <div className="admin-instagram__actions">
                    <button type="button" aria-label={`Move story ${index + 1} up`} onClick={() => change((prev) => moveItem(prev, index, index - 1))} disabled={index === 0}>↑</button>
                    <button type="button" aria-label={`Move story ${index + 1} down`} onClick={() => change((prev) => moveItem(prev, index, index + 1))} disabled={index === proposals.length - 1}>↓</button>
                    <button
                      type="button"
                      className="admin-text-button admin-text-button--danger"
                      onClick={() => { if (window.confirm(`Remove "${proposal.name || 'this story'}"?`)) remove(proposal.id); }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            />
          )}
        </section>

        <div className="admin-savebar">
          <span className="admin-savebar__status" role="status">
            {state?.message && !dirty ? state.message : dirty ? 'Unsaved changes' : 'All changes saved'}
          </span>
          {state?.ok === false ? <span className="admin-field-error">{state.message}</span> : null}
          <Link href="/proposals" target="_blank" className="admin-button admin-button--ghost">View on website ↗</Link>
          <button type="submit" className="admin-button" disabled={saving || !dirty || missingImage}>
            {saving ? 'Saving…' : 'Save stories'}
          </button>
        </div>
      </form>

      {pickerFor ? (
        <ImageLibraryModal
          title="Photo for this story"
          value={proposals.find((p) => p.id === pickerFor)?.image || ''}
          onChoose={(src) => { update(pickerFor, { image: src }); setPickerFor(null); }}
          onClose={() => setPickerFor(null)}
        />
      ) : null}
    </div>
  );
}
