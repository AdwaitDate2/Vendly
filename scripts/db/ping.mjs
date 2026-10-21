import { MongoClient } from 'mongodb';
import { requiredEnv } from './env.mjs';

const uri = requiredEnv('MONGODB_URI');
const dbName = process.env.MONGODB_DB || 'byshreen';
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });

try {
  await client.connect();
  await client.db(dbName).command({ ping: 1 });
  console.log(`MongoDB ping succeeded for database: ${dbName}`);
} finally {
  await client.close();
}

