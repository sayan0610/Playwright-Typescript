#!/usr/bin/env bash
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  echo "[db-up] Docker is not installed or not on PATH."
  echo "Install Docker Desktop for Mac: https://www.docker.com/products/docker-desktop/"
  echo "Or with Homebrew: brew install colima docker docker-compose && colima start"
  exit 127
fi

if ! docker info >/dev/null 2>&1; then
  echo "[db-up] Docker daemon is not running. Start Docker Desktop or run 'colima start'."
  exit 126
fi

echo "[db-up] Starting Postgres container via docker compose..."
docker compose up -d postgres

echo "[db-up] Waiting for database readiness (pg_isready)..."
for i in $(seq 1 60); do
  if docker compose exec -T postgres pg_isready -U task_user -d task_storage >/dev/null 2>&1; then
    echo "[db-up] Postgres is ready: host=127.0.0.1 port=5432 db=task_storage user=task_user password=strongpassword"
    exit 0
  fi
  sleep 1
done

echo "[db-up] Timed out waiting for Postgres to become ready. Check logs with: npm run db:logs"
exit 1
