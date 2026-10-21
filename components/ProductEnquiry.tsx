// @ts-nocheck
'use client';

import { useActionState } from 'react';
import { createInquiryAction } from '@/lib/lead-actions';

const initialState = { message: '', success: false, errors: {} };

export default function ProductEnquiry({ product }) {
  const [state, formAction, pending] = useActionState(createInquiryAction, initialState);
  const title = product.shortTitle || product.title;

  if (state.success) {
    return (
      <div className="pdp-enquiry pdp-enquiry--done" role="status">
        <strong>Thank you. We have your enquiry.</strong>
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <form className="pdp-enquiry lead-form" action={formAction} id="enquire">
      <input type="hidden" name="requestType" value="product" />
      <input type="hidden" name="productSlug" value={product.slug} />
      <input type="hidden" name="productTitle" value={title} />
      <input type="hidden" name="topic" value={`Enquiry: ${title}`} />
      <input className="lead-form__honeypot" name="website" tabIndex="-1" autoComplete="off" aria-hidden="true" />
      <h3 className="pdp-enquiry__title">Enquire about this piece</h3>
      <p className="pdp-enquiry__intro">Tell us a little about what you have in mind and we will reply personally with details and pricing.</p>
      <div className="lead-form__row">
        <label><span>Name *</span><input name="name" autoComplete="name" required /><small>{state.errors?.name?.[0]}</small></label>
        <label><span>Email *</span><input name="email" type="email" autoComplete="email" required /><small>{state.errors?.email?.[0]}</small></label>
      </div>
      <label><span>Phone</span><input name="phone" type="tel" autoComplete="tel" /></label>
      <label><span>Your message *</span><textarea name="message" rows="4" required defaultValue={`I would like to know more about the ${title}.`} /><small>{state.errors?.message?.[0]}</small></label>
      <label className="lead-form__consent"><input name="consent" type="checkbox" value="yes" required /><span>I agree that byShreen may use this information to reply to my enquiry.</span></label>
      <small className="lead-form__consent-error">{state.errors?.consent?.[0]}</small>
      {state.message && !state.success ? <div className="lead-form__message" role="status">{state.message}</div> : null}
      <button className="button button--full" type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send enquiry'}</button>
    </form>
  );
}
