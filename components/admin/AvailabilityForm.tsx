'use client';

import { useActionState, useState } from 'react';
import { saveAppointmentSettingsAction } from '@/lib/appointment-actions';
import { DEFAULT_WEEKLY, WEEKDAYS, slotLabel } from '@/lib/appointment-slots';

const TIMEZONES = [
  ['America/New_York', 'New York (Eastern)'],
  ['America/Chicago', 'Chicago (Central)'],
  ['America/Denver', 'Denver (Mountain)'],
  ['America/Los_Angeles', 'Los Angeles (Pacific)'],
  ['Europe/London', 'London'],
  ['Asia/Kolkata', 'India'],
];

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Status({ state }) {
  if (!state?.message) return null;
  return <div className={state.ok ? 'admin-alert' : 'admin-form-message'} role="status">{state.message}</div>;
}

function Times({ slots, onChange, label, compact = false }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    if (!draft || slots.includes(draft)) return;
    onChange([...slots, draft].sort());
    setDraft('');
  };
  return (
    <div className={`avail-times${compact ? ' avail-times--compact' : ''}`}>
      {slots.map((time) => (
        <span className="avail-chip" key={time}>
          {slotLabel(time)}
          <button type="button" aria-label={`Remove ${slotLabel(time)} (${label})`} onClick={() => onChange(slots.filter((item) => item !== time))}>×</button>
        </span>
      ))}
      <span className="avail-add">
        <input type="time" aria-label={`Add a time (${label})`} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} />
        <button type="button" onClick={add} disabled={!draft}>Add</button>
      </span>
    </div>
  );
}

