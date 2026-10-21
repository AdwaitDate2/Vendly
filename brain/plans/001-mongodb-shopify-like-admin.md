---
id: "001"
title: Build a MongoDB admin with Shopify-like workflows
tier: dig-deep
type: architecture
status: in-progress
source: kenmark-plan
created: 2026-08-24
approved: 2026-08-24
files:
  - package.json
  - pnpm-lock.yaml
  - README.md
  - .env.example
  - .gitlab-ci.yml
  - app/layout.js
  - app/(storefront)/
  - app/admin/
  - app/api/
  - components/admin/
  - lib/
  - scripts/
  - tests/
  - e2e/
  - docs/decisions/
related_issues: []
related_plans: []
---

# Build a MongoDB admin with Shopify-like workflows

## Plan classification

- **Tier:** `dig-deep`
- **Planning type:** `architecture`
- **Status:** proposed; implementation has not started
- **Estimated delivery:** 5–8 engineer-weeks for one experienced full-stack
  engineer, or 3–5 weeks for two engineers working across platform and admin UI
- **Risk:** high because this introduces authentication, authorization,
  persistence, media handling, data migration, publishing, and a storefront
  data-source cutover
- **Primary dependency:** the existing route-restoration working tree must be
  committed or deliberately included before execution begins
- **Advisor source:** `plans/001-build-mongodb-admin.md` contains the initial
  codebase survey and remains useful evidence; this file is the durable source
  of truth for approval and execution

## Execution log — 2026-08-24

- **Completed slice:** pnpm dependency setup; ignored MongoDB environment;
  shared Mongo client; catalog schemas/serialization/indexes; idempotent starter
  seed; local-only preview session; isolated admin shell; dashboard; product
  list/search/status views; version-aware product create/edit/archive; README,
  KB, changelog, and operational scripts; reversible `CATALOG_SOURCE` public
  reads for local Mongo preview.
- **Verified against the supplied database:** ping, index apply/check, dry-run
  seed, and two consecutive apply runs (second run upserted zero products).
- **Still gated:** production Auth.js provider/allowlist, media provider,
  structured content persistence, inventory movement transactions, public
  Mongo catalog cutover, inquiry/subscriber workflows, and automated tests/CI.
- **Scope clarification:** Shopify is only the admin usability reference. No
  Shopify API, checkout, orders, payments, webhooks, or synchronization work is
  required.
- **Reason for the gate:** the plan’s stop conditions require provider/source-
  of-truth decisions before exposing production admin access or changing public
  commerce behavior. The current token gate is explicitly local preview only.

## Summary

Build a private `/admin` workspace that lets a small byShreen team operate the
site without editing code. MongoDB will own catalog, collections, structured
site content, media metadata, inventory history, bespoke inquiries, newsletter
subscribers, staff access, revisions, saved views, and audit logs. The public
storefront will read only published MongoDB data and will retain its current
URLs and visual design.

The admin should feel as easy and predictable as Shopify, but should be tailored
to this jewelry business rather than reproduce Shopify feature-for-feature. Its
core experience will be consistent resource lists, global search, saved views,
bulk actions, sectioned editors, a sticky save bar, explicit draft/publish/
archive states, variants, inventory adjustments, live storefront preview,
clear feedback, and role-aware navigation.

Do not build custom payment, tax, refund, fulfillment, checkout, order, or
commerce integration infrastructure in MongoDB. MongoDB is the application
data layer for the catalog, content, leads, and operations in this project.
Shopify is not a connected system; its admin conventions are the usability
reference only.

## Feasibility decision

**Yes, this is feasible in the current application.** The site already uses
Next.js App Router, React, and pnpm, so the admin can share the deployment and
selected design tokens while using a separate route group, layout, data-access
layer, and permission boundary. The existing catalog is very small—four
products and four collections—so an idempotent migration and reversible
storefront cutover are practical.

It should be delivered in layers. Authentication, data contracts, and route
isolation come first; then catalog and product workflows; then public cutover;
then content, inquiries, and operational polish. A single large release would
make authorization and migration regressions unnecessarily difficult to detect
or roll back.

## Current understanding

### Repository and runtime

- The repository is a single Next.js 16.3.2 application using React 19.2.8 and
  pnpm 10.12.1.
- `package.json` currently exposes only `dev`, `build`, `start`, and `lint`.
  There are no database, auth, validation, typecheck, or test dependencies.
- `pnpm build` currently succeeds. `pnpm lint` succeeds with six existing
  `@next/next/no-img-element` warnings.
- The remote is GitLab, so automated verification belongs in `.gitlab-ci.yml`.
- Secrets are ignored through `.env*`, but there is no `.env.example`.

### Public application

- `app/layout.js` currently wraps every page in `SiteChrome` and `Footer`; an
  admin created under this layout would incorrectly inherit the storefront
  header, cart, announcement, and footer.
- Current public routes are `/`, `/about`, `/collections/[slug]`, and
  `/products/[slug]`.
- Route-restoration changes are present in the working tree and must not be
  overwritten during the route-group move.
- The visual system lives mainly in `app/globals.css` and the existing public
  components. The admin can reuse brand variables, but needs a denser workspace
  layout and its own components.

### Data and operations

- `data/products.js` contains four static product records and four static
  categories. Public pages import them directly.
- Catalog changes require a code change and deployment. There are no draft,
  publishing, revision, or scheduling concepts.
- `CartProvider` stores the cart only in browser memory, and the checkout UI is
  explicitly a demo.
- Homepage and About content are hardcoded in their page modules.
- The footer newsletter form has no persistence or submit workflow.
- Bespoke contact uses email links rather than a trackable inquiry pipeline.
- No auth, API routes, database connection, server-side permissions, media
  provider, automated tests, or CI pipeline exists.

## Goals

- Give non-developers a secure, learnable admin for routine site operations.
- Let staff create, edit, preview, publish, unpublish, duplicate, and archive
  products and collections without deployment.
- Support jewelry-specific variants and attributes: size, metal, finish, karat,
  stone, carat, certification, lead time, and made-to-order behavior.
