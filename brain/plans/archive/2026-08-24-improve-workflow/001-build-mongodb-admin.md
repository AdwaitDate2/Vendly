# Plan 001: Build a secure MongoDB-backed admin platform

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the STOP conditions occurs, stop and report; do not
> improvise. When done, update this plan's status in `plans/README.md` unless a
> reviewer explicitly says they maintain the index.
>
> **Drift check (run first)**:
>
> ```bash
> git diff --stat 291617a..HEAD -- app components data lib scripts tests package.json pnpm-lock.yaml jsconfig.json tsconfig.json next.config.mjs proxy.ts auth.ts .env.example .gitlab-ci.yml
> git status --short
> ```
>
> The plan was written while the working tree contained uncommitted route
> restoration changes. If those changes remain uncommitted, compare the
> Current state excerpts with the live files and incorporate them deliberately
> before implementation. Do not overwrite or discard them.

## Status

- **Priority**: P1
- **Effort**: L, approximately 4–7 engineer-weeks for one experienced engineer
- **Risk**: HIGH — introduces authentication, authorization, persistence,
  media handling, data migration, and a storefront data-source cutover
- **Depends on**: none, but the route-restoration working tree must be resolved
- **Category**: direction / architecture / security / migration
- **Planned at**: commit `291617a`, 2026-08-24, with documented uncommitted
  route-restoration changes

## Outcome

After this plan is complete, byShreen staff will have a private `/admin`
workspace backed by MongoDB for catalog, collections, editorial content,
inventory, media metadata, bespoke inquiries, newsletter subscribers, team
access, and audit history. The public storefront will read published catalog
and content data from MongoDB with precise cache invalidation. Drafts and admin
data will never be exposed to public users.

Checkout, payment capture, refunds, tax calculation, and fulfillment remain
outside the initial admin release. The existing product direction in
`README.md:27-29` names Shopify Storefront API; if commerce is enabled later,
Shopify should own checkout/orders/payments and MongoDB should store only the
normalized operational fields required by this admin.

## Why this matters

The current storefront is a polished static prototype, not an operable content
or commerce system. Four products and four categories live in
`data/products.js`, the cart exists only in client memory, the newsletter form
has no submit behavior, and there is no database, authentication, API, test
suite, or deployment pipeline. Any catalog or content change currently requires
a developer and a deployment.

An admin cannot be bolted directly under the existing root layout because
`app/layout.js` wraps every route in the public header, cart, and footer. The
implementation must first create distinct storefront and admin layout
boundaries, then add secure server-only data access and permissions before any
mutation UI is built.

## Confirmed current state

### Stack and verification baseline

- `package.json:5-20` pins pnpm 10.12.1, Next.js 16.3.2, React 19.2.8, and
  ESLint. There are no database, auth, validation, test, or TypeScript runtime
  dependencies.
- Current commands are `pnpm dev`, `pnpm build`, `pnpm start`, and
  `pnpm lint`. There is no `typecheck` or `test` script.
- The verified baseline before this plan: `pnpm build` exits 0; `pnpm lint`
  exits 0 with six existing `@next/next/no-img-element` warnings.
- `.gitignore:9-11` excludes secret-bearing `.env*` files while allowing an
  `.env.example`; no example environment file currently exists.
- The Git remote is GitLab, so CI work belongs in `.gitlab-ci.yml`, not a
  GitHub Actions workflow.

### Storefront structure

- `app/layout.js:10-17` places `SiteChrome` and `Footer` around every route.
  An `/admin` route created today would inherit the public announcement bar,
  navigation, cart drawer, and footer.
- `components/SiteChrome.jsx:7-14` installs the client-side `CartProvider`,
  header, and cart drawer for all children.
- `app/globals.css:3-13` defines the existing brand tokens: ivory, paper, ink,
  olive, mulberry, wine, serif, and sans. Admin UI may reuse the color and type
  tokens, but should have a separate dense workspace stylesheet.
- The public route set is `/`, `/about`, `/collections/[slug]`, and
  `/products/[slug]`. The working tree has restored these routes after a prior
  homepage-only preview.

### Catalog and cart data

- `data/products.js:1-50` contains exactly four product objects with `slug`,
  `title`, `shortTitle`, dollar price, single category slug, metal, stone,
  local image paths, and description.
- `data/products.js:52-57` contains four categories with slug, name, hero image,
  and note.
- `app/page.js:42-58` renders the category and product arrays directly.
- `app/collections/[slug]/page.js:6-24` builds category paths from the static
  array and filters products in memory.
- `app/products/[slug]/page.js:8-16` builds product paths from the static array
  and performs an in-memory slug lookup.
- `components/CartProvider.jsx:8-30` keeps the entire cart in React state. It is
  lost on refresh and has no server-side validation.
- `components/CartDrawer.jsx:37-42` calculates a client-side estimated total
  and explicitly labels checkout as a demo.

### Content and lead capture

- Homepage editorial copy and bespoke-process steps are embedded directly in
  `app/page.js:6-112`.
