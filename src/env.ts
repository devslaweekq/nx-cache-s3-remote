const REQUIRED_ENV_VARS = [
  'CACHE_ACCESS_TOKEN',
  'NXCACHE_S3_ACCESS_KEY_ID',
  'NXCACHE_S3_SECRET_ACCESS_KEY',
  'NXCACHE_S3_BUCKET',
  'NXCACHE_S3_REGION',
] as const;

// Fail fast on boot instead of surfacing a confusing error deep inside the
// AWS SDK (or silently rejecting every request) the first time it's needed.
export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter(name => !process.env[name]);
  if (missing.length > 0) {
    console.error(`Missing required env var(s): ${missing.join(', ')}`);
    process.exit(1);
  }
}
