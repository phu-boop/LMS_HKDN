#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Deploy script for LMS Backend on dev server
# Phases:
#   - 1.x: Identity (Login, SSO, JWT)
#   - 2.x: Tenancy, Users, Schools, Catalog
#   - 3.1: Curriculum Tree (CRUD)
#   - 3.2: Content CMS (Upload, Presigned URLs, Metadata)
#   - 4.10: Client content progress (resume learning)
# Migrations: V1-V13 (includes user_content_progress table)
# Usage: ./deploy/scripts/deploy-dev.sh [all|migrate|api|nginx]
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/deploy/docker"
DB_DIR="$PROJECT_ROOT/database"
ENV_FILE="$DOCKER_DIR/.env.dev"

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

echo "=== AIG LMS Backend - Dev Server Deploy ==="
echo "Project root: $PROJECT_ROOT"

# --- Check .env.dev exists ---
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: $ENV_FILE not found."
    echo "Copy the example and fill in values:"
    echo "  cp $DOCKER_DIR/.env.dev.example $ENV_FILE"
    echo "  vi $ENV_FILE"
    exit 1
fi

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

# --- Step 1: Run database migrations ---
run_migrations() {
    echo ""
    echo "--- Running database migrations ---"

    # Tạo bảng tracking nếu chưa có
    db_exec -q <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename    VARCHAR(255) PRIMARY KEY,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SQL

    while IFS= read -r sql_file; do
        filename=$(basename "$sql_file")

        # Kiểm tra đã apply chưa
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
                echo "  ERROR: Failed to apply $filename. Aborting migrations."
                exit 1
            fi
        fi
    done < <(find "$DB_DIR" -maxdepth 1 -type f -name 'V*.sql' | sort -V)

    echo "  Migrations complete."
}

# --- Step 2: Build and start API container ---
deploy_api() {
    echo ""
    echo "--- Building and deploying API ---"
    docker compose -f "$DOCKER_DIR/docker-compose.dev.yml" --env-file "$ENV_FILE" config > /dev/null
    
    cd "$PROJECT_ROOT"
    docker compose -f "$DOCKER_DIR/docker-compose.dev.yml" --env-file "$ENV_FILE" down --remove-orphans 2>/dev/null || true
    docker compose -f "$DOCKER_DIR/docker-compose.dev.yml" --env-file "$ENV_FILE" up -d --build
    echo "  API container started."
}