- About-page copy is embedded directly in `app/about/page.js`.
- `components/Footer.jsx:18-20` renders a newsletter form with no action.
- Bespoke calls to action currently use `mailto:` links rather than a trackable
  inquiry workflow.
- There are no API route handlers, Server Actions, authentication checks,
  environment validation, database connection modules, tests, or CI config.

## Architecture decisions

These are the recommended defaults. Any change must be recorded in a short ADR
under `docs/decisions/` before implementation continues.

1. **MongoDB access**: use the official `mongodb` Node.js driver, one shared
   `MongoClient`, Zod at every input/output boundary, and small repository and
   service modules. Do not add Mongoose in this phase.
2. **Database hosting**: use MongoDB Atlas with separate development, test,
   staging, and production databases. The application database user receives
   only the permissions it needs; admin operators do not reuse that credential.
3. **Language**: write all new auth, database, service, admin, and test code in
   TypeScript. Keep existing public JavaScript until each file is touched by the
   MongoDB cutover.
4. **Authentication**: use Auth.js with `@auth/mongodb-adapter` and database
   sessions. Recommended first provider is Google OAuth restricted by a
   normalized-email allowlist. If the team cannot use Google, stop and select a
   supported OAuth or magic-link provider before writing custom credentials
   auth.
5. **Authorization**: use an `adminAccess` collection plus a centralized
   `requirePermission()` data-access function. Proxy may provide an early
   redirect, but every server-side read and mutation must authorize again close
   to the data source.
6. **Mutations**: use Server Actions for admin forms and service-layer functions
   for business rules. Use Route Handlers only for Auth.js, signed media upload
   flows, health checks, preview toggles, and verified external webhooks.
7. **Caching**: keep `cacheComponents` disabled initially because the current
   config does not enable it. Wrap public MongoDB query functions with
   `unstable_cache`, tag catalog/content data, and invalidate affected tags and
   paths after successful mutations. Admin reads remain uncached.
8. **Media**: store binary files in an object/media service, never in MongoDB.
   MongoDB stores asset metadata, provider key, URL, dimensions, MIME type,
   alt text, usage, and lifecycle status. Use a provider adapter so deployment
   can choose Cloudinary or S3-compatible storage without changing catalog code.
9. **Publishing**: products and content use explicit draft/published/archived
   states. Public repositories return published records only. Admin preview
   requires both an authenticated session and Next.js draft mode.
10. **Commerce boundary**: MongoDB owns catalog/content/admin workflows.
    Shopify, if selected, owns checkout, payment, order, tax, and fulfillment
    truth. Never store card data in MongoDB.

## Target route map

| Route | Access | Purpose |
|------|--------|---------|
| `/admin/login` | Public, redirects signed-in staff | Custom branded Auth.js sign-in |
| `/admin` | Any active staff role | Dashboard and actionable alerts |
| `/admin/products` | Viewer+; mutations require catalog permission | Searchable, paginated product list |
| `/admin/products/new` | Catalog | Create a draft product |
| `/admin/products/[id]` | Viewer+ / Catalog | Edit, preview, publish, duplicate, archive |
| `/admin/collections` | Viewer+ / Catalog | Manage collection metadata and ordering |
| `/admin/inventory` | Viewer+ / Catalog | Variant quantities, low-stock thresholds, movement history |
| `/admin/media` | Viewer+ / Catalog or Content | Upload, reuse, replace, and inspect asset usage |
| `/admin/content/home` | Viewer+ / Content | Homepage sections, featured products, SEO |
| `/admin/content/about` | Viewer+ / Content | About-page content and imagery |
| `/admin/content/global` | Viewer+ / Content | Announcement, navigation, contact, socials, footer, default SEO |
| `/admin/inquiries` | Viewer+ / Operations | Bespoke inquiry pipeline and internal notes |
| `/admin/subscribers` | Viewer+ / Operations | Consent-aware newsletter subscriber list/export |
| `/admin/team` | Owner only | Allowlist, roles, disable/revoke access |
| `/admin/audit-log` | Owner; viewer read optional | Immutable operational history |
| `/admin/settings` | Owner | Provider/integration status and non-secret settings |

## Role and permission matrix

Do not authorize by UI visibility alone. Each permission is enforced inside the
DAL/service called by the Server Action or Route Handler.

| Role | Intended access |
|------|-----------------|
| `owner` | All permissions, team management, integration settings, audit export |
| `catalog` | Products, collections, inventory, product media, catalog import/export |
| `content` | Homepage/about/global content, editorial media, preview/publish |
| `operations` | Bespoke inquiries, subscribers, future order operations |
| `viewer` | Read-only access to authorized admin modules; no mutations |

Define named permissions such as `product:read`, `product:write`,
`product:publish`, `inventory:adjust`, `content:write`, `content:publish`,
`inquiry:write`, `subscriber:export`, `team:manage`, and `audit:read`. A role is
only a bundle of permissions.

## MongoDB model

