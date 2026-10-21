'use client';

import { useActionState } from 'react';
import { registerStoreOwner } from '@/lib/admin-actions';

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(registerStoreOwner, { message: '', errors: {} });

  return (
    <form action={formAction} className="admin-login-form">
      <label className="admin-field"><span>Your name</span><input name="name" autoComplete="name" defaultValue={state.name || ''} required maxLength={120} /></label>
      <label className="admin-field"><span>Email</span><input type="email" name="email" autoComplete="email" defaultValue={state.email || ''} required maxLength={240} /></label>
      <label className="admin-field"><span>Password</span><input type="password" name="password" autoComplete="new-password" required minLength={10} maxLength={200} /></label>
      <p className="admin-field-help">Use at least 10 characters.</p>
      {state.message ? <div className="admin-form-message" role="alert">{state.message}</div> : null}
      <button type="submit" className="admin-button admin-button--full" disabled={pending}>{pending ? 'Creating workspace…' : 'Create account'}</button>
    </form>
  );
}
