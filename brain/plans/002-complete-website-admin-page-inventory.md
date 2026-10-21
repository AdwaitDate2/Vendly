---
id: "002"
title: Complete the public website and Shopify-like admin page inventory
tier: dig-deep
type: architecture
status: in-progress
source: kenmark-plan
created: 2026-08-24
approved: 2026-08-24
files:
  - app/
  - components/
  - lib/
  - scripts/db/
  - tests/
  - e2e/
  - public/
  - README.md
  - .gitlab-ci.yml
  - brain/kb/
  - brain/CHANGELOG.md
related_issues: []
related_plans:
  - "001"
---

# Complete the public website and Shopify-like admin page inventory

## Summary

Complete the byShreen storefront and its MongoDB-backed administration surface
as one coordinated information architecture. The work adds the missing public
browse, search, bespoke, contact, client-care, policy, accessibility, and
technical pages; turns the current admin placeholders into real workflows; and
adds the missing admin search, content-detail, inquiry-detail, subscriber,
settings, redirects, and future commerce routes.

The recommended approach is not a generic page builder and not a custom
commerce platform. It is a Shopify-like operating experience built from
domain-specific resource lists and schema-validated editors. MongoDB owns
catalog, structured content, leads, consent records, revisions, access rules,
inventory history, saved views, and audit data. A selected media provider owns
binary assets. Shopify is only the usability benchmark; no Shopify service or
commerce integration is part of this project.

This is a completion plan for the route and page inventory. Plan 001 remains the
source of truth for shared MongoDB, authentication, authorization, publishing,
media and inventory boundaries. This plan turns those boundaries into
an explicit page-by-page delivery sequence.

## Execution checkpoint — 2026-08-24

The approved plan was executed on `feature/complete-website-admin-page-inventory`
and merged to `main`.
The first implementation slice now delivers the public route inventory,
structured content registry/editor, catalog and collection operations, inquiry
and subscriber surfaces, transactional inventory/history, media reference
visibility, admin global search, robots/sitemap/loading/not-found boundaries,
and the corresponding MongoDB indexes/seeds/tests. The plan remains
`in-progress`: production identity/RBAC, approved legal/service copy, provider-
backed media, notification/abuse controls, governance/settings, complete SEO/
accessibility verification, and CI remain gated follow-up work. Shopify
integration is explicitly out of scope.

## Goal

Deliver a complete public site and first-release admin in which visitors can
reliably browse, search, understand policies and care, contact the business, and
submit high-intent requests, while authorized staff can operate every published
catalog, content, lead, consent, inventory, media, access, and governance record
through a consistent Shopify-like workflow.

## Planning frame

- **Goal:** provide every launch-critical public page and every first-release
  admin workflow needed to operate the site without code changes.
- **Current state:** home, About, collection detail, and product detail are
  public. The admin has a local-preview login, dashboard, basic product
  list/create/edit/archive, and placeholders for seven other modules.
- **Desired outcome:** a complete, navigable, searchable, accessible storefront
  backed by published MongoDB records, plus a secure Shopify-like admin that can
  operate those records through explicit draft, preview, publish, archive, and
  revision workflows.
- **Scope:** route information architecture, page contracts, MongoDB ownership,
  admin workflows, public forms, technical SEO, accessibility, verification,
  rollout, rollback, and documentation. Shopify commerce is not in scope.
- **Constraints:** pnpm remains the only package manager; existing public URLs
  and visual identity remain stable; current environment files and gitignore
  are not edited, untracked, re-tracked, removed, or otherwise changed; no
  credential is copied into documentation, code, logs, tests, or client
  bundles.
- **Unknowns:** approved policy copy, shipping/returns rules, production auth
  provider, media provider, notification provider, PII retention, and hosting.
- **Risk level:** high because page creation crosses authentication, content
  publishing, legal copy, PII, media, catalog migration, SEO, and future
  commerce boundaries.
- **Time sensitivity:** public trust pages and working footer destinations are
  the first release priority; custom commerce remains gated.
- **Plan tier:** dig-deep.

## Relationship to plan 001

Plan 001, Build a MongoDB admin with Shopify-like workflows, is already marked
in progress. It has delivered the Mongo client, initial catalog contracts,
idempotent catalog seed/index scripts, local-preview authentication boundary,
admin shell, dashboard, product list/editor, and reversible public
CATALOG_SOURCE reads. It has not delivered production authentication, complete
product/collection workflows, structured content, inventory, media, leads,
  subscribers, team management, audit history, or CI. Shopify integration is
  not a dependency or deliverable.

Use the following precedence rules:

1. Plan 001 owns cross-cutting platform and source-of-truth decisions.
2. Plan 002 owns the complete route inventory, individual page contracts, page
   release order, and page-level acceptance criteria.
3. If implementation of a page reaches an unfinished Plan 001 dependency, finish
   that dependency first and record the progress in both plans.
4. Do not create a second auth, database, permissions, revisions, media, or
   integration subsystem for this plan.
5. The frontmatter and plans index are status authority. Historical prose in
   Plan 001 that still says proposed must not reset its in-progress status.

## Confirmed repository baseline

### Public routes and destinations

| Route or destination | Current state | Current source | Gap |
| --- | --- | --- | --- |
| / | Functional | Hardcoded editorial content plus static/Mongo catalog adapter | Editorial sections are not admin-managed |
| /about | Functional | Hardcoded page module | No structured editing, preview, revisions, or page metadata |
| /collections/[slug] | Functional | Static data or published Mongo records | No collection index, richer filters, metadata, or admin editor |
| /products/[slug] | Functional | Static data or published Mongo records | Product schema/editor is incomplete; no route metadata |
| /#collection and /#bespoke | Functional fragments | Home page | Useful anchors, but not substitutes for browse or bespoke pages |
| Shipping & delivery | Footer link resolves to # | None | Missing launch-critical page |
| Returns | Footer link resolves to # | None | Missing launch-critical page |
| Privacy | Footer link resolves to # | None | Missing launch-critical policy |
| Terms | Footer link resolves to # | None | Missing launch-critical policy |
| Contact and bespoke calls to action | Mail links or home fragment | Email client | No structured page, validation, pipeline, consent, or attribution |
| Newsletter | Visible form only | None | No submit action, persistence, consent record, or feedback |
| Cart | Client-only drawer | Browser memory | Demo checkout; no durable commerce cart |
| Technical routes | Framework defaults | Root metadata only | No custom sitemap, robots, not-found, error, or route loading states |

### Admin routes

| Route | Current state | Gap |
| --- | --- | --- |
| /admin/login | Functional local-preview gate | Must be replaced by approved production Auth.js flow before public deployment |
| /admin | Functional catalog dashboard | Needs role-aware actions, action queues, recent work, and integration health |
| /admin/products | Functional basic list/search/status filter | Needs saved views, real selection/bulk actions, filters, pagination hardening, and export |
| /admin/products/new | Functional basic create | Needs full jewelry, variant, inventory, media, SEO, and publishing fields |
| /admin/products/[id] | Functional basic edit/archive | Needs preview drafts, revisions, duplicate, unpublish, conflict UX, and history |
| /admin/collections | Placeholder | Needs list, create, edit, ordering, SEO, media, lifecycle, and detail route |
| /admin/inventory | Placeholder | Needs transactional adjustments and movement history |
| /admin/content | Placeholder | Needs content overview plus structured editors for every managed page |
| /admin/media | Placeholder | Needs provider-backed library after provider approval |
| /admin/inquiries | Placeholder | Needs list, detail, assignment, follow-up, notes, and PII controls |
| /admin/team | Placeholder | Needs production identities, allowlist, roles, revocation, and owner protection |
| /admin/audit-log | Placeholder | Needs immutable, redacted, filterable events |

The working tree was clean when this plan was created. The repository was on
main and synchronized with origin/main. Existing environment tracking is a
deliberate user-owned decision and is outside this plan.

## Scope and priority model

### P0 — Required before a credible public launch

- Working public destinations for catalog browse, collection browse, search,
  bespoke/contact, shipping, returns, privacy, terms, FAQ, care, size guidance,
  and sourcing/materials.
- Real navigation and footer links with no page-intended href set to #.
- Custom not-found/error/loading behavior, sitemap, robots, canonical metadata,
  and product/organization structured data.
- Structured MongoDB content, revision history, admin preview/publish, and
  production-safe authentication/authorization.
- Collection administration, complete product editing, inquiry operations,
  subscriber operations, global search, settings, team, and audit.
