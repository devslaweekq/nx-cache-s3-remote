# Changelog

## [1.3.2] - 2026-07-16

### Added

### Fail-fast startup validation (`src/env.ts`)
`server.ts` now calls `validateEnv()` before creating the app. Missing `CACHE_ACCESS_TOKEN`,
`NXCACHE_S3_ACCESS_KEY_ID`, `NXCACHE_S3_SECRET_ACCESS_KEY`, `NXCACHE_S3_BUCKET`, or
`NXCACHE_S3_REGION` now exits immediately with a clear "Missing required env var(s): ..."
message instead of surfacing as a confusing error deep inside the AWS SDK (or a silent
401 on every request) the first time it's actually needed.

### `/health/ready` readiness endpoint (`src/app.ts`, `src/s3.ts`)
Separate from `/health` (liveness, unchanged — still a plain 200, no dependencies) so a
transient S3 outage can't get the container killed by a liveness probe. `/health/ready`
calls the new `checkBucketAccess()` (`HeadBucketCommand`) and returns `503` if the bucket
isn't reachable — wire this into a readiness probe. Documented in `PORTS.md`.

### Auth-rejection diagnostics (`src/auth.ts`)
Rejected auth attempts now log `auth rejected: got token len=X, expected len=Y` server-side
(token values themselves are never logged). Came out of a real debugging session where the
only way to tell a token-mismatch 401 apart from an infra/proxy issue was tracing raw HTTP
traffic through a logging proxy — this makes it visible directly in the server logs instead.

### Global error-handling middleware (`src/app.ts`)
Added a catch-all Express error handler as a safety net for anything a route didn't catch
itself (e.g. a rejected promise, which Express 5 forwards here automatically). Logs
server-side and responds `500 Internal error` instead of leaking a stack trace.

### Dependency auditing (`ci.yml`, `.github/dependabot.yml`)
`npm audit --audit-level=high` now runs in CI on every push/PR. Added Dependabot config for
npm, GitHub Actions, and the Dockerfile base image, weekly. Fitting given this service exists
specifically to close a supply-chain vulnerability in Nx's official cache plugins
(CVE-2025-36852).
