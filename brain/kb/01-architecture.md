# Architecture

Last updated: 2026-10-22
Status: active

## Confirmed facts

- The application uses the Next.js App Router with React and TypeScript pages.
- Public signup and login establish a signed HTTP-only account session. Protected
  admin routes and server mutations resolve the active account and selected
  project from that session.
- The shared MongoDB database holds account identity, project records, and public
  site-slug lookup records. Each project's editor, content, settings, and
  activity data live in a dedicated tenant database.
- The same content model drives editor previews and published routes under
  `/store/{siteSlug}`.
- New project records carry `blankCanvas: true`; editor and public fallbacks
  stay empty until the owner adds and publishes content.
- Kenmark Storage handles uploaded media; the application mediates access and
  exposes published assets through its own asset route.

## Important files

- `proxy.js` — request/session routing.
- `lib/admin-auth.js` — account registration, password verification, and
  session helpers.
- `lib/mongodb.js` and tenant database helpers in `lib/` — Mongo clients and
  project-specific tenant database selection.
- `lib/admin-users.js` and `lib/project-actions.js` — project creation and
  selection.
- `app/admin/editor/` — theme and resource-template editor routes.
- `app/store/[siteSlug]/` — public published site renderer.

## Open decisions

- Hosting, custom-domain routing, production backups, and account recovery
  procedures need deployment configuration.
