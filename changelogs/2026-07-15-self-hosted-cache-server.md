# Changelog

## [1.2.0] - 2026-07-15

### Added

### Self-hosted Nx remote cache server
Implements Nx's [self-hosted remote cache HTTP API](https://nx.dev/docs/guides/tasks--caching/self-hosted-caching)
(`GET`/`PUT /v1/cache/:hash`, Bearer auth, `/health`) backed by S3-compatible storage
(Yandex Cloud Object Storage). Replaces `@pellegrims/nx-remotecache-s3`, which relied on
Nx's custom task-runner API removed in Nx 21+, and `@nx/s3-cache`, deprecated for
[CVE-2025-36852 (CREEP)](https://nx.dev/docs/reference/deprecated/self-hosted-cache-packages)
and incompatible with Nx 23 (`peerDependencies: "nx": ">= 18 < 23"`).

### `409` on duplicate upload
Uploads for a hash that's already cached are rejected instead of silently overwritten —
cached artifacts are immutable once written, closing the cache-poisoning vector CREEP
exploited in the deprecated official plugins.

### TypeScript, run natively — no `ts-node`/`tsx`
`src/*.ts` runs directly under Node 24's built-in type stripping (`"type": "module"` +
`tsconfig.json`'s `allowImportingTsExtensions`/`rewriteRelativeImportExtensions`, TS 7).
`npm run compile` builds `dist/` for production with `.ts` import specifiers rewritten to
`.js`. `npm run dev` runs it under `nodemon` for live-reload; `npm run typecheck` type-checks
without emitting.

### PM2 in production (`ecosystem.config.cjs`)
Production entrypoint is `pm2-runtime start ecosystem.config.cjs`, running the compiled
`dist/server.js` in cluster mode (`instances: max`) — not used in dev, where `nodemon` drives
the reload loop directly.

### Docker image, compose, and build/push scripts
Multi-stage `Dockerfile` (TS build stage → slim runtime stage), `docker-compose.yml` for the
installed layout, and `scripts/docker/build.sh`/`push.sh` (`npm run build`/`push`), mirroring
the pattern from `claude-docker`.

### Fixed

### `401`/`400`/`404`/`409`/`500` responses now send `text/plain`
Express's `res.send(string)` defaults to `Content-Type: text/html`, which Nx's remote cache
client rejects with `Misconfigured remote cache endpoint: Requests should respond with
text/plain on 401s`. All non-binary responses now explicitly set `text/plain`.
