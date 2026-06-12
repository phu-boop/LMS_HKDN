#!/usr/bin/env bash
set -euo pipefail

# One-command API update on server.
# Phases: 1.x (Identity) → 2.x (Tenancy/Users) → 3.1 (Curriculum) → 3.2 (Content CMS) → 4.10 (Client progress)
# Database Migrations: V1-V13 (auto-applied)
# Usage:
#   ./deploy/scripts/update-api.sh
#   ./deploy/scripts/update-api.sh --no-pull
#   ./deploy/scripts/update-api.sh --no-cache

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/deploy/docker/docker-compose.dev.yml"
ENV_FILE="$PROJECT_ROOT/deploy/docker/.env.dev"
DB_DIR="$PROJECT_ROOT/database"
SERVICE_NAME="api"
CONTAINER_NAME="lms-api"
HEALTH_URL="http://localhost:5294/health"

DO_PULL=true
NO_CACHE=false

require_env() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "ERROR: Required variable '$name' is missing in $ENV_FILE"
    exit 1
  fi
}

db_exec() {
  local sql=(docker exec -i "$DB_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$DB_USER_VAL" -d "$DB_NAME_VAL")
  if [ -n "${DB_PASSWORD_VAL:-}" ]; then
    sql=(docker exec -e PGPASSWORD="$DB_PASSWORD_VAL" -i "$DB_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$DB_USER_VAL" -d "$DB_NAME_VAL")
  fi
  "${sql[@]}" "$@"
}

for arg in "$@"; do
  case "$arg" in
    --no-pull)
      DO_PULL=false
      ;;
    --no-cache)
      NO_CACHE=true
      ;;
    -h|--help)
      cat <<'HELP'
Usage: ./deploy/scripts/update-api.sh [options]

Options:
  --no-pull    Skip git pull before build
  --no-cache   Rebuild image without Docker cache
  -h, --help   Show this help
HELP
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Run with --help for usage"
      exit 1
      ;;
  esac
done

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "ERROR: Compose file not found: $COMPOSE_FILE"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: Env file not found: $ENV_FILE"
  echo "Create it from template: cp $PROJECT_ROOT/deploy/docker/.env.dev.example $ENV_FILE"
  exit 1
fi

echo "=== LMS API Update ==="
echo "Project root: $PROJECT_ROOT"
cd "$PROJECT_ROOT"

if [ "$DO_PULL" = true ]; then
  echo "[1/5] Pull latest source..."
  git pull --ff-only
else
  echo "[1/5] Skip git pull (--no-pull)"
fi

echo "[2/5] Run database migrations..."
source "$ENV_FILE"
require_env DB_HOST
require_env DB_PORT
require_env DB_NAME
require_env DB_USER
require_env DB_CONTAINER
require_env JWT_SECRET_KEY
DB_CONTAINER="${DB_CONTAINER:-n8n-postgres-1}"
DB_NAME_VAL="${DB_NAME:-lms_dev}"
DB_USER_VAL="${DB_USER:-lms_dev}"
DB_PASSWORD_VAL="${DB_PASSWORD:-}"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" config > /dev/null

db_exec -q <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename    VARCHAR(255) PRIMARY KEY,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SQL

# Read migration file list into an array first so db_exec stdin cannot
# accidentally consume the process-substitution stream used by while/read.
mapfile -t migration_files < <(find "$DB_DIR" -maxdepth 1 -type f -name 'V*.sql' | sort -V)

for sql_file in "${migration_files[@]}"; do
  filename=$(basename "$sql_file")
  already_applied=$(db_exec -tAq \
      -c "SELECT COUNT(1) FROM schema_migrations WHERE filename = '$filename'")
  if [ "$already_applied" = "1" ]; then
    echo "  Skipped (already applied): $filename"
  else
    echo "  Applying: $filename"
    if db_exec -q < "$sql_file"; then
      db_exec -q \
          -c "INSERT INTO schema_migrations (filename) VALUES ('$filename')"
      echo "  Done: $filename"
    else
      echo "ERROR: Failed to apply $filename. Aborting."
      exit 1
    fi
  fi
done

if [ "$NO_CACHE" = true ]; then
  echo "[3/5] Build image (no cache)..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache "$SERVICE_NAME"
  echo "[4/5] Recreate service..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d "$SERVICE_NAME"
else
  echo "[3/5] Build + recreate service..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build "$SERVICE_NAME"
fi

echo "[5/5] Verify container and health..."
docker ps --filter "name=$CONTAINER_NAME"
docker inspect --format='health={{.State.Health.Status}} status={{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null || true

if command -v curl >/dev/null 2>&1; then
  if curl -sf "$HEALTH_URL" >/dev/null; then
    echo "Health endpoint OK: $HEALTH_URL"
  else
    echo "WARN: Health endpoint not ready yet: $HEALTH_URL"
    echo "Check logs with: docker logs --tail 200 $CONTAINER_NAME"
  fi
fi

echo "Done. API update command completed."
