# Testing and quality

Last updated: 2026-10-21
Status: active

## Verification

- `pnpm lint` passes with zero warnings and zero errors.
- `pnpm build` passes and generates the App Router routes, including account
  signup/login, editor, preview, and public tenant storefront routes.
- Unit tests are available through `pnpm test:unit`; they were not run during
  the warning cleanup.

## Commands

- `pnpm lint` runs ESLint.
- `pnpm test:unit` runs Node tests through `tsx`.
- `pnpm build` builds the Next.js production app and local storage packages.

## Coverage gaps

- Account isolation, account recovery, and public draft/publish flows should
  receive integration and browser coverage as the project is prepared for
  deployment.
