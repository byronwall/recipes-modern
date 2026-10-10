#!/usr/bin/env bash
# Throwaway Postgres for local UI work, isolated from your real dev database.
#
#   npm run sandbox          # start DB (+ migrate + seed on first run), then `next dev`
#   npm run sandbox:up       # start DB, migrate, seed if empty
#   npm run sandbox:reset    # wipe and reseed the sandbox data
#   npm run sandbox:down     # stop and delete the sandbox container
#
# Sign in with the seeded test account: audit@example.test / audit-password
set -euo pipefail

CONTAINER="${SANDBOX_DB_CONTAINER:-recipes-sandbox-db}"
PORT="${SANDBOX_DB_PORT:-55432}"
DB_NAME="recipes_sandbox"
export SANDBOX_DB_URL="postgresql://postgres:postgres@localhost:${PORT}/${DB_NAME}"

cd "$(dirname "$0")/.."

require_docker() {
  if ! docker info >/dev/null 2>&1; then
    echo "Docker is not running. Start Docker Desktop and try again." >&2
    exit 1
  fi
}

start_db() {
  require_docker
  if ! docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    echo "Creating sandbox Postgres container ($CONTAINER on port $PORT)…"
    docker run -d --name "$CONTAINER" \
      -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB="$DB_NAME" \
      -p "${PORT}:5432" postgres:16 >/dev/null
  elif ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    docker start "$CONTAINER" >/dev/null
  fi

  for _ in $(seq 1 30); do
    docker exec "$CONTAINER" pg_isready -U postgres -d "$DB_NAME" >/dev/null 2>&1 && break
    sleep 1
  done

  Z_DB_URL="$SANDBOX_DB_URL" npx prisma migrate deploy >/dev/null
}

seed() {
  Z_DB_URL="$SANDBOX_DB_URL" node scripts/seed-sandbox.mjs "$@"
}

case "${1:-up}" in
  up)
    start_db
    seed --if-empty
    echo "Sandbox DB ready: $SANDBOX_DB_URL"
    ;;
  reset)
    start_db
    seed
    ;;
  down)
    require_docker
    docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
    echo "Removed $CONTAINER"
    ;;
  dev)
    start_db
    seed --if-empty
    # Process env wins over .env, so the app talks only to the sandbox DB and
    # never sends real cart requests. Placeholders satisfy env validation when
    # no real keys are configured.
    export Z_DB_URL="$SANDBOX_DB_URL"
    export NEXT_SKIP_ADD_TO_CART=true
    export KROGER_CLIENT_ID="${KROGER_CLIENT_ID:-sandbox}"
    export KROGER_CLIENT_SECRET="${KROGER_CLIENT_SECRET:-sandbox}"
    export OPENAI_API_KEY="${OPENAI_API_KEY:-sandbox}"
    export S3_BUCKET="${S3_BUCKET:-recipes-media}"
    export S3_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID:-minioadmin}"
    export S3_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY:-minioadmin}"
    export NEXT_PUBLIC_MEDIA_BASE_URL="${NEXT_PUBLIC_MEDIA_BASE_URL:-http://localhost:9000/recipes-media}"
    echo "Sign in with audit@example.test / audit-password"
    exec npx next dev "${@:2}"
    ;;
  *)
    echo "Usage: $0 [up|reset|down|dev]" >&2
    exit 1
    ;;
esac
