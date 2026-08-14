#!/usr/bin/env bash
# Deploy the homepage to the server over SSH (no GitHub dependency).
#
# Usage:  ./deploy.sh
#
# Mirrors the project to srv:~/workspace/server_homepage/ via rsync (excluding
# git/build deps) and rebuilds + restarts the Docker container. SSH to `srv`
# must be configured (it is — see server.md). Run from the repo root on the Mac.
set -euo pipefail

REMOTE="${REMOTE:-srv}"
DEST="${DEST:-~/workspace/server_homepage}"

echo "▸ rsync → ${REMOTE}:${DEST}"
rsync -avz --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude 'backend/node_modules' \
  --exclude 'Self-hosted Server Homepage' \
  --exclude '.env*' \
  --exclude 'deploy.sh' \
  --exclude 'data' \
  ./ "${REMOTE}:${DEST}/"

echo "▸ docker compose up -d --build"
ssh "$REMOTE" "cd ${DEST} && docker compose up -d --build"

echo "✓ deployed → http://192.168.0.118:8088"
