# Data model

Last updated: 2026-10-22
Status: active

## Confirmed facts

- `MONGODB_DB` names the shared account database.
- The shared database contains account records, website project records, and
  the public site-slug directory. Site content is stored in a project-specific
  tenant database.
- Tenant database selection is derived from the signed project selection or the
  public site slug, never from an arbitrary user-supplied database name.
- A legacy account's first project uses its existing account ID as its tenant
  ID so its current content and public site remain in place. Additional
  projects use their own generated IDs.
- Tenant data includes the editor's structured content, theme settings, draft
  and published state, and supporting activity records.
- New website project records are marked `blankCanvas: true`; missing content
  then resolves to empty editor pages and empty shared theme section groups.
- Account passwords are scrypt hashes; session cookies contain signed session
  data rather than a plaintext password.
- Media bytes are stored by Kenmark Storage. MongoDB stores asset references and
  related metadata rather than file contents.

## Important files

- `lib/mongodb.js` and tenant helpers — MongoDB client and tenant database
  selection.
- `lib/admin-users.js` — project registry and account ownership.
- `lib/admin-auth.js` — account and session data handling.
- `lib/content.js` and editor modules — structured site content.

## Operational requirements

- The MongoDB user must be able to create tenant databases.
- Backups and tenant deletion/retention procedures must be configured for the
  deployment.