- Make inventory changes explicit, auditable, and protected from stale writes.
- Manage homepage, About, navigation, announcement, footer, contact, and SEO as
  structured content with preview and revision history.
- Reuse and govern product/editorial media through a searchable library.
- Capture and operate bespoke inquiries and newsletter subscribers with consent
  evidence and appropriate PII controls.
- Provide owner-controlled roles, access revocation, session revocation, and
  immutable operational audit history.
- Make newly published products and content public without a code deployment.
- Keep commerce integration out of scope while preserving a clear, non-
  transactional preview cart.
- Establish pnpm scripts, tests, CI, runbooks, and rollback paths sufficient for
  safe execution and maintenance.

## Non-goals for the first release

- Custom card capture, checkout, payment, tax, refund, chargeback, payout, or
  fulfillment engines.
- Customer accounts, wishlists, reviews, loyalty points, gift cards, or a
  general-purpose discount engine.
- A generic drag-and-drop page builder, arbitrary executable HTML, plugin
  marketplace, or theme editor.
- Real-time collaborative editing, websockets, offline mode, or a native mobile
  app.
- Storing image/video binaries or credentials in MongoDB.
- Rebuilding the public visual identity.
- Rewriting every existing JavaScript component before it is otherwise touched.
- Reproducing every Shopify screen or its visual styling. The target is
  comparable workflow clarity, not product imitation.

## Experience standard: “easy like Shopify”

### Principles

1. **One dependable shell:** persistent module navigation, a compact top bar,
   global search, breadcrumbs, contextual page actions, account menu, and clear
   environment indicator.
2. **One resource-list grammar:** Products, Collections, Inventory, Content,
   Media, Inquiries, Subscribers, and future Orders use the same search,
   filters, saved views, selection, pagination, empty state, and bulk-action
   patterns.
3. **Progressive disclosure:** a product can be created with title and price,
   while advanced jewelry, inventory, SEO, and publishing fields remain in
   clearly labeled sections.
4. **Explicit state:** every resource visibly communicates draft, published,
   archived, low-stock, scheduled, or error status. Color is never the only
   indicator.
5. **Safe speed:** duplicate, bulk edit, keyboard navigation, saved views, and
   remembered filters reduce repeated work without bypassing validation.
6. **No mysterious saves:** editors see dirty state, saving state, success,
   field errors, server errors, and version conflicts. Navigation warns about
   unsaved changes.
7. **Preview the real site:** preview renders actual storefront components and
   current drafts, not a separate approximate mockup.
8. **Role-aware simplicity:** navigation hides modules a role cannot use, while
   the server independently enforces every permission.
9. **Recoverability:** archive instead of destructive deletion, retain revision
   history, log mutations, and make rollback a documented operation.
10. **Accessible by default:** keyboard-complete controls, visible focus,
    labeled validation, logical headings, screen-reader announcements, and
    responsive behavior are release criteria.

### Shared interaction patterns

- Global `Cmd/Ctrl + K` search for products, collections, content entries,
  inquiries, subscribers, settings, and permitted admin destinations.
- Resource-list tabs for default views plus staff-created saved views.
- URL-backed search, filters, sort, page, and selected view so reload/back/share
  behavior is predictable.
- Column visibility preferences for dense lists.
- Select one, a page, or all matching resources; show selection scope before a
  bulk action.
- Bulk publish, unpublish, archive, tag, assign collection, assign owner, or
  export only where the domain permits it.
- Bulk edits validate all changes first and report row-level failures; partial
  success must be explicit rather than silent.
- A sticky save bar with Save, Discard, and contextual Preview/Publish actions.
- Toasts for transient confirmation, inline banners for actions requiring
  attention, and field-level errors for corrections.
- Confirmation dialogs state object count and impact; destructive actions
  require deliberate confirmation.
- Empty states teach the next action and never present a dead end.
- Loading skeletons preserve layout; errors include a safe retry and request ID.
- Keyboard shortcuts are discoverable in a help overlay and never conflict with
  text editing.
- Tables collapse into readable cards/actions on small screens; product editing
  remains functional on mobile even if bulk spreadsheet editing is desktop-only.

### Product editor

Use a Shopify-like sectioned detail page, tailored to jewelry:

- **Essentials:** title, short title, slug, description, status, tags, and
  primary collection.
- **Media:** drag/reorder gallery, primary image, variant image assignment,
  alt text, focal point, asset usage, replace, and archive.
- **Jewelry details:** metal, purity/karat, finish, stone type/shape, carat
  weight, dimensions, certificate lab/reference, care, lead time, and
  made-to-order status.
- **Variants:** option groups such as ring size, metal, and finish; generated
  combinations; per-variant SKU, price, compare-at price, cost, quantity,
  low-stock threshold, active/published state, and media.
- **Pricing:** integer minor-unit persistence with locale-aware display and
  currency; never use floating-point money in storage.
- **Inventory:** current quantity, availability policy, adjustment action,
  reason, note, and movement history. The edit form never silently overwrites
  quantity.
- **Organization:** collections, tags, featured status, and merchandising order.
- **Search preview:** SEO title/description guidance, canonical URL, and social
  image preview.
- **Publishing:** Save draft, Preview, Publish, Unpublish, Duplicate, Archive,
  revision history, author/timestamp, and conflict status.

### Admin information architecture

| Module | First-release responsibility | Primary Shopify-like behavior |
|---|---|---|
| Home | Actionable dashboard and onboarding checklist | Alerts, recent work, next actions |
| Products | Catalog list and product editor | Views, filters, bulk actions, sectioned editor |
| Collections | Category/curated groups and ordering | Search, manual ordering, status |
| Inventory | Variant stock and movement history | Dense editor, conflicts, adjustment reasons |
| Content | Home, About, global UI, SEO | Draft, preview, publish, revisions |
| Media | Shared public asset library | Search, usage, metadata, safe archive |
| Inquiries | Bespoke lead pipeline | Saved views, assignment, next follow-up |
| Subscribers | Consent-aware audience records | Filters, status, restricted export |
| Orders | Out of scope | Do not build order projections or commerce deep links |
| Analytics | Later bounded business summaries | Useful trends, no vanity dashboard |
| Team | Staff allowlist and roles | Invite, suspend, revoke, last login |
| Audit log | Mutation and access history | Filtered, redacted, immutable records |
| Settings | Integrations and non-secret configuration | Health/status, owner-only changes |

