#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DIR="$PROJECT_ROOT/deploy/docker-compose"
TEMPLATE_FILE="$PROJECT_ROOT/install.run.template"
OUTPUT_FILE="$PROJECT_ROOT/static/install.run"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    local level="$1"
    local message="$2"
    local color=""
    case "$level" in
        "INFO") color="$BLUE" ;;
        "SUCCESS") color="$GREEN" ;;
        "WARNING") color="$YELLOW" ;;
        "ERROR") color="$RED" ;;
        *) color="$NC" ;;
    esac
    echo -e "${color}[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $message${NC}"
}

# Check required commands
for cmd in tar base64; do
    if ! command -v "$cmd" &> /dev/null; then
        log "ERROR" "Command '$cmd' not found. Please install it first."
        exit 1
    fi
done

# Check if template exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    log "ERROR" "Template file not found: $TEMPLATE_FILE"
    exit 1
fi

# Check if deploy directory exists
if [ ! -d "$DEPLOY_DIR" ]; then
    log "ERROR" "Deploy directory not found: $DEPLOY_DIR"
    exit 1
fi

log "INFO" "Starting install.run generation..."

# Create temporary directory
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

# Create tarball
log "INFO" "Creating tarball from $DEPLOY_DIR..."
cd "$DEPLOY_DIR"
COPYFILE_DISABLE=1 tar -czf "$TMPDIR/app.tar.gz" .

# Encode to base64
log "INFO" "Encoding to base64..."
PAYLOAD=$(base64 < "$TMPDIR/app.tar.gz" | tr -d '\n')

# Replace placeholder in template
log "INFO" "Generating install.run from template..."
sed "s#__PAYLOAD__#$PAYLOAD#g" "$TEMPLATE_FILE" > "$OUTPUT_FILE"

# Make it executable
chmod +x "$OUTPUT_FILE"

log "SUCCESS" "install.run generated successfully at: $OUTPUT_FILE"
log "INFO" "File size: $(du -h "$OUTPUT_FILE" | cut -f1)"

exit 0
