# Vendly features

Last updated: 2026-10-21
Status: active

Vendly is the standalone website-builder project extracted from the byShreen
editor and storefront renderer. The editor source history below is retained as
implementation context; the running product uses per-account workspaces and
tenant-isolated persistence.

## Current product capabilities

- Account signup, login, signed sessions, and protected workspace routes.
- Per-account MongoDB tenant databases for editor and website content.
- Shopify-style theme and page editors with reusable sections and responsive
  storefront previews.
- Draft and publish controls with public pages served at `/store/{siteSlug}`.
- Media library and account-scoped uploads through Kenmark Storage.
- Starter storefront content and assets that account owners can replace.

## Retained editor implementation notes

| ID | Feature | Doc |
| --- | --- | --- |
| 001 | MongoDB catalog admin preview | [features/001-mongodb-admin-preview.md](features/001-mongodb-admin-preview.md) |
| 002 | Complete website and admin page inventory | [features/002-complete-website-admin-page-inventory.md](features/002-complete-website-admin-page-inventory.md) |

The local theme editor uses Shopify as its admin UX reference. Editor parity is
ongoing; Shopify API synchronization remains out of scope.

Home Hero content migrates to nested eyebrow, heading, text, and button blocks
while preserving the page's existing copy and actions. Hero Text and eyebrow
inspectors provide rich text, Shopify-like segmented layout/color choices, a
background switch, typography, and per-edge padding. Generated text and
dynamic-source actions remain open parity gaps.

The theme color editor now models Shopify's single shared Scheme 1–8 palette.
Each scheme stores 35 roles across Base, Primary button, Secondary button,
Inputs, Variants, and Selected variants; transparent values are supported.
Section, block, Header, and storefront preview controls can select a scheme,
show palette swatches, and open Theme Settings on the selected scheme. Legacy
Header palette values remain readable through a compatibility mapping, and the
Home Hero defaults to Scheme 5. The standalone `/admin/theme` page and embedded
Theme Settings editor share the same scheme data. Detailed browser values and
remaining parity gaps are tracked in `docs/shopify-theme-editor-findings.md`.

The editor also has a local Blog listing template for the News blog, including
the repeating Blog post block structure, a rich-text Title editor with a real
Blog → Title dynamic-source binding, and Shopify-style child-block settings.
Home and resource-template editors share a searchable destination
picker for supported pages, resources, and templates; unsupported destinations
are marked. News blog posts now have a MongoDB-backed admin workflow for draft,
published, and archived content, including sanitized rich text and featured
media. Individual blog posts now have resource templates keyed by stable post
ID, with editable title, details, featured image, excerpt, and rich-text body
blocks. Shopify's reference store had no assigned posts and disabled article
template creation, so those article-template controls and defaults remain
unverified assumptions.

The media picker now supports date ordering, minimum/maximum MB filters,
Product media / Other / Unused categories, actual product-image filtering, and
per-file details. Product matching currently covers `product.images` rather
than variant media; uploads beyond the loaded page require pagination. Shopify
video cover-image editing, Generate image, several Shopify-only template
families, and app-backed sections remain open work. Detailed browser evidence
and assumptions are in `docs/shopify-theme-editor-findings.md`.

## Documentation gaps

- Auth.js production identity, approved policy copy, media provider uploads,
  notification operations, and team/audit governance remain gated modules.