### Dashboard and onboarding

- First-login checklist: connect environment, create/verify owner, confirm media
  provider, review seeded catalog, add product, preview, publish, and invite team.
- KPI cards: published/draft products, low stock, new/overdue inquiries,
  subscribers over time, and integration health.
- Action queues: missing alt text/SEO, broken media, stale drafts, low stock,
  overdue follow-ups, failed webhooks, and unpublished changes.
- “Continue editing” and recent activity lists, filtered by permissions.
- Do not ship charts until their decision or action is explicit.

## Architecture options and recommendation

| Option | Description | Advantages | Costs and risks | Decision |
|---|---|---|---|---|
| A. MongoDB brand/admin platform | Build the tailored admin and MongoDB catalog/content/lead operations without commerce integration. | Meets the MongoDB requirement; best jewelry/content fit; incremental; storefront remains custom. | Requires deliberate schemas and domain-specific admin engineering. | **Recommended** |
| B. Shopify is the primary backend/admin now | Use Shopify products, content extensions, inventory, customers, orders, and admin; keep this site as a headless storefront. | Fastest route to proven commerce operations; less custom maintenance; built-in ecosystem. | MongoDB becomes secondary; bespoke editorial/lead workflows require apps or extensions; less control over admin experience and data model. | Viable if fastest commerce launch outweighs the MongoDB requirement |
| C. Fully custom MongoDB commerce | Build catalog, cart, checkout, discounts, payments, orders, tax, fulfillment, refunds, and all admin workflows. | Maximum control and one database. | Highest security, compliance, accounting, correctness, and operational burden; long delivery; duplicates mature commerce infrastructure. | Reject |

### Recommended source-of-truth boundary

- **MongoDB owns:** products, collections,
  jewelry metadata, structured content, media metadata, drafts/revisions,
  bespoke inquiries, newsletter subscribers, admin access, saved views,
  inventory history before commerce, and audit logs.
- **Object/media provider owns:** image/video binary storage and transformation.
- **Auth.js owns:** identities, linked accounts, sessions, and verification data;
  `adminAccess` remains the business allowlist and role source.
- **Commerce provider ownership:** not applicable to this project. Checkout,
  orders, payment state, taxes, discounts, fulfillment, refunds, and customer
  order identity are not modeled or integrated.
- Never store card data, payment credentials, session secrets, or unredacted
  webhook bodies in MongoDB.

No catalog-authority or synchronization decision is needed because commerce
integration is out of scope. If requirements change, create a separate plan
before adding a provider or order model.

## Technical architecture

### Application boundaries

- Move public routes beneath `app/(storefront)/` so URLs stay unchanged.
- Keep the root layout limited to document shell, global CSS, metadata defaults,
  and providers genuinely shared by both surfaces.
- Put public chrome and cart providers in `app/(storefront)/layout.*`.
- Create a dedicated `app/admin/layout.tsx`, a public login segment, and a
  protected admin segment. Admin pages never render public chrome.
- Prefer React Server Components for admin reads; add Client Components only
  for interactive tables, editors, uploads, dialogs, and local form state.
- Use Server Actions for first-party mutations and Route Handlers for Auth.js,
  signed uploads, preview toggles, health, and verified external webhooks.

### MongoDB access

- Use the official `mongodb` driver with one shared `MongoClient`.
- Use separate development, test, staging, and production databases.
- Add fail-fast server-only environment parsing and never expose the URI through
  a `NEXT_PUBLIC_*` value.
- Use Zod for input, persistence, admin DTO, and public DTO contracts.
- Keep repositories small and domain-focused; UI modules do not access raw
  collections.
- Use explicit projections. Never serialize raw MongoDB documents into Client
  Components or public responses.
- Create indexes through an idempotent script that also supports a check-only
  mode in CI.
- Use transactions for operations that must atomically update more than one
  document, especially inventory plus its movement record.
- Use integer `version` fields for optimistic concurrency; stale editors receive
  a compare/reload workflow, not last-write-wins.

### Authentication and authorization

- Use Auth.js with the official MongoDB adapter and database sessions.
- Start with an allowlisted OAuth provider, preferably Google Workspace if the
  team already uses it; otherwise select another supported provider before
  implementation. Do not build password auth casually.
- `adminAccess` stores normalized email, role, status, inviter, activation,
  last-login, and revocation timestamps.
- No public staff signup. An identity must have active allowlist access.
- Proxy/layout checks may improve redirects, but each server read and mutation
  must call centralized `requireActiveAdmin()`/`requirePermission()` close to
  the data source.
- Authorization defaults to deny. Hidden navigation is not authorization.
- Suspending a user revokes active sessions.
- Protect the last active owner from self-demotion or suspension.
- Add throttling, safe redirect validation, generic auth failures, secure
  cookies, request IDs, and security audit events.

### Roles and permissions

| Role | Access |
|---|---|
| Owner | Everything; team, integrations, audit export, owner recovery |
| Catalog | Products, collections, inventory, product media, catalog import/export |
| Content | Home/About/global content, editorial media, preview/publish |
| Operations | Inquiries, subscribers, and future order operations |
| Viewer | Read-only access to explicitly granted modules |

Permissions should be named capabilities such as `product:read`,
`product:write`, `product:publish`, `inventory:adjust`, `content:write`,
`content:publish`, `inquiry:write`, `subscriber:export`, `team:manage`, and
`audit:read`. Roles are bundles, and tests cover every role-permission pair.

### Publishing, caching, and preview

- Products, collections, and content use `draft`, `published`, and `archived`
  states with explicit timestamps and actors.
