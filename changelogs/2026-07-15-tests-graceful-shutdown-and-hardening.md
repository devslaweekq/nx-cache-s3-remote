# Changelog

## [1.2.2] - 2026-07-15

### Added

### Test suite (`src/app.test.ts`, `node:test`)
7 tests covering health, auth (missing/wrong token), hash validation, 404, streaming a
cached object back, the write → `409`-on-duplicate flow, and the upload size limit. No new
dependency — uses Node's built-in test runner and global `fetch` against an ephemeral-port
server; the S3 layer is swapped for an injectable fake via `CacheStore`. Run with `npm test`.

### Upload size limit (`MAX_UPLOAD_BYTES`, default 500 MiB)
`PUT` requests over the limit are rejected with `413` instead of streaming an unbounded
body to S3. `HASH_PATTERN` now also caps hash length at 128 chars (was unbounded).

### Graceful shutdown
`SIGTERM`/`SIGINT` now close the HTTP server cleanly (with a 10s force-exit fallback)
instead of dropping in-flight requests when Docker/PM2 stop the process. Verified live:
sent a real `SIGTERM`, confirmed the log line, clean exit, and the port released.

### `engines` in `package.json`
Pins `node >= 24` — the service depends on Node 24's native TypeScript execution, so an
older Node fails in a much more confusing way without this.

### Fixed

### Auth token read at module-load time instead of per-request
`auth.ts` captured `CACHE_ACCESS_TOKEN` into a top-level `const` when the module was first
imported. Harmless in production (env is set before the process starts), but it silently
broke every attempt to test auth: ESM hoists `import` statements ahead of any code that
sets `process.env` in the same file, so the token was always captured as `''`, and every
authenticated test request came back `401`. Now read inside `requireBearerToken` per call.

### `catch (err: any)` → `catch (err: unknown)`
Both route handlers narrowed the error type explicitly instead of trusting `any`.

### Changed

### `server.ts` split into `app.ts` + `server.ts`
`app.ts` exports `createApp(store?)` (pure Express app, no listener, S3 store injectable —
this is what made the test suite possible). `server.ts` is now just the entrypoint: builds
the app, listens, wires up shutdown handlers.

### `tsconfig.build.json`
Production `tsc` build (`npm run compile`, used by the Docker builder stage) now excludes
`*.test.ts` so test files and `node:test` types don't leak into `dist/`. `npm run typecheck`
still uses the base `tsconfig.json` and covers test files too.

### README — GitHub Actions example uses `secrets` for both variables
`NX_SELF_HOSTED_REMOTE_CACHE_SERVER` was documented as a repo `vars` entry (following the
old `NXCACHE_S3_BUCKET`/`REGION`/`ENDPOINT` convention of splitting config from
credentials). Changed to `secrets` for both, matching how `backend_monorepo`'s `ci.yml`
was actually configured.
