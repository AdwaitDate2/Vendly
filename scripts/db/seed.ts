// @ts-nocheck
import dotenv from 'dotenv';
import { seedCatalog } from '../../lib/catalog.js';
import { seedContent } from '../../lib/content.js';
import { closeMongoClient } from '../../lib/mongodb.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  try {
    const dryRun = process.argv.includes('--dry-run');
    const result = { catalog: await seedCatalog({ dryRun }) };
    if (process.argv.includes('--content')) result.content = await seedContent({ dryRun });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await closeMongoClient();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