- Public repositories can return only public DTOs for published records.
- Use cache tags for catalog and content queries and invalidate only affected
  tags/paths after successful publication.
- Admin reads remain uncached so the editor sees saved data immediately.
- Authenticated preview uses Next.js draft mode and actual public components.
- Guessed draft URLs remain unavailable to public users.
- Store immutable published snapshots in `contentRevisions`; rollback creates a
  new revision rather than modifying history.

### Media

- Store binaries in Cloudinary or an S3-compatible object store, selected before
  media work begins. MongoDB stores provider key, URL, MIME, size, dimensions,
  alt text, checksum, lifecycle state, and usage references.
- Use a `MediaProvider` adapter with sign, finalize, metadata, replace, and
  archive operations.
- Validate permission, type, size, dimensions, and provider response on the
  server. Client metadata is advisory only.
- Existing `/public/images/**` become local asset records and stay usable.
- Published/in-use media cannot be hard-deleted. Archive and replace first.

## MongoDB collections

Every mutable business record includes `createdAt`, `updatedAt`, `createdBy`,
`updatedBy`, and `version`. Dates are UTC `Date`; internal relationships use
`ObjectId`; public URLs use unique slugs; money uses integer minor units plus ISO
currency.

### `products`

- Identity/status: title, short title, unique slug, status, published timestamp,
  archive reason.
- Jewelry: metal, karat, finish, stone type/shape, carat, dimensions,
  certification, care, made-to-order, and lead-time days.
- Merchandising: collections, tags, featured, sort position, description.
- Variants: stable ID, unique SKU, option values, price/compare-at/cost cents,
  currency, quantity, threshold, availability policy, active/published state,
  optional media reference.
- Ordered media references with semantic role and optional alt/focal overrides.
- SEO title, description, canonical override, and social image.
- Unique slug and SKU enforcement in both service validation and indexes.

### `catalogCollections`

- Unique slug, name, note, description, type (`category` or `curated`), status,
  hero media, SEO, ordering, and ordered product references.
- Slug changes create redirect records instead of silently breaking public URLs.

### `siteContent`

- Unique keys `home`, `about`, and `global`.
- Schema-validated draft and published payloads, revision, actors/timestamps,
  and optional scheduling metadata.
- Structured fields only. If rich text is approved later, sanitize at write and
  render boundaries.

### `mediaAssets`

- Provider/key, public URL, type/size/dimensions, checksum, filename, alt text,
  lifecycle, actor/timestamp, and usage references.
- Media is public-storefront material only; private inquiry inspiration uploads
  require a separate private bucket/access policy.

### `adminAccess` plus Auth.js collections

- Auth.js manages its documented users, accounts, sessions, and verification
  tokens.
- `adminAccess` manages the business allowlist, role, status, invitation,
  activation, last login, and session-revocation state.

### `inventoryMovements`

- Product/variant/SKU snapshot, quantity delta, resulting quantity, reason,
  note, actor, source reference, and timestamp.
- All adjustments go through one transactional service.

### `bespokeInquiries`

- Contact/brief: name, email, optional phone, timezone, occasion, jewelry type,
  budget band, target date, preferences, message, private inspiration assets,
  marketing consent, and source/UTM.
- Workflow: status, assignee, next follow-up, internal notes, timestamps.
- Public DTOs and notifications can never include internal notes.

### `newsletterSubscribers`

- Normalized unique email, subscribed/unsubscribed/bounced status, consent
  timestamp, source, locale, tags, provider ID, and timestamps.
- Signup is idempotent and returns a generic response that does not disclose
  prior membership.

### `savedViews`

- Owner user ID or shared role scope, resource type, name, normalized filter/
  sort/column definition, default flag, and timestamps.
- Validate filter keys against a per-resource allowlist; do not store executable
  query fragments.

### `auditLogs`, `contentRevisions`, `rateLimits`, and `integrationEvents`

- Audit: actor, action, resource, request ID, timestamp, redacted field-level
  change summary. No secrets or unnecessary inquiry PII.
- Revisions: immutable product/content published snapshots and provenance.
- Rate limits: hashed key, action/window/count, expiry with TTL index.
- Integration events: provider, external event ID, type, version/timestamp,
  processing state, attempts, redacted error, and expiry/retention policy.

### Required index families

- Unique: product slug, active SKU, collection slug, site-content key,
  provider+asset key, normalized admin email, normalized subscriber email,
  provider+external event ID.
- List/query: product status+updated time, collection+status, inventory threshold,
  inquiry status+created time, inquiry assignee+follow-up, subscriber status+
  created time, audit resource/actor+time, saved-view owner+resource.
- TTL only for intentional ephemeral data such as rate-limit buckets and adapter
  session behavior. Do not TTL-delete audit, inquiry, or consent history without
  an approved retention policy.

## Target route map

| Route | Access | Purpose |
|---|---|---|
| `/admin/login` | Public; signed-in staff redirect | Branded Auth.js sign-in |
| `/admin` | Active staff | Dashboard, onboarding, alerts, recent work |
| `/admin/search` | Active staff | Permission-filtered global search |
| `/admin/products` | Viewer+; write needs Catalog | Product views, filters, bulk actions |
| `/admin/products/new` | Catalog | Minimal draft creation |
| `/admin/products/[id]` | Viewer+/Catalog | Sectioned editor, preview, publish, history |
| `/admin/collections` | Viewer+/Catalog | Collection list and ordering |
| `/admin/collections/[id]` | Viewer+/Catalog | Metadata, media, products, SEO |
| `/admin/inventory` | Viewer+/Catalog | Variant stock, filters, adjustments |
| `/admin/media` | Viewer+; Catalog/Content write | Upload, reuse, usage, archive |
| `/admin/content` | Viewer+ | Content overview and publish status |
| `/admin/content/home` | Viewer+/Content | Homepage structured content |
| `/admin/content/about` | Viewer+/Content | About structured content |
| `/admin/content/global` | Viewer+/Content | Navigation, announcement, footer, default SEO |
| `/admin/inquiries` | Viewer+/Operations | Saved pipeline views |
| `/admin/inquiries/[id]` | Viewer+/Operations | Brief, notes, assignment, follow-up |
| `/admin/subscribers` | Viewer+/Operations | Consent-aware list/export |
| `/admin/orders` | Out of scope | Do not build commerce order projections |
| `/admin/team` | Owner | Invite, role, suspension, revocation |
| `/admin/audit-log` | Owner; optional viewer read | Redacted activity history |
| `/admin/settings` | Owner | Integration status and non-secret settings |

