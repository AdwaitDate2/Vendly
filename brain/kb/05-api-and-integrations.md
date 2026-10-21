# APIs and integrations

Last updated: 2026-10-21
Status: active

## Confirmed facts

- Account signup, login, and protected mutations are handled by Next.js routes
  and server-side modules.
- MongoDB stores shared account records and tenant-specific site data.
- Kenmark Storage handles image and video uploads. The app keeps provider
  credentials server-side and checks account ownership for media operations.
- Published storefront pages resolve through the registered site slug and use
  the tenant's published content.

## Important files

- `app/api/` — application API routes.
- `lib/admin-auth.js`, `lib/mongodb.js`, and tenant helpers — authentication and
  data boundaries.
- `lib/storage.js`, `lib/storage-proxy.js`, and `app/api/assets/` — managed
  media integration.

## Open work

- Email verification, password recovery, custom-domain routing, and production
  monitoring need deployment and provider configuration.
