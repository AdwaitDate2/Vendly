'use client';

import { useEffect, useState } from 'react';
import { linkOptionsAction } from '@/lib/link-actions';

const CUSTOM = '__custom__';
let optionsPromise = null;

// Loaded once per admin session and shared by every link field on the page.
function loadOptions() {
  if (!optionsPromise) optionsPromise = linkOptionsAction().catch(() => { optionsPromise = null; return []; });
  return optionsPromise;
}

/**
 * Picks where a button goes: any page, policy, collection, product, or custom page from a list,
 * or a custom address (another website, an email, or a page section such as /faq#shipping).
 */
export default function LinkPicker({ value, onChange }) {
  const [groups, setGroups] = useState([]);
  const [custom, setCustom] = useState(false);
  useEffect(() => {
    let active = true;
    loadOptions().then((next) => { if (active) setGroups(next); });
    return () => { active = false; };
  }, []);
  const known = groups.some((group) => group.options.some((option) => option.href === value));
  const showCustom = custom || (Boolean(value) && groups.length > 0 && !known);

  return (
    <div className="admin-link-picker">
      <select
        value={showCustom ? CUSTOM : value || ''}
        onChange={(event) => {
          if (event.target.value === CUSTOM) { setCustom(true); return; }
          setCustom(false);
          onChange(event.target.value);
        }}
        aria-label="Link destination"
      >
        <option value="">— No link —</option>
        {!groups.length && value ? <option value={value}>{value}</option> : null}
        {groups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((option) => <option key={`${group.label}-${option.href}`} value={option.href}>{option.label}</option>)}
          </optgroup>
        ))}
        <option value={CUSTOM}>Custom link…</option>
      </select>
      {showCustom ? (
        <input value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder="https://… , mailto:… , or /page#section" aria-label="Custom link address" autoFocus={custom} />
      ) : null}
    </div>
  );
}