- Tested public forms with validation, rate limiting, consent evidence, generic
  responses, and operational notifications.

### P1 — High-value operating capabilities

- Inventory adjustment and history, shared media library, saved views, bulk
  actions, redirects, actionable dashboard queues, and appointment intake.
- Content quality checks for missing alt text, metadata, broken links, and
  unapproved policy drafts.
- Responsive and keyboard-complete administration for routine workflows.

### P2 — Explicitly out of scope: commerce integration

- Keep the current cart as a clearly labelled visual preview only.
- Do not build Shopify API clients, checkout handoffs, orders, customer
  accounts, payment, tax, fulfillment, webhook, or synchronization workflows.
- If commerce is ever reconsidered, create a separate approved plan; it is not
  a dependency of this MongoDB admin or public-page work.

### P3 — Growth routes after launch evidence

- Journal/editorial publishing, press, gift guides, and bounded analytics.
- Customer accounts, wishlists, reviews, loyalty, gift cards, and returns portal
  remain deferred until commerce and customer-service requirements justify
  them.

## Target public information architecture

### Launch and high-value routes

| Route | Priority | Purpose | Primary source | Admin owner/editor | Release gate |
| --- | --- | --- | --- | --- | --- |
| / | Existing/P0 | Brand, featured collections/products, story, bespoke entry | siteContent.home plus published catalog | /admin/content/home | Seeded parity and real preview |
| /about | Existing/P0 | Founder, family expertise, purpose, trust | siteContent.about | /admin/content/about | Seeded parity and approved copy |
| /products | P0 | Canonical all-products browse page | Published products | /admin/products | Catalog cutover and pagination tests |
| /products/[slug] | Existing/P0 | Product story, gallery, variants, care, availability, SEO | Published product DTO | /admin/products/[id] | Full product contract and draft isolation |
| /shop | Alias | Human-friendly alias to /products | Redirect record | /admin/redirects | Permanent redirect; one canonical URL only |
| /collections | P0 | All published collections | Published catalogCollections | /admin/collections | Collection list/editor complete |
| /collections/[slug] | Existing/P0 | Collection story and filtered products | Published collection plus products | /admin/collections/[id] | Metadata, ordering, draft isolation |
| /search | P0 | Query products and collections, optionally public content | Published search projections | Catalog/content modules | Bounded query, rate limit, no draft leakage |
| /bespoke | P0 | Explain process and submit a design inquiry | siteContent.bespoke plus bespokeInquiries | Content plus Inquiries | Consent/retention and notification approved |
| /contact | P0 | Route visitors to sales, support, appointments, and policies | siteContent.contact | /admin/content/contact | Contact channels and response expectations approved |
| /appointments | P1 | Request virtual or private consultation | siteContent.appointments plus bespokeInquiries type | Content plus Inquiries saved view | Scheduling ownership and timezone behavior approved |
| /client-care | P0 | Hub for shipping, returns, FAQ, care, sizing, sourcing, repairs | siteContent.clientCare | /admin/content/client-care | All child destinations published |
| /shipping | P0 | Regions, insured delivery, timing, duties, tracking | siteContent.shipping | /admin/content/shipping | Business and legal review |
| /returns | P0 | Eligibility, windows, exclusions, process, refunds/exchanges | siteContent.returns | /admin/content/returns | Business and legal review |
| /faq | P0 | Searchable/sectioned common questions | siteContent.faq | /admin/content/faq | Support owner approval |
| /care | P0 | Jewelry cleaning, storage, service precautions | siteContent.care | /admin/content/care | Product/craft owner approval |
| /size-guide | P0 | Ring sizing and relevant jewelry dimensions | siteContent.sizeGuide | /admin/content/size-guide | Printable/mobile usability check |
| /materials-and-sourcing | P0 | Metals, lab-grown diamonds, certification, sourcing claims | siteContent.materialsSourcing | /admin/content/materials-and-sourcing | Every claim is evidence-reviewed |
| /repairs-and-warranty | P1 | Warranty scope, repairs, inspections, exclusions, intake | siteContent.repairsWarranty | /admin/content/repairs-and-warranty | Service policy approval |
| /privacy | P0 | Privacy notice and data-rights contact | siteContent.privacy | /admin/content/privacy | Legal approval and effective date |
| /terms | P0 | Website and sales terms | siteContent.terms | /admin/content/terms | Legal approval and effective date |
| /accessibility | P1 | Accessibility commitment and feedback channel | siteContent.accessibility | /admin/content/accessibility | Accessibility owner and contact approved |
| /cookies | Conditional/P1 | Cookie categories, purposes, duration, and controls | siteContent.cookies | /admin/content/cookies | Add only if actual tracking and applicable law require it |
| /privacy-choices | Conditional/P1 | Region-appropriate opt-out/data-choice instructions | siteContent.privacyChoices | /admin/content/privacy-choices | Add only after legal review of regions, practices, and rights |

### Technical and framework routes

| Route/file convention | Purpose | Required behavior |
| --- | --- | --- |
| /sitemap.xml | Search discovery | Include only canonical, public, published URLs; attach last-modified dates where trustworthy |
| /robots.txt | Crawler policy | Permit intended public routes; disallow admin, previews, and non-public handlers |
| not-found | Brand-safe 404 | Explain next steps and link to products, collections, client care, and contact |
| error boundary | Recoverable failures | Provide a retry, safe message, and request ID without leaking internals |
| loading boundaries | Stable perceived navigation | Use route-appropriate skeletons that preserve layout |
| metadata generation | Titles, descriptions, canonical, Open Graph | Use only published DTOs and stable fallbacks |
| structured data | Organization, WebSite, Product, Breadcrumb, FAQ when eligible | Validate output and never emit claims or availability absent from source data |

### Commerce and growth inventory

| Route | Status | Decision |
| --- | --- | --- |
| /cart | Preview only | Keep the existing drawer clearly labelled as non-transactional; no commerce integration is planned |
| Checkout | Out of scope | Do not build a payment form, checkout handoff, or Shopify URL integration |
| /account and order status | Out of scope | Do not build customer accounts or order identity in this project |
| /journal and /journal/[slug] | P3 | Add only with an editorial cadence, authoring owner, content schema, archive, and SEO plan |
| /press | P3 | Add after approved assets/mentions exist |
| /gift-guide | P3 | Use a curated collection/content template rather than a new subsystem |
| Wishlist, reviews, loyalty, gift cards | Deferred | Reassess after commerce launch and evidence of demand |

## Target admin information architecture

### First-release admin routes

| Route | Priority | Purpose | Principal capability |
| --- | --- | --- | --- |
| /admin/login | P0 | Production-safe staff sign-in | Auth.js provider, allowlist, throttling, safe redirects |
| /admin | P0 | Actionable overview and onboarding | Bounded KPIs, alerts, recent work, integration health |
| /admin/search | P0 | Permission-filtered workspace search | Products, collections, content, inquiries, subscribers, settings |
| /admin/products | Existing/P0 | Product resource list | Search, filters, saved views, bulk lifecycle/organization actions |
| /admin/products/new | Existing/P0 | Minimal draft creation | Progressive disclosure and safe defaults |
| /admin/products/[id] | Existing/P0 | Full jewelry product editor | Variants, pricing, inventory, media, SEO, preview, publish, revisions |
| /admin/collections | Placeholder/P0 | Collection resource list | Search, views, type/status, ordering, bulk lifecycle |
| /admin/collections/new | P0 | Collection draft creation | Category/curated type, slug, hero, description, SEO |
| /admin/collections/[id] | P0 | Collection detail editor | Product membership/order, preview, publish, redirects, revisions |
| /admin/inventory | Placeholder/P1 | Variant stock workspace | Filters, adjustments, history, thresholds, conflict detection |
| /admin/content | Placeholder/P0 | All managed page entries | Status, schema, last author, missing requirements, preview |
| /admin/content/home | P0 | Homepage editor | Fixed ordered sections and catalog/media references |
| /admin/content/about | P0 | About editor | Fixed brand-story sections and media references |
| /admin/content/global | P0 | Shared storefront editor | Header, navigation, announcement, footer, contact, social, default SEO |
| /admin/content/[key] | P0 | Client-care, policy, bespoke, contact, and accessibility editors | Registry-selected schema, revisions, preview, publish |
| /admin/media | Placeholder/P1 | Shared public asset library | Upload, search, metadata, usage, replacement, safe archive |
| /admin/inquiries | Placeholder/P0 | Bespoke/contact/appointment pipeline | Saved views, assignment, status, next follow-up, export controls |
| /admin/inquiries/[id] | P0 | Inquiry workspace | Brief, contact, source, private assets, notes, audit, follow-up |
| /admin/subscribers | P0 | Consent-aware audience operations | Status, consent evidence, unsubscribe, restricted export |
| /admin/team | Placeholder/P0 | Staff access | Invite/allowlist, role, suspend, session revoke, last-owner protection |
| /admin/audit-log | Placeholder/P0 | Governance history | Redacted event search, filters, detail, controlled export |
| /admin/settings | P0 | Non-secret site/integration settings | Health, public contact defaults, provider state, commerce state |
| /admin/settings/integrations | P1 | Provider status and operational controls | Connection health and deep links; never display secrets |
| /admin/redirects | P1 | Preserve changed public URLs | Unique source, safe internal destination, loop detection, status |

