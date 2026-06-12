#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Production Deployment Script for LMS Frontend
# Run setup.sh FIRST: ./setup.sh prod
# Usage: ./deploy-prod.sh [build|up|down|restart|logs|ps|rebuild|update|clean]
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/deploy/docker"
ENV_FILE="$DOCKER_DIR/.env"
ENV_EXAMPLE="$DOCKER_DIR/.env.example"
DOCKER_COMPOSE_CMD=""

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

# Remove stale containers that may block fixed container_name reuse.
cleanup_stale_containers() {
    local stale_containers=("lms-web" "lms-web-nginx")
    for name in "${stale_containers[@]}"; do
        if docker ps -a --format '{{.Names}}' | grep -Fxq "$name"; then
            log_warn "Removing stale container: $name"
            docker rm -f "$name" >/dev/null 2>&1 || true
        fi
    done
}

# ============================================================
# Check Prerequisites
# ============================================================
check_prerequisites() {
    local missing=0
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        missing=1
    fi
    
    if docker compose version &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
    elif command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        log_error "Docker Compose is not installed"
        log_info "Install Docker Compose plugin or docker-compose binary"
        missing=1
    fi
    
    if [ $missing -eq 1 ]; then
        exit 1
    fi
}

# ============================================================
# Check Environment File
# ============================================================
check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        log_error "$ENV_FILE not found!"
        log_info ""
        log_info "Please run setup first:"
        log_info "  ./setup.sh prod"
        log_info ""
        exit 1
    fi
}

# ============================================================
# Validate Production Configuration
# ============================================================
validate_prod_config() {
    local api_url=$(grep "^NEXT_PUBLIC_HOST_API_URL=" "$ENV_FILE" | cut -d '=' -f 2 || echo "")
    
    if [ -z "$api_url" ]; then
        log_warn "NEXT_PUBLIC_HOST_API_URL not set in $ENV_FILE"
    fi
    
    if grep -q "your-auth0-domain" "$ENV_FILE"; then
        log_warn "Auth0 domain still has placeholder value"
    fi
}

# ============================================================
# Main Script
# ============================================================
check_prerequisites
check_env_file

log_header "LMS Frontend - Production Environment"
log_info "Project root: $PROJECT_ROOT"
log_info "Config file: $ENV_FILE"
log_info "Compose command: $DOCKER_COMPOSE_CMD"

# Parse command
COMMAND=${1:-up}

