#!/bin/bash
set -e

BACKUP_DIR="/home/abhimanyu/Projects/YQ/YQ Management/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/yq_queue_$DATE.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Creating database backup..."
docker exec yq_postgres pg_dump -U postgres yq_queue | gzip > "$BACKUP_FILE"

echo "Backup created: $BACKUP_FILE"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "yq_queue_*.sql.gz" -type f -mtime +30 -delete

echo "Old backups cleaned up (kept last 30 days)"
