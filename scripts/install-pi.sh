#!/bin/bash
set -e

# Plexsonic Installation Script for Raspberry Pi
# Usage: curl -sSL https://raw.githubusercontent.com/your-username/plexsonic/main/scripts/install-pi.sh | bash

INSTALL_DIR="/home/pi/plexsonic"
REPO_URL="${PLEXSONIC_REPO:-https://github.com/your-username/plexsonic.git}"
BRANCH="${PLEXSONIC_BRANCH:-main}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[Plexsonic]${NC} $1"; }
warn() { echo -e "${YELLOW}[Warning]${NC} $1"; }
error() { echo -e "${RED}[Error]${NC} $1"; exit 1; }

# Check if running on Raspberry Pi
check_pi() {
    if [[ ! -f /proc/device-tree/model ]] || ! grep -qi "raspberry" /proc/device-tree/model 2>/dev/null; then
        warn "This doesn't appear to be a Raspberry Pi. Continuing anyway..."
    fi
}

# Check for root (we need sudo but shouldn't run as root)
check_user() {
    if [[ $EUID -eq 0 ]]; then
        error "Don't run this script as root. Run as the 'pi' user with sudo access."
    fi

    if ! sudo -n true 2>/dev/null; then
        log "This script requires sudo access. You may be prompted for your password."
    fi
}

# Install Node.js 20 LTS via NodeSource
install_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $NODE_VERSION -ge 18 ]]; then
            log "Node.js $(node -v) already installed"
            return
        fi
    fi

    log "Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    log "Node.js $(node -v) installed"
}

# Clone or update repository
setup_repo() {
    if [[ -d "$INSTALL_DIR/.git" ]]; then
        log "Updating existing installation..."
        cd "$INSTALL_DIR"
        git fetch origin
        git checkout "$BRANCH"
        git pull origin "$BRANCH"
    else
        log "Cloning Plexsonic..."
        git clone -b "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi
}

# Install dependencies and build
build_project() {
    log "Installing dependencies..."
    cd "$INSTALL_DIR"
    npm ci --production=false

    log "Building project..."
    npm run build

    log "Build complete!"
}

# Setup environment file
setup_env() {
    if [[ ! -f "$INSTALL_DIR/.env" ]]; then
        log "Creating .env file from template..."
        cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
        warn "Please edit $INSTALL_DIR/.env with your Plex settings"
        warn "Required: PLEX_SERVER_URL, PLEX_TOKEN, PLEX_USERNAME"
    else
        log ".env file already exists"
    fi
}

# Setup systemd service
setup_service() {
    log "Setting up systemd service..."

    sudo cp "$INSTALL_DIR/scripts/plexsonic.service" /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable plexsonic

    log "Systemd service installed and enabled"
}

# Create data directory
setup_data() {
    mkdir -p "$INSTALL_DIR/data"
    log "Data directory created"
}

# Main installation
main() {
    echo ""
    echo "=================================="
    echo "   Plexsonic Installation Script"
    echo "=================================="
    echo ""

    check_pi
    check_user

    log "Updating system packages..."
    sudo apt-get update

    log "Installing required packages..."
    sudo apt-get install -y git curl

    install_nodejs
    setup_repo
    build_project
    setup_data
    setup_env
    setup_service

    echo ""
    echo "=================================="
    echo "   Installation Complete!"
    echo "=================================="
    echo ""
    log "Next steps:"
    echo "  1. Edit your .env file:"
    echo "     nano $INSTALL_DIR/.env"
    echo ""
    echo "  2. Configure Plex webhooks to point to:"
    echo "     http://<pi-ip>:3001/api/webhook"
    echo ""
    echo "  3. Start the service:"
    echo "     sudo systemctl start plexsonic"
    echo ""
    echo "  4. (Optional) Setup kiosk mode:"
    echo "     $INSTALL_DIR/scripts/setup-kiosk.sh"
    echo ""
    echo "  View logs: journalctl -u plexsonic -f"
    echo ""
}

main "$@"
