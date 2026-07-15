#!/usr/bin/env bash
# Bump version in all places and create a changelog template.
# Usage: bash scripts/utils/bump-version.sh <version> <changelog-slug>
# Example: bash scripts/utils/bump-version.sh 1.2.13 fix-clipboard-wayland

set -euo pipefail

NEW_VERSION="${1:?Usage: $0 <version> <changelog-slug>}"
SLUG="${2:?Usage: $0 <version> <changelog-slug>}"
DATE="$(date +%Y-%m-%d)"

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"

# 1. package.json + package-lock.json
npm version "$NEW_VERSION" --no-git-tag-version --allow-same-version

# 2. changelog template
CHANGELOG="changelogs/$DATE-$SLUG.md"
cat > "$CHANGELOG" <<EOF
# Changelog

## [$NEW_VERSION] - $DATE

###
EOF

echo "==> Version bumped to $NEW_VERSION"
echo "==> Changelog: $CHANGELOG"
