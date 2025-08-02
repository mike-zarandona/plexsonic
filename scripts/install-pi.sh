#!/bin/bash

# PlexSonic v2 - Raspberry Pi Installation Script
# One-line install: curl -sSL https://raw.githubusercontent.com/[user]/plexsonic/main/scripts/install-pi.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PLEXSONIC_DIR="/opt/plexsonic"
SERVICE_USER="plexsonic"
REPO_URL="https://github.com/[user]/plexsonic.git"
NODE_VERSION="18"

echo -e "${BLUE}PlexSonic v2 - Raspberry Pi Installation${NC}"
echo "=================================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}Error: Please run this script as a regular user, not root${NC}"
   echo "The script will use sudo when needed."
   exit 1
fi

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo -e "${YELLOW}Warning: This doesn't appear to be a Raspberry Pi${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${BLUE}[1/8] Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

echo -e "${BLUE}[2/8] Installing dependencies...${NC}"
sudo apt install -y curl git build-essential python3-pip

# Install Node.js
echo -e "${BLUE}[3/8] Installing Node.js ${NODE_VERSION}...${NC}"
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt ${NODE_VERSION} ]]; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo -e "${BLUE}[4/8] Creating service user...${NC}"
if ! id "${SERVICE_USER}" &>/dev/null; then
    sudo useradd -r -s /bin/false -d ${PLEXSONIC_DIR} ${SERVICE_USER}
fi

echo -e "${BLUE}[5/8] Cloning repository...${NC}"
sudo rm -rf ${PLEXSONIC_DIR}
sudo git clone ${REPO_URL} ${PLEXSONIC_DIR}
sudo chown -R ${SERVICE_USER}:${SERVICE_USER} ${PLEXSONIC_DIR}

echo -e "${BLUE}[6/8] Installing dependencies and building...${NC}"
cd ${PLEXSONIC_DIR}

# Install backend dependencies
cd backend
sudo -u ${SERVICE_USER} npm ci --production
sudo -u ${SERVICE_USER} npm run build

# Install and build frontend
cd ../frontend
sudo -u ${SERVICE_USER} npm ci
sudo -u ${SERVICE_USER} npm run build

# Copy built frontend to backend static
sudo -u ${SERVICE_USER} cp -r dist/* ../backend/dist/public/

echo -e "${BLUE}[7/8] Setting up environment...${NC}"
cd ${PLEXSONIC_DIR}

# Create environment file
if [[ ! -f .env ]]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    sudo -u ${SERVICE_USER} cp .env.example .env
    echo -e "${RED}IMPORTANT: You MUST edit ${PLEXSONIC_DIR}/.env with your Plex settings!${NC}"
fi

# Create data directory
sudo -u ${SERVICE_USER} mkdir -p data/image-cache
sudo -u ${SERVICE_USER} touch data/current-state.json

echo -e "${BLUE}[8/8] Installing systemd service...${NC}"

# Create systemd service file
sudo tee /etc/systemd/system/plexsonic.service > /dev/null <<EOF
[Unit]
Description=PlexSonic v2 - Real-time Plex Media Display
After=network.target
Wants=network.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${PLEXSONIC_DIR}
ExecStart=/usr/bin/node backend/dist/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=${PLEXSONIC_DIR}
CapabilityBoundingSet=

# Resource limits
MemoryMax=200M
CPUQuota=50%

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable plexsonic

echo -e "${GREEN}Installation complete!${NC}"
echo
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit configuration: sudo nano ${PLEXSONIC_DIR}/.env"
echo "2. Add your Plex server details and token"
echo "3. Start the service: sudo systemctl start plexsonic"
echo "4. Check status: sudo systemctl status plexsonic"
echo "5. View logs: sudo journalctl -f -u plexsonic"
echo
echo "Access your PlexSonic display at: http://$(hostname -I | awk '{print $1}'):3001"
echo
echo -e "${BLUE}Configuration guide: https://github.com/[user]/plexsonic#configuration${NC}"

# Optional: Configure display rotation for small screens
if command -v raspi-config &> /dev/null; then
    echo
    echo -e "${YELLOW}Optional: Configure display settings${NC}"
    echo "For small displays, you may want to:"
    echo "- Rotate screen: Add 'display_rotate=1' to /boot/config.txt"
    echo "- Hide cursor: Install unclutter (sudo apt install unclutter)"
    echo "- Auto-start browser: Configure Chromium kiosk mode"
fi

exit 0