All money values are integer minor units (`priceCents`) plus ISO currency
(`USD`). All timestamps are UTC `Date` values. Public URLs use unique slugs;
internal relationships use `ObjectId`. Every mutable business document carries
`createdAt`, `updatedAt`, `createdBy`, `updatedBy`, and integer `version` fields
for optimistic concurrency.

### `products`

- Identity: `_id`, unique `slug`, `title`, `shortTitle`, `status`
  (`draft | published | archived`), `publishedAt`.
- Merchandising: `primaryCollectionId`, `collectionIds`, `tags`, `featured`,
  `sortOrder`, `description`.
- Jewelry details: `metal`, `karat`, `stoneType`, `caratWeight`, `stoneShape`,
  `certificationLab`, optional certificate reference, dimensions, care notes,
  made-to-order flag, and lead-time days.
- Variants: stable variant ID, unique SKU, size, metal/finish options,
  `priceCents`, optional compare-at/cost values, quantity, low-stock threshold,
  availability policy, and active flag.
- Media: ordered references to `mediaAssets`, role (`primary | gallery | video |
  certificate`), alt text override, and focal-point metadata.
- SEO: title, description, canonical override, and social image reference.
- Governance: `version`, timestamps, actor IDs, and optional archive reason.

Validate SKU uniqueness both within a product document and across documents.
Create a partial unique multikey index where MongoDB supports the chosen shape;
the service must still reject duplicate SKUs inside one document.

### `catalogCollections`

- `_id`, unique `slug`, name, note, long description, type
  (`category | curated`), status, hero media, SEO, sort order, and ordered
  `productIds` for manual merchandising.
- The four current categories seed as `type: category` documents.
- Collection slug changes require a redirect record; do not silently break an
  indexed URL.

### `mediaAssets`

- Provider, unique provider key, public URL, MIME type, byte size, width, height,
  duration when applicable, original filename, alt text, lifecycle status,
  checksum, created actor/time, and usage references.
- Upload allowlist: JPEG, PNG, WebP, AVIF, and approved video formats; enforce
  provider-specific size limits on both the signing endpoint and completion
  callback.
- Assets referenced by published content cannot be hard-deleted. Mark them
  archived and require replacement first.

### `siteContent`

- Unique `key`: `home`, `about`, or `global`.
- Separate schema-validated `draft` and `published` payloads, revision number,
  draft/publish actor IDs, timestamps, and optional scheduled publish time.
- `home`: hero, introduction, selected collections, featured products, story,
  purpose, values, bespoke steps/CTA, closing section, and page SEO.
- `about`: hero, purpose, founder story, CTA, and page SEO.
- `global`: announcement, navigation, contact email, social links, footer,
  newsletter copy, default SEO, and organization metadata.
- Do not store arbitrary executable HTML. Use structured fields and plain text;
  if limited rich text is later approved, sanitize it on write and render.

### Auth.js collections and `adminAccess`

- Allow Auth.js MongoDB adapter to own its documented user, account, session,
  and verification-token collections.
- `adminAccess`: normalized unique email, role, status (`invited | active |
  suspended`), display name, invited/activated timestamps, inviter, last login,
  and session-revocation timestamp.
- Sign-in callback denies anyone without active allowlist access. Suspending an
  account invalidates database sessions and all subsequent DAL checks.

### `inventoryMovements`

- Product ID, variant ID, SKU snapshot, quantity delta, resulting quantity,
  reason (`receive | correction | sale | return | damage | reserve | release`),
  note, actor, source reference, and timestamp.
- Inventory is changed through one service that writes the product update and
  movement record in a transaction. Never update quantity directly from a form.

### `bespokeInquiries`

- Public fields: contact name/email/phone, location/time zone, occasion,
  jewelry type, budget band, target date, metal/stone preferences, message,
  inspiration asset references, marketing consent, and consent timestamp.
- Workflow fields: status (`new | contacted | consultation | quoted | won |
  lost | spam`), assignee, next follow-up, internal notes, source/UTM, created and
  updated timestamps.
- Keep internal notes out of every public DTO and notification payload.

### `newsletterSubscribers`

- Normalized unique email, status (`subscribed | unsubscribed | bounced`),
  consent timestamp, source, locale, tags, created/updated timestamps, and
  external email-provider ID when integrated.
- Repeated signup is idempotent and refreshes consent only when the user
  explicitly submits again.

### `auditLogs`, `contentRevisions`, and `rateLimits`

- `auditLogs`: actor, action, resource type/ID, request ID, timestamp, and a
  redacted field-level change summary. Do not store credentials, session tokens,
  full inquiry messages, or unnecessary PII in logs.
- `contentRevisions`: immutable published snapshots for product/content rollback.
- `rateLimits`: hashed key, action, count/window metadata, and expiry. Apply a
  TTL index so expired buckets are removed automatically.

### Required indexes

- Unique: product slug; active SKU path (partial when appropriate); collection
  slug; media provider+key; site-content key; normalized admin email; normalized
  subscriber email.
- Query support: product status+updatedAt; product collection IDs+status;
  inventory quantity/threshold; inquiry status+createdAt; inquiry assignee+
  nextFollowUpAt; audit resource+timestamp; audit actor+timestamp; subscriber
  status+createdAt.
