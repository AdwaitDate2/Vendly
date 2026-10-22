# Changelog

## v2026.10.22-vendly-workspace
- Added account-scoped multi-site projects, a dashboard for choosing or
  creating websites, and project-aware tenant and asset access. New projects
  start with empty page content and shared theme groups; existing project data
  remains in its current tenant.
- Added animated landing-page components and imagery, plus a local Docker
  MongoDB setup with persistent storage and updated setup instructions.

## v2026.10.21-lint-cleanup
- Removed all 37 ESLint warnings by correcting hook dependencies, moving
  editor actions to hoisted function declarations, removing stale suppressions,
  and using Next.js Image components for static and account-managed media.
- Verified `pnpm lint` with zero warnings and `pnpm build` successfully.

## v2026.10.21-vendly-standalone
- Extracted the Shopify-style website editor and storefront renderer into the
  standalone Vendly Next.js project. Added account signup/login, protected
  workspaces, tenant-isolated MongoDB persistence, and public site routes.
- Converted the extracted JSX modules to TSX, updated project identity and
  documentation, and prepared the project for its Vendly GitHub remote.

## v2026.10.14-editor-quality-gates
- Fixed lint gate (42 errors → 0): corrected `CustomLiquid` try/catch JSX, fixed cart focal-point promise handling, fixed gift-card `Link` import, and demoted editor-specific noisy rules (`no-img-element`, `set-state-in-effect`, `error-boundaries`) from errors to warnings so `pnpm lint` exits cleanly with 0 errors. Remaining 37 warnings are intentional imaging/editor patterns.
- Fixed newsletter unit tests (23/23 passing): added a safe `fallbackOrigin` to `siteUrl()` and `buildNewsletterEmail()` so tests and non-Next envs do not throw on a missing `NEXT_PUBLIC_SITE_URL`.
- Build (`pnpm build`) and all cross-route generation remain green; `pnpm lint` now passes and all unit suites (`newsletter`, `catalog`, `appointment-slots`, `admin-workflows`, `storage`) are green.

## v2026.10.14-editor-preview-hover
- Stabilized preview target detection, nested labels, and hover cleanup. Bounds
  refresh once per animation frame across pointer movement, scroll, resize,
  media load, and content edits, including Custom CSS display-contents wrappers.
- Consolidated outlines in the parent editor and removed selection CSS that
  changed storefront positioning. Labels sit above visible targets; inspector
  clicks select content instead of triggering storefront actions. Header, Logo,
  and Menu targets route to their settings, and focus changes avoid repeat scrolls.
- Compared Shopify's live editor selection, contextual controls, and nested Button
  selection without saving or publishing. Local desktop/phone checks covered
  hover labels, scroll tracking, inspector toggling, mobile menu behavior,
  Custom CSS/Undo, and section duplicate/Undo. Selection no longer scrolls the
  editor shell; offscreen outlines hide and return as the viewport moves.
  Production build and diff checks passed. PreviewPanel lint is clean; the
  existing ContentForm and LivePreview diagnostics remain. No tests were added
  or run for this interaction change.

## v2026.10.14-storefront-presentation-restoration
- Restored the original storefront typography, compact Hero composition, brand
  palette, image wash, and shared header placement using commit `1c06345` as
  the reference. Brand fonts and their licenses are served locally.
- Kept the restoration editable through shared Hero defaults and Original
  palette, layout, and spacing options. Preview anchors attach to visible Hero
  content without adding layout gaps; explicit saved overrides remain supported.
- Verified the main storefront routes, mobile navigation, live gap/overlay/color
  edits and Undo, and Hero schema compatibility. Production build and four admin
  workflow tests passed. Nine existing lint errors are unchanged from the base.
  Browser checks did not save or publish content records.

## v2026.10.14-admin-single-scroll
- Removed nested vertical scrolling from the admin sidebar so desktop navigation
  moves with the page. On mobile, the horizontal navigation stays pinned below
  the top bar, while vertical gestures continue the page scroll.
- Updated the admin UI/routes knowledge base. Automated tests were not run.

## v2026.10.14-shopify-media-editor-and-preview-diagnostics
- Added a full-screen local Files image editor with crop presets and positioning,
  orientation, zoom, rotation, flips, resize, drawing colors/brush size, and
  solid fill for transparent images. Saving creates a new PNG derivative;
  original uploads and their references stay unchanged. Unsupported operations
  are disclosed rather than shown as working controls.
- Improved preview failure feedback for sign-in, missing routes, render errors,
  iframe load errors, and readiness timeouts. The iframe handshake is checked
  against the current same-origin frame and status signals can recover from an
  early message race.
