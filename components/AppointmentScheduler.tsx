// @ts-nocheck
'use client';

import { useActionState, useCallback, useEffect, useMemo, useState } from 'react';
import BotanicalLogoAnimation from '@/components/BotanicalLogoAnimation';
import { Paragraphs } from '@/components/RichText';
import { createInquiryAction, getAppointmentAvailabilityAction } from '@/lib/lead-actions';

const initialState = { message: '', success: false, errors: {} };

const APPOINTMENT_TYPES = [
  'Custom Jewelry',
  'Engagement Ring',
  'Bridal',
  'Shopping / Collection',
  'General Consultation',
];

const VISIT_TYPES = [
  'In person (NYC Office)',
  'Virtual Consultation',
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function AppointmentScheduler({ block }) {
  const [state, formAction, pending] = useActionState(createInquiryAction, initialState);
  const [appointmentType, setAppointmentType] = useState(APPOINTMENT_TYPES[0]);
  const [visitType, setVisitType] = useState(VISIT_TYPES[0]);
  const [availability, setAvailability] = useState({ loading: true, enabled: true, days: {} });
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');

  // Month currently being viewed in the calendar
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const dateKeyFor = (year, month, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const loadAvailability = useCallback(async () => {
    const result = await getAppointmentAvailabilityAction();
    const days = result.days || {};
    setAvailability({ loading: false, enabled: result.enabled !== false, error: Boolean(result.error), days });
    // Keep the current pick when it is still open; otherwise jump to the first open date.
    setSelectedDate((current) => {
      if (current && days[dateKeyFor(current.year, current.month, current.day)]) return current;
      const first = Object.keys(days).sort()[0];
      if (!first) return null;
      const [year, month, day] = first.split('-').map(Number);
      setViewYear(year);
      setViewMonth(month - 1);
      return { year, month: month - 1, day };
    });
  }, []);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  // A rejected submission usually means someone else just took the slot.
  useEffect(() => {
    if (state.slotTaken) loadAvailability();
  }, [state, loadAvailability]);

  const slotsForSelected = useMemo(
    () => (selectedDate ? availability.days[dateKeyFor(selectedDate.year, selectedDate.month, selectedDate.day)] || [] : []),
    [availability.days, selectedDate],
  );
  const activeTime = slotsForSelected.includes(selectedTime) ? selectedTime : slotsForSelected[0] || '';

  const lastOpenMonth = useMemo(() => {
    const last = Object.keys(availability.days).sort().pop();
    return last ? { year: Number(last.slice(0, 4)), month: Number(last.slice(5, 7)) - 1 } : null;
  }, [availability.days]);
  const isLastOpenMonth = !lastOpenMonth || viewYear > lastOpenMonth.year || (viewYear === lastOpenMonth.year && viewMonth >= lastOpenMonth.month);

  const today = useMemo(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }, []);

  const isCurrentMonthOrPast = useMemo(() => {
    return viewYear < today.year || (viewYear === today.year && viewMonth <= today.month);
  }, [viewYear, viewMonth, today]);

  const handlePrevMonth = () => {
    if (isCurrentMonthOrPast) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Build calendar matrix for viewed month
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(day);
    }
    return cells;
  }, [viewYear, viewMonth]);

  const isUnavailable = (day) => !day || !availability.days[dateKeyFor(viewYear, viewMonth, day)];

  const isSelectedDate = (day) => {
    return (
      selectedDate &&
      selectedDate.year === viewYear &&
      selectedDate.month === viewMonth &&
      selectedDate.day === day
    );
  };

  const handleSelectDay = (day) => {
    if (isUnavailable(day)) return;
    setSelectedDate({ year: viewYear, month: viewMonth, day });
  };

  // Formatted date string for humans and inputs
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    const d = new Date(selectedDate.year, selectedDate.month, selectedDate.day);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDate]);

  const isoDateString = useMemo(() => {
    if (!selectedDate) return '';
    return dateKeyFor(selectedDate.year, selectedDate.month, selectedDate.day);
  }, [selectedDate]);

  const noSlotsMessage = availability.loading
    ? 'Loading availability…'
    : !availability.enabled || availability.error
      ? 'Online booking is paused right now. Please email us and we will arrange a time.'
      : !Object.keys(availability.days).length
        ? 'There are no open times at the moment. Please check back soon or email us.'
        : '';

  return (
    <div className="appointment-layout">
      {/* Left Column: Interactive Calendar & Time Slots */}
      <div className="appointment-layout__side">
        <div className="calendar-picker">
          <div className="calendar-picker__header">
            <span className="calendar-picker__month">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div className="calendar-picker__nav">
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={handlePrevMonth}
                disabled={isCurrentMonthOrPast}
                aria-label="Previous month"
              >
                ‹
              </button>
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={handleNextMonth}
                disabled={isLastOpenMonth}
                aria-label="Next month"
              >
                ›
              </button>
            </div>
          </div>

          <div className="calendar-picker__grid">
            {DAYS_OF_WEEK.map((dow, idx) => (
              <span className="dow" key={`dow-${idx}`}>
                {dow}
              </span>
            ))}
            {calendarCells.map((day, idx) => {
              if (!day) return <span key={`empty-${idx}`} className="day-empty" />;
              const past = isUnavailable(day);
              const selected = isSelectedDate(day);
              const isToday =
                viewYear === today.year && viewMonth === today.month && day === today.day;

              let className = 'calendar-day-btn';
              if (past) className += ' calendar-day-btn--disabled';
              if (selected) className += ' calendar-day-btn--selected';
              if (isToday && !selected) className += ' calendar-day-btn--today';

              return (
                <button
                  type="button"
                  key={`day-${day}`}
                  className={className}
                  disabled={past}
                  onClick={() => handleSelectDay(day)}
                  aria-pressed={selected}
                  aria-label={`${MONTH_NAMES[viewMonth]} ${day}, ${viewYear}`}
                >
                  <span>{day}</span>
                  {!past && !selected && <span className="day-dot" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          {/* Time Slot Selection */}
          <div className="calendar-slots-section">
            <span className="calendar-slots-title">Available Consultation Slots</span>
            {noSlotsMessage ? <p className="appointment-layout__note">{noSlotsMessage}</p> : null}
            <div className="calendar-slots-grid">
              {slotsForSelected.map((slot) => {
                const isSlotSelected = activeTime === slot;
                return (
                  <button
                    type="button"
                    key={slot}
                    className={`calendar-slot-btn${isSlotSelected ? ' calendar-slot-btn--active' : ''}`}
                    onClick={() => setSelectedTime(slot)}
                    aria-pressed={isSlotSelected}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Booking Summary */}
          {selectedDate && activeTime && (
            <div className="calendar-selection-summary">
              <div className="calendar-selection-summary__slot">
                <span className="calendar-selection-summary__icon">✦</span>
                <span>
                  <strong>{formattedSelectedDate}</strong> at <strong>{activeTime}</strong>
                </span>
              </div>
              <span className="calendar-selection-summary__format">{visitType}</span>
            </div>
          )}

          <div className="calendar-mock__note">
            <span className="calendar-sync-dot" aria-hidden="true" />
            {availability.loading ? 'Checking availability' : 'Live Showroom & Virtual Availability'}
          </div>
        </div>

        {block?.body && (
          <Paragraphs text={block.body} className="appointment-layout__note" />
        )}
        <BotanicalLogoAnimation />
      </div>

      {/* Right Column: Inquiry & Booking Form / Confirmation */}
      <div className="appointment-layout__form">
        {state.success ? (
          <div className="appointment-confirmation" role="status">
            <div className="appointment-confirmation__badge" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <span className="eyebrow">Appointment Request Received</span>
            <h3 className="appointment-confirmation__title">We look forward to meeting with you.</h3>
            <p className="appointment-confirmation__message">{state.message}</p>
            <div className="appointment-confirmation__details">
              <div className="appointment-confirmation__row">
                <span>Selected Time</span>
                <strong>{formattedSelectedDate} at {activeTime}</strong>
              </div>
              <div className="appointment-confirmation__row">
                <span>Meeting Format</span>
                <strong>{visitType}</strong>
              </div>
              <div className="appointment-confirmation__row">
                <span>Consultation Type</span>
                <strong>{appointmentType}</strong>
              </div>
            </div>
            <p className="appointment-confirmation__sub">
              A private concierge will be in touch shortly to confirm your consultation schedule.
            </p>
          </div>
        ) : (
          <form className="lead-form" action={formAction}>
            <input type="hidden" name="requestType" value="appointment" />
            <input
              type="hidden"
              name="topic"
              value={`${appointmentType} · ${visitType} · ${formattedSelectedDate} at ${activeTime}`}
            />
            <input type="hidden" name="preferredDate" value={isoDateString} />
            <input type="hidden" name="preferredTime" value={activeTime} />

            <div className="appointment-types" aria-label="Appointment type">
              {APPOINTMENT_TYPES.map((type) => (
                <button
                  type="button"
                  key={type}
                  aria-pressed={appointmentType === type}
                  className={`appointment-type${appointmentType === type ? ' appointment-type--active' : ''}`}
                  onClick={() => setAppointmentType(type)}
                >
                  {type}
                  {appointmentType === type ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 12l5 5L20 6" />
                    </svg>
                  ) : null}
                </button>
              ))}
            </div>

            <fieldset className="visit-type">
              <legend>Meeting Format</legend>
              <div className="visit-type__options" aria-label="Visit format">
                {VISIT_TYPES.map((type) => (
                  <button
                    type="button"
                    key={type}
                    aria-pressed={visitType === type}
                    className={`visit-type__option${visitType === type ? ' visit-type__option--active' : ''}`}
                    onClick={() => setVisitType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="lead-form__row">
              <label>
                <span>Name *</span>
                <input
                  name="name"
                  autoComplete="name"
                  required
                  className={state.errors?.name ? 'lead-form__input--error' : ''}
                />
                <small>{state.errors?.name?.[0]}</small>
              </label>
              <label>
                <span>Email *</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={state.errors?.email ? 'lead-form__input--error' : ''}
                />
                <small>{state.errors?.email?.[0]}</small>
              </label>
            </div>

            <label>
              <span>Phone *</span>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                className={state.errors?.phone ? 'lead-form__input--error' : ''}
              />
              <small>{state.errors?.phone?.[0]}</small>
            </label>

            <label>
              <span>What are you shopping for?</span>
              <select name="interest" defaultValue="">
                <option value="" disabled>Select an option</option>
                <option value="engagement-ring">Engagement ring</option>
                <option value="wedding-band">Wedding band</option>
                <option value="necklace">Necklace</option>
                <option value="bracelet">Bracelet</option>
                <option value="earrings">Earrings</option>
                <option value="custom-design">Custom design</option>
                <option value="not-sure">Not sure yet</option>
              </select>
            </label>

            <div className="lead-form__row">
              <label>
                <span>Approximate Budget</span>
                <select name="budget" defaultValue="">
                  <option value="" disabled>Select a range</option>
                  <option value="under-3000">Under $3,000</option>
                  <option value="3000-5000">$3,000 – $5,000</option>
                  <option value="5000-10000">$5,000 – $10,000</option>
                  <option value="10000-20000">$10,000 – $20,000</option>
                  <option value="20000-plus">$20,000+</option>
                </select>
              </label>
              <label>
                <span>Timeline</span>
                <select name="timeline" defaultValue="">
                  <option value="" disabled>Select a timeframe</option>
                  <option value="within-3-months">Within 3 months</option>
                  <option value="3-6-months">3 – 6 months</option>
                  <option value="6-12-months">6 – 12 months</option>
                  <option value="just-exploring">Just exploring</option>
                </select>
              </label>
            </div>

            <label>
              <span>Tell us a little about what you&rsquo;re looking for *</span>
              <textarea
                name="message"
                rows="4"
                required
                placeholder="Share your inspiration, story, and what you have in mind…"
                className={state.errors?.message ? 'lead-form__input--error' : ''}
              />
              <small>{state.errors?.message?.[0]}</small>
            </label>

            <label className="lead-form__consent">
              <input name="consent" type="checkbox" value="yes" required />
              <span>I agree that byShreen may use this information to respond to my appointment request.</span>
            </label>
            <small className="lead-form__consent-error">{state.errors?.consent?.[0]}</small>

            <input className="lead-form__honeypot" name="website" tabIndex="-1" autoComplete="off" aria-hidden="true" />

            {state.message && !state.success ? (
              <div className="lead-form__message" role="status">
                {state.message}
              </div>
            ) : null}

            <button className="button button--icon" type="submit" disabled={pending || !activeTime}>
              {pending ? 'Submitting Request…' : 'Request Appointment'}
              <span className="button__icon">
                <svg width="13" height="11" viewBox="0 0 24 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 10h20M14 3l7 7-7 7" />
                </svg>
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
