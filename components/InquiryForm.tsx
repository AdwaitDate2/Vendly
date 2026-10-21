// @ts-nocheck
'use client';

import { useActionState, useState } from 'react';
import { createInquiryAction } from '@/lib/lead-actions';

const initialState = { message: '', success: false, errors: {} };

const APPOINTMENT_TYPES = ['Custom Jewelry', 'Engagement Ring', 'Bridal', 'Shopping / Collection', 'General Consultation'];
const VISIT_TYPES = ['In person (NYC Office)', 'Virtual Consultation'];

export default function InquiryForm({ requestType = 'contact', variant = 'default' }) {
  const [state, formAction, pending] = useActionState(createInquiryAction, initialState);
  const [appointmentType, setAppointmentType] = useState(APPOINTMENT_TYPES[0]);
  const [visitType, setVisitType] = useState(VISIT_TYPES[0]);

  if (variant === 'appointment') {
    return (
      <form className="lead-form" action={formAction}>
        <input type="hidden" name="requestType" value={requestType} />
        <input type="hidden" name="topic" value={`${appointmentType} · ${visitType}`} />
        <div className="appointment-types" aria-label="Appointment type">
          {APPOINTMENT_TYPES.map((type) => (
            <button type="button" key={type} aria-pressed={appointmentType === type} className={`appointment-type${appointmentType === type ? ' appointment-type--active' : ''}`} onClick={() => setAppointmentType(type)}>
              {type}
              {appointmentType === type ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12l5 5L20 6"/></svg> : null}
            </button>
          ))}
        </div>
        <fieldset className="visit-type">
          <legend>Meeting Format</legend>
          <div className="visit-type__options" aria-label="Visit format">
            {VISIT_TYPES.map((type) => (
              <button type="button" key={type} aria-pressed={visitType === type} className={`visit-type__option${visitType === type ? ' visit-type__option--active' : ''}`} onClick={() => setVisitType(type)}>
                {type}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="lead-form__row">
          <label><span>Name</span><input name="name" autoComplete="name" required /><small>{state.errors?.name?.[0]}</small></label>
          <label><span>Email</span><input name="email" type="email" autoComplete="email" required /><small>{state.errors?.email?.[0]}</small></label>
        </div>
        <label><span>Phone</span><input name="phone" type="tel" autoComplete="tel" required /></label>
        <label><span>What are you shopping for?</span>
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
          <label><span>Approximate Budget</span>
            <select name="budget" defaultValue="">
              <option value="" disabled>Select a range</option>
              <option value="under-3000">Under $3,000</option>
              <option value="3000-5000">$3,000 – $5,000</option>
              <option value="5000-10000">$5,000 – $10,000</option>
              <option value="10000-20000">$10,000 – $20,000</option>
              <option value="20000-plus">$20,000+</option>
            </select>
          </label>
          <label><span>Timeline</span>
            <select name="timeline" defaultValue="">
              <option value="" disabled>Select a timeframe</option>
              <option value="within-3-months">Within 3 months</option>
              <option value="3-6-months">3 – 6 months</option>
              <option value="6-12-months">6 – 12 months</option>
              <option value="just-exploring">Just exploring</option>
            </select>
          </label>
        </div>
        <label><span>Tell us a little about what you&rsquo;re looking for</span><textarea name="message" rows="5" required placeholder="Share your inspiration, story, and what you have in mind…" /><small>{state.errors?.message?.[0]}</small></label>
        <label className="lead-form__consent"><input name="consent" type="checkbox" value="yes" required /><span>I agree that byShreen may use this information to respond to my request.</span></label>
        <input className="lead-form__honeypot" name="website" tabIndex="-1" autoComplete="off" aria-hidden="true" />
        {state.message ? <div className={state.success ? 'lead-form__message lead-form__message--success' : 'lead-form__message'} role="status">{state.message}</div> : null}
        <button className="button button--icon" type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Request Appointment'}
          <span className="button__icon"><svg width="13" height="11" viewBox="0 0 24 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 10h20M14 3l7 7-7 7"/></svg></span>
        </button>
      </form>
    );
  }

  return (
    <form className="lead-form" action={formAction}>
      <input type="hidden" name="requestType" value={requestType} />
      <label><span>Name</span><input name="name" autoComplete="name" required /><small>{state.errors?.name?.[0]}</small></label>
      <label><span>Email</span><input name="email" type="email" autoComplete="email" required /><small>{state.errors?.email?.[0]}</small></label>
      <label><span>What are you considering?</span><select name="topic" defaultValue=""><option value="" disabled>Select one</option><option value="piece">A piece from the collection</option><option value="bespoke">A bespoke commission</option><option value="sizing">Sizing or fit</option><option value="care">Care or repair</option><option value="other">Something else</option></select></label>
      <label><span>Message</span><textarea name="message" rows="6" required placeholder="Tell us a little about what you have in mind." /><small>{state.errors?.message?.[0]}</small></label>
      <label className="lead-form__consent"><input name="consent" type="checkbox" value="yes" required /><span>I agree that byShreen may use this information to respond to my request.</span></label>
      <input className="lead-form__honeypot" name="website" tabIndex="-1" autoComplete="off" aria-hidden="true" />
      {state.message ? <div className={state.success ? 'lead-form__message lead-form__message--success' : 'lead-form__message'} role="status">{state.message}</div> : null}
      <button className="button" type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send your note'}</button>
    </form>
  );
}