### Commerce and growth admin routes

| Route | Status | Boundary |
| --- | --- | --- |
| /admin/orders and /admin/orders/[id] | Out of scope | Do not build order projections or commerce deep links |
| /admin/analytics | P3 | Bounded business summaries only after metrics have owners/actions |
| /admin/journal and /admin/journal/[id] | P3 | Add with the public journal, reusing content lifecycle patterns |
| /admin/customers | Out of scope | Do not build commerce customer records in this project |
| /admin/discounts | Out of scope | Do not build discounts or commerce deep links |
| /admin/appointments | No separate first-release module | Represent appointments as an inquiry type and saved view until scheduling complexity justifies a module |

## Recommended page and content contracts

### Content registry

Create one server-owned content definition registry. Each entry defines:

- immutable content key and public route;
- display name, description, content type, and admin navigation grouping;
- Zod draft/persistence/public schemas and schema version;
- allowed blocks or fixed sections, required fields, and reference types;
- responsible permission for write and publish;
- preview route and cache tags;
- SEO requirements and whether legal approval is mandatory;
- seed adapter from current hardcoded content;
- migration path when the schema version changes.

The registry is configuration for known page types, not a page-builder language.
It must not accept executable components, scripts, arbitrary CSS, arbitrary
HTML, or database query fragments.

### Required and conditional siteContent keys

| Key | Payload shape | Special rules |
| --- | --- | --- |
| global | Announcement, primary/secondary navigation, footer groups, contact channels, social links, default SEO | Validate internal URLs and external protocols; footer destinations cannot be # when published |
| home | Hero, category introduction, featured edit, story, founder, values, bespoke summary, closing visual | References only published or preview-visible catalog/media records |
| about | Hero, purpose, founder/family story, CTA | Preserve current visual hierarchy during seed parity |
| clientCare | Introduction and ordered child-page cards | Cannot publish with broken required child routes |
| shipping | Structured sections, regions, timing, cost/duties, tracking, contact CTA | Requires business/legal review state and effective date |
| returns | Eligibility, window, exclusions, process, refund/exchange timing, contact CTA | Requires business/legal review state and effective date |
| faq | Categories and ordered question/answer entries | FAQ structured data only when visible content qualifies |
| care | Ordered material/stone care guidance and service CTA | Avoid unsupported guarantees |
| sizeGuide | Measurement instructions, size tables, printable reference, help CTA | Store measurements with explicit units |
| materialsSourcing | Metals, stones, lab-grown diamond explanation, certification and sourcing claims | Claims require evidence owner and review record |
| repairsWarranty | Coverage, exclusions, process, timing, fees, contact CTA | Requires business/legal review |
| privacy | Policy sections, rights/contact, effective date, version | Cannot publish without legal approval metadata |
| terms | Terms sections, governing/contact data, effective date, version | Cannot publish without legal approval metadata |
| accessibility | Commitment, known support, feedback contact, last review | Feedback route must be monitored |
| cookies | Cookie categories, purposes, durations, providers, and settings route | Conditional; must reflect actual technology and consent controls |
| privacyChoices | Applicable privacy choices, verification, request method, and contact | Conditional; legal review determines route, wording, and jurisdictions |
| bespoke | Process, expectations, examples/media, inquiry introduction and form labels | Form fields remain a versioned server schema |
| contact | Contact choices, support topics, expected response, location/timezone | Never expose private staff details |
| appointments | Appointment types, expectations, availability guidance and request form | Requests use inquiry records until a scheduler is approved |

### Catalog page contracts

- Product listing and collection listing must use cursor or stable page
  pagination, explicit sort values, published-only projections, empty states,
  canonical query behavior, and URL-backed filters.
- Initial public product filters should remain useful and jewelry-specific:
  collection, product type, metal, stone, price band, availability, and
  made-to-order. Do not expose filters without sufficient data quality.
- Product detail must support ordered media, variant selection, price, lead
  time, availability, jewelry attributes, certification where present, care
  link, shipping/returns links, bespoke/contact fallback, breadcrumbs, SEO, and
  related products.
- Collection detail must support hero/media, description, SEO, merchandising
  order, optional filters, empty state, and redirects after slug changes.
- Public search must query only published search projections, normalize and
  bound query input, paginate results, preserve the query in the URL, explain
  zero-results recovery, and avoid regex scans across unbounded collections.
- On the current self-hosted/replica-set-compatible Mongo deployment, prefer
  explicit normalized search fields and supported text indexes. Do not assume
  Atlas Search exists without confirming the environment.

### Public form contracts

- Bespoke, contact, appointment, and newsletter forms use Server Actions or
  Route Handlers with Zod validation, size limits, a honeypot, rate limiting,
  generic success responses, request IDs, and safe logging.
- Submission does not depend on email delivery succeeding. Persist first, then
  enqueue or attempt notification with retryable state.
- Bespoke/contact/appointment records share bespokeInquiries with a typed source
  and request type; keep internal notes out of all public DTOs and notifications.
- Newsletter signup normalizes email, records consent timestamp/source/locale,
  is idempotent, and never reveals whether an address was already subscribed.
- Inspiration uploads use a separately approved private-media policy and signed
  access. Do not put private assets in the public media library.
- Publish no form until consent wording, retention, deletion/export, and
  notification ownership are approved.

## Data ownership and MongoDB changes

| Domain | Authority | Planned records | Notes |
| --- | --- | --- | --- |
| Products and collections | MongoDB until a later commerce ADR changes field ownership | products, catalogCollections | Retain public DTO boundary, versions, states, timestamps, actors |
| Structured pages | MongoDB | siteContent | Expand from home/about/global to the full key registry |
| Published history | MongoDB | contentRevisions | Immutable snapshots; rollback creates a new revision |
| Redirects | MongoDB | redirects | Unique normalized source path; internal destination validation; loop protection |
| Public media metadata | MongoDB plus selected object provider | mediaAssets | Provider stores binaries; Mongo stores metadata/usage |
| Private inquiry assets | Selected private object provider plus restricted metadata | inquiryAssets or private media references | Separate access policy and retention |
| Inquiries and appointment requests | MongoDB | bespokeInquiries | Typed intake, assignment, follow-up, internal notes, consent/source |
| Subscribers | MongoDB and optional email provider | newsletterSubscribers | Mongo retains consent/source status; provider IDs are projections |
| Staff access | Auth.js plus MongoDB | adapter collections and adminAccess | No public signup; role and status default deny |
| Inventory before commerce | MongoDB | product variants and inventoryMovements | Adjustments are transactional and attributable |
| Saved list views | MongoDB | savedViews | Filter keys are allowlisted; no executable query fragments |
| Audit and integration history | MongoDB | auditLogs and integrationEvents | Redacted; retention explicitly approved |
| Checkout, orders, payment, tax, discounts, refunds, fulfillment | Out of scope | No commerce source or Mongo projection | Keep all transaction controls disabled |
| Analytics | Approved privacy-aware service only | Bounded aggregates only when needed | Do not invent a raw event warehouse for first release |

### siteContent persistence contract

Each mutable entry should include key, kind, schemaVersion, draftPayload,
publishedPayload, status, publishedAt, publishedBy, createdAt, createdBy,
updatedAt, updatedBy, version, and optional approval metadata. Admin DTOs can
include draft and revision data; public DTOs can include only published,
schema-valid payloads.

Policy-like entries additionally need reviewStatus, reviewedBy, reviewedAt,
effectiveAt, and policyVersion. The system enforces the approval state, but it
does not pretend to provide legal approval. Actual policy language must come
from the business and its legal reviewer.

### Additional index families

- Unique siteContent key and redirects source path.
- Content status plus updated time, kind plus status, and revision resource plus
  revision/time.
