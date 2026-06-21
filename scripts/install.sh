#!/usr/bin/env bash
#
# Installation script for Member Management System development environment
# Supports: macOS, Linux, Windows (WSL2)
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║ $1${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        return 1
    fi
    return 0
}

get_version() {
    $1 --version 2>&1 | head -n1
}

# Main script
print_header "Member Management System - Development Environment Setup"

# Check prerequisites
print_header "Checking Prerequisites"

# Docker
if check_command docker; then
    print_step "Docker installed: $(get_version docker)"
else
    print_error "Docker not found. Please install Docker Desktop."
    echo "  macOS: https://docs.docker.com/desktop/install/mac-install/"
    echo "  Windows: https://docs.docker.com/desktop/install/windows-install/"
    echo "  Linux: https://docs.docker.com/engine/install/"
    exit 1
fi

# Docker Compose
if check_command docker-compose; then
    print_step "Docker Compose installed: $(get_version docker-compose)"
else
    print_error "Docker Compose not found."
    echo "  Install: https://docs.docker.com/compose/install/"
    exit 1
fi

# Git
if check_command git; then
    print_step "Git installed: $(get_version git)"
else
    print_error "Git not found. Please install Git."
    exit 1
fi

# Make (optional)
if check_command make; then
    print_step "Make installed: $(get_version make)"
else
    print_info "Make not installed (optional, but recommended)"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  Install on macOS: xcode-select --install"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "  Install on Linux: sudo apt-get install make"
    fi
fi

# Verify Docker daemon
print_header "Verifying Docker Daemon"
if docker ps > /dev/null 2>&1; then
    print_step "Docker daemon is running"
else
    print_error "Docker daemon is not running"
    echo "  Please start Docker Desktop and try again"
    exit 1
fi

# Create environment file
print_header "Setting Up Environment"
if [ -f .env.development ]; then
    print_info ".env.development already exists"
else
    if [ -f .env.example ]; then
        cp .env.example .env.development
        print_step "Created .env.development from .env.example"
    else
        print_error ".env.example not found"
        exit 1
    fi
fi

# Check for .gitignore
if [ ! -f .gitignore ]; then
    print_info "Creating .gitignore"
    cat > .gitignore << 'EOF'
# Environment
.env
.env.local
.env.production
.env.*.local

# Dependencies
node_modules/
/backend/vendor/

# Build
/bin
/.next
/dist
/build

# IDE
.vscode
.idea
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Database
*.db
*.sqlite

# Temp
/tmp
EOF
    print_step "Created .gitignore"
fi

# Build and start services
print_header "Building Docker Images"

if docker-compose build --no-cache 2>&1 | tail -5; then
    print_step "Successfully built Docker images"
else
    print_error "Failed to build Docker images"
    exit 1
fi

# Summary
print_header "Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Review configuration:"
echo "   nano .env.development"
echo ""
echo "2. Start development environment:"
echo "   ${GREEN}make dev${NC} (if Make installed)"
echo "   ${GREEN}docker-compose up -d${NC} (manual)"
echo ""
echo "3. Access services:"
echo "   Frontend:  ${BLUE}http://localhost:3000${NC}"
echo "   Backend:   ${BLUE}http://localhost:8080${NC}"
echo "   Adminer:   ${BLUE}http://localhost:8081${NC}"
echo ""
echo "4. View logs:"
echo "   ${GREEN}make logs${NC}"
echo ""
echo "5. Run database migrations:"
echo "   ${GREEN}make migrate-up${NC}"
echo ""
echo "6. Seed database:"
echo "   ${GREEN}make seed${NC}"
echo ""
echo "📚 Documentation:"
echo "   - QUICKSTART.md      - Quick start guide"
echo "   - DEPLOYMENT.md      - Production deployment"
echo "   - DOCKER.md          - Docker architecture"
echo "   - ENV_REFERENCE.md   - Environment variables"
echo ""
echo "🆘 For issues:"
echo "   make help            - Show all available commands"
echo "   make logs            - View service logs"
echo ""
