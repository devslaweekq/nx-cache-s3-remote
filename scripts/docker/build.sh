#!/usr/bin/env bash
# Build the nx-cache-s3 Docker image locally (--load) and write cache to registry.
#
# Usage:
#   bash scripts/docker/build.sh
#
# CI (GitHub Actions): set DOCKER_USERNAME env var; login is done by the workflow.

set -euo pipefail
cd "$(dirname "$0")/../.."

CI="${GITHUB_ACTIONS:-false}"

if [ "$CI" = "true" ]; then
  if [ -z "${DOCKER_USERNAME:-}" ]; then
    echo "CI mode: set DOCKER_USERNAME env var." >&2
    exit 1
  fi
elif [ -z "${DOCKER_USERNAME:-}" ]; then
  read -rp "Docker Hub username: " DOCKER_USERNAME
  if [ -z "$DOCKER_USERNAME" ]; then
    echo "Username cannot be empty." >&2
    exit 1
  fi
fi

REPO_IMAGE="$DOCKER_USERNAME/nx-cache-s3"
VERSION="$(node -p "require('./package.json').version")"
CACHE="$REPO_IMAGE:buildcache"

if [ "$CI" != "true" ]; then
  echo "==> Remove old local images: $REPO_IMAGE:latest, $REPO_IMAGE:$VERSION"
  docker rmi -f "$REPO_IMAGE:latest" "$REPO_IMAGE:$VERSION" 2>/dev/null || true
fi

docker buildx build \
  --progress=plain \
  --build-arg HTTP_PROXY= --build-arg http_proxy= \
  --build-arg HTTPS_PROXY= --build-arg https_proxy= \
  --cache-from type=registry,ref="$CACHE" \
  --cache-to   type=registry,ref="$CACHE",mode=max \
  -t "$REPO_IMAGE:latest" -t "$REPO_IMAGE:$VERSION" --load \
  .

echo "OK: $REPO_IMAGE:latest, $REPO_IMAGE:$VERSION  (cache → $CACHE)"
