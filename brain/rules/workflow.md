# Development workflow

## Branch policy

`main`, `master`, `dev`, `develop`, `staging`, and `production` are protected
deployment branches. Use a descriptive `feature/` or `fix/` branch for normal
work and merge through review unless a human explicitly approves direct push.

## Local workflow

- Check for an existing dev server before starting another one.
- Keep migrations and seed scripts idempotent and never delete unknown records.
- Update KB and changelog with meaningful code changes.
- Do not commit `.env`, `.env.local`, credentials, keys, or tokens.
