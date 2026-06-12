#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Development Deployment Script for LMS Frontend
# Run setup.sh FIRST: ./setup.sh dev
# Usage: ./deploy-dev.sh [build|up|down|restart|logs|ps|rebuild|clean]
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/deploy/docker"
ENV_FILE="$DOCKER_DIR/.env.dev"
ENV_EXAMPLE="$DOCKER_DIR/.env.example"

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

# ============================================================
# Check Prerequisites
# ============================================================
check_prerequisites() {
    local missing=0
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        missing=1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
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
        log_info "  ./setup.sh dev"
        log_info ""
        exit 1
    fi
}

# ============================================================
# Main Script
# ============================================================
check_prerequisites
check_env_file

log_header "LMS Frontend - Development Environment"
log_info "Project root: $PROJECT_ROOT"
log_info "Config file: $ENV_FILE"

# Parse command
COMMAND=${1:-up}

case "$COMMAND" in
    build)
        log_info "Building development Docker image..."
        cd "$DOCKER_DIR"
        if docker-compose -f docker-compose.dev.yml build lms-web-dev; then
            log_info "✓ Build completed successfully"
        else
            log_error "Build failed"
            exit 1
        fi
        ;;
    
    up)
        log_header "Starting Development Environment"
        cd "$DOCKER_DIR"
        
        if docker-compose -f docker-compose.dev.yml up -d; then
            log_info "✓ Containers started"
            sleep 3
            
            if docker ps | grep -q lms-web-dev; then
                log_header "Development Server Ready! 🚀"
                echo ""
                echo "Access points:"
                echo "  • Via Nginx: http://localhost:8080"
                echo "  • Direct: http://localhost:8081"
                echo ""
                echo "Features:"
                echo "  • Hot Module Reload (HMR) enabled"
                echo "  • Fast refresh on file changes"
                echo "  • Source maps for debugging"
                echo ""
                echo "View logs:"
                echo "  ./deploy-dev.sh logs"
                echo ""
            else
                log_error "Container failed to start"
                docker-compose -f docker-compose.dev.yml logs lms-web-dev
                exit 1
            fi
        else
            log_error "Failed to start containers"
            exit 1
        fi
        ;;
    
    down)
        log_info "Stopping development containers..."
        cd "$DOCKER_DIR"
        if docker-compose -f docker-compose.dev.yml down; then
            log_info "✓ Stopped successfully"
        else
            log_error "Failed to stop containers"
            exit 1
        fi
        ;;
    
    restart)
        log_info "Restarting development containers..."
        cd "$DOCKER_DIR"
        if docker-compose -f docker-compose.dev.yml restart; then
            log_info "✓ Restarted successfully"
        else
            log_error "Failed to restart containers"
            exit 1
        fi
        ;;
    
    logs)
        log_header "Development Logs (Ctrl+C to exit)"
        cd "$DOCKER_DIR"
        docker-compose -f docker-compose.dev.yml logs -f
        ;;
    
    ps)
        log_info "Development container status:"
        cd "$DOCKER_DIR"
        docker-compose -f docker-compose.dev.yml ps
        ;;
    
    rebuild)
        log_header "Rebuilding Development Environment"
        cd "$DOCKER_DIR"
        
        log_info "Building Docker image..."
        if ! docker-compose -f docker-compose.dev.yml build lms-web-dev; then
            log_error "Build failed"
            exit 1
        fi
        
        log_info "Stopping old containers..."
        docker-compose -f docker-compose.dev.yml down || true
        
        log_info "Starting new containers..."
        if docker-compose -f docker-compose.dev.yml up -d; then
            log_info "✓ Rebuild completed"
            sleep 2
            docker-compose -f docker-compose.dev.yml logs lms-web-dev
        else
            log_error "Failed to start containers"
            exit 1
        fi
        ;;
    
    clean)
        log_header "Cleaning Development Environment"
        cd "$DOCKER_DIR"
        
        log_warn "This will remove all development containers and volumes"
        read -p "Continue? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Removing containers and volumes..."
            docker-compose -f docker-compose.dev.yml down -v || true
            
            log_info "Removing development image..."
            docker rmi lms-web:dev || true
            
            log_info "✓ Cleanup completed"
        else
            log_info "Cleanup cancelled"
        fi
        ;;
    
    *)
        echo "LMS Frontend Development Deployment"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  build      - Build development Docker image"
        echo "  up         - Start development containers"
        echo "  down       - Stop development containers"
        echo "  restart    - Restart development containers"
        echo "  logs       - Show container logs"
        echo "  ps         - Show container status"
        echo "  rebuild    - Rebuild image and restart"
        echo "  clean      - Remove all containers/images/volumes"
        echo ""
        echo "First time setup:"
        echo "  ./setup.sh dev"
        echo "  ./deploy-dev.sh up"
        exit 1
        ;;
esac