- Search-supporting product/collection normalized fields or text indexes,
  chosen from features supported by the actual Mongo deployment.
- Inquiry request type/status plus created time, assignee plus follow-up, and
  normalized contact lookup only where access is restricted.
- Subscriber normalized email unique and status plus created time.
- Audit resource/time, actor/time, and action/time.
- Do not add TTL deletion for policies, consent, inquiries, revisions, or audit
  records until retention has been explicitly approved.

## Shopify-like admin experience requirements

### Shared resource-list grammar

Products, Collections, Inventory, Content, Media, Inquiries, Subscribers,
Redirects, Team, Audit, and future Orders should share:

- URL-backed query, filters, sort, page/cursor, selected view, and visible
  columns;
- default and permission-aware saved views;
- accessible table on larger screens and usable cards/actions on smaller
  screens;
- explicit selection scope for one item, one page, or all matching results;
- domain-safe bulk actions with preview, confirmation, row-level outcomes, and
  no silent partial success;
- useful empty, loading, error, permission-denied, and integration-down states;
- consistent status badges, timestamps, actor identity, and contextual actions;
- bounded queries, stable sort, tested indexes, and server-side authorization.

### Shared editor grammar

- Sticky Save and Discard actions with dirty, saving, success, error, and
  version-conflict states.
- Save draft, real-page Preview, Publish, Unpublish, Duplicate where useful,
  Archive, revision list, and rollback.
- Progressive disclosure: essential fields first; advanced jewelry, media,
  SEO, policy approval, inventory, and publishing sections later.
- Unsaved-navigation protection and a compare/reload path for stale versions.
- Field-level validation and summary feedback linked to invalid fields.
- Reference pickers show publishability and prevent publishing broken
  product/collection/media/content relationships.
- Keyboard-complete dialogs, visible focus, accessible names, announcements,
  responsive editing, and no color-only status.

### Global search

- Cmd/Ctrl + K opens a command palette; /admin/search provides the durable
  results route.
- Results are filtered twice: only allowed resource types are queried and every
  returned record is authorized.
- Support destinations/actions plus products, collections, content, inquiries,
  subscribers, redirects, and permitted settings.
- Search internal notes and subscriber/inquiry PII only for explicitly permitted
  roles, and never place sensitive terms in analytics logs.

## Roles and permissions

| Capability family | Owner | Catalog | Content | Operations | Viewer |
| --- | --- | --- | --- | --- | --- |
| Products/collections read | Yes | Yes | Optional reference read | Optional reference read | Yes |
| Products/collections write/publish | Yes | Yes | No | No | No |
| Inventory read/adjust | Yes | Yes | No | Optional read | Read only if granted |
| Content read/write/publish | Yes | Reference read | Yes | Optional reference read | Read only if granted |
| Media read | Yes | Yes | Yes | Restricted private assets only | Public-library read if granted |
| Media upload/archive | Yes | Product media | Editorial media | Private inquiry media under separate policy | No |
| Inquiries read/write/export | Yes | No | No | Yes; export separately restricted | No by default |
| Subscribers read/write/export | Yes | No | No | Yes; export separately restricted | No by default |
| Redirects | Yes | Catalog slug redirects | Content-route redirects | No | Read only if granted |
| Team/settings/integrations | Yes | No | No | No | No |
| Audit read/export | Yes | Own/resource events if approved | Own/resource events if approved | Own/resource events if approved | No by default |

Server reads and mutations enforce named capabilities near the repository or
service. Navigation visibility is only presentation and cannot grant or deny
access by itself.

## Options

| Option | Summary | Pros | Cons | Risk | When to choose |
| --- | --- | --- | --- | --- | --- |
| A. Structured route families and domain-specific admin | Fixed public page contracts, typed Mongo content, reusable resource lists/editors, phased Shopify boundary | Best fit for the current site; safe publishing; easy for staff; testable; incremental; preserves custom design | Requires deliberate schemas and several admin modules | Medium | **Recommended for this plan** |
| B. Generic block/page builder | Store arbitrary page trees and let staff assemble every page | Maximum layout flexibility and fewer hardcoded page routes | Much larger editor, migration, rendering, preview, accessibility, security, and support surface; weak fit for a small editorial site | High | Only if frequent layout creation becomes a proven operating need |
| C. Hardcoded public pages with no content admin | Add route modules and keep copy in code | Fastest initial route creation and lowest schema work | Every content/policy update needs deployment; no preview/revisions/roles; does not satisfy the admin goal | Medium | Temporary prototype only |
| D. Move the whole site to Shopify admin now | Use Shopify catalog/content/commerce and keep Next.js headless | Mature commerce operations and smaller custom admin | Conflicts with the MongoDB-first requirement; bespoke/content workflows need extensions; migration and design constraints | Medium | If commerce speed becomes more important than the custom Mongo admin |

**Recommended: Option A.**

Why:

- The site has a small, known set of editorial and client-care page types.
- The business needs predictable non-developer workflows, not arbitrary layout
  composition.
- It extends the architecture already accepted in Plan 001.
- It keeps commerce out of scope without discarding the MongoDB
  catalog/content/lead investment.
- It supports safe page-by-page rollout and rollback.

## Recommended defaults for unresolved route choices

- Use /products as the canonical all-products route; optionally redirect /shop
  to it.
- Keep /collections as the collection index and existing
  /collections/[slug] URLs unchanged.
- Keep /bespoke and /contact distinct: bespoke is a high-intent guided journey;
  contact is a support/routing page.
- Add /client-care as a hub while retaining direct stable child URLs.
- Keep appointments as an inquiry type and saved admin view for the first
  release.
- Keep the cart drawer as a clearly labelled visual preview; do not create a
  checkout or commerce handoff.
- Use fixed structured content schemas and one content registry; do not build a
  generic drag-and-drop builder.
- Keep policy entries private drafts until business/legal approval metadata is
  present.
- Defer journal, press, accounts, wishlist, reviews, loyalty, gift cards, and
  custom analytics until launch behavior justifies them.

## Plan

### Phase 0 — Approve the inventory and resolve release blockers

- [ ] Review every public and admin route in this plan; mark each Required,
  Approved later, Shopify-gated, or Rejected without deleting it from the
  inventory history.
- [ ] Confirm canonical route choices for /products versus /shop, client-care
  naming, and whether appointments are offered.
- [ ] Assign content owner, business approver, and legal reviewer for shipping,
  returns, warranty, privacy, terms, sourcing claims, and accessibility.
- [ ] Confirm real shipping regions/timing, duties handling, return windows and
  exclusions, warranty/repair terms, support channels, response expectations,
  and company/legal identity.
- [ ] Confirm production auth, media, private-upload, email/notification,
  hosting, monitoring, and backup owners before dependent phases.
- [ ] Confirm PII consent wording, role access, retention, export, correction,
  deletion, and incident procedures before enabling public forms.
- [x] Confirm Shopify is not part of the launch or implementation. Any future
  commerce request requires a separate plan and field-ownership decision.
- [ ] Reconcile unfinished dependencies in Plan 001 and record which phases this
  plan will satisfy on its behalf.
- [x] Capture baseline build/lint/test results, route output, internal link map,
  and screenshots for current home, About, collections, products, and admin
  catalog.
- [x] Preserve the clean baseline and all user-owned environment/gitignore
  choices. Do not edit or change tracking for any environment file or gitignore.

**Exit:** route scope and required business/provider decisions are documented;
no dependent work relies on invented policy, identity, media, or commerce facts.

### Phase 1 — Establish page contracts and verification foundations

- [ ] Add TypeScript incrementally for new server/domain/test modules as defined
  by Plan 001; do not rewrite unrelated existing public components.
- [x] Define the public route inventory and content registry as server-owned
  typed configuration.
- [ ] Add Zod schemas for every siteContent key, legal approval metadata,
  redirects, public forms, admin DTOs, and public DTOs.
- [ ] Define catalog browse/filter/search input schemas and stable query
  serialization.
- [ ] Define named permissions for content, policies, redirects, inquiries,
  subscribers, media, inventory, team, audit, and integrations.
- [ ] Add factories/fixtures for all content keys, products, collections,
  inquiries, subscribers, staff roles, revisions, redirects, and system states.
- [ ] Add route-contract tests that enumerate required public/admin routes and
  prevent accidental omissions.
- [ ] Add an internal-link check that flags page-intended href values equal to #
  while allowing intentional in-page fragments.
- [ ] Add pnpm scripts from Plan 001 for typecheck, unit, integration, E2E, and
  aggregate verification if they are still missing.

