# Changelog

## [1.3.3] - 2026-09-04

### Changed

### Docker base image bumped to `node:24.20.0-slim`
Both build and runtime stages of `Dockerfile` moved from `node:24.17.0-slim`. Picks up
upstream Node 24 patch fixes; no code changes required.

### `docker/login-action` pinned to `v4.5.2`
`.github/workflows/docker-publish.yml` previously floated on the `v4` major tag; pinned to
the exact release for reproducible CI runs.

### Dependency bumps (`package.json`, `package-lock.json`)
- `@aws-sdk/client-s3` `^3.1088.0` → `^3.1126.0` (and its transitive `@aws-sdk/*`/`@smithy/*`
  packages)
- `pm2` `^7.0.3` → `^7.0.4`
- `@types/node` `^26.1.1` → `^26.4.1`
- `prettier` `^3.9.5` → `^3.9.6`
