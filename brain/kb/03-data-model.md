# Data model

Last updated: 2026-10-21
Status: active

## Confirmed facts

- `MONGODB_DB` names the shared account database.
- The shared database contains account records and the public site-slug
  directory. Site content is stored in an account-specific tenant database.
- Tenant database selection is derived from the authenticated account ID or the
  public site slug, never from an arbitrary user-supplied database name.
- Tenant data includes the editor's structured content, theme settings, draft
  and published state, and supporting activity records.
- Account passwords are scrypt hashes; session cookies contain signed session
  data rather than a plaintext password.
- Media bytes are stored by Kenmark Storage. MongoDB stores asset references and
  related metadata rather than file contents.

## Important files

- `lib/mongodb.js` and tenant helpers — MongoDB client and tenant database
  selection.
- `lib/admin-auth.js` — account and session data handling.
- `lib/content.js` and editor modules — structured site content.

## Operational requirements

- The MongoDB user must be able to create tenant databases.
- Backups and tenant deletion/retention procedures must be configured for the
  deployment.
