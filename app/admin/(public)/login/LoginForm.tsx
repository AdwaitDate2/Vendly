'use client';

import { useActionState } from 'react';
import { loginAdmin } from '@/lib/admin-actions';

export default function LoginForm({ accountLogin, developerToken }) {
  const [state, formAction, pending] = useActionState(loginAdmin, { message: '', errors: {} });
  return (
    <>
      {accountLogin ? (
        <form action={formAction} className="admin-login-form">
          <label className="admin-field"><span>Email</span><input type="email" name="email" autoComplete="username" defaultValue={state.email || ''} key={state.email || 'empty'} required /></label>
          <label className="admin-field"><span>Password</span><input type="password" name="password" autoComplete="current-password" required /></label>
          {state.message ? <div className="admin-form-message" role="alert">{state.message}</div> : null}
          <button type="submit" className="admin-button admin-button--full" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
        </form>
      ) : null}
      {developerToken ? (
        <details className="admin-login-developer">
          <summary>Developer access</summary>
          <form action={formAction} className="admin-login-form">
            <label className="admin-field"><span>Developer token</span><input type="password" name="token" autoComplete="off" required /></label>
            {!accountLogin && state.message ? <div className="admin-form-message" role="alert">{state.message}</div> : null}
            <button type="submit" className="admin-button admin-button--ghost admin-button--full" disabled={pending}>Open with token</button>
          </form>
        </details>
      ) : null}
    </>
  );
}
