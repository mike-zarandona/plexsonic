#!/bin/bash
set -e

# Plexsonic Kiosk Setup Script for Raspberry Pi
# Configures Chromium to display Plexsonic in fullscreen kiosk mode

PLEXSONIC_URL="${PLEXSONIC_URL:-http://localhost:3001}"
AUTOSTART_DIR="/home/pi/.config/autostart"
LXSESSION_DIR="/home/pi/.config/lxsession/LXDE-pi"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[Kiosk]${NC} $1"; }
warn() { echo -e "${YELLOW}[Warning]${NC} $1"; }
error() { echo -e "${RED}[Error]${NC} $1"; exit 1; }

# Check if running on a graphical environment
check_display() {
    if [[ -z "$DISPLAY" ]] && [[ ! -d "/usr/share/xsessions" ]]; then
        warn "No display environment detected."
        warn "Make sure you have Raspberry Pi OS with Desktop installed."
    fi
}

# Install required packages
install_packages() {
    log "Installing required packages..."
    sudo apt-get update
    sudo apt-get install -y \
        chromium-browser \
        unclutter \
        xdotool
}

# Disable screen blanking
disable_screen_blanking() {
    log "Disabling screen blanking..."

    # Create or update lightdm.conf
    sudo mkdir -p /etc/lightdm/lightdm.conf.d/
    sudo tee /etc/lightdm/lightdm.conf.d/plexsonic.conf > /dev/null << EOF
[SeatDefaults]
xserver-command=X -s 0 -dpms
EOF

    # Also set via xset for current session
    if [[ -n "$DISPLAY" ]]; then
        xset s off
        xset s noblank
        xset -dpms
    fi
}

# Create autostart entry for Chromium kiosk
setup_autostart() {
    log "Setting up kiosk autostart..."

    mkdir -p "$AUTOSTART_DIR"

    # Create Plexsonic kiosk autostart entry
    cat > "$AUTOSTART_DIR/plexsonic-kiosk.desktop" << EOF
[Desktop Entry]
Type=Application
Name=Plexsonic Kiosk
Comment=Plexsonic Now Playing Display
Exec=/home/pi/plexsonic/scripts/start-kiosk.sh
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

    # Create the kiosk launcher script
    cat > /home/pi/plexsonic/scripts/start-kiosk.sh << 'EOF'
#!/bin/bash

# Wait for Plexsonic service to be ready
PLEXSONIC_URL="${PLEXSONIC_URL:-http://localhost:3001}"
MAX_WAIT=60
WAITED=0

echo "Waiting for Plexsonic service..."
while ! curl -s "$PLEXSONIC_URL/health" > /dev/null 2>&1; do
    sleep 2
    WAITED=$((WAITED + 2))
    if [[ $WAITED -ge $MAX_WAIT ]]; then
        echo "Timeout waiting for Plexsonic service"
        break
    fi
done

# Disable screen blanking
xset s off
xset s noblank
xset -dpms

# Hide cursor after 0.5 seconds of inactivity
unclutter -idle 0.5 -root &

# Clear Chromium crash flags (prevents "restore session" dialogs)
CHROMIUM_DIR="/home/pi/.config/chromium"
if [[ -f "$CHROMIUM_DIR/Default/Preferences" ]]; then
    sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' "$CHROMIUM_DIR/Default/Preferences"
    sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' "$CHROMIUM_DIR/Default/Preferences"
fi

# Start Chromium in kiosk mode
chromium-browser \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-restore-session-state \
    --disable-features=TranslateUI \
    --check-for-update-interval=31536000 \
    --disable-pinch \
    --overscroll-history-navigation=0 \
    --no-first-run \
    --fast \
    --fast-start \
    --disable-background-mode \
    "$PLEXSONIC_URL"
EOF

    chmod +x /home/pi/plexsonic/scripts/start-kiosk.sh

    log "Autostart configured"
}

# Create uninstall option
create_uninstall() {
    cat > /home/pi/plexsonic/scripts/disable-kiosk.sh << 'EOF'
#!/bin/bash
# Disable Plexsonic kiosk mode

rm -f /home/pi/.config/autostart/plexsonic-kiosk.desktop
sudo rm -f /etc/lightdm/lightdm.conf.d/plexsonic.conf
echo "Kiosk mode disabled. Reboot to apply changes."
EOF

    chmod +x /home/pi/plexsonic/scripts/disable-kiosk.sh
}

# Main setup
main() {
    echo ""
    echo "=================================="
    echo "   Plexsonic Kiosk Setup"
    echo "=================================="
    echo ""

    if [[ $EUID -eq 0 ]]; then
        error "Don't run this script as root. Run as the 'pi' user."
    fi

    check_display
    install_packages
    disable_screen_blanking
    setup_autostart
    create_uninstall

    echo ""
    echo "=================================="
    echo "   Kiosk Setup Complete!"
    echo "=================================="
    echo ""
    log "Chromium will start in kiosk mode on next boot"
    echo ""
    echo "  To start kiosk now (in desktop mode):"
    echo "    /home/pi/plexsonic/scripts/start-kiosk.sh"
    echo ""
    echo "  To disable kiosk mode:"
    echo "    /home/pi/plexsonic/scripts/disable-kiosk.sh"
    echo ""
    echo "  Reboot to apply all changes:"
    echo "    sudo reboot"
    echo ""
}

main "$@"
