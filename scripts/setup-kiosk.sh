#!/bin/bash

# PlexSonic v2 - Kiosk Mode Setup
# Sets up Chromium in fullscreen kiosk mode for dedicated displays

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PLEXSONIC_URL="http://localhost:3001"
AUTOSTART_DIR="/home/pi/.config/autostart"
AUTOSTART_FILE="${AUTOSTART_DIR}/plexsonic-kiosk.desktop"

echo -e "${BLUE}PlexSonic v2 - Kiosk Mode Setup${NC}"
echo "======================================"

# Install required packages
echo -e "${BLUE}Installing required packages...${NC}"
sudo apt update
sudo apt install -y chromium-browser unclutter xdotool

# Create autostart directory
echo -e "${BLUE}Setting up autostart...${NC}"
mkdir -p "${AUTOSTART_DIR}"

# Create autostart desktop file
cat > "${AUTOSTART_FILE}" <<EOF
[Desktop Entry]
Type=Application
Name=PlexSonic Kiosk
Comment=Auto-start PlexSonic in fullscreen kiosk mode
Icon=chromium-browser
Exec=/home/pi/plexsonic-kiosk.sh
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

# Create kiosk startup script
cat > "/home/pi/plexsonic-kiosk.sh" <<'EOF'
#!/bin/bash

# Wait for PlexSonic service to start
sleep 10

# Hide mouse cursor
unclutter -idle 1 -root &

# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Start Chromium in kiosk mode
chromium-browser \
  --kiosk \
  --no-first-run \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-translate \
  --disable-features=TranslateUI \
  --disable-ipc-flooding-protection \
  --disable-background-timer-throttling \
  --disable-backgrounding-occluded-windows \
  --disable-renderer-backgrounding \
  --disable-field-trial-config \
  --disable-back-forward-cache \
  --disable-hang-monitor \
  --disable-prompt-on-repost \
  --disable-web-security \
  --disable-features=VizDisplayCompositor \
  --autoplay-policy=no-user-gesture-required \
  --no-sandbox \
  --start-fullscreen \
  http://localhost:3001
EOF

chmod +x "/home/pi/plexsonic-kiosk.sh"

echo -e "${GREEN}Kiosk mode setup complete!${NC}"
echo
echo -e "${YELLOW}Configuration:${NC}"
echo "- Chromium will auto-start in fullscreen kiosk mode"
echo "- Mouse cursor will be hidden after 1 second of inactivity"
echo "- Screen blanking is disabled"
echo
echo -e "${YELLOW}Manual controls:${NC}"
echo "- Press F11 to toggle fullscreen"
echo "- Press Ctrl+Shift+Q to quit Chromium"
echo "- Press Alt+Tab to switch between applications"
echo
echo -e "${YELLOW}To enable:${NC}"
echo "Reboot your Pi or log out and back in to start kiosk mode automatically"
echo
echo -e "${YELLOW}Display rotation (optional):${NC}"
echo "Add to /boot/config.txt for portrait mode:"
echo "  display_rotate=1  # 90 degrees"
echo "  display_rotate=2  # 180 degrees"
echo "  display_rotate=3  # 270 degrees"

exit 0