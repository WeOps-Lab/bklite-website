#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE_FILE="$PROJECT_ROOT/install.run.template"

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

# Function to generate installer
generate_installer() {
    local deploy_dir="$1"
    local output_file="$2"
    local name="$3"

    if [ ! -d "$deploy_dir" ]; then
        log "ERROR" "Deploy directory not found: $deploy_dir"
        return 1
    fi

    log "INFO" "Starting $name generation..."

    # Create temporary directory
    local tmpdir=$(mktemp -d)
    trap "rm -rf $tmpdir" RETURN

    # Create tarball (use options to avoid macOS extended attributes)
    log "INFO" "Creating tarball from $deploy_dir..."
    cd "$deploy_dir"
    # COPYFILE_DISABLE=1 prevents ._* files, --no-xattrs and --no-mac-metadata prevent xattr headers
    COPYFILE_DISABLE=1 tar --no-xattrs --no-mac-metadata -czf "$tmpdir/app.tar.gz" . 2>/dev/null || \
    COPYFILE_DISABLE=1 tar -czf "$tmpdir/app.tar.gz" .

    # Encode to base64
    log "INFO" "Encoding to base64..."
    local payload=$(base64 < "$tmpdir/app.tar.gz" | tr -d '\n')

    # Replace placeholder in template
    log "INFO" "Generating $name from template..."
    sed "s#__PAYLOAD__#$payload#g" "$TEMPLATE_FILE" > "$output_file"

    # Make it executable
    chmod +x "$output_file"

    log "SUCCESS" "$name generated successfully at: $output_file"
    log "INFO" "File size: $(du -h "$output_file" | cut -f1)"
}

# Copy shared conf files to dev directory
sync_dev_conf() {
    local source_conf="$PROJECT_ROOT/deploy/docker-compose/conf"
    local target_conf="$PROJECT_ROOT/deploy/dev/conf"

    log "INFO" "Syncing conf files from docker-compose to dev..."

    # Create target directories
    mkdir -p "$target_conf/vector"
    mkdir -p "$target_conf/telegraf"
    mkdir -p "$target_conf/postgres"

    # Copy conf files
    [ -f "$source_conf/vector/vector.yaml" ] && cp "$source_conf/vector/vector.yaml" "$target_conf/vector/"
    [ -f "$source_conf/telegraf/telegraf.conf" ] && cp "$source_conf/telegraf/telegraf.conf" "$target_conf/telegraf/"
    [ -f "$source_conf/postgres/initdb.sql" ] && cp "$source_conf/postgres/initdb.sql" "$target_conf/postgres/"

    log "SUCCESS" "Conf files synced to dev directory"
}

# Parse arguments
TARGET="${1:-all}"

case "$TARGET" in
    "run"|"docker-compose")
        generate_installer "$PROJECT_ROOT/deploy/docker-compose" "$PROJECT_ROOT/static/install.run" "install.run"
        ;;
    "dev")
        sync_dev_conf
        generate_installer "$PROJECT_ROOT/deploy/dev" "$PROJECT_ROOT/static/install.dev" "install.dev"
        ;;
    "all")
        generate_installer "$PROJECT_ROOT/deploy/docker-compose" "$PROJECT_ROOT/static/install.run" "install.run"
        sync_dev_conf
        generate_installer "$PROJECT_ROOT/deploy/dev" "$PROJECT_ROOT/static/install.dev" "install.dev"
        ;;
    *)
        log "ERROR" "Unknown target: $TARGET. Use 'run', 'dev', or 'all'"
        exit 1
        ;;
esac

exit 0