**Exit:** page schemas, permissions, route inventory, fixtures, and initial
contract tests pass before CRUD or UI implementation expands.

### Phase 2 — Finish shared platform and layout prerequisites from Plan 001

- [ ] Move storefront chrome into an App Router storefront route group without
  changing any public URL.
- [ ] Keep root layout limited to the document shell and genuinely shared
  providers; admin must never render header, cart, announcement, or footer.
- [ ] Replace production use of the local preview token with approved Auth.js,
  allowlisted staff, database sessions, default-deny RBAC, session revocation,
  throttling, request IDs, and last-owner protection.
- [ ] Preserve the local preview mechanism only as an explicitly local,
  non-production path if still useful and approved.
- [ ] Build shared admin feedback, dialog, resource-list, editor, breadcrumbs,
  command palette, mobile navigation, and permission-aware navigation
  primitives.
- [x] Add public and admin not-found, error, and loading boundaries appropriate
  to each surface.
- [ ] Confirm direct calls to every protected read/mutation fail for anonymous,
  unlisted, suspended, revoked, and wrong-role users.

**Exit:** route surfaces are isolated, production admin access is secure, and
shared components are ready for domain modules.

### Phase 3 — Expand MongoDB content, revision, redirect, and search contracts

- [x] Expand siteContent from home/about/global to every approved key in this
  plan.
- [x] Add immutable contentRevisions on every content save; rollback UI remains
  a follow-up.
- [ ] Add redirects with unique normalized source paths, safe internal
  destinations, loop/cycle detection, actor/time, status, and version.
- [x] Add schema/index ensure and check behavior for new collections and index
  families.
- [x] Create a dry-run-first, idempotent content seed that maps current home and
  About output into draft/published payloads without visual or copy drift.
- [ ] Seed global navigation/footer/contact/social data from current code, while
  representing missing client-care destinations as unpublished references
  until their pages are approved.
- [ ] Seed approved client-care/policy entries without inventing business or
  legal terms; unresolved entries remain drafts.
- [x] Add repository/service layers with explicit admin and public DTOs,
  versions, permission checks, and bounded projections.
- [ ] Add supported search indexes or normalized fields for published products
  and collections; document why the chosen query works on this Mongo
  deployment.
- [x] Ensure seed/index scripts remain additive, idempotent, and never delete
  unknown records.

**Exit:** all approved content keys can be seeded twice safely, public reads
cannot leak drafts/internal fields, revisions are immutable, and required
indexes pass check-only verification.

### Phase 4 — Build the structured content studio

- [x] Replace /admin/content placeholder with a registry list covering Brand,
  Client care, Policies, Lead generation, and Global keys.
- [x] Show content title/key, public route, draft/published state, and update
  time; searchable grouping and requirement diagnostics remain follow-up.
- [ ] Build schema-specific editors for Home, About, Global, client-care
  articles/hubs, legal policies, Bespoke, Contact, Appointments, and
  Accessibility.
- [ ] Reuse shared editor grammar for dirty state, Save, Discard, Preview,
  Publish, Unpublish, revisions, conflicts, and rollback.
- [ ] Add reference pickers for products, collections, and media with
  publishability validation.
- [ ] Add link validation, heading checks, alt-text requirements, SEO guidance,
  effective dates, and policy approval controls.
- [ ] Render preview through the actual public page/component with authenticated
  draft access; guessed preview URLs remain inaccessible.
- [x] Add precise cache/path invalidation after publish without making admin
  reads stale.
- [ ] Audit every content save/publish/unpublish/rollback and redact payloads
  appropriately.

**Exit:** a Content user can update, preview, publish, unpublish, and roll back
each approved page type without code changes; unrelated roles cannot mutate it.

### Phase 5 — Deliver public trust, client-care, contact, and policy pages

- [x] Add /client-care and every approved child route using shared editorial
  components and schema-specific public DTOs.
- [x] Add /shipping, /returns, /faq, /care, /size-guide,
  /materials-and-sourcing, /repairs-and-warranty, /privacy, /terms, and
  /accessibility.
- [ ] Add /cookies and /privacy-choices only when the actual tracking,
  jurisdiction, and legal review establish that they are required.
- [x] Add /bespoke, /contact, and optionally /appointments with clear paths to
  the appropriate form or fallback contact.
- [x] Replace the four current footer # destinations with their real routes only
  when each destination is published.
- [ ] Update header/footer/global navigation from published global content with
  safe fallbacks.
- [ ] Add breadcrumbs, page metadata, canonical URLs, social previews, and
  contextual cross-links among product, care, shipping, returns, size, repair,
  and contact pages.
- [x] Ensure legal/policy routes refuse publication without approved content;
  effective dates/versions remain a legal-content follow-up.
- [ ] Ensure claims about sourcing, certification, shipping, returns, and
  warranties match approved source material.
- [ ] Verify responsive layout, keyboard order, headings, links, tables, print
  behavior for sizing, and screen-reader output.

**Exit:** every launch-critical footer and client-care destination is real,
approved, indexable as intended, accessible, and editable through the admin.

### Phase 6 — Deliver catalog indexes and public search

- [x] Add /products as the canonical published-product list with bounded
  stable sorting, useful filters, empty/error states, metadata, and query
  handling; full UI pagination remains follow-up.
- [x] Add /collections as the published-collection index with editorial
  summaries and appropriate empty states.
- [ ] Complete collection public DTOs for descriptions, heroes, SEO,
  merchandising order, and slug redirects.
- [ ] Complete product public DTOs and product detail rendering for variants,
  pricing, lead time, availability, gallery/alt, attributes, certification,
  care/client-care links, related products, and structured data.
- [x] Add /search with bounded query input, relevance/stable order, typed result
  cards, no-results recovery, and published-only data; full UI pagination
  remains follow-up.
- [ ] Add optional /shop permanent redirect to /products without creating a
  second canonical index.
- [ ] Remove build-time static-param assumptions that prevent newly published
  slugs from working without deployment.
- [ ] Add cache tags and targeted invalidation for product, collection, listing,
  search, sitemap, and referenced content.
- [ ] Compare static and Mongo output for seeded items before switching the
  production catalog source; retain the static rollback for the Plan 001
  observation window.

**Exit:** visitors can browse all products/collections and search published
records; new slugs work without deployment; drafts and internal data remain
private.

### Phase 7 — Complete product and collection administration

- [ ] Upgrade Products to the shared resource-list grammar with validated saved
  views, filters, stable pagination, column preferences, selection, and
  domain-safe bulk actions.
- [ ] Complete the jewelry product editor sections for essentials, media,
  attributes, variants, pricing, inventory policy, organization, SEO, and
  lifecycle.
- [ ] Add Preview, Publish, Unpublish, Duplicate, Archive, revision history,
  compare/reload conflict UX, and slug redirect handling.
- [x] Replace /admin/collections placeholder with a bounded list, search,
  status filters, ordering, and lifecycle actions; saved views/bulk actions
  remain follow-up.
- [x] Add /admin/collections/new and /admin/collections/[id] with image path,
  description, ordering, SEO, preview, publish, archive, and conflict handling;
  manual product order, revisions, and redirects remain follow-up.
- [x] Prevent hard deletion of published/referenced products and collections.
- [ ] Add catalog usability tests for a first-time Catalog user on desktop and
  mobile.

**Exit:** Catalog staff can complete routine product and collection creation,
organization, preview, publish, correction, and archive without developer help.

### Phase 8 — Deliver inquiry and subscriber operations

- [x] Implement bespoke/contact/appointment public submissions using the
  approved form contract and accessible pending/success/error states.
- [x] Preserve a monitored fallback contact when form or notification provider
  is unavailable.
- [x] Replace /admin/inquiries placeholder with bounded New, Active, Closed, and
  Spam status views plus search.
- [x] Add /admin/inquiries/[id] with intake, contact, request type, assignee,
  status, next follow-up, and internal notes; private assets/audit remain
  follow-up.
- [x] Add ownership and optimistic concurrency so simultaneous operators do not
  silently overwrite inquiry work.
- [x] Implement footer newsletter action and /admin/subscribers with consent
  evidence, status, source, and filters; unsubscribe/export controls remain
  follow-up.
- [ ] Add rate-limit, abuse, idempotency, redaction, retention, deletion/export,
  notification retry, and provider-outage tests.
- [ ] Add dashboard queues for new/overdue inquiries and failed notifications
  using bounded indexed queries.

