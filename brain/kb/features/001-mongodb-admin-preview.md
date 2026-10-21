# MongoDB catalog admin preview

Last updated: 2026-08-24
Status: draft

## Purpose

Give the byShreen team a local, Shopify-like catalog workspace while the
production identity/media/commerce decisions are still open.

## Entry points

- `/admin/login` — local token gate.
- `/admin` — overview, onboarding, Mongo status, and catalog metrics.
- `/admin/products` — searchable/status-filtered product resource list.
- `/admin/products/new` — create a draft/published catalog record.
- `/admin/products/[id]` — version-aware product editor and archive action.
- Public home, collection, and product routes can opt into the same published
  Mongo catalog through `CATALOG_SOURCE=mongodb`.

## Key files

- `lib/mongodb.js`, `lib/catalog.js`, `lib/admin-auth.js`, `lib/admin-actions.js`.
- `components/admin/AdminShell.jsx`, `components/admin/ProductForm.jsx`.
- `scripts/db/ping.mjs`, `scripts/db/indexes.mjs`, `scripts/db/seed.ts`.

## Boundaries

- The preview gate is not production auth.
- Public pages still read `data/products.js`.
- Public pages default to static data; Mongo cutover is opt-in per environment.
- Media binaries, checkout, payments, and Shopify integrations are not part of
  this project. Shopify only informs the admin workflow conventions.
