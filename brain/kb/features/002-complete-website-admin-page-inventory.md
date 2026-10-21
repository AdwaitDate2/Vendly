# Complete website and admin page inventory

Last updated: 2026-08-24
Status: in progress

## Purpose

Implement the approved page inventory as a coherent work-in-progress storefront
and a Shopify-like, MongoDB-backed admin workspace without inventing legal,
identity, media-provider, or checkout behavior.

## Public surface delivered

- Catalog index/search: `/products`, `/collections`, `/search`.
- Lead journeys: `/bespoke`, `/contact`, `/appointments`.
- Client-care pages: `/client-care`, `/shipping`, `/returns`, `/faq`, `/care`,
  `/size-guide`, `/materials-and-sourcing`, `/repairs-and-warranty`.
- Trust/accessibility pages: `/accessibility`, `/privacy`, `/terms`, `/cookies`,
  `/privacy-choices`. Policy entries render an explicit pending state until
  approved copy is entered and published.
- Technical routes: `/robots.txt`, `/sitemap.xml`, shared loading, and not-found.
- Existing page-intended links now resolve to real routes; intentional home
  section fragments remain as fragments.

## Admin surface delivered

- Dashboard and protected shell with local preview owner gate.
- Products list/editor/archive with validation and optimistic version checks.
- Collections list/create/edit/archive with ordering, SEO fields, and a guard
  against changing a slug already referenced by products.
- Structured content registry/editor with JSON section validation, revisions,
  preview links, and policy publish protection.
- Inquiry list/detail/follow-up editing and subscriber consent-aware listing.
- Variant inventory list, search/status/low-stock filters, signed adjustments,
  transaction-backed movement history, and stale-version errors.
- Read-only public media reference inventory while uploads/provider policy remain
  gated.
- Permission-bound `/admin/search` across products, collections, content, and
  inquiries; the shell search submits to this route.

## MongoDB additions

- Collections: `siteContent`, `contentRevisions`, `bespokeInquiries`,
  `newsletterSubscribers`, and `inventoryMovements`.
- Additive indexes and index checks cover content, leads, subscribers, catalog,
  and movement history.
- `pnpm db:seed -- --content --dry-run` reports 19 content entries; applying the
  seed is idempotent.

## Intentional boundaries

- `ADMIN_PREVIEW_TOKEN` is local preview access only; production identity/RBAC,
  team, sessions, audit export, and recovery are not claimed complete.
- Privacy/terms/cookie content is not legal advice and cannot be published by
  the current editor without approved copy.
- Media binaries stay outside MongoDB until public/private provider policies are
  approved. No upload/delete route exists.
- Shopify cart, checkout, orders, webhooks, payments, and fulfillment are not
  part of this project. The “Shopify-like” wording describes usability only.
- Form notification delivery, abuse rate limiting, idempotency, retention, and
  restricted exports remain follow-up work.

## Verification recorded

- `pnpm lint` passes with the six pre-existing raw-image warnings.
- `pnpm test:unit` passes the catalog, content, lead, collection, and inventory
  schema/DTO tests.
- `pnpm build` passes with the implemented public/admin route inventory.
- MongoDB index apply/check, catalog seed, content seed dry-run/apply, and
  idempotent content seed were run against the configured database without
  changing environment tracking.