**Exit:** valid submissions enter permission-protected workflows, abuse is
bounded, notifications are retryable, and sensitive/internal data never leaks.

### Phase 9 — Deliver inventory and media operations

- [x] Replace /admin/inventory placeholder with variant-level stock list,
  product/SKU/collection/status filters, low-stock view, and movement history.
- [x] Add single and reviewed bulk adjustments requiring reason and optional
  note.
- [x] Atomically update quantity and create inventoryMovement; detect stale
  reads and avoid silent overwrite.
- [ ] Confirm inventory authority and made-to-order behavior before enabling
  quantity-dependent public availability.
- [ ] Select the public and private media provider/policies before replacing the
  media placeholder.
- [ ] Seed current public assets as media metadata without moving or breaking
  existing URLs prematurely.
- [ ] Add signed upload/finalization, server validation, search, reuse, alt text,
  focal point, usage graph, replacement, and archive.
- [ ] Prevent public/in-use media deletion and keep private inquiry media
  isolated by access policy and retention.

**Exit:** stock changes are atomic/auditable; governed media can be safely
reused; public and private assets cannot cross access boundaries.

### Phase 10 — Complete admin search, governance, settings, and dashboard

- [ ] Add /admin/search and wire Cmd/Ctrl + K to permission-filtered results and
  destinations.
- [ ] Replace Team placeholder with allowlist/invite, activation, roles,
  suspension, session revocation, last login, and last-owner protection.
- [ ] Replace Audit placeholder with redacted, immutable search/filter/detail
  and owner-controlled export.
- [ ] Add Settings and Integrations routes for non-secret site state, provider
  health, support ownership, commerce mode, and operational deep links.
- [ ] Add Redirects resource list/editor with loop, collision, and external
  redirect safeguards.
- [ ] Upgrade dashboard onboarding, recent work, action queues, integration
  failures, missing content/media/SEO, low stock, inquiry follow-ups, and
  publish health.
- [ ] Ensure every dashboard count is bounded/indexed, permission-filtered, and
  tied to an action; omit vanity charts.
- [ ] Complete responsive navigation, command help, focus management, request
  IDs, recovery states, and staff usability sessions.

**Exit:** production staff access and governance are operable, global search is
useful and safe, and the dashboard directs staff to actionable work.

### Phase 11 — Finish technical SEO, accessibility, quality, and performance

- [x] Generate sitemap from canonical fixed routes plus published products and
  collections; exclude admin, drafts, previews, query variants, and gated
  commerce routes.
- [x] Add robots policy that explicitly protects admin/preview surfaces.
- [ ] Add page-specific metadata, canonical URLs, Open Graph assets, and
  validated Organization, WebSite, Product, Breadcrumb, and eligible FAQ
  structured data.
- [ ] Add redirect tests, broken-link crawl, 404/error/loading tests, and
  metadata snapshots for representative pages.
- [ ] Replace or justify existing raw image warnings as pages are touched; use
  responsive optimized images and correct dimensions/priorities.
- [ ] Test keyboard, visible focus, semantics, form errors, announcements,
  contrast, zoom/reflow, reduced motion, dialogs, tables/cards, and screen
  readers on critical journeys.
- [ ] Define performance budgets for public JavaScript, LCP media, layout shift,
  Mongo query bounds, and admin list response sizes.
- [ ] Run representative explain plans and load tests against safe non-production
  data; remove unbounded list/search/dashboard queries.
- [ ] Add privacy-aware analytics only after events, consent requirements,
  retention, and owners are approved.

**Exit:** route crawl, metadata/structured-data validation, accessibility,
performance budgets, and representative query checks meet the release bar.

### Phase 12 — Explicitly out of scope: Shopify commerce integration

- [x] Record that Shopify is a usability reference only; no Shopify API,
  Storefront API, checkout, order, payment, webhook, customer, or
  synchronization work is required.
- [x] Keep the cart visibly labelled as a non-transactional preview and do not
  add a commerce handoff.
- [x] Defer any future commerce request to a separate approved plan with its own
  source-of-truth, security, privacy, and operational decisions.

**Exit:** this plan does not integrate Shopify or any other commerce provider;
the MongoDB admin remains the system being built.

### Phase 13 — Evaluate growth pages from evidence

- [ ] Review search terms, support questions, content operations, and commerce
  data after the initial observation window.
- [ ] Create separate approved plans for Journal, Press, gift guides, accounts,
  wishlist, reviews, loyalty, gift cards, or analytics when measurable needs
  exist.
- [ ] Reuse existing catalog/content/list/editor patterns rather than creating
  parallel subsystems.
- [ ] Record rejected/deferred decisions and revisit triggers in the KB.

**Exit:** growth scope is evidence-backed, owned, and separately approved.

### Phase 14 — CI, rollout, documentation, and handoff

- [ ] Add GitLab gates for frozen pnpm install, lint, typecheck, unit, isolated
  Mongo integration, critical E2E, link crawl, accessibility, and build.
- [ ] Keep production credentials unavailable to merge-request jobs and avoid
  printing connection details in any result.
- [ ] Run page-by-page content, legal, catalog, operations, accessibility, SEO,
  and mobile UAT with named approvers.
- [ ] Exercise content revision rollback, static catalog rollback, admin access
  revocation, provider outage, notification retry, and backup/restore in
  staging.
- [x] Update README, relevant numbered KB files, feature docs, decision records,
  changelog, and Plans 001/002 status after each delivered slice.
- [ ] Document content authoring, policy approval, inquiry handling, subscriber
  consent, media, inventory, redirects, and staff recovery runbooks. No
  Shopify runbook is required for this project.
- [ ] Release in the staged order below, monitor, and record acceptance before
  expanding roles or commerce.

**Exit:** a clean-clone pnpm workflow is reproducible, CI is green, UAT and
rollback drills pass, documentation is current, and operational owners accept
the system.

## Delivery slices and dependency order

| Slice | Included phases | Outcome | Can release independently? |
| --- | --- | --- | --- |
| A. Decisions and foundations | 0–3 | Approved inventory, secure platform, content contracts, seeds/indexes | Internal only |
| B. Public trust and content control | 4–5 | Content studio and all trust/client-care/policy/contact pages | Yes, after content/legal approval |
| C. Discovery and catalog operations | 6–7 | Browse/search plus complete product/collection admin | Yes, after parity and catalog UAT |
| D. Leads and audience | 8 | Bespoke/contact/appointment/newsletter operations | Yes, after PII/notification approval |
| E. Operations and governance | 9–10 | Inventory, media, search, team, audit, settings, dashboard | Incrementally, role-gated |
| F. Release hardening | 11 and 14 | SEO, accessibility, performance, CI, runbooks, rollout | Required before broad launch |
| G. Commerce | 12 | Real cart/checkout and order projection | Separate approval and observation |
| H. Growth | 13 | Evidence-backed optional pages | Separate plans |

For one experienced full-stack engineer, Slices A–F are approximately 8–13
engineer-weeks from the current baseline, excluding delays for provider, legal,
content, and business decisions. No commerce integration slice is included in
this work; any future request requires a separate estimate and approval. Use
these as sequencing ranges, not launch promises.

## Files and areas likely involved

| File or area | Expected change |
| --- | --- |
| app/(storefront)/ | Storefront layout and all public route modules while preserving URLs |
| app/products/, app/collections/, app/search/ | Browse, detail, filters, metadata, and search |
| app/bespoke/, app/contact/, app/appointments/ | Lead-generation pages and forms |
| app/client-care/ and informational routes | Hub, shipping, returns, FAQ, care, sizing, sourcing, repairs, policies, accessibility |
| app/sitemap.*, app/robots.*, app/not-found.*, error/loading files | Technical routing, crawler policy, errors, and skeletons |
| app/admin/ | Production login, resource routes, detail editors, search, settings, redirects, governance |
| components/storefront/ or existing public components | Reusable editorial, client-care, list, search, form, breadcrumb, metadata-related UI |
| components/admin/ | Shell, command palette, resource list, editors, revisions, reference pickers, feedback, dialogs |
| lib/content/ | Content registry, schemas, DTOs, repositories, publishing, revisions, cache invalidation |
| lib/catalog/ | Product/collection contracts, filters, search projections, publishing, redirects |
| lib/inquiries/, lib/subscribers/ | Intake, consent, operations, notifications, retention/redaction |
| lib/auth/, lib/permissions/ | Auth.js boundary, active access, roles/capabilities, session revocation |
| lib/media/, lib/inventory/ | Provider adapter, usage, private/public policies, adjustments and movements |
| lib/integrations/ | No commerce integration in this project; create a separate plan if requirements change |
| scripts/db/ | Additive index checks, content seed/migrations, safety guards |
| tests/ and e2e/ | Unit, integration, route contract, role matrix, accessibility, link, and journey coverage |
| app/globals.css and app/admin/admin.css | New public templates and accessible responsive admin patterns |
| public/ | Existing assets retained; additions only when approved and optimized |
| README.md, brain/kb/, brain/CHANGELOG.md | Setup, routes, data, auth, workflows, risks, tests, runbooks, delivery status |
| .gitlab-ci.yml | Frozen pnpm verification and safe non-production test jobs |

