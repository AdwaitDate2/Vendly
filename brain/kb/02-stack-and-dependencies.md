# Stack and dependencies

Last updated: 2026-10-21
Status: active

## Confirmed facts

- The app uses Next.js 16.3.2, React 19.2.8, TypeScript 5.9, and pnpm 10.12.1.
- App Router pages and extracted JSX components use TSX. Supporting server,
  content, and storage utilities may remain JavaScript where appropriate.
- MongoDB is accessed with the official `mongodb` driver; Zod validates input at
  data boundaries.
- Kenmark Storage packages are vendored in the project under `packages/`.
- The project includes ESLint and `tsx` for linting, tests, and TypeScript scripts.

## Important files

- `package.json` and `pnpm-lock.yaml` — scripts and dependency versions.
- `tsconfig.json` and `eslint.config.mjs` — TypeScript and lint configuration.
- `packages/` — local storage packages used by the application.