export default function AvailabilityForm({ settings }) {
  const [state, action, pending] = useActionState(saveAppointmentSettingsAction, {});
  const [config, setConfig] = useState(settings);
  const openDays = config.weekly.filter((day) => day.open);
  const sameHours = openDays.every((day) => day.slots.join() === openDays[0].slots.join());
  const [custom, setCustom] = useState(!sameHours);
  const [newDate, setNewDate] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  const set = (key, value) => setConfig((current) => ({ ...current, [key]: value }));
  const setDay = (index, patch) => set('weekly', config.weekly.map((day, i) => (i === index ? { ...day, ...patch } : day)));
  const sharedSlots = openDays[0]?.slots || [];
  const setShared = (slots) => set('weekly', config.weekly.map((day) => (day.open ? { ...day, slots } : day)));
  const toggleDay = (index) => {
    const day = config.weekly[index];
    setDay(index, { open: !day.open, slots: day.open ? day.slots : (sharedSlots.length ? sharedSlots : DEFAULT_WEEKLY[1].slots) });
  };
  const setOverride = (index, patch) => set('overrides', config.overrides.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const addOverride = () => {
    if (!newDate || config.overrides.some((item) => item.date === newDate)) return;
    set('overrides', [...config.overrides, { date: newDate, slots: [], note: '' }].sort((a, b) => a.date.localeCompare(b.date)));
    setNewDate('');
  };
  const upcomingOverrides = config.overrides.filter((item) => item.date >= today);

  return (
    <form action={action} className="admin-card avail">
      <input type="hidden" name="settings" value={JSON.stringify(config)} />

      <div className="admin-card__heading avail-head">
        <div><h2>Booking availability</h2><p className="admin-field-help">What clients can book on the website calendar.</p></div>
        <label className="avail-switch">
          <input type="checkbox" checked={config.enabled} onChange={(event) => set('enabled', event.target.checked)} />
          <span>{config.enabled ? 'Accepting bookings' : 'Bookings paused'}</span>
        </label>
      </div>

      <section className="avail-section">
        <h3>Working days and times</h3>
        <div className="avail-days" role="group" aria-label="Open days">
          {config.weekly.map((day, index) => (
            <button type="button" key={WEEKDAYS[index]} className={`avail-day${day.open ? ' is-on' : ''}`} aria-pressed={day.open} aria-label={WEEKDAYS[index]} onClick={() => toggleDay(index)}>{SHORT_DAYS[index]}</button>
          ))}
        </div>
        {!openDays.length ? <p className="admin-field-help">Every day is closed. Pick at least one day.</p> : custom ? (
          <div className="avail-rows">
            {config.weekly.map((day, index) => day.open ? (
              <div className="avail-row" key={WEEKDAYS[index]}>
                <strong>{WEEKDAYS[index]}</strong>
                <Times slots={day.slots} label={WEEKDAYS[index]} onChange={(slots) => setDay(index, { slots })} compact />
              </div>
            ) : null)}
          </div>
        ) : (
          <Times slots={sharedSlots} label="open days" onChange={setShared} />
        )}
        {openDays.length ? (
          <button type="button" className="avail-link" onClick={() => { if (custom && !sameHours) setShared(sharedSlots); setCustom((value) => !value); }}>
            {custom ? 'Use the same times every day' : 'Set different times for some days'}
          </button>
        ) : null}
      </section>

      <section className="avail-section">
        <h3>Booking rules</h3>
        <div className="avail-grid">
          <div className="avail-field">
            <label htmlFor="avail-tz">Timezone</label>
            <select id="avail-tz" value={config.timezone} onChange={(event) => set('timezone', event.target.value)}>
              {TIMEZONES.some(([value]) => value === config.timezone) ? null : <option value={config.timezone}>{config.timezone}</option>}
              {TIMEZONES.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
            </select>
          </div>
          <div className="avail-field">
            <label htmlFor="avail-lead">Minimum notice</label>
            <div className="avail-unit"><input id="avail-lead" type="number" min="0" max="720" value={config.leadHours} onChange={(event) => set('leadHours', event.target.value)} /><em>hours</em></div>
          </div>
          <div className="avail-field">
            <label htmlFor="avail-max">Book up to</label>
            <div className="avail-unit"><input id="avail-max" type="number" min="1" max="365" value={config.maxDaysAhead} onChange={(event) => set('maxDaysAhead', event.target.value)} /><em>days ahead</em></div>
          </div>
          <div className="avail-field">
            <label htmlFor="avail-cap">Clients per time</label>
            <div className="avail-unit"><input id="avail-cap" type="number" min="1" max="10" value={config.capacity} onChange={(event) => set('capacity', event.target.value)} /><em>at once</em></div>
          </div>
        </div>
      </section>

      <section className="avail-section">
        <h3>Days off and special days</h3>
        <p className="admin-field-help">A date with no times is closed (holiday, travel). Add times to open a closed day or change one day&rsquo;s hours.</p>
        {upcomingOverrides.length ? (
          <div className="avail-rows">
            {upcomingOverrides.map((item) => {
              const index = config.overrides.indexOf(item);
              return (
                <div className="avail-row" key={item.date}>
                  <div>
                    <strong>{new Date(`${item.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                    <small>{item.slots.length ? 'Special hours' : 'Closed'}</small>
                  </div>
                  <Times slots={item.slots} label={item.date} onChange={(slots) => setOverride(index, { slots })} compact />
                  <button type="button" className="avail-remove" aria-label={`Remove ${item.date}`} onClick={() => set('overrides', config.overrides.filter((_, i) => i !== index))}>Remove</button>
                </div>
              );
            })}
          </div>
        ) : null}
        <span className="avail-add avail-add--date">
          <input type="date" aria-label="Date to add" min={today} value={newDate} onChange={(event) => setNewDate(event.target.value)} />
          <button type="button" onClick={addOverride} disabled={!newDate}>Add date</button>
        </span>
      </section>

      <Status state={state} />
      <div className="avail-save"><button type="submit" className="admin-button" disabled={pending}>{pending ? 'Saving…' : 'Save availability'}</button></div>
    </form>
  );
}