## Explicitly out of bounds

- Do not edit, remove, ignore, unignore, track, untrack, rename, or overwrite any
  environment file or gitignore as part of this plan.
- Do not copy the supplied MongoDB URI or any secret into the plan, README, KB,
  fixtures, tests, logs, screenshots, client code, or commit messages.
- Do not change existing product/collection URLs, visible prices, or brand copy
  without an approved migration/content review.
- Do not redesign the existing public visual identity; add pages using its
  established ivory, olive, mulberry, serif, sans, and editorial language.
- Do not build a generic page-builder DSL, executable rich content, plugin
  marketplace, or theme editor.
- Do not build custom payment, checkout, order, tax, discount, refund,
  fulfillment, or customer-account infrastructure.
- Do not hard-delete published/referenced catalog, media, revisions, policies,
  consent, inquiries, inventory movements, or audit records.
- Do not assume Atlas-only features, a particular hosting platform, provider, or
  legal position without confirmation. Commerce provider authority is out of
  scope for this plan.
- Do not make unrelated repository cleanup, dependency modernization, or broad
  JavaScript-to-TypeScript rewrites.

## Verification matrix

| Concern | Automated verification | Manual/operational verification |
| --- | --- | --- |
| Existing route preservation | Route contract and E2E tests for /, /about, product and collection slugs | Baseline screenshot/content comparison |
| Complete route inventory | Expected-route manifest test and production build route review | Navigate every public/admin route from real UI links |
| Internal destinations | Link crawl and rule against page-intended href=# | Header/footer/mobile navigation check |
| Public data isolation | DTO tests proving draft/internal fields absent | Inspect HTML/payloads for draft, cost, actor, notes, PII |
| Admin auth/RBAC | Full anonymous/unlisted/suspended/revoked/wrong-role matrix | Owner recovery and session-revocation drill |
| Content lifecycle | Schema, version conflict, preview auth, publish, revision, rollback tests | Content editor UAT for every page type |
| Policies | Approval/effective-date publish guards | Business/legal sign-off against rendered output |
| Catalog browse | Filters, stable sort, pagination, canonical query, empty/error tests | Desktop/mobile browse and URL back/forward behavior |
| Public search | Input bounds, published-only, pagination, index/query tests | Relevant results and useful zero-results recovery |
| Product/collection admin | CRUD/lifecycle/conflict/redirect/bulk tests | First-time Catalog user task sessions |
| Forms and PII | Validation, rate limit, honeypot, idempotency, redaction, retention tests | Submission, fallback contact, export/delete procedure |
| Subscribers | Normalization, unique consent, unsubscribe, restricted export tests | Consent evidence and provider reconciliation review |
| Inventory | Transaction, movement, stale version, bulk review tests | Two-operator adjustment and audit review |
| Media | Sign/finalize/type/size/usage/access tests | Public CDN render, private access denial, replacement/archive |
| Admin search | Permission-filtered query and result authorization tests | Cmd/Ctrl + K keyboard and sensitive-data review |
| Redirects | Collision, loop, unsafe destination, chain tests | Old slug and canonical behavior smoke |
| Technical SEO | Sitemap/robots/metadata/structured-data snapshots | Search-console-style URL inspection and rich-result validation |
| Accessibility | Automated axe-style scans plus keyboard E2E | Screen-reader, zoom/reflow, focus, forms, dialogs, tables |
| Performance | Bundle/page budgets, query bounds, explain-plan assertions where practical | Representative network/device and admin dataset smoke |
| Error handling | 404, error boundary, retry, provider-down tests | Safe message and request-ID support workflow |
| Commerce integration | Out of scope for this project | No integration or commerce drill is required |
| Rollback | Static catalog/content revision/integration-disable tests | Staging rollback and backup/restore drill |

## Required pnpm checks

Run the narrowest relevant checks during each phase and the full set before a
release:

    pnpm install --frozen-lockfile
    pnpm lint
    pnpm typecheck
    pnpm test:unit
    pnpm test:integration
    pnpm test:e2e
    pnpm test
    pnpm db:ping
    pnpm db:indexes -- --check
    pnpm db:seed -- --dry-run
    pnpm build

Any integration or migration verification must use an isolated non-production
database and the repository safety guards. No command output may reveal the
MongoDB connection string, topology credentials, tokens, private inquiry data,
or other secrets.

## Acceptance criteria

### Public website

- [ ] Existing home, About, collection-detail, and product-detail URLs still
  render their intended published content.
- [ ] /products, /collections, /search, /bespoke, /contact, /client-care, and
  all approved client-care/policy routes are implemented and linked.
- [ ] No page-intended public navigation/footer link resolves to #; intentional
  same-page fragments remain valid and tested.
- [ ] Every public page has a unique title/description, canonical URL, social
  metadata, logical headings, breadcrumbs where useful, and a useful
  empty/error/not-found path.
- [ ] Sitemap contains only canonical published routes and robots excludes
  admin, preview, and private handlers.
- [ ] Public repositories return only published DTOs; drafts, costs, actors,
  internal notes, consent metadata, and staff data never appear.
- [ ] New published product and collection slugs resolve without a code
  deployment.
- [ ] Search is bounded, paginated, relevant enough for the current catalog,
  published-only, and usable with no results.
- [ ] Legal/policy pages show approved effective/version metadata and cannot be
  published through the admin without the required approval state.
- [ ] Bespoke, contact, appointment, and newsletter forms are validated,
  rate-limited, accessible, idempotent where required, consent-aware, and
  operationally monitored.
- [ ] The demo cart cannot mislead users into believing checkout is live.

### Admin

- [ ] Admin never renders storefront chrome and every protected read/mutation
  enforces production authentication and named permissions at the server
  boundary.
- [ ] Local preview authentication is not deployed as production identity.
- [ ] Dashboard, global search, Products, Collections, Inventory, Content,
  Media, Inquiries, Subscribers, Team, Audit, Settings, Integrations, and
  Redirects have purposeful loading, empty, error, permission, and recovery
  states.
- [ ] Resource lists share URL-backed search/filter/sort/pagination/saved-view
  behavior and domain-safe selection/bulk actions.
- [ ] Product and collection editors support complete domain fields, draft,
  preview, publish, unpublish, duplicate where relevant, archive, revisions,
  conflict handling, and slug redirects.
- [ ] Every approved content key has a structured editor, actual-page preview,
  publish validation, revision history, and rollback.
- [ ] Inventory changes are atomic, attributable, conflict-aware, and always
  create movement history.
- [ ] Media binaries remain outside MongoDB; public/private assets are governed
  separately and in-use assets cannot be hard-deleted.
- [ ] Inquiry and subscriber operations enforce PII/consent permissions,
  redacted audit, retention procedures, and restricted exports.
- [ ] Team management handles allowlisting, roles, suspension, session
  revocation, last login, and last-owner protection.
- [ ] Audit history is immutable/redacted and settings never reveal secrets.
- [ ] A first-time staff user can complete product publish, collection publish,
  content publish, inventory adjustment, inquiry follow-up, and subscriber
  unsubscribe without undocumented developer assistance.

### Quality and operations

- [ ] Frozen pnpm install, lint, typecheck, unit, isolated integration, critical
  E2E, accessibility, link crawl, and production build pass in GitLab.
- [ ] No new lint warnings are introduced; existing warnings are removed as
  affected components are touched or documented with a narrow rationale.
- [ ] Route lists, role matrix, data schemas, search/list queries, and relevant
  Mongo indexes have automated coverage.
- [ ] Representative public pages meet approved performance budgets and admin
  lists remain bounded on realistic data volumes.
- [ ] Content rollback, static catalog rollback, session revocation, provider
  outage, notification retry, and backup/restore are exercised in staging.
- [ ] README, KB, decision records, changelog, runbooks, and both related plan
  statuses match delivered behavior.
