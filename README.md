# PlexSonic v2

Lightweight, real-time Plex media display application designed for Raspberry Pi with mini displays.

## Features

- Real-time updates via Plex webhooks
- Auto-reconnecting WebSocket for reliability
- State persistence across restarts
- Touch-friendly, responsive layouts
- Optimized for ARM processors
- < 200KB frontend bundle size

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/plexsonic.git
cd plexsonic
```

2. Copy the environment template:
```bash
cp .env.example .env
```

3. Configure your Plex settings in `.env`:
- `PLEX_TOKEN`: Your Plex authentication token
- `PLEX_USERNAME`: Your Plex username
- `WEBHOOK_SECRET`: A random secret for webhook authentication

4. Install dependencies:
```bash
npm install
```

5. Start the development servers:
```bash
npm run dev
```

6. Configure Plex webhooks to point to: `http://your-server:3001/api/webhook`

## Architecture

- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS
- **Backend**: Fastify + TypeScript + WebSocket
- **Storage**: Local JSON file for state persistence

## Deployment

One-line installation script for Raspberry Pi coming in Phase 4.

## Development

See [PLEXSONIC_V2_PLAN.md](./PLEXSONIC_V2_PLAN.md) for the complete development roadmap.

## License

MIT
