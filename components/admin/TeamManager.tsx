// @ts-nocheck
'use client';

import { useActionState } from 'react';
import { inviteAdminAction, resetAdminPasswordAction, updateAdminUserAction } from '@/lib/admin-actions';

function PasswordNotice({ state }) {
  if (!state?.message) return null;
  return (
    <div className={state.ok ? 'admin-alert admin-password-notice' : 'admin-form-message'} role="status">
      <span>{state.message}</span>
      {state.password ? (
        <span>Password (shown once — send it privately): <code>{state.password}</code> <button type="button" className="admin-text-button" onClick={() => navigator.clipboard?.writeText(state.password)}>Copy</button></span>
      ) : null}
    </div>
  );
}

function MemberRow({ user, isSelf, roles }) {
  const [roleState, roleAction, rolePending] = useActionState(updateAdminUserAction, {});
  const [resetState, resetAction, resetPending] = useActionState(resetAdminPasswordAction, {});
  return (
    <>
      <tr className={user.active ? '' : 'is-inactive'}>
        <td><strong>{user.name}</strong>{isSelf ? <small className="admin-table-sub">You</small> : null}<small className="admin-table-sub">{user.email}</small></td>
        <td>
          <form action={roleAction} className="admin-inline-form">
            <input type="hidden" name="id" value={user.id} />
            <select name="role" defaultValue={user.role} disabled={isSelf || rolePending} onChange={(event) => event.currentTarget.form.requestSubmit()} aria-label={`Role for ${user.email}`}>
              {Object.keys(roles).map((role) => <option key={role} value={role}>{role === 'owner' ? 'Owner' : 'Editor'}</option>)}
            </select>
          </form>
        </td>
        <td><span className={`admin-status admin-status--${user.active ? 'published' : 'archived'}`}>{user.active ? 'Active' : 'Deactivated'}</span></td>
        <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}</td>
        <td className="admin-team__actions">
          <form action={resetAction} className="admin-inline-form">
            <input type="hidden" name="id" value={user.id} />
            <button type="submit" className="admin-button admin-button--ghost" disabled={resetPending} onClick={(event) => { if (!window.confirm(`Create a new password for ${user.email}? Their current password stops working.`)) event.preventDefault(); }}>Reset password</button>
          </form>
          {!isSelf ? (
            <form action={roleAction} className="admin-inline-form">
              <input type="hidden" name="id" value={user.id} />
              <input type="hidden" name="active" value={user.active ? 'false' : 'true'} />
              <button type="submit" className={`admin-button ${user.active ? 'admin-button--danger' : 'admin-button--ghost'}`} disabled={rolePending} onClick={(event) => { if (user.active && !window.confirm(`Deactivate ${user.email}? They will be signed out immediately.`)) event.preventDefault(); }}>{user.active ? 'Deactivate' : 'Reactivate'}</button>
            </form>
          ) : null}
        </td>
      </tr>
      {roleState?.message || resetState?.message ? (
        <tr><td colSpan={5}><PasswordNotice state={resetState?.message ? resetState : roleState} /></td></tr>
      ) : null}
    </>
  );
}

export default function TeamManager({ users, currentUserId, roles }) {
  const [inviteState, inviteAction, invitePending] = useActionState(inviteAdminAction, {});
  return (
    <div className="admin-import">
      <section className="admin-card admin-table-card">
        <div className="admin-card__heading admin-content-group__head"><div><h2>Team members</h2></div></div>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Last sign-in</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{users.map((user) => <MemberRow key={user.id} user={user} isSelf={user.id === currentUserId} roles={roles} />)}</tbody>
          </table>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card__heading"><div><h2>Add a team member</h2><p className="admin-field-help">They sign in at /admin/login with their email and the password shown after you add them.</p></div></div>
        <form action={inviteAction} className="admin-team__invite">
          <label className="admin-field"><span>Name</span><input name="name" required /></label>
          <label className="admin-field"><span>Email</span><input name="email" type="email" required /></label>
          <label className="admin-field"><span>Role</span>
            <select name="role" defaultValue="editor">
              {Object.entries(roles).map(([role, description]) => <option key={role} value={role}>{description}</option>)}
            </select>
          </label>
          <div><button type="submit" className="admin-button" disabled={invitePending}>{invitePending ? 'Adding…' : 'Add member'}</button></div>
        </form>
        <PasswordNotice state={inviteState} />
      </section>
    </div>
  );
}
