import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

export function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