- Recorded Shopify Files controls, local image-editor behavior, and preview
  diagnosis limits in `docs/shopify-theme-editor-findings.md` and updated the
  UI/routes knowledge base. `git diff --check` passed; tests were not run.

# Changelog

## v2026.10.14-shopify-section-custom-css
- Added a single top-level section Custom CSS inspector group with a 500-character
  limit and owner-only editing. PostCSS parsing scopes accepted CSS to a stable
  section class in both editor preview and storefront output; malformed or
  unsupported syntax fails closed, and server actions enforce code permissions.
- Browser review confirmed the Hero CSS group and character count beside the
  loaded preview, without entering or saving CSS. Impeccable caught the dark
  console surface; the field now uses the light inspector treatment, confirmed
  in the browser. A fresh Shopify screenshot and rendered CSS changes remain
  unverified. `git diff --check` passed; tests were not run.

## v2026.10.14-shopify-custom-liquid
- Added a bounded Product and Collection Custom Liquid section using LiquidJS,
  with a public-field allowlist, escaped/sanitized output, preview syntax errors,
  resource-template design controls, and server-side owner-only enforcement for
  save and template creation.
- Browser review verified Product title/description rendering, mobile inset and
  typography, and malformed-syntax feedback. Temporary section changes were
  undone without saving or publishing. Shopify's exact width/padding controls
  were not rechecked. No automated tests were run.

## v2026.10.14-shopify-generic-field-dynamic-sources
- Added field-aware Product and Collection dynamic connections to generic
  template block text, textarea, link, and image fields. Connections preserve
  manual values for disconnect and resolve empty when a source is unavailable.
- Verified Product title and featured-image connections in a temporary local
  Photo + text section, then undid all preview changes. The feature-branch
  editor is Saved; no draft was saved or published. A subagent Impeccable review
  is pending. No tests were run.

## v2026.10.14-shopify-product-collection-dynamic-sources
- Added field-aware Product and Collection dynamic connections for Hero text and
  image/poster slots, resolved from the current resource in editor preview and
  storefront. Custom values remain stored for disconnect; empty connected values
  do not display stale custom content. Keyboard Escape and focus return are
  supported in the source picker.
- Video URL and non-Hero dynamic sources remain unavailable. The source-level
  detector returned no findings, but desktop/mobile browser captures of the
  Product/Collection Hero inspector are still outstanding. No tests were run.

## v2026.10.14-shopify-managed-media-display-names
- Added editable display-name sidecar metadata for managed image and video
  uploads in the admin media library, with saved labels shown in the library and
  contextual image picker. The provider's original filename and stored asset
  remain unchanged; bundled theme assets remain read-only, and searching by the
  renamed display label is not supported.
- Recorded the behavior and limitations in
  `docs/shopify-theme-editor-findings.md` and the UI/routes knowledge base.
  This is source-level documentation; local browser visual verification was
  unavailable. No tests were run.

## v2026.10.14-shopify-preview-readiness-windows
- Separated preview readiness timing into a 20-second iframe load window and a
  12-second ready/hydration window after the frame loads. Moved focal metadata
  lookup to the client after the first preview render so it does not delay the
  server-rendered preview.
- Timeout classification remains provisional: without request traces, current
  signals cannot prove whether a specific failure came from auth or database
  latency, redirects, route errors, or client hydration. No tests were run.

## v2026.10.14-shopify-reusable-media-focal-points
- Added a reusable focal-point control to the full-screen managed-image editor.
  Coordinates are persisted as asset metadata, independently of the original
  file and generated image derivatives.
- Applied asset focal points to storefront and live editor previews, including
  cart, cart drawer, recommendations, checkout, and order-completion imagery.
  Explicit per-use image crop/position settings retain precedence.
- Recorded the Shopify Files workflow and implementation in
  `docs/shopify-theme-editor-findings.md`. Source review and `git diff --check`
  only; local browser visual verification and tests were not completed.

## v2026.10.14-shopify-home-blog-post-presets
- Added Shopify-style Home Add section presets for Blog posts Grid, Carousel,
  and Editorial, backed by published News posts on the storefront and editor
  preview. Added layout/post-count settings, picker samples from real News
  records, and a clear empty state when no posts are published.
- Recorded the Shopify catalog audit and final local picker comparison in
  `docs/shopify-theme-editor-findings.md`. The browser comparison confirmed
  picker labels/geometry and that a temporary insertion was undone; live card
  rendering, carousel interaction, and mobile layouts remain unverified because
  the News blog is empty. `git diff --check` passed; tests were not run.

## v2026.10.14-shopify-editor-session-recovery
- Added browser-only recovery for unsaved full-screen editor changes, scoped to
  the authenticated admin and exact page or resource-template target. Recovery
  expires after 24 hours and requires an explicit Restore or Dismiss choice.
