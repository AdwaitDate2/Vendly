# Vendly project overview

Last updated: 2026-10-22
Status: active

## Confirmed facts

- Vendly is a standalone Next.js App Router website builder.
- Visitors can create an account, sign in, and manage multiple private website
  projects from a project dashboard.
- Each project has an isolated tenant-specific MongoDB database. A shared
  database stores account and project records and the public site-slug directory.
- The editor supports theme and page content, reusable sections, responsive
  previews, draft and publish controls, and public storefront routes for each
  project.
- Newly created projects start with an empty canvas. Legacy storefront fallback
  content remains available to existing projects.

## Important files

- `package.json` — Vendly scripts and dependencies.
- `app/admin/` and `app/admin/editor/` — account workspace and theme editor.
- `app/store/[siteSlug]/` — published site routes.
- `lib/` — account authentication, tenant database, content, and publishing.
- `README.md` — setup, environment, security, and operating instructions.

## Requirements and unknowns

- Runtime setup requires MongoDB and Kenmark Storage credentials; see
  `.env.example` and the README.
- Custom domains, deployment hosting, email verification, and account recovery
  are not configured in this standalone project.
