/**
 * Server-only runtime configuration. Never import this module from a Client
 * Component or expose any of these values through NEXT_PUBLIC_* variables.
 */
export function getServerEnv({ requireAdminToken = false } = {}) {
  const values = {
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB: process.env.MONGODB_DB || 'vendly',
    ADMIN_PREVIEW_TOKEN: process.env.ADMIN_PREVIEW_TOKEN,
    KENMARK_STORAGE_URL: process.env.KENMARK_STORAGE_URL,
    KENMARK_STORAGE_KEY: process.env.KENMARK_STORAGE_KEY,
    ASSETS_API_AUTH_SECRET: process.env.ASSETS_API_AUTH_SECRET,
  };

  if (!values.MONGODB_URI) {
    throw new Error('MONGODB_URI is required for server data access.');
  }

  if (requireAdminToken && !values.ADMIN_PREVIEW_TOKEN) {
    throw new Error('ADMIN_PREVIEW_TOKEN is required for local admin preview access.');
  }

  return values;
}