- TTL: Auth.js/session behavior as documented by its adapter and the custom
  rate-limit expiry field. Do not add TTL deletion to audit or inquiry data
  until a written retention policy is approved.

## Commands the executor will establish

| Purpose | Command | Expected success |
|---------|---------|------------------|
| Install | `pnpm install --frozen-lockfile` | Exit 0; lockfile unchanged |
| Lint | `pnpm lint` | Exit 0; do not add warnings |
| Typecheck | `pnpm typecheck` | Exit 0; no type errors |
| Unit tests | `pnpm test:unit` | All tests pass |
| Integration tests | `pnpm test:integration` | All MongoDB repository/action tests pass against an isolated test DB |
| E2E tests | `pnpm test:e2e` | Admin auth and critical workflows pass |
| All tests | `pnpm test` | Unit + integration pass |
| DB connectivity | `pnpm db:ping` | Reports database name/environment and successful ping, never URI/credentials |
| Index verification | `pnpm db:indexes -- --check` | Exit 0; required indexes present |
| Seed dry run | `pnpm db:seed -- --dry-run` | Reports four products/four collections, performs zero writes |
| Production build | `pnpm build` | Exit 0; storefront and admin routes compile |

The executor must add these scripts to `package.json` and document required
environment variables in `.env.example` and `README.md`.

## Suggested executor toolkit and references

- If available, use the `impeccable` skill for the admin information
  architecture and responsive workspace UI, then use the testing skills for
  unit, integration, E2E, and CI implementation.