## Likely file and module layout

```text
app/
  layout.*
  (storefront)/
    layout.*
    page.*
    about/page.*
    collections/[slug]/page.*
    products/[slug]/page.*
  admin/
    layout.tsx
    (public)/login/page.tsx
    (protected)/
      layout.tsx
      page.tsx
      products/**
      collections/**
      inventory/**
      media/**
      content/**
      inquiries/**
      subscribers/**
      team/**
      audit-log/**
      settings/**
  api/
    auth/[...nextauth]/route.ts
    media/**
    preview/**
    webhooks/shopify/route.ts
components/admin/
  shell/**
  resource-list/**
  forms/**
  products/**
  content/**
  feedback/**
lib/
  env.ts
  mongodb.ts
  auth/**
  permissions/**
  db/**
  domain/**
  repositories/**
  services/**
  cache/**
  media/**
  integrations/shopify/**
scripts/db/**
tests/{unit,integration}/**
e2e/**
docs/decisions/**
```

## Phased implementation checklist

### Phase 0 — Resolve ownership and freeze the baseline

- [ ] Commit the route-restoration work or explicitly include it in the admin
  implementation branch; do not overwrite it during route moves.
- [ ] Confirm hosting/runtime, Atlas project/region, environment names, media
  provider, auth provider, initial owner provisioning, and Shopify intent.
- [ ] Write ADRs for MongoDB ownership, auth, media, and commerce boundaries.
- [ ] Record current `pnpm install --frozen-lockfile`, lint, and build results.
- [ ] Capture public route screenshots and key content/catalog fixtures for
  regression comparison.
- [ ] Assign migration/rollback owner and define maintenance/observation windows.

**Exit:** baseline is reproducible and every provider/source-of-truth decision
needed for platform work is documented.

### Phase 1 — Add TypeScript, validation, and verification foundations

- [ ] Introduce TypeScript for new server/admin/test code while preserving the
  existing `@/*` alias and migrating old JS only when touched.
- [ ] Add `mongodb`, `zod`, Auth.js adapter dependencies, Vitest, Testing Library
  where useful, and Playwright.
- [ ] Add `typecheck`, `test`, `test:unit`, `test:integration`, and `test:e2e`
  pnpm scripts.
- [ ] Add server-only environment validation and `.env.example` names/docs.
- [ ] Add test database guards that refuse destructive tests unless the database
  name ends with `_test`.
- [ ] Establish deterministic factories/fixtures for users, products, variants,
  content, inquiries, and subscribers.

**Exit:** lint, typecheck, and initial unit tests pass locally with pnpm.

### Phase 2 — Separate storefront and admin surfaces

- [ ] Move public routes into `app/(storefront)` without changing URLs.
- [ ] Move `SiteChrome`/`Footer` into the storefront layout.
- [ ] Create public-login and protected-admin layout boundaries.
- [ ] Build admin shell: skip link, side nav, mobile nav, global-search trigger,
  breadcrumbs, contextual actions, account, sign-out, and environment badge.
- [ ] Define admin tokens/components for surface, spacing, typography, density,
  focus, status badges, dialogs, toasts, banners, skeletons, and empty states.
- [ ] Confirm no public cart/header/footer appears under `/admin`.

**Exit:** public screenshots and URLs are unchanged; admin shell is isolated,
responsive, and keyboard navigable.

### Phase 3 — Establish MongoDB contracts, indexes, and scripts

- [ ] Add one reusable `MongoClient` and typed collection accessors.
- [ ] Add Zod persistence/admin/public schemas for every planned collection.
- [ ] Add repository interfaces and explicit DTO mapping.
- [ ] Add ping, index ensure/check, seed dry-run/apply, and script safety helpers.
- [ ] Document Atlas network rules, least-privilege DB users, backups, alerts,
  restore expectations, and environment isolation.
- [ ] Add a sanitized health endpoint that reveals no topology or credential data.

**Exit:** ping/index checks pass; only the approved module constructs a client;
schema and index tests cover uniqueness and TTL expectations.

### Phase 4 — Implement authentication and authorization

- [ ] Configure Auth.js, database sessions, provider, branded login, and auth
  route handler.
- [ ] Add proxy-level redirects only as an optimistic UX layer.
- [ ] Implement `adminAccess`, normalized email, invite/owner seed, role map,
  active-user check, permission checks, and session revocation.
- [ ] Authorize every admin query/mutation near the DAL/service.
- [ ] Deny unlisted and suspended users; prevent public staff signup.
- [ ] Add auth throttling, redirect validation, secure cookies, request IDs, safe
  errors, and audit events.
- [ ] Add last-owner protection and owner recovery runbook.

**Exit:** anonymous, unlisted, suspended, wrong-role, revoked-session, and
last-owner scenarios pass integration/E2E tests.

### Phase 5 — Migrate static catalog behind a reversible repository

- [ ] Implement `StaticCatalogRepository` and `MongoCatalogRepository` behind a
  temporary `CATALOG_SOURCE=static|mongodb` flag.
- [ ] Map the four current products and collections without changing slugs,
  public prices, images, or visible copy.
- [ ] Convert prices to cents and generate deterministic initial SKUs.
- [ ] Make seed dry-run the default; require explicit apply; upsert known seed
  records and never delete unknown records.
- [ ] Validate slugs, references, images, prices, SKUs, and duplicates before
  writing.
- [ ] Add repository tests for pagination, search, state visibility, projections,
  conflicts, and archives.

