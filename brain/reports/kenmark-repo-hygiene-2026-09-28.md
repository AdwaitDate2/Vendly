# Repo Hygiene and Code Health Audit — 2026-09-28

Scope: project structure, repo clutter, and code quality gates (lint, tests) for the byShreen Next.js app at the repo root.

## Summary

| Category | Finding | Risk | Status |
| --- | --- | --- | --- |
| Secrets | `.env` tracked and pushed to `origin/main` (3 commits), with 8 populated values | **High** | **Open** — rotate credentials, untrack, decide on history rewrite |
| Uncommitted work | 65 untracked + 62 modified files on `main`, including the whole commerce/admin feature set | **High** | **Open** — commit on a feature branch |
| Lint | 1 error (`Date.now()` during render in the admin dashboard) | Med | Fixed |
| Tests | 2 of 10 failing | Med | Fixed — 12 of 12 pass |
| Duplicate plan folders | Root `plans/` duplicated `brain/plans/` | Low | Fixed |
| Untracked migration | Metal-options migration lived only in ignored `scratch/` | Med | Fixed |
| Dead folder | `vendor/` (stale build output of the storage packages, unreferenced) | Low | Deleted |
| Redirect-only routes | `app/about`, `app/faqs`, `app/appointments`, `app/contact`; `/contact` also redirected in config | Low | Fixed |
| Lint warnings | 13 × `@next/next/no-img-element` | Low | Open |
| `.gitignore` | Broad `public/` rule would silently ignore new icons | Low | Open |
| Test coverage | No tests for checkout, payments, refunds, or order state | Med | Open |

## Open: high risk

### Tracked `.env`

`.env` is in git despite being listed in `.gitignore`, and has reached `origin/main`. Populated keys (values not reproduced here): `MONGODB_URI`, `MONGODB_DB`, `CATALOG_SOURCE`, `ADMIN_PREVIEW_TOKEN`, `NEXT_PUBLIC_SITE_URL`, `KENMARK_STORAGE_URL`, `KENMARK_STORAGE_KEY`, `ASSETS_API_AUTH_SECRET`.

Anyone with read access to the GitLab repository holds the database connection string, the storage key, the asset API secret, and a token that signs in to the admin.

1. Rotate the MongoDB user password, `KENMARK_STORAGE_KEY`, `ASSETS_API_AUTH_SECRET`, and `ADMIN_PREVIEW_TOKEN`.
2. `git rm --cached .env` and commit (the local file stays).
3. Decide whether to purge history (`git filter-repo`); rotation is required either way.
4. Run `kenmark-repo-secrets` for a full redacted scan.

### Uncommitted work on `main`

The orders, checkout, payments, discounts, customers, settings, and team features exist only in the working tree. Commit them on a feature branch in grouped commits so they can be reviewed and are not lost.

## Fixed in this pass

### Lint error — `app/admin/(protected)/page.js`

`SalesCard` computed its 30-day axis from `Date.now()` during render (React's purity rule). `getSalesSummary()` in `lib/orders.js` now returns `asOf`, the same timestamp its query window is built from, and the card uses it. This also keeps the chart axis and the database query aligned to one instant. `pnpm lint` exits 0.

### Failing tests

- `tests/catalog.test.ts` — the test expected the legacy `default` variant to pass through unchanged. Since the metal-options change, `withOptions()` intentionally converts it into 14kt and 18kt options. The test now checks that conversion (ids, title with metal colour, preserved stock, 18kt price at +15% rounded to the dollar, cheapest price as product price).
- `tests/storage.test.ts` — `validateCallerAuth()` read the admin session via `cookies()`, which throws outside a Next.js request. The session lookup is now an optional injected dependency (`{ getSession }`, defaulting to `getAdminSession`), so production behaviour is unchanged. Catching the error instead was rejected: Next.js relies on that error to mark GET route handlers dynamic. Added a test that a wrong bearer secret is rejected and the right one accepted.

Result: `pnpm test` — 12 pass, 0 fail.

### Structure

| Change | Detail |
| --- | --- |
| `plans/` → `brain/plans/archive/2026-08-24-improve-workflow/` | Moved with `git mv` (history kept). Superseded by plan 001; noted under "Archived" in `brain/plans/INDEX.md`. |
| `scratch/migrate-variants.mjs` → `scripts/db/migrations/2026-09-28-metal-options.mjs` | Now tracked, documented, and runnable with `pnpm db:migrate:metal-options`. Backups go to `temp/backups/` (gitignored). Safe to re-run. |
| `vendor/` deleted | Untracked build output; nothing referenced it. `packages/` is the source of truth. |
| Redirect pages → `next.config.mjs` | `/about` → `/our-story`, `/faqs` → `/faq`, `/appointments` → `/book-appointment`, `/contact` → `/book-appointment` (was duplicated). All permanent (308); previously 307 from `redirect()`. Verified on the dev server. |

Left in `scratch/` on purpose: `publish-policy-content.mjs` and `reset-wired-content.mjs` overwrite live site content with code defaults. They are one-off resets, and keeping them out of tracked scripts avoids an accidental re-run wiping edits made in the admin.

## Open: lower priority

- **`lib/` is a flat folder of 40 files**, and server actions are split across four files. Suggested grouping as it grows: `lib/commerce/`, `lib/content/`, `lib/admin/`.
- **`app/admin/admin.css`** (779 lines) stacks three themes; only the last is live. To be replaced in the admin redesign.
- **Test coverage**: nothing covers checkout, payments, refunds, or order state. Use `kenmark-test-plan` to prioritise.
- **`.gitignore`**: narrow `public/` to `/public/images/` and `/public/videos/` so new icons in `public/icons/` stay tracked. Images are served from Kenmark Storage via `lib/asset-paths.js`, so ignoring them is intentional.
- **Committed agent tooling**: 74 files under `.agents/` and `.claude/` (including a 1 MB font index). Fine if shared deliberately.
- **`.next/`** is 3.6 GB of dev cache; safe to delete while the dev server is stopped.
- **13 lint warnings** for `<img>` in admin thumbnails, the block renderer, and the Instagram feed.