- Installed Next.js references:
  - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route-groups.md`
  - `node_modules/next/dist/docs/01-app/02-guides/authentication.md`
  - `node_modules/next/dist/docs/01-app/02-guides/data-security.md`
  - `node_modules/next/dist/docs/01-app/02-guides/forms.md`
  - `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md`
- Official external references:
  - MongoDB Next.js integration: https://www.mongodb.com/docs/drivers/node-frameworks/next-integration/
  - MongoDB index properties: https://www.mongodb.com/docs/manual/core/indexes/index-properties/
  - Auth.js MongoDB adapter: https://authjs.dev/getting-started/adapters/mongodb
  - Auth.js RBAC: https://authjs.dev/guides/role-based-access-control

## Scope

### In scope

- `package.json`, `pnpm-lock.yaml`, `.env.example`, `tsconfig.json`
  (replacing `jsconfig.json` only after aliases are preserved), test configs,
  `next.config.mjs`, `proxy.ts`, and `.gitlab-ci.yml`.
- `auth.ts`, `app/api/auth/[...nextauth]/route.ts`, protected auth/DAL modules.
- Route grouping and layouts under `app/(storefront)/**` and `app/admin/**`.
- MongoDB/env/domain code under `lib/**`.
- Admin UI components and styles under `components/admin/**`.
- Catalog/content/inquiry public integration in existing `app/**` and
  `components/**` files.
- Idempotent database scripts under `scripts/**`.
- Unit/integration tests under `tests/**` and E2E tests under `e2e/**`.
- Documentation updates in `README.md`, `brain/CHANGELOG.md`, and one ADR per
  changed architectural decision.

### Out of scope

- Custom card payment processing, tax, refund, chargeback, or payout logic.
- A custom replacement for Shopify checkout/order infrastructure.
- Customer accounts, wishlists, loyalty points, reviews, discount engines, or
  gift cards in the first release.
- A generic page-builder DSL, arbitrary HTML/JavaScript content, or plugin
  system.
- Rebuilding the public visual design or replacing existing image assets.
- Real-time multi-user editing, websockets, or offline mode.
- Storing media blobs or secrets in MongoDB.
- Migrating every existing JavaScript component to TypeScript solely for
  consistency.

## Git workflow

- Start only after the route-restoration changes are committed or intentionally
  included. Branch from the updated default branch as
  `feature/mongodb-admin-platform`.
- Match the repository's conventional commit direction. Examples already in
  history include `feat(web): limit WIP preview to homepage` and
  `chore(config): prevent generated agent-rule files`.
- Commit per internal milestone. Never mix a data migration with unrelated UI
  polish in the same commit.
- Do not push, merge, or deploy unless the operator explicitly requests it.

## Implementation milestones

### Milestone 0: Resolve decisions and freeze the baseline

1. Commit or deliberately incorporate the current route-restoration changes.
2. Confirm the deployment target, Atlas project/region, database names, auth
   provider, initial owner emails, media provider, and whether Shopify remains
   the future commerce provider.
3. Write ADRs for the MongoDB source-of-truth boundary, authentication provider,
   media provider, and commerce boundary.
4. Record a rollback owner and maintenance window for the catalog cutover.
5. Run the current install/lint/build baseline and record existing warnings.

**Verify**:

```bash
git status --short
pnpm install --frozen-lockfile
pnpm lint
pnpm build
```

Expected: working tree is understood and intentional; install/build exit 0;
lint has no errors and no warnings beyond the known baseline.

### Milestone 1: Add TypeScript, validation, and a test baseline

1. Add TypeScript only for new code, preserving the `@/*` alias from
   `jsconfig.json` when creating `tsconfig.json`.
2. Add Zod, Vitest, React Testing Library where component tests are needed,
   and Playwright for critical browser flows.
3. Add `typecheck`, `test`, `test:unit`, `test:integration`, and `test:e2e`
   scripts. Unit tests must not require network access.
4. Add `lib/env.ts` with server-only, fail-fast environment validation and a
   separate client-safe configuration object. Never expose `MONGODB_URI` or
   Auth.js secrets through `NEXT_PUBLIC_*` variables.
5. Add `.env.example` with names and descriptions only: MongoDB URI/database,
   Auth.js secret/provider IDs, application URL, media provider identifiers,
   and test database URI.
6. Add a test helper that refuses to run destructive tests unless the database
   name ends in `_test`.

**Verify**: `pnpm typecheck && pnpm test:unit && pnpm lint` exits 0.

### Milestone 2: Separate storefront and admin layouts

1. Reduce `app/layout.js` to document shell, global styles, metadata defaults,
   and providers that truly apply to both surfaces.
2. Move public routes into `app/(storefront)/` without changing URLs. Add
   `app/(storefront)/layout.*` containing `SiteChrome` and `Footer`.
3. Create `app/admin/layout.tsx`, `app/admin/(public)/login/page.tsx`, and
   `app/admin/(protected)/layout.tsx`. Admin routes must never render the public
   cart/header/footer.
4. Add an admin shell with skip link, side navigation, mobile drawer,
   breadcrumbs, page actions, current user, and sign-out control.
5. Add `components/admin/admin.css` or CSS Modules using the existing brand
   tokens but a denser, accessible workspace layout. Do not add a second general
   component framework unless the executor documents why native components are
   insufficient.

**Verify**:

- `pnpm build` exits 0 and public URLs are unchanged.
- An unauthenticated render of `/admin/login` contains no storefront header,
  cart button, or storefront footer.
- Existing homepage, about, collection, and product screenshots show no layout
  regression.

### Milestone 3: Establish MongoDB connection, schemas, indexes, and scripts

1. Add one reusable `MongoClient` in `lib/mongodb.ts`, using a development
   global only for HMR reuse and a module-scoped client in production.
2. Add typed collection accessors in `lib/db/collections.ts`; no feature module
   may instantiate its own `MongoClient`.
3. Add Zod schemas and DTOs under `lib/domain/**` for every model defined above.
   Separate input, persistence, admin DTO, and public DTO schemas.
4. Add `scripts/db/ping.ts`, `scripts/db/ensure-indexes.ts`, and shared script
   safety helpers. Index creation must be idempotent and support `--check`.
5. Add a health Route Handler that reports only healthy/degraded status and a
   request ID. It must not reveal database names, hosts, versions, or errors.
6. Document Atlas network access, backups, least-privilege credentials, alerting,
   and point-in-time restore expectations.

**Verify**: `pnpm db:ping`, `pnpm db:indexes`, and
`pnpm db:indexes -- --check` exit 0 against development; the connection module
is the only `new MongoClient` match outside tests.

### Milestone 4: Implement authentication and authorization first

1. Configure Auth.js in `auth.ts` with MongoDB adapter, database sessions, a
   custom `/admin/login` page, and the confirmed provider.
2. Add the Auth.js Route Handler and `proxy.ts` for optimistic `/admin` redirects.
   Proxy must not query MongoDB on every request.
3. Create `adminAccess` repository/service, email normalization, invite seed,
   role-permission map, `verifySession()`, `requireActiveAdmin()`, and
   `requirePermission()` in server-only DAL modules.
4. Require secure authorization in every admin query, Server Action, Route
   Handler, and media signing request. Layout checks improve UX but never count
   as the secure check.
5. Deny public signup. Only allowlisted active emails can complete sign-in.
   Suspension revokes database sessions.
6. Add login throttling, secure cookie settings, safe redirect validation,
   generic auth error messages, and audit events for sign-in success/failure,
   invite, role change, suspension, and session revocation.
7. Seed the first owner using a one-time, idempotent CLI that accepts email as a
   runtime argument; never commit an owner email.

**Verify**:

- E2E: anonymous `/admin` redirects to `/admin/login`.
- Integration: non-allowlisted and suspended identities are denied.
- Integration: every role permission is allowed/denied according to the matrix.
- Static scan: every exported admin mutation calls `requirePermission()` or a
  service that does so before reading mutation input.

### Milestone 5: Build catalog repositories and migrate static data safely

1. Define a catalog repository interface used by storefront queries and admin
   services. Implement `StaticCatalogRepository` and
   `MongoCatalogRepository` behind `CATALOG_SOURCE=static|mongodb` for a
   reversible rollout.
2. Add idempotent `scripts/db/seed-catalog.ts` that maps four existing products
   and four categories into the new model. Convert dollar values to integer
   cents, retain slugs and asset paths, generate deterministic initial SKUs, and
   preserve source metadata.
3. Require `--dry-run` by default and explicit `--apply` for writes. Upsert only
   known seed records and never delete unknown production records.
4. Validate duplicates, missing images, bad slugs, collection references, money
   conversion, and SKU uniqueness before the first write.
5. Add repository integration tests for list, pagination, search, slug lookup,
   status filtering, optimistic version conflicts, archive behavior, and public
   DTO redaction.

**Verify**:

- Dry run reports exactly 4 products and 4 collections, zero writes.
- Apply against a disposable DB creates 4+4; running it again changes zero
  documents.
- Public repository cannot return draft/archived products or admin-only fields.

### Milestone 6: Build product, collection, and inventory admin workflows

1. Build paginated server-rendered list pages with URL-based search, status,
   collection, stock, and updated-date filters. Never fetch unbounded lists.
2. Build product create/edit using accessible sections: core copy, jewelry
   details, variants/SKUs/pricing, inventory, collections, media, SEO, and
   publishing.
3. Use Server Actions plus `useActionState` for server validation and field
   errors. Validate ObjectIds, version numbers, permissions, and all inputs on
   the server even when client validation exists.
4. Implement explicit Save draft, Preview, Publish, Unpublish, Duplicate, and
   Archive actions. Destructive actions require confirmation and never hard-
   delete a referenced product.
5. Reject stale writes using `version`; show the editor a conflict message and
   require reload/compare rather than last-write-wins data loss.
6. Build collection metadata, hero, SEO, and ordered-product management.
7. Route every inventory adjustment through the transactional inventory
   service and create a movement record.
8. Add CSV export. CSV import is allowed only with dry-run validation, row-level
   errors, and an explicit apply step.

**Verify**:

- Catalog role can complete CRUD/publish; viewer cannot mutate; content and
  operations roles cannot alter catalog.
- Duplicate slugs/SKUs and stale versions return field/form errors without
  partial writes.
- Inventory change and movement log commit together or both roll back.
- Lists remain paginated and filters survive refresh/back navigation.

### Milestone 7: Add safe media management

1. Implement a `MediaProvider` interface with sign, finalize, delete/archive,
   and metadata lookup. Add only the confirmed provider implementation.
2. Validate file type, size, dimensions, and authorization before signing.
   Revalidate provider response during finalize; never trust client metadata.
3. Build media library upload, search, alt-text edit, usage display, replace,
   and archive workflows.
4. Seed existing `/public/images/**` references as `provider: local` assets so
   the admin can reuse them without re-uploading.
5. Update `next.config.mjs` remote image patterns only for the confirmed CDN
   host; never allow arbitrary remote hosts.
6. Prevent deletion of in-use published media and ensure every published
   product/content image has meaningful alt text or an explicit decorative flag.

**Verify**: unauthorized signing is 401/403; invalid files are rejected before
upload; valid finalize creates one asset idempotently; in-use deletion is
blocked; public images render through `next/image`.

### Milestone 8: Cut the public catalog over to MongoDB

1. Add server-only cached queries for home products/collections, collection by
   slug, product by slug, and related products. Public DTOs serialize ObjectIds
   and expose only necessary fields.
2. Replace direct `data/products.js` imports in public pages with repository
   queries. Retain the static repository behind the feature flag during rollout.
3. Remove build-time assumptions that prevent newly published slugs from
   resolving. Implement `generateMetadata` for product and collection SEO.
4. Tag cached query results (`catalog`, `products`, `product:<slug>`,
   `collections`, `collection:<slug>`). Successful admin writes invalidate the
   precise tags plus affected paths.
5. Ensure admin reads are uncached so editors see saved changes immediately.
6. Add authenticated draft preview enter/exit Route Handlers. Public requests
   and guessed draft slugs remain 404.
7. Run static and Mongo sources in comparison mode in staging, recording count,
   slug, price, collection, and primary-media differences without logging PII.
8. Switch staging, then production, to `CATALOG_SOURCE=mongodb`. Keep rollback
   to static for one release window; remove it in a later cleanup commit after
   acceptance.

**Verify**:

- Homepage and all seeded product/collection URLs return 200 from MongoDB.
- A newly published product becomes reachable without a redeploy.
- Draft/archived products return 404 publicly and render only in authorized
  preview mode.
- Price and product counts match the static source before cutover.
- `rg "@/data/products" app components` returns no public runtime imports.

### Milestone 9: Add structured content management and revisions

1. Move homepage, about, navigation, announcement, contact/social, footer, and
   SEO copy into the fixed `siteContent` schemas. Do not create a generic page
   builder.
2. Seed current copy and asset references idempotently from the existing files.
3. Build separate Home, About, and Global admin forms with draft save, preview,
   publish, scheduled publish (optional only if a scheduler exists), revision
   history, and rollback.
4. Make featured products/collections reference catalog IDs, with validation
   that archived records cannot be published in content.
5. Cache published content by key and invalidate only affected content tags and
   routes after publish.
6. Add SEO length guidance, required alt text, broken-link validation, and a
   preview that uses the real public components.

**Verify**: seed reproduces current pages; draft changes are admin-only; publish
updates the public page; rollback creates a new revision rather than mutating
history; invalid references cannot publish.

### Milestone 10: Add bespoke inquiry and newsletter operations

1. Replace the mail-only bespoke CTA with a structured public inquiry page or
   modal while retaining a contact fallback. Support inspiration uploads only
   through the validated media flow.
2. Implement newsletter submission for the existing footer form with normalized
   email, explicit consent text, idempotency, honeypot, rate limit, and generic
   success response that does not reveal whether an email already exists.
3. Build admin inquiry list/detail with filters, assignment, status pipeline,
   follow-up date, internal notes, and CSV export permission.
4. Build subscriber list with status/source/date filters, unsubscribe handling,
   consent evidence, and restricted export.
5. Add provider-neutral notification/email services. Queue or retry external
   sends; never hold the database mutation open while waiting for email.
6. Define PII retention and deletion/export procedures before production.

**Verify**: validation, spam protection, rate limits, consent, idempotency,
permissions, and internal-note redaction all have integration tests; admin can
move an inquiry through statuses; public clients never receive internal fields.

### Milestone 11: Add dashboard, team, audit, and operational polish

1. Dashboard cards: published/draft products, low stock, new/overdue inquiries,
   subscriber trend, stale drafts, and recent authorized activity. Use bounded,
   indexed aggregations.
2. Add alert lists for low stock, missing SEO/alt text, broken media, scheduled
   follow-ups, and unpublished changes.
3. Team screen: invite/activate/suspend, assign role, revoke sessions, and show
   last login. Prevent the last active owner from demoting or suspending self.
4. Audit screen: filter by actor/action/resource/date, display redacted diffs,
   and export only for owners.
5. Add keyboard-accessible tables/forms, loading/error/empty states, unsaved-
   change warnings, mobile navigation, and WCAG-visible focus states.
6. Add request IDs and structured server logs. Integrate an error-reporting
   provider only after privacy filters are configured.

**Verify**: aggregation explain plans use expected indexes on representative
data; last-owner protection passes; keyboard-only E2E flow can create/publish a
product; no sensitive values appear in logs or audit diffs.

### Milestone 12: Prepare the optional Shopify order-operations module

Do not execute this milestone until Shopify is confirmed.

1. Document source-of-truth ownership: Shopify owns checkout, payment status,
   taxes, discounts, fulfillment, refunds, and customer order identity.
2. Add signed Shopify webhook Route Handlers with raw-body signature
   verification, idempotency/event ledger, replay safety, and secret rotation.
3. Store only a normalized order-operation projection in MongoDB: Shopify IDs,
   display number, customer summary needed by staff, line-item SKU snapshots,
   totals/currency, operational statuses, timestamps, and link back to Shopify.
4. Add read-mostly `/admin/orders` and `/admin/customers` views. Mutations that
   belong to Shopify should deep-link to Shopify or use a documented Shopify API
   command with idempotency and audit logging.
5. Add reconciliation for missed/out-of-order webhooks and deletion/redaction
   handling. Never store payment instrument data.

**Verify**: invalid signatures rejected; duplicate events no-op; out-of-order
events converge; order totals/status match Shopify fixtures; PII minimization
and retention tests pass.

### Milestone 13: Add GitLab CI, security gates, rollout, and runbooks

1. Add `.gitlab-ci.yml` stages for frozen install, lint, typecheck, unit,
   isolated Mongo integration, E2E critical paths, and production build. Cache
   pnpm store safely.
2. CI test databases must be isolated and disposable. Production credentials
   are unavailable to merge-request jobs.
3. Add dependency audit, secret scanning, and an authorization coverage check.
   Fail on errors/high-severity reachable issues; document accepted exceptions.
4. Add migration/index/seed runbooks, backup/restore drill, owner recovery,
   access revocation, provider outage behavior, and catalog rollback.
5. Deploy to staging with Atlas monitoring. Complete a content-editor UAT script
   before production.
6. Production rollout order: create indexes, seed, enable admin for owners,
   migrate catalog/content, compare sources, switch reads, monitor, then open
   access to additional roles.
7. Update `README.md`, `brain/CHANGELOG.md`, and architecture decisions with
   exact setup and operational commands.

**Verify**: a clean GitLab pipeline passes; a fresh developer can follow README
from clone to test run without private knowledge; restore and static-catalog
rollback are exercised in staging; post-deploy health and critical E2E checks
pass.

## Test plan

### Unit tests

- Environment parsing separates server/client values and rejects missing or
  malformed configuration without printing secrets.
- Zod schemas cover happy paths, boundary lengths, invalid slugs/ObjectIds,
  negative/overflow money, duplicate SKUs, invalid state transitions, and
  unsafe media metadata.
- Permission matrix covers every role-permission pair and default-deny behavior.
- DTO tests prove draft fields, cost, internal notes, actor IDs, and PII are not
  present in public outputs.
- Cache invalidation utility returns the exact tag/path set for each mutation.

### MongoDB integration tests

- Required indexes exist and uniqueness/TTL behavior works as designed.
- Product/collection CRUD, pagination, filters, status visibility, optimistic
  locking, and archive constraints.
- Inventory transaction writes quantity and movement atomically.
- Auth allowlist, suspension/session revocation, and last-owner protections.
- Seed dry run/idempotency and static-to-Mongo field parity.
- Inquiry/subscriber consent, idempotency, retention, rate-limit, and redaction.
- Audit log creation for every mutation without secret/PII leakage.

### E2E tests

- Anonymous admin redirect; allowed login; denied non-allowlisted login; logout.
- Catalog role creates draft, uploads/selects media, adds variant, previews,
  publishes, and sees the public product.
- Content role edits and publishes homepage copy but cannot change inventory.
- Operations role processes an inquiry but cannot publish a product.
- Viewer cannot mutate even by direct Server Action/Route Handler request.
- Slug/SKU conflict and stale edit show actionable form errors.
- Newsletter and bespoke public submissions appear in admin with correct consent.
- Published page SEO, images, navigation, and responsive layout remain intact.

### Non-functional tests

- Accessibility scan plus keyboard-only admin critical path.
- Representative catalog list/filter performance and MongoDB explain checks.
- Upload size/type abuse and unauthorized signing tests.
- Build with no production database writes; no seed/index mutation during render.
- Secret scan and client bundle inspection for Mongo/Auth/provider credentials.

## Done criteria

All conditions must hold:

- [ ] `pnpm install --frozen-lockfile` exits 0 with no lockfile drift.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, and
      `pnpm build` exit 0.
- [ ] `/admin` is isolated from storefront chrome and protected by Auth.js plus
      server-side DAL authorization.
- [ ] Every admin mutation validates input and permission on the server.
- [ ] Required MongoDB unique/query/TTL indexes are verified by script and test.
- [ ] Static seed dry-run/apply is idempotent and preserves the four existing
      products and collections.
- [ ] Public catalog/content read published MongoDB DTOs; drafts and internal
      fields never appear publicly.
- [ ] New published slugs work without a code change or redeploy.
- [ ] Product, collection, inventory, media, content, inquiry, subscriber, team,
      and audit workflows have permission and regression coverage.
- [ ] Money is stored in minor units; inventory mutations are transactional;
      hard deletion is blocked for referenced/published records.
- [ ] No media blobs, credentials, session tokens, payment data, or unnecessary
      PII are stored in MongoDB logs or client bundles.
- [ ] GitLab CI runs the full verification suite with an isolated test database.
- [ ] Staging backup/restore and catalog-read rollback have been exercised.
- [ ] README, environment example, runbooks, ADRs, changelog, and this plan index
      reflect the implemented system.
- [ ] No files outside the approved scope are modified without a reviewed plan
      update.

## STOP conditions

Stop and report rather than improvising if any condition occurs:

- The route-restoration working tree is still uncommitted and the operator has
  not said whether to include it in the implementation branch.
- The deployed hosting/runtime is unknown or cannot support the chosen Auth.js,
  MongoDB, and media provider configuration.
- The authentication provider or initial owner provisioning mechanism is not
  confirmed before Milestone 4.
- The media provider is not confirmed before Milestone 7.
- Production MongoDB already contains catalog/admin data whose ownership or
  schema is unknown; do not run seed/index changes over it.
- Duplicate existing slugs/SKUs prevent unique indexes; produce a collision
  report and wait for a data decision.
- MongoDB transactions are unavailable but an inventory/order step requires
  atomic multi-document writes.
- An admin mutation appears to require relying solely on a layout, Proxy, or
  hidden button for authorization.
- Implementing a requirement would expose a secret/connection string in a
  client component or `NEXT_PUBLIC_*` variable.
- Shopify is not confirmed before any checkout/order/customer sync work.
- A migration would remove current public products, alter their URLs/prices, or
  overwrite newer admin data without an approved mapping.
- A verification command fails twice after a reasonable scoped correction.

## Maintenance notes

- Keep authorization in server-only DAL/services. New admin modules must add a
  named permission and tests before UI work.
- Keep public DTOs explicit. Never serialize MongoDB documents directly into
  Client Components or API responses.
- Review indexes whenever list filters, sort orders, or dashboard aggregations
  change; unbounded admin queries are not acceptable.
- Treat product/content schemas as versioned contracts. Add idempotent migration
  scripts for breaking document changes; never mutate every document at import
  time during a request.
- Audit cache invalidation whenever a new public placement uses catalog/content
  data. A successful admin save that leaves the public page stale is a defect.
- Media lifecycle and data-retention policies need periodic review. Archive
  referenced assets; delete only after confirmed dereference and retention.
- If Shopify is introduced, keep source-of-truth ownership explicit and test
  webhook replay/reconciliation continuously.
- Reviewer focus: server authorization, DTO redaction, migration idempotency,
  cache freshness, money units, inventory atomicity, and secret/PII handling.