**Exit:** dry run reports 4+4 and zero writes; apply is idempotent; public DTOs
cannot return drafts, cost, actors, or internal fields.

### Phase 6 — Build the reusable Shopify-like resource-list system

- [ ] Create shared accessible table/card list primitives.
- [ ] Standardize URL search, filter, sort, page, visible columns, and selection.
- [ ] Add per-resource default views and validated personal/shared saved views.
- [ ] Add single-page and all-matching selection with explicit scope.
- [ ] Add permission-aware bulk action bar, confirmations, progress, cancellation
  where safe, and row-level outcome reporting.
- [ ] Add CSV export; defer import until dry-run/apply and row-level validation
  are complete.
- [ ] Add `Cmd/Ctrl + K` permission-filtered global search and recent items.
- [ ] Test keyboard, mobile, empty, loading, error, and large-result behavior.

**Exit:** Products, Collections, Inventory, Media, Inquiries, and Subscribers can
reuse the same interaction grammar without sharing domain rules improperly.

### Phase 7 — Build product and collection administration

- [ ] Build product list with saved views for All, Draft, Published, Archived,
  Low stock, Missing media, and Missing SEO.
- [ ] Build minimal product creation, then the sectioned jewelry editor.
- [ ] Add variant option generation, SKU checks, per-variant media/pricing/stock,
  and a desktop bulk variant editor.
- [ ] Add sticky Save/Discard, dirty state, field errors, success, conflict,
  navigation guard, Preview, Publish, Unpublish, Duplicate, and Archive.
- [ ] Add optimistic version checking and compare/reload conflict UX.
- [ ] Build collection metadata, hero, SEO, manual product ordering, and archive.
- [ ] Prevent hard deletion of referenced/published resources.
- [ ] Add revision/audit records for publish and destructive lifecycle actions.

**Exit:** a Catalog user can create, preview, publish, duplicate, update, and
archive a jewelry product; Viewer and unrelated roles cannot mutate it.

### Phase 8 — Add inventory operations

- [ ] Build variant inventory list with product, SKU, stock state, collection,
  and updated-time filters.
- [ ] Add adjustment modal requiring delta or target, reason, and optional note.
- [ ] Atomically update product quantity and create a movement record.
- [ ] Show recent movement history per variant and actor/source.
- [ ] Add low-stock thresholds and dashboard/list alerts.
- [ ] Build bulk inventory editor with stale-read conflict detection and review
  before save.
- [x] Keep inventory authority in MongoDB for this project; no commerce provider
  is connected.

**Exit:** every stock change is attributable and atomic; concurrent changes
cannot silently overwrite each other.

### Phase 9 — Add safe media management

- [ ] Implement selected provider adapter and authorized signing/finalization.
- [ ] Validate type, size, dimensions, checksum, and provider result server-side.
- [ ] Seed existing public images as local media records.
- [ ] Build upload, search, filter, selection, reuse, alt edit, focal point,
  usage, replace, and archive.
- [ ] Prevent hard deletion of any published/in-use asset.
- [ ] Separate public catalog/editorial media from private inquiry inspiration.
- [ ] Restrict Next image remote hosts to the confirmed CDN.

**Exit:** authorized staff can reuse governed assets; invalid/unauthorized
uploads and in-use deletion are blocked and tested.

### Phase 10 — Cut public catalog reads to MongoDB

- [ ] Add cached server queries for home catalog, collection slug, product slug,
  and related products.
- [ ] Replace direct public `data/products.js` imports with repository calls.
- [ ] Remove build-time assumptions that block new published slugs.
- [ ] Add product/collection metadata generation and precise cache tags.
- [ ] Add authenticated real-component preview and public draft 404 behavior.
- [ ] Compare static and Mongo sources in staging for count, slug, price,
  collection, and primary media.
- [ ] Switch staging, then production, while retaining static rollback for one
  release window.

**Exit:** seeded and newly published pages resolve without redeploy; drafts stay
private; public values match baseline; rollback has been exercised.

### Phase 11 — Add structured content management

- [ ] Model and seed Home, About, and Global content without changing output.
- [ ] Build structured editors with save, preview, publish, revision list, and
  rollback.
- [ ] Reference products/collections/media by ID and validate publishability.
- [ ] Add SEO guidance, alt requirements, broken-link validation, and real-page
  preview.
- [ ] Add precise cache invalidation per content key.
- [ ] Add scheduling only after a reliable scheduler and failure workflow exist.

**Exit:** content staff can safely update public pages without code/deploy;
draft, publish, and rollback behavior is covered end-to-end.

### Phase 12 — Add bespoke inquiries and newsletter operations

- [ ] Add a structured inquiry form with validated private inspiration upload
  and retain a contact fallback.
- [ ] Add footer subscription action with email normalization, consent, honeypot,
  rate limiting, idempotency, and generic response.
- [ ] Build inquiry views, detail, assignment, status pipeline, follow-up,
  internal notes, and restricted export.
- [ ] Build subscriber filters, consent evidence, status/unsubscribe, and
  restricted export.
- [ ] Add provider-neutral notifications outside DB transactions with retry.
- [ ] Approve PII retention, access, export, and deletion procedures before
  production.

**Exit:** valid submissions appear in role-protected admin workflows; internal
notes and membership state never leak publicly.

### Phase 13 — Add dashboard, team, audit, and usability polish

- [ ] Add indexed, bounded dashboard cards and action queues.
- [ ] Add onboarding checklist, continue-editing, and recent activity.
- [ ] Add Team invitation, activation, role, suspension, session revocation,
  last login, and last-owner protection UI.
- [ ] Add redacted Audit log search/filter/detail and owner-only export.
- [ ] Finish unsaved-change protection, command palette, keyboard shortcut help,
  responsive tables/cards, focus management, screen-reader announcements,
  error recovery, and request IDs.
- [ ] Run editor usability sessions for Product publish, Content publish,
  Inventory adjust, and Inquiry follow-up; address critical friction.

**Exit:** a first-time staff user can complete the core workflows from the UI
without developer assistance or undocumented knowledge.

