# Changelog

## [1.2.3] - 2026-07-15

### Added

### Docker builds now tag and push `:<version>` alongside `:latest`
`scripts/docker/build.sh` and `scripts/docker/push.sh` read the version from `package.json`
and tag/push both `slaweekq/nx-cache-s3:latest` and `slaweekq/nx-cache-s3:<version>` in the
same `docker buildx build` (no extra build cost — just an extra `-t`). Applies identically
in CI (`docker-publish.yml`, unchanged — it just calls these scripts) and locally. Lets
consumers pin to a specific release instead of always tracking `latest`.
