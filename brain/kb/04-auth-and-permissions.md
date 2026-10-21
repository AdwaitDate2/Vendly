# Authentication and permissions

Last updated: 2026-10-21
Status: active

## Confirmed facts

- Users create an account at `/admin/signup` and sign in at `/admin/login`.
- Passwords are stored as scrypt hashes. Sessions use signed, HTTP-only cookies
  with a 12-hour lifetime.
- Protected pages and server actions require an authenticated account before
  reading or mutating tenant data.
- Tenant selection is derived from the authenticated account or a public site
  slug; callers do not choose arbitrary database names.
- `ADMIN_SESSION_SECRET` must contain at least 32 characters and must remain
  server-side.

## Important files

- `lib/admin-auth.js` — password and session implementation.
- `proxy.js` — route protection and redirects.
- Protected layouts and Server Actions under `app/admin/` and `lib/` —
  authorization boundaries.

## Open decisions

- Email verification, password reset, session revocation, and production account
  recovery require additional provider and operational configuration.