# --- Step 3: Setup nginx ---
setup_nginx() {
    echo ""
    echo "--- Setting up Nginx ---"

    local NGINX_CONF="$PROJECT_ROOT/deploy/nginx/lms-api.conf"
    local MEDIA_GATEWAY_CONF="$PROJECT_ROOT/deploy/nginx/minio-gateway.conf"
    local DOCKER_NGINX_CONTAINER="n8n-nginx_proxy-1"
    local DOCKER_NGINX_NETWORK="n8n_internal"
    local DOCKER_CONF_DEST="/etc/nginx/conf.d/lms-api.conf"
    local DOCKER_MEDIA_CONF_DEST="/etc/nginx/conf.d/minio-gateway.conf"

    if [ ! -f "$NGINX_CONF" ]; then
        echo "  WARN: Nginx config not found at $NGINX_CONF, skipping."
        return
    fi

    # --- Case 1: System nginx ---
    if command -v nginx &>/dev/null && [ -d /etc/nginx/sites-available ]; then
        sudo cp "$NGINX_CONF" /etc/nginx/sites-available/lms-api.conf
        sudo ln -sf /etc/nginx/sites-available/lms-api.conf /etc/nginx/sites-enabled/lms-api.conf

        if [ -f "$MEDIA_GATEWAY_CONF" ]; then
            sudo cp "$MEDIA_GATEWAY_CONF" /etc/nginx/sites-available/minio-gateway.conf
            sudo ln -sf /etc/nginx/sites-available/minio-gateway.conf /etc/nginx/sites-enabled/minio-gateway.conf
        fi

        sudo nginx -t && sudo systemctl reload nginx
        echo "  Nginx (system) configured and reloaded."
        return
    fi

    # --- Case 2: Docker nginx ---
    if docker inspect "$DOCKER_NGINX_CONTAINER" &>/dev/null; then
        echo "  Detected Docker nginx: $DOCKER_NGINX_CONTAINER"

        # Connect lms-api to nginx network if not already connected
        if ! docker inspect lms-api --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' | grep -qw "$DOCKER_NGINX_NETWORK"; then
            docker network connect "$DOCKER_NGINX_NETWORK" lms-api
            echo "  Connected lms-api to network: $DOCKER_NGINX_NETWORK"
        else
            echo "  lms-api already on network: $DOCKER_NGINX_NETWORK"
        fi

        # Generate config with container-name upstream (replacing 127.0.0.1)
        local TMP_CONF
        TMP_CONF=$(mktemp)
        sed 's|http://127.0.0.1:5294|http://lms-api:5294|g' "$NGINX_CONF" > "$TMP_CONF"

        # Check if nginx.conf uses conf.d (injected config will only work if included)
        if docker exec "$DOCKER_NGINX_CONTAINER" nginx -T 2>/dev/null | grep -q "conf\.d"; then
            docker cp "$TMP_CONF" "$DOCKER_NGINX_CONTAINER:$DOCKER_CONF_DEST"

            if [ -f "$MEDIA_GATEWAY_CONF" ]; then
                docker cp "$MEDIA_GATEWAY_CONF" "$DOCKER_NGINX_CONTAINER:$DOCKER_MEDIA_CONF_DEST"
            fi

            docker exec "$DOCKER_NGINX_CONTAINER" nginx -s reload
            echo "  Nginx (Docker) config injected and reloaded."
        else
            echo "  WARN: Docker nginx does not include conf.d. Manual steps required:"
            echo "    1. Add the following server blocks to /root/n8n/nginx.conf (inside http {}):"
            echo "       $(cat "$TMP_CONF")"

            if [ -f "$MEDIA_GATEWAY_CONF" ]; then
                echo "       $(cat "$MEDIA_GATEWAY_CONF")"
            fi

            echo "    2. Restart nginx: docker restart $DOCKER_NGINX_CONTAINER"
        fi
        rm -f "$TMP_CONF"
        return
    fi

    echo "  WARN: No nginx found (system or Docker). Skipping."
    echo "  API is accessible directly at http://localhost:5294"
    echo "  To configure nginx manually, see: $NGINX_CONF"
}

# --- Step 4: Health check ---
health_check() {
    echo ""
    echo "--- Health Check ---"
    
    local max_retries=10
    local retry=0
    
    while [ $retry -lt $max_retries ]; do
        if curl -sf http://localhost:5294/health > /dev/null 2>&1; then
            echo "  API is healthy!"
            echo ""
            echo "=== Deploy complete ==="
            echo "  API:      http://103.159.51.19:5294"
            echo "  Scalar:   http://103.159.51.19:5294/scalar/"
            echo "  Health:   http://103.159.51.19:5294/health"
            return 0
        fi
        retry=$((retry + 1))
        echo "  Waiting for API to start... ($retry/$max_retries)"
        sleep 3
    done
    
    echo "  ERROR: API did not become healthy in time."
    echo "  Check logs: docker logs lms-api"
    return 1
}

# --- Main ---
case "${1:-all}" in
    migrate)
        run_migrations
        ;;
    api)
        run_migrations
        deploy_api
        health_check
        ;;
    nginx)
        setup_nginx
        ;;
    all)
        run_migrations
        deploy_api
        setup_nginx
        health_check
        ;;
    *)
        echo "Usage: $0 {all|migrate|api|nginx}"
        exit 1
        ;;
esac
