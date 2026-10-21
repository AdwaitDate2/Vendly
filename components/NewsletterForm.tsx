'use client';

import { useActionState } from 'react';
import { subscribeNewsletterAction } from '@/lib/lead-actions';

const initialState = { message: '', success: false };

export default function NewsletterForm({
  placeholder = 'Enter your email address',
  submitLabel = 'Subscribe',
  source = 'pre-footer',
  preview = false,
}) {
  const [state, formAction, pending] = useActionState(subscribeNewsletterAction, initialState);
  if (preview) {
    return (
      <div className="newsletter-form newsletter-form--preview" aria-label="Email signup preview">
        <div className="newsletter-form__row">
          <input aria-label="Email address" type="email" placeholder={placeholder} disabled />
          <button type="button" disabled>{submitLabel}</button>
        </div>
      </div>
    );
  }
  return (
    <form action={formAction} className="newsletter-form">
      <div className="newsletter-form__row">
        <input
          name="email"
          aria-label="Email address"
          type="email"
          placeholder={placeholder}
          required
        />
        <input type="hidden" name="consent" value="yes" />
        <input type="hidden" name="source" value={source} />
        <button type="submit" disabled={pending}>
          {pending ? 'Joining…' : submitLabel}
        </button>
      </div>
      {state.message ? (
        <small
          className={state.success ? 'newsletter-message newsletter-message--success' : 'newsletter-message'}
          role="status"
        >
          {state.message}
        </small>
      ) : null}
    </form>
  );
}
