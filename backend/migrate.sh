#!/bin/bash
# migrate.sh - Helper script for running migrations

set -e

# Configuration
MIGRATIONS_PATH="backend/migrations"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/member_mgmt?sslmode=disable}"
MIGRATE_CMD="${MIGRATE_CMD:-migrate}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  up              Apply all pending migrations"
    echo "  down            Rollback all migrations"
    echo "  version         Show current migration version"
    echo "  force VERSION   Force to specific version"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 up"
    echo "  $0 down"
    echo "  $0 version"
    echo "  $0 force 12"
}

check_migrate() {
    if ! command -v $MIGRATE_CMD &> /dev/null; then
        echo -e "${RED}Error: 'migrate' not found. Install golang-migrate first:${NC}"
        echo "  brew install migrate  # macOS"
        echo "  https://github.com/golang-migrate/migrate"
        exit 1
    fi
}

run_up() {
    echo -e "${YELLOW}Applying migrations...${NC}"
    $MIGRATE_CMD -path $MIGRATIONS_PATH -database "$DATABASE_URL" up
    echo -e "${GREEN}✓ Migrations applied successfully${NC}"
    show_version
}

run_down() {
    echo -e "${YELLOW}Rolling back migrations...${NC}"
    $MIGRATE_CMD -path $MIGRATIONS_PATH -database "$DATABASE_URL" down
    echo -e "${GREEN}✓ Migrations rolled back${NC}"
}

show_version() {
    echo -e "${YELLOW}Checking migration version...${NC}"
    $MIGRATE_CMD -path $MIGRATIONS_PATH -database "$DATABASE_URL" version
}

force_version() {
    local version=$1
    if [ -z "$version" ]; then
        echo -e "${RED}Error: version not specified${NC}"
        exit 1
    fi
    echo -e "${YELLOW}Forcing migration version to $version...${NC}"
    $MIGRATE_CMD -path $MIGRATIONS_PATH -database "$DATABASE_URL" force $version
    echo -e "${GREEN}✓ Forced to version $version${NC}"
}

# Main
case "${1:-help}" in
    up)
        check_migrate
        run_up
        ;;
    down)
        check_migrate
        run_down
        ;;
    version)
        check_migrate
        show_version
        ;;
    force)
        check_migrate
        force_version "$2"
        ;;
    help)
        print_usage
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        print_usage
        exit 1
        ;;
esac
