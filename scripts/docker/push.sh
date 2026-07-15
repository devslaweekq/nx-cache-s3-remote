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

REPO_IMAGE="$DOCKER_USERNAME/nx-cache-s3"
VERSION="$(node -p "require('./package.json').version")"

[ "$CI" != "true" ] && DOCKER_USERNAME="$DOCKER_USERNAME" bash "$REPO/scripts/docker/build.sh"

echo "==> Push: $REPO_IMAGE:latest, $REPO_IMAGE:$VERSION"
docker push "$REPO_IMAGE:latest"
docker push "$REPO_IMAGE:$VERSION"
[ "$CI" != "true" ] && docker pull "$REPO_IMAGE:latest"

echo "  Registry: $REPO_IMAGE:latest, $REPO_IMAGE:$VERSION"
echo
echo "Done."
