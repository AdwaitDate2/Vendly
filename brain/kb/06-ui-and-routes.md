# UI and routes

Last updated: 2026-10-22
Status: active

## Account and editor routes

- `/admin/signup` creates an account; `/admin/login` starts an account session.
- `/dashboard` lists the account's website projects, identifies the active
  project, and lets owners create a blank website. Its workspace sidebar links
  to `/admin/settings` for the active website's Store Settings.
- Protected `/admin` routes provide the workspace, theme settings, content
  tools, media library, and site editor.
- `/admin/editor/[key]` edits pages and shared content. Resource-template editor
  routes live under `/admin/editor/templates/`.
- `/preview/[key]` renders an editor preview without publishing changes.
- `/store/[siteSlug]` and its nested routes render the published tenant website.

## Rendering and implementation

- The application uses the Next.js App Router. React pages and components are
  TSX; server-only data access stays in server modules.
- The editor and public renderer share structured content and theme settings.
- Account workspaces require a signed session; public storefront routes resolve
  a published site using its registered slug.
- Newly created projects open with empty page content and empty shared header
  and footer groups. Legacy project fallback content remains available to
  existing projects.

## Important files

- `app/dashboard/` — account project dashboard and workspace navigation.
- `app/admin/` — workspace, account access, and admin screens.
- `app/admin/editor/` — theme/page editor routes.
- `app/preview/` — unpublished preview routes.
- `app/store/` — published site routes.
