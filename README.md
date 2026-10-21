# Vendly

Vendly is a standalone Next.js website builder extracted from the editor and its storefront renderer. Each account can create and manage an isolated website with a Shopify-style theme and page editor, draft and publish controls, reusable sections, responsive previews, and a public site address.

## Requirements

- Node.js 20.9 or later
- pnpm 10
- A MongoDB database user that can create databases
- Kenmark Storage credentials for image and video uploads

## Configure and run

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), choose **Create an account**, and start editing the homepage. New accounts receive an address at `/store/{site-slug}`. The editor, content, theme settings, and activity records are stored in a dedicated MongoDB database for that account. The shared `MONGODB_DB` database contains only account records and the public site-slug directory.

The project includes starter storefront content and assets that users can replace. Users can add pages, upload media, save drafts, and publish changes to their own site URL.

## Environment variables

Set these in `.env.local` before creating an account:

- `MONGODB_URI`: MongoDB connection string.
- `MONGODB_DB`: shared account database name. Tenant databases use the `{name}_tenant_{accountId}` pattern.
- `ADMIN_SESSION_SECRET`: at least 32 characters; generate one with `openssl rand -hex 32`.
- `NEXT_PUBLIC_SITE_URL`: public origin used for metadata, such as `http://localhost:3000` locally.
- `KENMARK_STORAGE_URL` and `KENMARK_STORAGE_KEY`: required for media library uploads and asset delivery.

The app stores media under an account-specific folder and checks ownership before allowing an account to browse, download, restore, update, or delete an asset. Public media used by a published site is delivered through the app's `/api/assets/{id}` route.

## Project commands

```bash
pnpm dev       # Start the local app
pnpm build     # Build the production app
pnpm start     # Serve the production build
pnpm lint      # Run ESLint
```

## Security and data model

Passwords use scrypt hashes. Sessions are signed, HTTP-only cookies with a 12-hour lifetime. Account records are stored in the shared database; all site data lives in a separate database selected from the authenticated account or public site slug. Never commit `.env.local` or deployment secrets.
