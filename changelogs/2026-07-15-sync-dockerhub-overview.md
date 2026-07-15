# Changelog

## [1.3.0] - 2026-07-15

### Added

### Docker Hub overview now syncs automatically from README.md
`docker-publish.yml` pushes `README.md` as the Docker Hub repository description via
[`peter-evans/dockerhub-description@v5`](https://github.com/peter-evans/dockerhub-description),
right after the image push, and also on any `README.md`-only change (added to the workflow's
path trigger). `short-description` is set from `package.json`'s `description` field. Needs
`DOCKER_PASSWORD` to be a Read & Write scoped token — a read-only token (fine for pulling
during `docker login`) can't write the description.

### Changed

### README restyled to match `philiplehmann/nx-cache-server`'s presentation
Same content, better packaging — not their architecture (still our own env-var config, not
YAML/TOML): added CI + Docker Publish status badges under the banner, and a `## Features`
section with bold-lead bullets (immutable cache, zero client config, S3-compatible, thin
native-TS image, tested, graceful shutdown/upload limits) up front before the how-it-works
and setup detail. Also fixed a stray missing space in the `CACHE_ACCESS_TOKEN` config table
row while touching that section.

### Fixed

### Banner image was broken on Docker Hub
README's `<img>` used a relative path (`assets/banner.png`), which works on GitHub but has
nothing to resolve against once the same markdown is pushed to Docker Hub via the API (no
repo filesystem context there) — the banner would render as a broken image. Switched to the
absolute `raw.githubusercontent.com` URL, which works in both places.

Relative *links* elsewhere in the README (`PORTS.md`, `.env.example`, workflow files, etc.)
still won't navigate anywhere on Docker Hub — left as-is, since fixing all of them would mean
hardcoding GitHub blob URLs throughout the README for a lower-severity issue (a dead link,
not a broken image).