### Phase 14 — Explicitly out of scope: commerce integration

- [x] Record that Shopify is only the admin usability reference.
- [x] Keep checkout, orders, payments, tax, fulfillment, webhooks, and
  synchronization out of this MongoDB admin project.
- [x] Route any future commerce request to a separate approved plan with its
  own source-of-truth and security decisions.

**Exit:** this plan builds the MongoDB-backed admin experience only; no Shopify
or other commerce provider is integrated.

### Phase 15 — CI, rollout, documentation, and handoff

- [ ] Add GitLab stages for frozen pnpm install, lint, typecheck, unit,
  isolated-Mongo integration, critical E2E, and production build.
- [ ] Add dependency/security and secret scanning with documented exceptions.
- [ ] Keep production credentials unavailable to merge-request jobs.
- [ ] Write setup, env, index/seed/migration, access recovery, backup/restore,
  provider outage, cache, and rollback runbooks. No Shopify sync runbook is
  required.
- [ ] Run staging editor UAT, accessibility checks, representative query explain
  plans, backup/restore drill, and static-catalog rollback drill.
- [ ] Roll out in order: indexes, seed, owner-only admin, catalog/content
  migration, comparison, public read switch, monitoring, then role expansion.
- [ ] Update README, changelog, ADRs, and plan tracker status.

**Exit:** clean-clone setup is documented, GitLab is green, staging drills pass,
and operational ownership is accepted.

## Verification matrix

| Concern | Automated verification | Manual/operational verification |
|---|---|---|
| Install/lockfile | `pnpm install --frozen-lockfile` | Fresh clone follows README |
| Static quality | `pnpm lint`, `pnpm typecheck` | No new baseline warnings |
| Unit behavior | `pnpm test:unit` | Review schemas/transitions/permissions |
| Mongo behavior | `pnpm test:integration` with isolated `_test` DB | Atlas roles/backups/alerts reviewed |
| Admin workflows | `pnpm test:e2e` | Editor UAT on desktop and mobile |
| Production compilation | `pnpm build` | Staging smoke of all public/admin routes |
| Auth/RBAC | Role matrix integration tests; direct mutation denial | Suspend/revoke and owner recovery drill |
| Data isolation | DTO/redaction tests; client-bundle secret scan | Inspect public payloads and logs |
| Indexes | `pnpm db:indexes -- --check` | Explain plans on representative data |
| Migration | Seed dry-run/idempotency/parity tests | Compare 4 products and 4 collections |
| Publishing/cache | Draft 404, preview auth, publish E2E | New slug appears without redeploy |
| Concurrency | Stale-version and bulk-conflict tests | Two-editor conflict exercise |
| Inventory | Transaction and movement tests | Adjustment audit trail review |
| Media | Signing/finalize/type/usage tests | CDN render, alt, replacement checks |
| Accessibility | Automated scan and keyboard E2E | Keyboard/screen-reader critical paths |
| PII/consent | Redaction, rate-limit, idempotency tests | Retention/export/delete procedure review |
| Commerce integration | Out of scope | No signature, reconciliation, or checkout drill is required |
| Rollback | Feature-flag/static-source tests | Staging backup/restore and source rollback |

## Required pnpm command contract

| Purpose | Command | Expected result |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | Exit 0; lockfile unchanged |
| Lint | `pnpm lint` | Exit 0; no added warnings |
| Typecheck | `pnpm typecheck` | Exit 0 |
| Unit | `pnpm test:unit` | All unit tests pass |
| Integration | `pnpm test:integration` | Isolated Mongo suite passes |
| E2E | `pnpm test:e2e` | Critical public/admin flows pass |
| Test aggregate | `pnpm test` | Unit and integration pass |
| DB ping | `pnpm db:ping` | Safe success without credentials/topology |
| Index apply | `pnpm db:indexes` | Idempotent apply succeeds |
| Index check | `pnpm db:indexes -- --check` | Required indexes present |
| Seed preview | `pnpm db:seed -- --dry-run` | Reports 4+4, performs zero writes |
| Seed apply | `pnpm db:seed -- --apply` | Idempotent known-record upsert |
| Build | `pnpm build` | Public and admin compile |

## Acceptance criteria

- [ ] `/admin` has a separate responsive shell and never renders storefront
  chrome.
- [ ] Anonymous, unlisted, suspended, and unauthorized users cannot access data
  or invoke mutations.
- [ ] Every server query and mutation authorizes near the data source and
  validates untrusted input.
- [ ] Owner, Catalog, Content, Operations, and Viewer permissions are covered by
  a complete default-deny test matrix.
- [ ] Staff can find work through global search, saved resource views, filters,
  pagination, and consistent module navigation.
- [ ] Product editing includes jewelry details, variants, per-variant pricing/
  inventory/media, SEO, sticky save state, preview, publish, duplicate, archive,
  revision, and conflict handling.
- [ ] Resource lists support accessible selection and domain-safe bulk actions
  with clear all-matching scope and row-level errors.
- [ ] All stock changes create an atomic, attributable movement record.
- [ ] Media is provider-backed, validated, reusable, accessible, and protected
  from in-use hard deletion.
- [ ] Home, About, and global content support structured draft, real preview,
  publish, revision, and rollback.
- [ ] Public catalog/content reads only published DTOs from MongoDB and new
  published slugs work without deployment.
- [ ] Static catalog migration preserves current routes, product count, prices,
  collections, visible copy, and media and is safe to run twice.
- [ ] Bespoke and newsletter submissions validate, rate-limit, retain consent,
  and expose only appropriate data to each role.
- [ ] Audit logs are immutable and redacted; secret/PII scans find no prohibited
  values in logs, client bundles, or public payloads.
- [ ] Required unique/query/TTL indexes exist and representative list/dashboard
  queries use appropriate indexes.
- [ ] `pnpm install --frozen-lockfile`, lint, typecheck, test suites, and build
  pass in GitLab with an isolated test DB.
