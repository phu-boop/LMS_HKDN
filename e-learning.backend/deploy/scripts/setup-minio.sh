#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# setup-minio.sh
# Initialise MinIO for LMS Phase 3 (run once after first deploy)
#
# What this script does:
#   1. Waits for MinIO to be healthy
#   2. Configures mc (MinIO Client) alias
#   3. Creates private buckets: lms-content, lms-hls, lms-thumb
#   4. Sets bucket versioning and lifecycle rules
#   5. Creates a service-account key for the LMS API
#   6. Prints the access/secret pair to stdout for adding to .env.dev
#
# Usage:
#   ./deploy/scripts/setup-minio.sh [--env-file deploy/docker/.env.minio]
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${1:-$PROJECT_ROOT/deploy/docker/.env.minio}"

# ── Helpers ─────────────────────────────────────────────────────────────────

log()  { echo "[setup-minio] $*"; }
die()  { echo "[setup-minio] ERROR: $*" >&2; exit 1; }

require_cmd() { command -v "$1" &>/dev/null || die "'$1' not found. Install MinIO Client (mc): https://min.io/docs/minio/linux/reference/minio-mc.html"; }

# ── Load env ─────────────────────────────────────────────────────────────────

if [ ! -f "$ENV_FILE" ]; then
    die "$ENV_FILE not found. Copy .env.minio.example and fill in values."
fi

# shellcheck source=/dev/null
source "$ENV_FILE"

: "${MINIO_ROOT_USER:?MINIO_ROOT_USER is required}"
: "${MINIO_ROOT_PASSWORD:?MINIO_ROOT_PASSWORD is required}"
: "${MINIO_API_PORT:=9000}"

MINIO_ENDPOINT="http://127.0.0.1:${MINIO_API_PORT}"
MC_ALIAS="lms-minio"

# ── Preflight ────────────────────────────────────────────────────────────────

require_cmd mc
require_cmd docker

# ── Wait for MinIO to be healthy ─────────────────────────────────────────────

log "Waiting for MinIO at ${MINIO_ENDPOINT} ..."
MAX_WAIT=60
ELAPSED=0
until curl -sf "${MINIO_ENDPOINT}/minio/health/live" &>/dev/null; do
    sleep 2
    ELAPSED=$((ELAPSED + 2))
    if [ "$ELAPSED" -ge "$MAX_WAIT" ]; then
        die "MinIO did not become healthy after ${MAX_WAIT}s. Check: docker logs lms-minio"
    fi
done
log "MinIO is up."

# ── Configure mc alias ───────────────────────────────────────────────────────

log "Configuring mc alias '${MC_ALIAS}' ..."
mc alias set "${MC_ALIAS}" "${MINIO_ENDPOINT}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" --api S3v4 2>/dev/null

# ── Create buckets ───────────────────────────────────────────────────────────

BUCKETS=(lms-content lms-hls lms-thumb)

for bucket in "${BUCKETS[@]}"; do
    if mc ls "${MC_ALIAS}/${bucket}" &>/dev/null; then
        log "Bucket '${bucket}' already exists — skipping."
    else
        log "Creating bucket '${bucket}' ..."
        mc mb "${MC_ALIAS}/${bucket}"
    fi

    # Set bucket policies: lms-hls is public read, others are private
    if [ "$bucket" = "lms-hls" ]; then
        mc anonymous set download "${MC_ALIAS}/${bucket}"
        log "  Policy: public read (for HLS streaming)"
    else
        mc anonymous set none "${MC_ALIAS}/${bucket}"
        log "  Policy: private (anonymous access denied)"
    fi
done

# ── Versioning (optional, helps with safe overwrites during transcode) ────────

log "Enabling versioning on lms-content and lms-hls ..."
mc version enable "${MC_ALIAS}/lms-content" || true
mc version enable "${MC_ALIAS}/lms-hls"    || true

# ── Lifecycle rules ───────────────────────────────────────────────────────────
# Automatically remove incomplete multipart uploads after 7 days.

log "Setting lifecycle: abort incomplete multipart after 7 days ..."
for bucket in lms-content lms-hls; do
    mc ilm rule add \
        --expire-days 1 \
        --expire-delete-marker \
        --noncurrent-expire-days 7 \
        "${MC_ALIAS}/${bucket}" 2>/dev/null || \
    log "  (lifecycle rule may already exist on ${bucket}, skipping)"
done

# ── Create LMS API service account ───────────────────────────────────────────
# This creates a limited-permission service account separate from the root user.
# The LMS API uses this account for presigned URL generation and object operations.

SA_NAME="lms-api-sa"
log "Creating service account '${SA_NAME}' ..."

# Policy: allow read/write/delete on all LMS buckets, no admin operations
POLICY_JSON=$(cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectTagging",
        "s3:PutObjectTagging",
        "s3:ListMultipartUploadParts",
        "s3:AbortMultipartUpload"
      ],
      "Resource": [
        "arn:aws:s3:::lms-content/*",
        "arn:aws:s3:::lms-hls/*",
        "arn:aws:s3:::lms-thumb/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "arn:aws:s3:::lms-content",
        "arn:aws:s3:::lms-hls",
        "arn:aws:s3:::lms-thumb"
      ]
    }
  ]
}
EOF
)

POLICY_NAME="lms-api-policy"
POLICY_FILE=$(mktemp /tmp/lms-policy-XXXXXX.json)
echo "$POLICY_JSON" > "$POLICY_FILE"

# Create/update policy
mc admin policy create "${MC_ALIAS}" "${POLICY_NAME}" "$POLICY_FILE" 2>/dev/null || \
mc admin policy update "${MC_ALIAS}" "${POLICY_NAME}" "$POLICY_FILE" 2>/dev/null || true
rm -f "$POLICY_FILE"

# Always rotate/create API user key so this script always prints usable credentials.
if mc admin user info "${MC_ALIAS}" "${SA_NAME}" >/dev/null 2>&1; then
  log "User '${SA_NAME}' already exists. Recreating to rotate key..."
  mc admin user remove "${MC_ALIAS}" "${SA_NAME}" >/dev/null 2>&1 || true
fi

# Generate random secret
SA_SECRET=$(openssl rand -base64 30 | tr -d '/+=\n' | head -c 40)

mc admin user add "${MC_ALIAS}" "${SA_NAME}" "${SA_SECRET}"
mc admin policy attach "${MC_ALIAS}" "${POLICY_NAME}" --user "${SA_NAME}"

log ""
log "============================================================"
log " Service account ready. Add these to deploy/docker/.env.dev:"
log ""
log "   ObjectStorage__AccessKey=${SA_NAME}"
log "   ObjectStorage__SecretKey=${SA_SECRET}"
log "   ObjectStorage__Endpoint=${MINIO_SERVER_URL:-http://localhost:9000}"
log "   ObjectStorage__UseSSL=true"
log "   ObjectStorage__ContentBucket=lms-content"
log "   ObjectStorage__HlsBucket=lms-hls"
log "   ObjectStorage__ThumbBucket=lms-thumb"
log "   ObjectStorage__StreamUrlTtlSeconds=3600"
log "   ObjectStorage__ViewUrlTtlSeconds=3600"
log "   ObjectStorage__DownloadUrlTtlSeconds=300"
log ""
log " IMPORTANT: Save the SecretKey now — it will not be shown again."
log "============================================================"
log ""

log "MinIO setup complete."
log ""
log "MinIO Console: ${MINIO_CONSOLE_URL:-http://localhost:9001}"
log "S3 Endpoint:   ${MINIO_SERVER_URL:-http://localhost:9000}"
