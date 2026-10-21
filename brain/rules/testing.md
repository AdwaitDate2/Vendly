# Testing policy

- Run `pnpm lint` and `pnpm build` after substantive application changes.
- Run `pnpm db:ping`, `pnpm db:indexes -- --check`, and seed dry-run/apply when
  database behavior changes.
- Integration tests must use an isolated test database before they are added.
- Manual route checks should confirm admin authentication boundaries and that
  storefront chrome does not render under `/admin`.
