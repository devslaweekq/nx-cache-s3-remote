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

IMAGE="$DOCKER_USERNAME/nx-cache-s3:latest"
CACHE="$DOCKER_USERNAME/nx-cache-s3:buildcache"

if [ "$CI" != "true" ]; then
  echo "==> Remove old local image: $IMAGE"
  docker rmi -f "$IMAGE" 2>/dev/null || true
fi

docker buildx build \
  --progress=plain \
  --build-arg HTTP_PROXY= --build-arg http_proxy= \
  --build-arg HTTPS_PROXY= --build-arg https_proxy= \
  --cache-from type=registry,ref="$CACHE" \
  --cache-to   type=registry,ref="$CACHE",mode=max \
  -t "$IMAGE" --load \
  .

echo "OK: $IMAGE  (cache → $CACHE)"
