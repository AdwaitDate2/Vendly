# Known risks and decisions

Last updated: 2026-10-22
Status: active

## Confirmed decisions

- Vendly uses Next.js App Router, MongoDB, signed account sessions, and separate
  tenant databases for site data.
- Passwords use scrypt hashes; uploaded file bytes remain in Kenmark Storage.
- Newly created projects start blank. Legacy fallback content and assets remain
  in the codebase to support existing projects and editor fallbacks.

## Open work and risks

- MongoDB must permit tenant database creation; backups and tenant retention
  require deployment-specific setup.
- Email verification, password recovery, session revocation, and production
  abuse monitoring are not configured.
- Custom domains, domain verification, deployment hosting, and production
  monitoring are not configured.
- Kenmark Storage credentials and `ADMIN_SESSION_SECRET` must be supplied at
  runtime and kept out of source control.
