# Project standards

- Prefer the smallest correct change; preserve unrelated user work.
- Use pnpm for package installation and scripts.
- Keep secrets in ignored environment files; never commit credentials or expose
  server values through `NEXT_PUBLIC_*` variables.
- Validate untrusted input at server boundaries and authorize mutations close to
  the data source.
- Update the relevant `brain/kb/` file and `brain/CHANGELOG.md` after meaningful
  behavior, route, API, data, auth, deployment, or testing changes.
- Run the narrowest useful verification after each substantive change and report
  warnings/failures honestly.
