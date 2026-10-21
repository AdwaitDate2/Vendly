'use client';

import { useActionState, useEffect, useRef } from 'react';
import { saveStorefrontPasswordAction } from '@/lib/admin-actions';

export default function StorefrontPasswordForm({ passwordConfigured, attemptRateLimitConfigured }) {
  const [state, action, pending] = useActionState(saveStorefrontPasswordAction, {});
  const passwordFormRef = useRef(null);

  useEffect(() => {
    if (state?.ok) passwordFormRef.current?.reset();
  }, [state]);

  const statusLabel = passwordConfigured ? 'A storefront password is set.' : 'No storefront password is set.';
  const disabled = pending;

  return <section className="admin-card storefront-password-settings">
    <div className="admin-card__heading">
      <div>
        <h2>Storefront password</h2>
        <p className="admin-field-help">{statusLabel} The password is stored as a one-way hash and cannot be viewed here.</p>
      </div>
    </div>
    <p className="admin-field-help">To protect the public site, set a password and turn on the coming-soon page above. With both enabled, the published Password template is shown. Turning on the coming-soon page by itself keeps the existing landing page.</p>
    {!attemptRateLimitConfigured ? <p className="admin-form-message" role="status">Set STOREFRONT_TRUSTED_CLIENT_IP_HEADER to a single-IP request header that your hosting proxy overwrites. This request has no valid address in that header, so password attempts would share one rate-limit bucket.</p> : null}
    <form action={action} ref={passwordFormRef}>
      <input type="hidden" name="intent" value="set" />
      <label className="admin-field">
        <span>{passwordConfigured ? 'New password' : 'Password'}</span>
        <input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={200} required disabled={disabled} />
      </label>
      <p className="admin-field-help">Use 10–200 characters. Changing the password signs out existing storefront sessions.</p>
      <div className="admin-import__actions">
        <button type="submit" className="admin-button" disabled={disabled}>{pending ? 'Saving…' : passwordConfigured ? 'Change password' : 'Set password'}</button>
      </div>
    </form>
    {passwordConfigured ? <form action={action} onSubmit={(event) => {
      if (!window.confirm('Disable the storefront password? Existing access cookies will stop working.')) event.preventDefault();
    }}>
      <input type="hidden" name="intent" value="disable" />
      <div className="admin-import__actions">
        <button type="submit" className="admin-button admin-button--ghost" disabled={disabled}>{pending ? 'Saving…' : 'Disable password'}</button>
      </div>
    </form> : null}
    {state?.message ? <div className={state.ok ? 'admin-alert' : 'admin-form-message'} role="status">{state.message}</div> : null}
  </section>;
}
