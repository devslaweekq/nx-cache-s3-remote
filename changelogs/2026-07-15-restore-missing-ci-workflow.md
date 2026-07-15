# Changelog

## [1.3.1] - 2026-07-15

### Fixed

### Restored missing `.github/workflows/ci.yml`
The typecheck + test workflow had gone missing from `.github/workflows/` at some point
(likely lost during an earlier version-revert while iterating on this repo), leaving the
README's CI badge and `[ci.yml](.github/workflows/ci.yml)` link both broken —
`docker-publish.yml` was the only workflow left. Recreated it: `npm ci` → `npm run
typecheck` → `npm test` on every push/PR, matching what the README already documented.
Verified locally before restoring — typecheck clean, all 7 tests passing.
