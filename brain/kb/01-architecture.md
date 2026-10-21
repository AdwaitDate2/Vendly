# Architecture

Last updated: 2026-10-21
Status: active

## Confirmed facts

- The application uses the Next.js App Router with React and TypeScript pages.
- Public signup and login establish a signed HTTP-only account session. Protected
  admin routes and server mutations resolve the active account from that session.
- The shared MongoDB database holds account identity and public site-slug lookup
  records. Each account's editor, content, settings, and activity data live in
  a dedicated tenant database.
- The same content model drives editor previews and published routes under
  `/store/{siteSlug}`.
- Kenmark Storage handles uploaded media; the application mediates access and
  exposes published assets through its own asset route.

## Important files

- `proxy.js` — request/session routing.
- `lib/admin-auth.js` — account registration, password verification, and
  session helpers.
- `lib/mongodb.js` and tenant database helpers in `lib/` — Mongo clients and
  account-specific database selection.
- `app/admin/editor/` — theme and resource-template editor routes.
- `app/store/[siteSlug]/` — public published site renderer.

## Open decisions

- Hosting, custom-domain routing, production backups, and account recovery
  procedures need deployment configuration.
