// One-time migration (2026-09-28): converts products that still have the single `default` variant
// into 14kt / 18kt metal options with ring sizes. Safe to re-run: products already migrated are skipped.
// Writes a JSON backup of every product to temp/backups/ (gitignored) before changing anything.
// Run: pnpm db:migrate:metal-options
import { mkdirSync, writeFileSync } from 'node:fs';
import { getDb } from '../../../lib/mongodb';
import { DEFAULT_RING_SIZES, hasLegacyVariants, legacyMetalVariants } from '../../../lib/product-variants';

const products = (await getDb()).collection('products');
const all = await products.find({}).toArray();
mkdirSync('temp/backups', { recursive: true });
const backupPath = `temp/backups/products-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
writeFileSync(backupPath, JSON.stringify(all, null, 2));
console.log(`Backed up ${all.length} products to ${backupPath}`);

let migrated = 0;
for (const product of all) {
  if (!hasLegacyVariants(product)) continue;
  const variants = legacyMetalVariants(product);
  await products.updateOne({ _id: product._id, version: product.version }, {
    $set: {
      variants,
      priceCents: variants[0].priceCents,
      sizeOption: product.sizeOption || { enabled: product.category === 'rings', label: 'Ring size', values: DEFAULT_RING_SIZES },
      madeToOrder: product.madeToOrder !== false,
      tags: Array.isArray(product.tags) ? product.tags : [],
      updatedAt: new Date(),
      updatedBy: 'claude-code (metal options migration)',
    },
    $inc: { version: 1 },
  });
  migrated += 1;
  console.log(`  ${product.slug}: ${variants.map((v) => `${v.title} $${v.priceCents / 100}`).join(' / ')}${product.category === 'rings' ? ' + ring sizes' : ''}`);
}
console.log(`Migrated ${migrated} products.`);
process.exit(0);
