# Vendly

Vendly is a standalone Next.js website builder extracted from the editor and its storefront renderer. Each account can create and manage multiple independent website projects, each with a Shopify-style theme and page editor, draft and publish controls, reusable sections, responsive previews, and a public site address.

## Requirements

- Node.js 20.9 or later
- pnpm 10
- Docker Desktop for the local MongoDB container

## Configure and run

```bash
cp .env.example .env.local
pnpm install
pnpm db:up
pnpm dev
```

The local database runs in Docker Compose and keeps its data in the `vendly-mongodb-data` volume. It binds only to `127.0.0.1:27018` so it does not conflict with a MongoDB service already using the default port. Use `pnpm db:down` to stop MongoDB; its data stays in the volume.

Open [http://localhost:3000](http://localhost:3000), choose **Sign in** or create an account, then choose or create a website project from the project dashboard. Opening a project takes you to its editor. Each project receives an address at `/store/{site-slug}`. Its editor, content, theme settings, activity records, and media are isolated from the account's other projects. The shared `MONGODB_DB` database contains account records, project records, and the public site-slug directory.

New websites open on a blank canvas. Users can add their own pages and sections, upload media, save drafts, and publish changes to their site URL.

## Environment variables

Set these in `.env.local` before creating an account:

- `MONGODB_URI`: MongoDB connection string.
- `MONGODB_DB`: shared account database name. Tenant databases use the `{name}_tenant_{projectId}` pattern. Existing first projects keep the account ID so current tenant data stays in place.
- `ADMIN_SESSION_SECRET`: at least 32 characters; generate one with `openssl rand -hex 32`.
- `NEXT_PUBLIC_SITE_URL`: public origin used for metadata, such as `http://localhost:3000` locally.

Media uploads require credentials for the configured object-storage service. The app can be run locally without storage credentials while you work on pages and content.

The app stores media under a project-specific folder and checks ownership before allowing an account to browse, download, restore, update, or delete an asset. Public media used by a published site is delivered through the app's `/api/assets/{id}` route.

## Project commands

```bash
pnpm dev       # Start the local app
pnpm build     # Build the production app
pnpm start     # Serve the production build
pnpm lint      # Run ESLint
pnpm db:up     # Start the local MongoDB container
pnpm db:down   # Stop MongoDB without deleting its data
pnpm db:logs   # Follow MongoDB logs
```

## Security and data model

Passwords use scrypt hashes. Sessions are signed, HTTP-only cookies with a 12-hour lifetime. Account records are stored in the shared database; all site data lives in a separate database selected from the authenticated account or public site slug. Never commit `.env.local` or deployment secrets.
