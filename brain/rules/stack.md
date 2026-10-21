# Stack conventions

- Next.js App Router and React are the application runtime.
- Existing public components remain JavaScript/JSX; new server/admin modules may
  use TypeScript incrementally.
- Use the official `mongodb` driver with a shared client and explicit DTOs.
- Use Zod at form and data boundaries.
- Prefer Server Components for reads and Server Actions for first-party writes.
- Keep binary media outside MongoDB.
