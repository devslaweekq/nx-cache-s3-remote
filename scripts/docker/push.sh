#!/usr/bin/env bash
# Push the locally built nx-cache-s3 Docker image to Docker Hub.
# Runs build.sh first to build and load the image.
#
# Usage:
#   bash scripts/docker/push.sh
#
# Local: log in first:
#   echo YOUR_DOCKER_PASS | docker login -u YOUR_DOCKER_USERNAME --password-stdin
#
# CI (GitHub Actions): login is done by the workflow; set DOCKER_USERNAME env var.

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"

CI="${GITHUB_ACTIONS:-false}"

if [ "$CI" = "true" ]; then
  if [ -z "${DOCKER_USERNAME:-}" ]; then
    echo "CI mode: set DOCKER_USERNAME env var." >&2
    exit 1
  fi
else
  read -rp "Docker Hub username: " DOCKER_USERNAME
  if [ -z "$DOCKER_USERNAME" ]; then
    echo "Username cannot be empty." >&2
    exit 1
  fi
fi

IMAGE="$DOCKER_USERNAME/nx-cache-s3:latest"

[ "$CI" != "true" ] && DOCKER_USERNAME="$DOCKER_USERNAME" bash "$REPO/scripts/docker/build.sh"

echo "==> Push: $IMAGE"
docker push "$IMAGE"
[ "$CI" != "true" ] && docker pull "$IMAGE"

echo "  Registry: $IMAGE"
echo
echo "Done."