- [x] Existing environment files and gitignore remain untouched and retain the
  user's current tracking state.
- [x] Shopify integration is explicitly out of scope; no checkout, orders,
  payments, tax, refunds, fulfillment, or integration tests are required here.

## Rollout

1. Approve Phase 0 decisions and mark route inventory states.
2. Deploy additive schemas/indexes and secure admin foundations with no public
   data-source or route change.
3. Seed and compare structured Home/About/Global content while current code
   output remains the public baseline.
4. Enable owner-only Content and catalog administration in staging; complete
   role, preview, publish, revision, conflict, and rollback UAT.
5. Release approved trust/client-care/policy routes, then replace their footer
   placeholders with real links.
6. Release product/collection indexes and search after Mongo parity and
   published-only verification.
7. Release bespoke/contact/newsletter forms only after PII, notification, and
   retention approvals.
8. Expand staff roles and operational modules one at a time after role-specific
   UAT.
9. Complete SEO/accessibility/performance/CI gates and observe the non-commerce
   launch.
10. Do not start Shopify commerce; any future request must be a separate plan.

## Rollback

- Revert route/layout work through its isolated commit if existing URLs or
  storefront/admin chrome regress.
- Unpublish a faulty content entry and restore the last approved revision by
  creating a new revision; never rewrite revision history.
- Switch public catalog reads back to the existing static repository during the
  Plan 001 rollback window if Mongo output regresses.
- Disable affected public form submission through the approved application
  control while retaining a monitored fallback contact; preserve already
  accepted records.
- Suspend media or notification integrations without deleting queued/audit
  state; retry only after idempotency-safe correction.
- Revert search/list UI without dropping additive fields/indexes until data
  compatibility is confirmed.
- Keep the preview cart disabled and remove any future commerce work from this
  plan; no Shopify event ledger or reconciliation state exists here.
- Restore a Mongo backup only for confirmed corruption. Prefer revisions,
  archive/unarchive, reconciliation, and isolated code rollback for ordinary
  mistakes.
- Record the rollback reason, operator, time, affected routes/data, client
  impact, and explicit re-entry criteria.
- Never use rollback as a reason to modify environment-file or gitignore
  tracking.

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Route scope expands into every possible ecommerce feature | Launch slips and admin becomes incoherent | Priority inventory, explicit P2/P3 gates, separate growth plans |
| Plan 001 and 002 duplicate platform work | Divergent auth/data/publishing systems | Precedence rules and shared phase tracking |
| Unapproved legal/policy copy is treated as final | Legal and customer-service exposure | Required approver metadata and publish guards |
| Sourcing/certification claims exceed evidence | Trust and regulatory risk | Evidence owner, claim review, structured source notes |
| Current URLs or visuals drift during route moves | SEO and brand regression | Route groups preserving paths, baselines, screenshots, E2E |
| Admin relies on hidden navigation as authorization | Unauthorized data access/mutation | Server-side default-deny capability checks and direct-call tests |
| Draft or internal data reaches public output | Confidentiality and content errors | Separate public DTOs, published filters, preview auth, leak tests |
| Environment or credential handling is changed accidentally | User-work loss or secret exposure | Explicit out-of-bounds rule and no env/gitignore tasks |
| Content schema becomes a generic page builder | Long delivery and unsafe rendering | Fixed registry and typed page-specific payloads |
| Content migrations break existing pages | Public outage or lost copy | Dry-run/idempotent seed, schema versions, parity fixtures, revisions |
| Search causes unbounded Mongo scans | Slow pages and database load | Supported indexes, bounded input/results, pagination, explain checks |
| Product/collection slug edits break links | SEO loss and 404s | Redirect records, collision/loop validation, canonical tests |
| Public forms create spam or excessive PII | Abuse and privacy exposure | Minimal fields, limits, rate limiting, consent/retention, redaction |
| Notification failure loses inquiries | Lost leads | Persist before notify, retry state, dashboard alert, fallback contact |
| Private inspiration media becomes public | Severe privacy exposure | Separate private policy/provider path and access tests |
| Inventory edits race | Incorrect availability | Transactions, versions, movement records, reviewed bulk adjustments |
| Media deletion breaks published pages | Broken storefront | Usage graph, archive/replace, hard-delete prohibition |
| Dashboard/global search leaks restricted data | PII and access exposure | Permission-filtered queries/results and sensitive logging ban |
| Accessibility is deferred until the end | Costly rework and exclusion | Shared accessible primitives, per-phase checks, manual critical-path UAT |
| Commerce integration creeps into scope | Security/compliance/operational burden | Explicitly out of scope; create a separate approved plan if requirements change |
| Custom commerce creeps into MongoDB | Security/compliance/operational burden | Keep checkout, payment, order, tax, and fulfillment flows disabled |
| Too many provider decisions block all progress | Idle delivery | Release slices; build provider-independent contracts while honoring STOP gates |

## STOP conditions

Stop the dependent phase and obtain a decision if:

- the route inventory, canonical route, or release priority is disputed;
- policy, shipping, returns, warranty, accessibility, or sourcing copy lacks its
  named business/legal/evidence approval;
- a page would need invented facts, company identity, service commitment,
  consent wording, or legal terms;
- implementation would edit or change tracking for an environment file or
  gitignore;
- a secret or connection string would need to enter client code, source,
  documentation, fixtures, logs, or command output;
- production auth provider, initial owner, recovery, or session policy is
  unknown at the auth phase;
- media/private-upload provider and access/retention policy are unknown at the
  media or inspiration-upload phase;
- PII retention, export, deletion, access, or notification ownership is unknown
  before public form release;
- the actual Mongo deployment does not support the selected transaction or
  search strategy;
- production Mongo data contains undocumented records, duplicate keys, or
  ownership conflicts;
- a route/data migration would change existing URLs, prices, visible copy, or
  images without an approved map;
- public output exposes drafts, internal fields, notes, staff data, consent
  evidence, or secrets;
- Someone requests Shopify or another commerce integration without a new
  approved plan;
- checkout would require custom card handling or Mongo-owned payment/order
  state;
- a verification command continues to fail after two scoped correction
  attempts;
- unrelated user work overlaps a required move/edit and cannot be preserved.

## Open decisions and recommended owners

| Decision | Needed by | Recommended owner |
| --- | --- | --- |
| Canonical /products and optional /shop redirect | Phase 0 | Product/brand owner |
| Final page inventory and public navigation labels | Phase 0 | Brand/content owner |
| Shipping, returns, warranty, privacy, terms | Before Phase 5 publish | Business owner plus legal reviewer |
| Sourcing, lab-grown, and certification claims | Before Phase 5 publish | Product/sourcing owner plus reviewer |
| Accessibility feedback channel and ownership | Before Phase 5 publish | Business/accessibility owner |
| Contact channels, response expectations, appointments | Before Phases 5/8 | Client-service owner |
| Production auth provider and initial owner recovery | Before Phase 2 production access | Technical owner plus business owner |
| Public/private media provider and policies | Before Phase 9 | Technical/content owner |
| Email/notification provider and retry ownership | Before Phase 8 | Operations/technical owner |
| PII consent, retention, export, correction, deletion | Before Phase 8 | Business/legal/operations owners |
| Hosting, staging, backups, monitoring | Before broad rollout | Technical owner |
| Currency, locations, made-to-order and inventory authority | Before Phases 7/9 | Catalog/operations owner |
| Future commerce requirements | Separate future plan only | Business/technical owners |
| Analytics provider, consent, events, retention | Before any analytics | Business/legal/technical owners |

## Executor handoff

1. Read Plans 001 and 002 completely and inspect the current repository before
   editing.
2. Obtain explicit approval for this proposed plan and finish Phase 0.
3. Execute slices in dependency order; do not begin page UI that bypasses
   unfinished auth, data, policy, or PII gates.
4. Keep each route family, data migration, admin module, and integration in
   reviewable, independently reversible commits.
5. After each slice, update the relevant KB, changelog, Plan 001 execution log,
   Plan 002 checklist/status, and plans index.
6. Preserve user-owned environment/gitignore state throughout execution.
7. Use kenmark-plans-execute only after approval.

## References

- brain/plans/001-mongodb-shopify-like-admin.md
- brain/kb/01-architecture.md
- brain/kb/03-data-model.md
- brain/kb/04-auth-and-permissions.md
- brain/kb/06-ui-and-routes.md
- brain/kb/08-flows-and-workflows.md
- brain/kb/10-testing-and-quality.md
- brain/kb/11-known-risks-and-decisions.md
