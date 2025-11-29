# Plexsonic

A real-time "Now Playing" display for Plex, designed for Raspberry Pi with a 7" display.

![Status](https://img.shields.io/badge/status-beta-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- Real-time music display via Plex webhooks
- Album art, track name, artist, and album information
- Pause/resume state indicators
- Dark theme optimized for always-on displays
- Automatic reconnection with exponential backoff
- Low resource usage suitable for Raspberry Pi

## Requirements

- **Plex Pass** (required for webhooks)
- **Node.js 18+**
- **Raspberry Pi 4/5** with 7" display (or any system for testing)

## Quick Start (Raspberry Pi)

```bash
curl -sSL https://raw.githubusercontent.com/your-username/plexsonic/main/scripts/install-pi.sh | bash
```

Then configure your `.env` file and setup Plex webhooks (see below).

## Manual Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/plexsonic.git
cd plexsonic
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
nano .env
```

Edit with your Plex settings:

```env
PLEX_SERVER_URL=192.168.1.100    # Your Plex server IP
PLEX_SERVER_PORT=32400           # Default Plex port
PLEX_TOKEN=your-plex-token       # See "Getting Your Plex Token" below
PLEX_USERNAME=your-username      # Your Plex username
BACKEND_PORT=3001                # Backend server port
```

### 4. Build and Start

```bash
npm run build
npm start
```

Access the display at: `http://localhost:3001`

## Getting Your Plex Token

1. Open Plex Web App and sign in
2. Browse to any media item
3. Click the **...** menu, then **Get Info**
4. Click **View XML** in the bottom left
5. Look for `X-Plex-Token=` in the URL
6. Copy the token value

## Configuring Plex Webhooks

1. Open Plex Web App
2. Go to **Settings** > **Webhooks**
3. Click **Add Webhook**
4. Enter your Plexsonic URL: `http://<pi-ip>:3001/api/webhook`
5. Click **Save Changes**

**Note:** Webhooks require Plex Pass subscription.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PLEX_SERVER_URL` | Yes | - | Plex server IP or hostname |
| `PLEX_SERVER_PORT` | No | `32400` | Plex server port |
| `PLEX_TOKEN` | Yes | - | Your Plex authentication token |
| `PLEX_USERNAME` | Yes | - | Filter webhooks to this user only |
| `BACKEND_PORT` | No | `3001` | Port for the backend server |

## Raspberry Pi Setup

### Installing the Service

After running the installation script, the systemd service is automatically configured.

```bash
# Start the service
sudo systemctl start plexsonic

# Check status
sudo systemctl status plexsonic

# View logs
journalctl -u plexsonic -f

# Stop the service
sudo systemctl stop plexsonic

# Disable autostart
sudo systemctl disable plexsonic
```

### Kiosk Mode (Full-Screen Display)

To run Plexsonic in full-screen kiosk mode:

```bash
~/plexsonic/scripts/setup-kiosk.sh
sudo reboot
```

This will:
- Install Chromium browser
- Disable screen blanking
- Hide mouse cursor after inactivity
- Auto-start Chromium in kiosk mode on boot

To disable kiosk mode:
```bash
~/plexsonic/scripts/disable-kiosk.sh
sudo reboot
```

## Development

### Running in Development Mode

```bash
# Terminal 1: Start backend with hot reload
npm run dev

# Terminal 2: Start frontend dev server
npm run dev:frontend

# Or run both (frontend on :5173, backend on :3001)
npm run dev:all
```

### Testing Webhooks

Simulate a `media.play` event:

```bash
curl -X POST http://localhost:3001/api/webhook \
  -F 'payload={"event":"media.play","Account":{"title":"YourUsername"},"Metadata":{"type":"track","title":"Track Name","grandparentTitle":"Artist","parentTitle":"Album","thumb":"/library/metadata/123/thumb/456"},"Player":{"title":"Chrome","uuid":"abc123"}}'
```

### Debug Endpoint

View current state: `http://localhost:3001/api/debug/state`

## Troubleshooting

### "Configuration Error" on startup

Make sure your `.env` file exists and has all required variables:
```bash
cp .env.example .env
nano .env  # Edit with your values
```

### Webhook not receiving events

1. Verify webhook URL is accessible from Plex server:
   ```bash
   curl http://<pi-ip>:3001/health
   ```

2. Check Plex webhook is configured correctly in Plex settings

3. Verify `PLEX_USERNAME` in `.env` matches your Plex account name exactly

4. Check backend logs for incoming webhooks:
   ```bash
   journalctl -u plexsonic -f
   ```

### Album art not loading

1. Verify Plex server is accessible:
   ```bash
   curl "http://<plex-ip>:32400/library/sections?X-Plex-Token=<your-token>"
   ```

2. Check `PLEX_TOKEN` in `.env` is correct

3. Try the image proxy directly:
   ```bash
   curl "http://localhost:3001/api/image?thumb=/library/metadata/123/thumb"
   ```

### Display shows "Waiting for music..."

This is normal when no music is currently playing. The display will update when:
- Music starts playing (via Plex webhook)
- Music is paused (shows pause overlay)
- Music is resumed

### WebSocket disconnects frequently

The frontend will automatically reconnect with exponential backoff. If disconnects are frequent:

1. Check network stability
2. Verify backend is running: `systemctl status plexsonic`
3. Check backend logs for errors

### Kiosk mode not starting

1. Ensure desktop environment is installed:
   ```bash
   sudo apt-get install raspberrypi-ui-mods
   ```

2. Check autostart file exists:
   ```bash
   ls ~/.config/autostart/plexsonic-kiosk.desktop
   ```

3. Test kiosk script manually:
   ```bash
   ~/plexsonic/scripts/start-kiosk.sh
   ```

## Project Structure

```
plexsonic/
├── backend/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript types
│   │   ├── config.ts        # Environment config
│   │   └── server.ts        # Fastify server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx
│   └── package.json
├── scripts/
│   ├── install-pi.sh        # Pi installation script
│   ├── setup-kiosk.sh       # Kiosk mode setup
│   └── plexsonic.service    # Systemd service
├── data/                    # State persistence
└── .env.example
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/webhook` | POST | Plex webhook receiver |
| `/api/image` | GET | Album art proxy |
| `/api/debug/state` | GET | Current state (debug) |
| `/ws` | WS | WebSocket for real-time updates |

## License

MIT