- [ ] Accessibility and editor UAT pass the Product publish, Content publish,
  Inventory adjustment, and Inquiry follow-up journeys.
- [ ] Backup/restore and static-catalog rollback are exercised in staging.
- [x] Shopify integration is explicitly out of scope; no commerce ownership,
  webhook, reconciliation, or projection tests are required for this plan.
- [ ] README, `.env.example`, ADRs, runbooks, changelog, and this tracker reflect
  the delivered system.

## Rollout and rollback

### Rollout

1. Establish tests, separate layouts, Mongo connection, and indexes with no
   public data-source change.
2. Enable auth and owner-only admin in development/staging.
3. Seed and compare catalog while public reads remain static.
4. Complete catalog admin and editor UAT.
5. Enable Mongo public reads in staging, compare outputs, and monitor.
6. Enable Mongo public reads in production behind `CATALOG_SOURCE` after backup.
7. Add content, lead, and role modules incrementally after catalog stability.
8. Expand staff roles only after role-specific UAT.
9. Remove the static repository only in a later approved cleanup after one
   stable release window.

### Rollback

- Switch `CATALOG_SOURCE` back to `static` for public catalog read regressions.
- Disable admin mutation feature flags while leaving read/audit access available.
- Restore a MongoDB snapshot only for confirmed data corruption; prefer revision
  rollback for content/product mistakes.
- Keep seed/migration scripts additive/idempotent and never delete unknown data.
- Revert route-group/layout changes as one isolated commit if public routing or
  chrome regresses.
- Keep media/provider work independently recoverable; no Shopify integration
  jobs or event records exist in this project.
- Record rollback reason, operator, time, affected data, and re-entry conditions.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Admin inherits public layout | Confusing/insecure surface | Route groups and layout regression tests first |
| UI-only permission checks | Unauthorized reads/writes | Central server-only DAL checks and direct-call tests |
| Secrets enter client bundle | Credential compromise | Server-only env module, bundle/secret scans, no public env names |
| Static-to-Mongo drift | Broken URLs/prices/content | Dry-run, idempotency, comparison mode, reversible repository flag |
| Stale writes | Lost editor/inventory changes | Version filters, conflicts, transactions, review before bulk save |
| Unbounded Mongo queries | Slow admin and cost growth | Pagination, filter allowlists, indexes, explain checks |
| Media abuse or orphaning | Cost/security/accessibility | Signed uploads, server validation, usage graph, archive policy |
| Overbuilt “Shopify clone” | Long delivery and poor fit | Workflow parity only; phased domain-specific scope and non-goals |
| Underbuilt admin UX | Staff return to developer edits | Shared patterns, onboarding, editor UAT, measurable task completion |
| Commerce integration creeps into scope | Security/compliance/operational burden | Explicitly out of scope; require a separate approved plan |
| PII retained excessively | Privacy/legal exposure | Explicit projections, role restrictions, retention/export/delete policy |
| Dashboard aggregations degrade | Slow home page | Bounded indexed queries; defer non-actionable charts |
| Existing dirty work overwritten | User work loss | Resolve/commit before route move and inspect live diffs during execution |

## STOP conditions

Stop and obtain a decision if:

- Route-restoration changes remain unresolved when implementation would move or
  rewrite overlapping files.
- Hosting/runtime, Atlas environment, auth provider, owner provisioning, or
  media provider is unknown at its dependent phase.
- Production MongoDB contains undocumented data or ownership.
- Duplicate slugs/SKUs block indexes or migration mapping.
- Transactions are unavailable for a required atomic inventory operation.
- A design relies on hidden navigation, Proxy, or layout checks as authorization.
- A secret would need to enter client code or a public environment variable.
- Current URLs, prices, or catalog items would change without an approved map.
- Shopify or another commerce integration is requested without a separate
  approved plan.
- PII export/deletion/retention policy is unresolved before public lead launch.
- A verification command still fails after two scoped correction attempts.

## Open decisions required before dependent phases

- Deployment provider/runtime and preview/staging strategy.
- MongoDB Atlas project, region, environment databases, backup tier, and owners.
- Authentication provider and initial owner provisioning/recovery process.
- Media provider, public/private bucket separation, limits, and transformations.
- Commerce integration is not planned. Revisit only through a separate approved
  plan if business requirements change.
- Currency, pricing authority, inventory authority, location model, and whether
  made-to-order products decrement stock.
- Exact staff roles/emails and whether saved views can be shared by role.
- Inquiry/subscriber retention, export rights, deletion, notification provider,
  and consent wording.
- Domain redirects when staff change product/collection slugs.
- Whether scheduled publishing is necessary and what reliable scheduler owns it.

## Executor handoff

1. Read this plan completely and inspect current diffs; do not assume the
   advisor draft is newer than this durable plan.
2. Resolve Phase 0 decisions and seek plan approval before implementation.
3. Execute phases sequentially. Do not start UI mutations before auth and DAL
   authorization exist.
4. Commit by phase/concern so route movement, data migration, and UI work remain
   reviewable and independently reversible.
5. Record deviations in ADRs and update this plan before expanding scope.
6. Use `kenmark-plans-execute` only after this plan is approved.

## References

- MongoDB official Next.js integration:
  https://www.mongodb.com/docs/drivers/node-frameworks/next-integration/
- MongoDB official index properties:
  https://www.mongodb.com/docs/manual/core/indexes/index-properties/
- Auth.js official MongoDB adapter:
  https://authjs.dev/getting-started/adapters/mongodb
- Auth.js official role-based access control guide:
  https://authjs.dev/guides/role-based-access-control
- Shopify official list search/filter/saved-view guide:
  https://help.shopify.com/en/manual/shopify-admin/productivity-tools/searching-filtering-views
- Shopify official admin search guide:
  https://help.shopify.com/en/manual/shopify-admin/admin-search
- Shopify official bulk-editing guide:
  https://help.shopify.com/en/manual/shopify-admin/productivity-tools/bulk-editing
- Shopify official product and variant guides:
  https://help.shopify.com/en/manual/products
