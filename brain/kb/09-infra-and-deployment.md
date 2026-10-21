# Infrastructure and deployment

Last updated: 2026-10-21
Status: active

## Confirmed facts

- This is a standalone Next.js 16 project managed with pnpm 10.
- Local and deployed runtime settings are provided through environment
  variables. `.env.example` documents the required values.
- MongoDB stores account records and tenant site data. The MongoDB user needs
  permission to create tenant databases.
- Kenmark Storage credentials are required for media upload and delivery.
- `.env.local`, credentials, keys, and tokens must never be committed.

## Required environment

- `MONGODB_URI` and `MONGODB_DB` for account and tenant data.
- `ADMIN_SESSION_SECRET` for signed account sessions.
- `NEXT_PUBLIC_SITE_URL` for canonical URLs and metadata.
- `KENMARK_STORAGE_URL` and `KENMARK_STORAGE_KEY` for media operations.

## Open deployment work

- Hosting/runtime, DNS and custom domains, TLS, database backups, storage
  provisioning, and production recovery procedures need deployment-specific
  setup.
