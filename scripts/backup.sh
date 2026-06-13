#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CMS Platform — Automated Backup Script
#
# Backs up:
#   - PostgreSQL database (pg_dump)
#   - Media uploads (tar.gz)
#   - Redis data (RDB snapshot)
#
# Usage:
#   ./scripts/backup.sh                    # Backup to ./backups/
#   ./scripts/backup.sh /mnt/nfs/backups   # Custom backup dir
#   ./scripts/backup.sh --upload-s3        # Also upload to S3
#
# Cron (daily at 2 AM):
#   0 2 * * * cd /path/to/openclaw && ./scripts/backup.sh --upload-s3
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ────────────────────────────────────────────
BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-14}
UPLOAD_S3=false

# Parse flags
for arg in "$@"; do
  case $arg in
    --upload-s3) UPLOAD_S3=true ;;
  esac
done

# Load .env if available
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep -v '^$' | xargs) 2>/dev/null || true
fi

DB_NAME="${DATABASE_NAME:-cms_db}"
DB_USER="${DATABASE_USERNAME:-cms_user}"
DB_HOST="${DATABASE_HOST:-postgres}"
DB_PORT="${DATABASE_PORT:-5432}"
MINIO_BUCKET="${MINIO_BUCKET:-cms-media}"
S3_BACKUP_BUCKET="${S3_BACKUP_BUCKET:-}"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

# ── Functions ────────────────────────────────────────────────

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
error() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $*" >&2; }
success() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $*"; }

check_docker() {
  if ! docker info &>/dev/null; then
    error "Docker is not running"
    exit 1
  fi
}

backup_database() {
  local backup_file="${BACKUP_DIR}/db_${TIMESTAMP}.sql.gz"
  log "Backing up PostgreSQL database..."

  docker compose -f "$COMPOSE_FILE" exec -T postgres \
    pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists \
    | gzip > "$backup_file"

  local size=$(du -h "$backup_file" | cut -f1)
  success "Database backed up: $backup_file ($size)"
}

backup_media() {
  local backup_file="${BACKUP_DIR}/media_${TIMESTAMP}.tar.gz"
  log "Backing up media uploads..."

  docker compose -f "$COMPOSE_FILE" exec -T api \
    tar czf - -C /app/public/uploads . \
    > "$backup_file" 2>/dev/null || true

  if [ -s "$backup_file" ]; then
    local size=$(du -h "$backup_file" | cut -f1)
    success "Media backed up: $backup_file ($size)"
  else
    rm -f "$backup_file"
    log "No media files to back up"
  fi
}

backup_redis() {
  local backup_file="${BACKUP_DIR}/redis_${TIMESTAMP}.rdb"
  log "Backing up Redis data..."

  # Trigger BGSAVE and copy RDB file
  docker compose -f "$COMPOSE_FILE" exec -T redis \
    redis-cli BGSAVE &>/dev/null || true
  sleep 2

  docker compose -f "$COMPOSE_FILE" cp redis:/data/dump.rdb "$backup_file" 2>/dev/null || true

  if [ -s "$backup_file" ]; then
    local size=$(du -h "$backup_file" | cut -f1)
    success "Redis backed up: $backup_file ($size)"
  else
    rm -f "$backup_file"
    log "No Redis data to back up"
  fi
}

upload_to_s3() {
  if [ "$UPLOAD_S3" != true ]; then return; fi
  if [ -z "$S3_BACKUP_BUCKET" ]; then
    log "S3_BACKUP_BUCKET not set, skipping S3 upload"
    return
  fi

  log "Uploading backups to S3..."

  for file in "${BACKUP_DIR}"/*_"${TIMESTAMP}".*; do
    [ -f "$file" ] || continue
    local filename=$(basename "$file")
    local s3_key="backups/${TIMESTAMP}/${filename}"

    if command -v aws &>/dev/null; then
      aws s3 cp "$file" "s3://${S3_BACKUP_BUCKET}/${s3_key}" --quiet
      success "Uploaded to S3: s3://${S3_BACKUP_BUCKET}/${s3_key}"
    elif docker compose -f "$COMPOSE_FILE" exec -T minio mc &>/dev/null; then
      docker compose -f "$COMPOSE_FILE" exec -T minio \
        mc cp "$file" "local/${S3_BACKUP_BUCKET}/${s3_key}" 2>/dev/null || true
      success "Uploaded to MinIO: ${S3_BACKUP_BUCKET}/${s3_key}"
    else
      error "No S3/MinIO client available for upload"
    fi
  done
}

cleanup_old_backups() {
  log "Cleaning up backups older than ${RETENTION_DAYS} days..."
  local count=$(find "$BACKUP_DIR" -name "*_*" -type f -mtime +${RETENTION_DAYS} 2>/dev/null | wc -l)
  find "$BACKUP_DIR" -name "*_*" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true
  success "Cleaned up $count old backup files"
}

# ── Main ─────────────────────────────────────────────────────

main() {
  log "Starting CMS backup..."
  log "Backup directory: $BACKUP_DIR"
  log "Timestamp: $TIMESTAMP"

  check_docker
  mkdir -p "$BACKUP_DIR"

  backup_database
  backup_media
  backup_redis
  upload_to_s3
  cleanup_old_backups

  local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
  success "Backup complete! Total backup size: $total_size"
  log "Backup location: $BACKUP_DIR"
}

main "$@"
