# Flows and workflows

Last updated: 2026-10-22
Status: active

## Account and website setup

1. Configure MongoDB, `ADMIN_SESSION_SECRET`, and Kenmark Storage in
   `.env.local` using `.env.example` as a template.
2. Create an account at `/admin/signup` or sign in at `/admin/login`.
3. Choose a website project from `/dashboard`, or create a new one. New
   projects start with an empty canvas; opening or creating one selects its
   isolated tenant and opens the editor.
4. Add pages and sections, save a draft, and preview changes before publishing
   to `/store/{siteSlug}`.

Each project's content and settings are stored in its own tenant database.
Media uploads are project-scoped and use Kenmark Storage.

## Development

- Install dependencies with `pnpm install`.
- Start the app with `pnpm dev`.
- Use `pnpm lint` and `pnpm build` for code checks and production compilation.
