#!/usr/bin/env node
/**
 * Rewrite legacy /images/* paths in MongoDB catalog to /api/assets/*.
 *
 *   node --env-file=.env scripts/migrate-asset-paths.mjs
 *   node --env-file=.env scripts/migrate-asset-paths.mjs --dry-run
 */
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { ASSET_PATH_MAP } from '../lib/asset-paths.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const dryRun = process.argv.includes('--dry-run');
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'byshreen';
if (!uri) {
  console.error('MONGODB_URI is required.');
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });

try {
  await client.connect();
  const db = client.db(dbName);

  let products = 0;
  for (const product of await db.collection('products').find({ images: { $exists: true } }).toArray()) {
    const next = (product.images || []).map((src) => ASSET_PATH_MAP[src] || src);
    if (JSON.stringify(next) === JSON.stringify(product.images || [])) continue;
    products += 1;
    console.log(`product ${product.slug}: ${(product.images || []).join(', ')} → ${next.join(', ')}`);
    if (!dryRun) {
      await db.collection('products').updateOne({ _id: product._id }, { $set: { images: next, updatedAt: new Date() } });
    }
  }

  let collections = 0;
  for (const collection of await db.collection('catalogCollections').find({ image: { $exists: true } }).toArray()) {
    const next = ASSET_PATH_MAP[collection.image] || collection.image;
    if (next === collection.image) continue;
    collections += 1;
    console.log(`collection ${collection.slug}: ${collection.image} → ${next}`);
    if (!dryRun) {
      await db.collection('catalogCollections').updateOne({ _id: collection._id }, { $set: { image: next, updatedAt: new Date() } });
    }
  }

  console.log(JSON.stringify({ dryRun, products, collections }, null, 2));
} finally {
  await client.close();
}
