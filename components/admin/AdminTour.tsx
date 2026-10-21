// @ts-nocheck
'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { tourForPath, TOURS } from '@/lib/admin-tours';

const STORAGE = 'byshreen-admin-tours-v1';

function readSeen() {
  try { return JSON.parse(localStorage.getItem(STORAGE) || '{}'); } catch { return {}; }
}
function markSeen(key) {
  try { localStorage.setItem(STORAGE, JSON.stringify({ ...readSeen(), [key]: true })); } catch { /* the tour may show again next time */ }
}
function visible(element) {
  if (!element) return false;
  const box = element.getBoundingClientRect();
  return box.width > 0 && box.height > 0;
}

export default function AdminTour() {
  const pathname = usePathname();
  const [active, setActive] = useState(null); // { key, steps }
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState(null);
  const [pos, setPos] = useState({ top: 80, left: 80, centered: true });
  const card = useRef(null);

  const start = useCallback((key) => {
    const tour = TOURS[key];
    if (!tour) return;
    const steps = tour.steps.filter((step) => !step.target || visible(document.querySelector(step.target)));
    if (steps.length) { setIndex(0); setActive({ key, steps }); }
  }, []);

  const close = useCallback(() => {
    if (active) markSeen(active.key);
    setActive(null);
    setBox(null);
  }, [active]);

  // Start the tour for this page the first time someone lands on it, or when asked with ?tour=1.
  useEffect(() => {
    const found = tourForPath(pathname);
    if (!found) return undefined;
    const [key] = found;
    const asked = new URLSearchParams(window.location.search).get('tour');
    if (readSeen()[key] && !asked) return undefined;
    const timer = setTimeout(() => start(key), 900);
    return () => clearTimeout(timer);
  }, [pathname, start]);

  const step = active?.steps[index];

  // Point at the step's element and place the card next to it.
  useLayoutEffect(() => {
    if (!step) return undefined;
    const place = () => {
      const element = step.target ? document.querySelector(step.target) : null;
      if (!element) { setBox(null); setPos({ centered: true }); return; }
      const r = element.getBoundingClientRect();
      const pad = 6;
      setBox({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
      const cardBox = card.current?.getBoundingClientRect();
      const w = cardBox?.width || 340;
      const h = cardBox?.height || 190;
      const vw = window.innerWidth; const vh = window.innerHeight;
      if (vw < 640) { setPos({ docked: true }); return; }
      let side = step.place || 'bottom';
      if (side === 'right' && r.right + w + 24 > vw) side = 'bottom';
      if (side === 'left' && r.left - w - 24 < 0) side = 'bottom';
      if (side === 'bottom' && r.bottom + h + 24 > vh) side = 'top';
      if (side === 'top' && r.top - h - 24 < 0) side = 'bottom';
      let top; let left;
      if (side === 'right') { left = r.right + 18; top = r.top; }
      else if (side === 'left') { left = r.left - w - 18; top = r.top; }
      else if (side === 'top') { top = r.top - h - 18; left = r.left; }
      else { top = r.bottom + 18; left = r.left; }
      setPos({ top: Math.max(12, Math.min(top, vh - h - 12)), left: Math.max(12, Math.min(left, vw - w - 12)) });
    };
    const element = step.target ? document.querySelector(step.target) : null;
    element?.scrollIntoView({ block: 'center', behavior: 'instant' });
    place();
    const timer = setTimeout(place, 120);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { clearTimeout(timer); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [step]);

  // Keyboard: Esc closes, arrows move.
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, active.steps.length - 1));
      if (event.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    card.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [active, close]);

  if (!active || !step) return null;
  const last = index === active.steps.length - 1;
  const style = pos.centered ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } : pos.docked ? { left: 12, right: 12, bottom: 12 } : { top: pos.top, left: pos.left };

  return (
    <div className="tour" role="presentation">
      <div className="tour__blocker" onClick={(event) => event.stopPropagation()} />
      {box ? <div className="tour__spot" style={{ top: box.top, left: box.left, width: box.width, height: box.height }} /> : <div className="tour__dim" />}
      <div className="tour__card" ref={card} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="tour-title" style={style}>
        <button type="button" className="tour__x" onClick={close} aria-label="Close the tour">×</button>
        <span className="tour__count">Step {index + 1} of {active.steps.length}</span>
        <h2 id="tour-title">{step.title}</h2>
        <p>{step.text}</p>
        <div className="tour__dots" aria-hidden="true">{active.steps.map((_, i) => <i key={i} className={i === index ? 'on' : i < index ? 'done' : ''} />)}</div>
        <div className="tour__actions">
          {last ? <span /> : <button type="button" className="tour__skip" onClick={close}>Skip tour</button>}
          <span className="tour__nav">
            {index > 0 ? <button type="button" className="admin-button admin-button--ghost" onClick={() => setIndex(index - 1)}>Back</button> : null}
            <button type="button" className="admin-button" onClick={() => (last ? close() : setIndex(index + 1))}>{last ? 'Finish' : index === 0 ? 'Start tour' : 'Next'}</button>
          </span>
        </div>
      </div>
    </div>
  );
}