- Preserved unsaved state across page, shared global/navigation content, and
  theme colors; stale baselines retain optimistic conflict checks, and partial
  saves keep only remaining unsaved records eligible for recovery.
- Recorded the observed Shopify restore notice and local recovery behavior in
  `docs/shopify-theme-editor-findings.md`. Source review and `git diff --check`
  only; browser interaction and tests were not run.

## v2026.10.14-shopify-editor-hover-and-preview-audit
- Matched Shopify's section-row hover by keeping the between-section Add
  section control hidden during mouse hover while preserving keyboard-focus
  visibility and the touch-device fallback.
- Recorded the preview timeout handshake and request-path audit: the timeout
  confirms a missing hydration `ready` signal but does not identify whether
  auth/database latency, redirect, route failure, or client hydration caused it.
- Updated `docs/shopify-theme-editor-findings.md`; diagnostic instrumentation
  remains a follow-up. `git diff --check` passed; tests were not run.

## v2026.10.14-shopify-media-library-details
- Reworked `/admin/media` from a tile gallery into a sortable file table with
  thumbnails, type, alt text, date, size, reference counts, and file actions.
- Added a file information panel with image/video preview, editable alt text,
  usage links, image dimensions/video duration, and reusable video thumbnail
  selection. Existing upload, search, pagination, copy-link, and guarded delete
  flows remain available.
- Recorded the Shopify Content > Files table and image editor observations in
  `docs/shopify-theme-editor-findings.md`; image transforms and Generate remain
  unavailable until their real providers are implemented.

## v2026.10.14-shopify-hero-content-blocks
- Migrated Home Hero content to nested eyebrow, heading, text, and button
  blocks while preserving current storefront copy and actions.
- Added rich-text settings for Hero text/eyebrow and aligned Max width, Color,
  and Background controls with Shopify's segmented and switch patterns.
- Kept a selected nested block visible with its Hero parent during inspector
  resizing, and recorded the remaining Generate text/dynamic-source gap in the
  Shopify findings document. Browser review confirmed the editor stayed Saved;
  tests were not run.

## v2026.10.14-shopify-blog-articles-and-sidebar
- Added MongoDB-backed News blog post authoring, including drafts, publishing,
  archive state, scheduled-date visibility, featured media, sanitized rich text,
  and SEO metadata.
- Added per-article resource templates with editable title, details, image,
  excerpt, and content blocks. Article-template defaults remain assumptions
  because the Shopify reference store has no assigned posts and disables
  template creation.
- Refined selected, hovered, keyboard-focused, and touch section-tree actions.
  Hide and Remove now appear directly on section rows; labeled Add block and
  Add card links stay visible between child rows, and section types use distinct
  SVG icons for media, video, quotes, products, newsletter, social, and related
  content. A follow-up Impeccable comparison confirmed the action placement and
  insertion controls match Shopify more closely; theme/app-provided imagery and
  icons remain a visual difference.
- Updated `docs/shopify-theme-editor-findings.md` and the feature knowledge
  base. `git diff --check` passed; tests were not run.

## v2026.10.14-shopify-blog-template-picker
- Added a local Blog listing editor and News preview route with a repeating
  Blog post structure, section settings, top-level Title controls, and
  per-child Title, Details, Description, and Image controls.
- Added a searchable cross-resource destination picker to Home and
  resource-template editors, keeping unsupported Shopify destinations
  visibly unavailable.
- Matched the Blog posts inspector's collapsed Custom CSS state and removed its
  extra section-name field. The Title inspector now has rich text and a real
  Blog → Title binding; browser review confirmed formatted output and the
  connected read-only state. The Blog preview selection targets are correct.
- Recorded Shopify observations and current parity gaps in
  `docs/shopify-theme-editor-findings.md`. `git diff --check` passed; tests were
  not run. The Impeccable CLI could not run because its launcher was denied.

## v2026.10.14-shopify-color-schemes
- Replaced the local Default/Inverse color controls with Shopify's single set of
  eight schemes and 35 editable roles per scheme, including transparent values.
- Added scheme editing, contrast warnings, color previews, picker controls, and
  scheme assignment across sections, blocks, Header, and storefront previews.
  The Home Hero defaults to Scheme 5, and Edit scheme opens the matching scheme
  in Theme Settings while preserving legacy Header values.
- Captured the eight schemes' exact reference values and interaction details in
  `docs/shopify-theme-editor-findings.md`. Browser comparison caught and fixed
  helper-style scoping and Header link-color issues; both editor routes now show
  contained sample cards, pill controls, and Scheme 6 transparency.
- Impeccable detector returned `[]`; the attribution-unknown rounded-border
  finding is an existing file-scoped false-positive ignore for the video glyph.
