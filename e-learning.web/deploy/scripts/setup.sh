#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Setup Script for LMS Frontend Deployment
# Run this FIRST before any deployment
# Usage: ./setup.sh [dev|prod]
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/deploy/docker"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Detect environment
ENV_TYPE=${1:-dev}

if [[ "$ENV_TYPE" != "dev" && "$ENV_TYPE" != "prod" ]]; then
    log_error "Invalid environment: $ENV_TYPE"
    echo "Usage: $0 [dev|prod]"
    exit 1
fi

log_header "LMS Frontend Setup - $ENV_TYPE Environment"

# ============================================================
# 1. Check Prerequisites
# ============================================================
log_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
fi

log_info "✓ Docker & Docker Compose found"

# ============================================================
# 2. Check Project Structure
# ============================================================
log_info "Checking project structure..."

if [ ! -f "$PROJECT_ROOT/Dockerfile" ]; then
    log_error "Dockerfile not found at $PROJECT_ROOT/Dockerfile"
    exit 1
fi

if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    log_error "package.json not found at $PROJECT_ROOT/package.json"
    exit 1
fi

log_info "✓ Project structure is valid"

# ============================================================
# 3. Create Environment File
# ============================================================
log_header "Environment Configuration"

if [[ "$ENV_TYPE" == "dev" ]]; then
    ENV_FILE="$DOCKER_DIR/.env.dev"
    ENV_EXAMPLE="$DOCKER_DIR/.env.example"
    ENV_DESC="Development"
else
    ENV_FILE="$DOCKER_DIR/.env"
    ENV_EXAMPLE="$DOCKER_DIR/.env.example"
    ENV_DESC="Production"
fi

if [ ! -f "$ENV_FILE" ]; then
    log_warn "$ENV_FILE does not exist"
    log_info "Creating from .env.example..."
    
    if [ ! -f "$ENV_EXAMPLE" ]; then
        log_error ".env.example not found!"
        exit 1
    fi
    
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    log_info "✓ Created $ENV_FILE"
    
    if [[ "$ENV_TYPE" == "prod" ]]; then
        log_warn ""
        log_warn "IMPORTANT: You MUST edit $ENV_FILE with production values:"
        log_warn "  - NEXT_PUBLIC_API_URL: Should point to your production backend"
        log_warn "  - NEXT_PUBLIC_AUTH0_DOMAIN: Your Auth0 domain"
        log_warn "  - NEXT_PUBLIC_AUTH0_CLIENT_ID: Your Auth0 client ID"
        log_warn ""
        log_info "Command to edit:"
        log_info "  nano $ENV_FILE"
        log_warn ""
        read -p "Edit now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            nano "$ENV_FILE"
        fi
    else
        log_info "Default development values copied to $ENV_FILE"
        log_info "Edit if needed: nano $ENV_FILE"
    fi
else
    log_info "✓ $ENV_FILE already exists"
fi

# ============================================================
# 4. Validate Environment File
# ============================================================
log_info "Validating environment configuration..."

if grep -q "^NEXT_PUBLIC_API_URL=" "$ENV_FILE"; then
    API_URL=$(grep "^NEXT_PUBLIC_API_URL=" "$ENV_FILE" | cut -d '=' -f 2)
    log_info "✓ API URL configured: $API_URL"
else
    log_warn "⚠ NEXT_PUBLIC_API_URL not configured"
fi

# ============================================================
# 5. Make Scripts Executable
# ============================================================
log_info "Making deployment scripts executable..."
chmod +x "$SCRIPT_DIR/deploy-dev.sh" "$SCRIPT_DIR/deploy-prod.sh" "$SCRIPT_DIR/setup.sh"
log_info "✓ Scripts are executable"

# ============================================================
# 6. Summary & Next Steps
# ============================================================
log_header "Setup Complete! 🎉"

echo ""
echo "Environment: $ENV_DESC"
echo "Config file: $ENV_FILE"
echo ""

if [[ "$ENV_TYPE" == "dev" ]]; then
    echo -e "${GREEN}Next steps:${NC}"
    echo "1. Review configuration:"
    echo "   nano $ENV_FILE"
    echo ""
    echo "2. Start development server:"
    echo "   cd $SCRIPT_DIR"
    echo "   ./deploy-dev.sh up"
    echo ""
    echo "3. Access application:"
    echo "   http://localhost:8080  (via Nginx)"
    echo "   http://localhost:8081  (direct)"
    echo ""
else
    echo -e "${GREEN}Next steps:${NC}"
    echo "1. Configure production values:"
    echo "   nano $ENV_FILE"
    echo ""
    echo "2. Build Docker image:"
    echo "   cd $SCRIPT_DIR"
    echo "   ./deploy-prod.sh build"
    echo ""
    echo "3. Deploy:"
    echo "   ./deploy-prod.sh up"
    echo ""
    echo "4. Check status:"
    echo "   ./deploy-prod.sh ps"
    echo ""
fi

echo "View logs:"
if [[ "$ENV_TYPE" == "dev" ]]; then
    echo "   ./deploy-dev.sh logs"
else
    echo "   ./deploy-prod.sh logs"
fi

echo ""
log_info "Setup completed successfully!"
