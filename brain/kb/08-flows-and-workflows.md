# Flows and workflows

Last updated: 2026-10-21
Status: active

## Account and website setup

1. Configure MongoDB, `ADMIN_SESSION_SECRET`, and Kenmark Storage in
   `.env.local` using `.env.example` as a template.
2. Create an account at `/admin/signup` or sign in at `/admin/login`.
3. Open the editor, update the starter site's theme and page content, and save a
   draft.
4. Preview changes, then publish to make the website available at
   `/store/{siteSlug}`.

Account content and settings are stored in the account's own tenant database.
Media uploads are account-scoped and use Kenmark Storage.

## Development

- Install dependencies with `pnpm install`.
- Start the app with `pnpm dev`.
- Use `pnpm lint` and `pnpm build` for code checks and production compilation.