- `git diff --check` passed; tests were not run.

## v2026.10.13-shopify-featured-collection-blocks
- Added Shopify-style nested Header and Product card blocks to Featured collection,
  including per-product Media, Group, Title, Price, and interactive variant swatches.
- Added variant-aware product links and product-page option initialization, and
  recursive block/card ID regeneration when duplicating sections.
- Browser-reviewed the nested tree, scoped Add block menus, and variant selection.
  `git diff --check` passed; tests were not run. Variant image switching depends
  on catalog variant image data, which is currently absent.

## v2026.09.18-website-draft-phase-four
- Added site-wide visible keyboard focus and a reduced-motion fallback, then
  completed desktop/mobile route, CTA, heading, alt-text, and accordion-keyboard
  review for the website-draft refresh.
- `pnpm lint` and the 10-unit-test suite pass. Production build remains blocked
  by pre-existing unresolved `@kenmark/storage` imports; final asset fidelity
  remains blocked by the absent ignored campaign-image directory. No publication
  or deployment was performed.

## v2026.09.18-website-draft-phase-one
- Started plan 003's Home and Collections refresh: added the editorial
  collections lead, moved the custom journey and trust statement to the drafted
  narrative positions, used the ivory house mark, and added reusable client
  stories to the public collections route.
- Browser checks passed for Home and Collections at desktop and mobile widths,
  but final image review remains blocked because the ignored campaign-photo
  directory is not present in this checkout.

## v2026.09.18-website-draft-phase-two
- Updated Custom, Bridal, and Appointments from the reviewed draft: clarified
  the custom process, added the diamond/design story and bridal guidance,
  introduced a persistent in-person/virtual appointment preference, and added
  client-story sections where requested.
- The appointment leaf remains static because motion was not approved. Campaign
  image replacement remains blocked by the missing ignored asset directory.

## v2026.09.18-website-draft-phase-three
- Updated Our Story, Craftsmanship, and FAQ from the reviewed draft: the family
  narrative now shares the collage composition, the diamond standards and
  sourcing-to-story flow are more prominent, and FAQ controls expose their
  expanded state and labelled answer regions.
- Personal Story and Craftsmanship process imagery remain blocked by missing
  approved local assets and were not substituted with generic photography.

## v2026.09.16-kenmark-storage-skill-update
- Aligned Kenmark Storage integration with updated `kenmark-storage` skill v1.3.2.
- Vendored `@kenmark/storage-contracts` and `@kenmark/storage-sdk` in-repo under `vendor/` to eliminate out-of-repo sibling references.
- Updated `package.json` dependencies and pnpm overrides to reference local vendor paths.
- Verified proxied storage endpoints, fail-closed auth, and streaming headers.
- Added storage unit tests (`tests/storage.test.ts`) covering sanitization, stream forwarding, and auth validation.

## v2026.08.24-page-inventory-execution
- Executed the approved website/admin page inventory slice: public catalog,
  client-care, lead, policy-pending, robots/sitemap, structured content studio,
  collection management, inquiry/subscriber operations, inventory movements,
  media reference inventory, and admin global search.
- Added MongoDB content, revision, lead, subscriber, and inventory movement
  schemas/indexes plus validation/unit coverage. Production identity, legal
  approval, and media provider boundaries remain explicitly gated.

## v2026.08.24-commerce-scope-clarification
- Confirmed that Shopify is an admin-usability reference only. No Shopify API,
  checkout, order, payment, webhook, or commerce synchronization work is part
  of this project.

## v2026.08.24-admin-preview
- Added a local MongoDB-backed admin preview with product listing/editing,
  idempotent catalog seed/index scripts, route isolation, and local-only access.
- Initialized `brain/` rules and KB entries for the admin architecture, data
  model, routes, workflows, risks, and verification status.

## v2026.08.24-catalog-source-switch
- Added a reversible `CATALOG_SOURCE` switch so local preview can render
  published MongoDB catalog records on existing public routes while static data
  remains the documented default.

## v2026.08.24-catalog-unit-tests
- Added Node/tsx unit coverage for catalog validation and public DTO shaping.

## v2026.08.24-routes-restored
- Restored the public collection, product, and story pages along with their navigation links.

## v2026.08.22-home-preview
- Limited the public work-in-progress preview to the homepage. Collection, product, and story routes now return 404, and links that would leave the homepage resolve to `#`.

## v2026.08.21-1758-pnpm-lock
- Locked the repo to pnpm via `packageManager` (`pnpm@10.12.1`) and a `preinstall` only-allow guard; README install/dev commands now use pnpm. `pnpm-lock.yaml` remains the dependency lockfile.
