'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const KEY = 'byshreen-help-checklist-v1';

export default function HelpCenter({ guides, groups, checklist }) {
  const [done, setDone] = useState([]);
  const [query, setQuery] = useState('');
  const [ready, setReady] = useState(false);

  // Read the saved checklist once in the browser, so the first server render matches.
  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { /* checklist just starts empty */ }
    setReady(true);
  }, []);

  const toggle = (id) => {
    setDone((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* not saved in this browser */ }
      return next;
    });
  };

  const count = checklist.filter((item) => done.includes(item.id)).length;
  const percent = Math.round((count / checklist.length) * 100);
  const term = query.trim().toLowerCase();
  const matches = useMemo(() => guides.filter((guide) => !term || `${guide.title} ${guide.summary}`.toLowerCase().includes(term)), [guides, term]);
  const nextItem = checklist.find((item) => !done.includes(item.id));

  return (
    <div className="help">
      <section className="admin-card help-start">
        <div className="help-start__head">
          <div>
            <span className="admin-eyebrow">Getting started</span>
            <h2>{count === checklist.length ? 'You are all set up' : 'Set up your store in 9 small steps'}</h2>
            <p className="admin-field-help">Tick each step as you finish it. Your progress is saved in this browser.</p>
          </div>
          <div className="help-start__side">
          <Link href="/admin?tour=1" className="admin-button admin-button--ghost">▶ Take the 1-minute tour</Link>
          <div className="help-progress" aria-label={`${percent} percent complete`}>
            <strong>{ready ? count : 0}/{checklist.length}</strong>
            <span className="help-progress__bar"><i style={{ width: `${ready ? percent : 0}%` }} /></span>
          </div>
          </div>
        </div>
        <ol className="help-checklist">
          {checklist.map((item, index) => {
            const isDone = done.includes(item.id);
            return (
              <li key={item.id} className={isDone ? 'is-done' : nextItem?.id === item.id ? 'is-next' : ''}>
                <button type="button" className="help-check" role="checkbox" aria-checked={isDone} aria-label={`Mark "${item.title}" as done`} onClick={() => toggle(item.id)}>{isDone ? '✓' : index + 1}</button>
                <div className="help-checklist__text"><strong>{item.title}</strong><span>{item.text}</span></div>
                <div className="help-checklist__links"><Link href={`/admin/help/${item.slug}`}>How to</Link><Link href={item.href} className="admin-button admin-button--ghost">Open</Link></div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="help-search">
        <label className="admin-list-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guides, e.g. refund, booking, colours" aria-label="Search guides" /></label>
      </div>

      {groups.map((group) => {
        const items = matches.filter((guide) => guide.group === group.key);
        if (!items.length) return null;
        return (
          <section key={group.key} className="help-group">
            <h2>{group.title}</h2>
            <div className="help-cards">
              {items.map((guide) => (
                <Link href={`/admin/help/${guide.slug}`} className="help-card" key={guide.slug}>
                  <strong>{guide.title}</strong>
                  <span>{guide.summary}</span>
                  <small>{guide.who}</small>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
      {!matches.length ? <div className="admin-empty"><h2>No guide matches “{query}”.</h2><p>Try a shorter word, such as “order” or “email”.</p></div> : null}
    </div>
  );
}