case "$COMMAND" in
    build)
        log_header "Building Production Docker Image"
        cd "$DOCKER_DIR"
        if $DOCKER_COMPOSE_CMD -f docker-compose.yml build lms-web; then
            log_info "✓ Build completed successfully"
        else
            log_error "Build failed"
            exit 1
        fi
        ;;
    
    up)
        log_header "Starting Production Environment"
        validate_prod_config
        
        cd "$DOCKER_DIR"
        cleanup_stale_containers
        if $DOCKER_COMPOSE_CMD -f docker-compose.yml up -d; then
            log_info "✓ Containers started"
            sleep 5
            
            if docker ps | grep -q lms-web; then
                log_header "Production Server Ready! 🚀"
                echo ""
                echo "Access points:"
                echo "  • Via Nginx: http://localhost"
                echo "  • Direct: http://localhost:3000"
                echo ""
                echo "Container info:"
                $DOCKER_COMPOSE_CMD -f docker-compose.yml ps
                echo ""
                echo "View logs:"
                echo "  ./deploy-prod.sh logs"
                echo ""
            else
                log_error "Container failed to start"
                $DOCKER_COMPOSE_CMD -f docker-compose.yml logs lms-web
                exit 1
            fi
        else
            log_error "Failed to start containers"
            exit 1
        fi
        ;;
    
    down)
        log_header "Stopping Production Environment"
        cd "$DOCKER_DIR"
        if $DOCKER_COMPOSE_CMD -f docker-compose.yml down; then
            log_info "✓ Stopped successfully"
        else
            log_error "Failed to stop containers"
            exit 1
        fi
        ;;
    
    restart)
        log_info "Restarting production containers..."
        cd "$DOCKER_DIR"
        if $DOCKER_COMPOSE_CMD -f docker-compose.yml restart; then
            log_info "✓ Restarted successfully"
            $DOCKER_COMPOSE_CMD -f docker-compose.yml ps
        else
            log_error "Failed to restart containers"
            exit 1
        fi
        ;;
    
    logs)
        log_header "Production Logs (Ctrl+C to exit)"
        cd "$DOCKER_DIR"
        $DOCKER_COMPOSE_CMD -f docker-compose.yml logs -f
        ;;
    
    ps)
        log_info "Production container status:"
        cd "$DOCKER_DIR"
        $DOCKER_COMPOSE_CMD -f docker-compose.yml ps
        ;;
    
    rebuild)
        log_header "Rebuilding Production Environment"
        cd "$DOCKER_DIR"
        
        log_info "Building Docker image..."
        if ! $DOCKER_COMPOSE_CMD -f docker-compose.yml build lms-web; then
            log_error "Build failed"
            exit 1
        fi
        
        log_info "Stopping current containers..."
        $DOCKER_COMPOSE_CMD -f docker-compose.yml down || true
        cleanup_stale_containers
        
        log_info "Starting new containers..."
        if $DOCKER_COMPOSE_CMD -f docker-compose.yml up -d; then
            log_info "✓ Rebuild completed"
            sleep 3
            $DOCKER_COMPOSE_CMD -f docker-compose.yml ps
        else
            log_error "Failed to start containers"
            exit 1
        fi
        ;;
    
    update)
        log_header "Updating Production Deployment"
        cd "$PROJECT_ROOT"
        
        log_info "Pulling latest code from git..."
        if ! git pull --ff-only; then
            log_error "Git pull failed"
            exit 1
        fi
        
        log_info "Building Docker image..."
        cd "$DOCKER_DIR"
        if ! $DOCKER_COMPOSE_CMD -f docker-compose.yml build lms-web; then
            log_error "Build failed"
            exit 1
        fi
        
        log_info "Stopping current containers..."
        $DOCKER_COMPOSE_CMD -f docker-compose.yml down || true
        cleanup_stale_containers
        
        log_info "Starting new containers..."
        if $DOCKER_COMPOSE_CMD -f docker-compose.yml up -d; then
            log_info "✓ Update completed"
            sleep 3
            log_header "Deployment Summary"
            $DOCKER_COMPOSE_CMD -f docker-compose.yml ps
        else
            log_error "Failed to start containers"
            exit 1
        fi
        ;;
    
    clean)
        log_header "Cleaning Production Environment"
        cd "$DOCKER_DIR"
        
        log_error "WARNING: This will remove production containers!"
        read -p "Type 'yes' to confirm: " confirm
        if [ "$confirm" = "yes" ]; then
            log_warn "Removing containers and volumes..."
            $DOCKER_COMPOSE_CMD -f docker-compose.yml down -v || true
            
            log_warn "Removing production image..."
            docker rmi lms-web:latest || true
            
            log_info "✓ Cleanup completed"
        else
            log_info "Cleanup cancelled"
        fi
        ;;
    
    *)
        echo "LMS Frontend Production Deployment"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  build      - Build production Docker image"
        echo "  up         - Start production containers"
        echo "  down       - Stop production containers"
        echo "  restart    - Restart production containers"
        echo "  logs       - Show container logs"
        echo "  ps         - Show container status"
        echo "  rebuild    - Build image and restart"
        echo "  update     - Pull code, build, and restart"
        echo "  clean      - Remove containers/images (BE CAREFUL!)"
        echo ""
        echo "First time deployment:"
        echo "  ./setup.sh prod"
        echo "  ./deploy-prod.sh build"
        echo "  ./deploy-prod.sh up"
        exit 1
        ;;
esac
