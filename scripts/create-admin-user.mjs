// Create an admin account, or reset its password (which signs out its existing sessions).
// Usage: pnpm admin:user --email shreen@byshreen.com --name "Shreen" [--password "..."]
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';
import { ensureAdminUserIndexes, upsertAdminUser } from '../lib/admin-users';

const { values } = parseArgs({
  options: {
    email: { type: 'string' },
    name: { type: 'string' },
    password: { type: 'string' },
  },
});

if (!values.email || !values.name) {
  console.error('Usage: pnpm admin:user --email <email> --name <name> [--password <password>]');
  process.exit(1);
}

const password = values.password || randomBytes(12).toString('base64url');

try {
  await ensureAdminUserIndexes();
  const user = await upsertAdminUser({ email: values.email, name: values.name, password });
  console.log(`Admin account ready: ${user.email} (${user.name})`);
  if (!values.password) console.log(`Generated password (shown once): ${password}`);
  process.exit(0);
} catch (error) {
  console.error(error.issues ? error.issues.map((issue) => issue.message).join('\n') : error.message);
  process.exit(1);
}
