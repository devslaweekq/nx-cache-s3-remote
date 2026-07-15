# Changelog

## [1.2.1] - 2026-07-15

### Added

### CI — auto-publish Docker image on push (`.github/workflows/docker-publish.yml`)
Builds and pushes `slaweekq/nx-cache-s3:latest` to Docker Hub on push to `main`/`master`
when `Dockerfile`, `package.json`/`package-lock.json`, `tsconfig.json`,
`ecosystem.config.cjs`, or `src/**` change, plus manual `workflow_dispatch`. Mirrors
`claude-docker`'s `docker-publish.yml` (buildx + registry cache, `scripts/docker/build.sh`/
`push.sh`). Requires the `DOCKER_USERNAME`/`DOCKER_PASSWORD` repo secrets to be set.
