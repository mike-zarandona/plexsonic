# Plexsonic Implementation Plan

A lightweight, real-time music "Now Playing" display for Raspberry Pi 4/5 with 7" display.

---

## Project Overview

| Attribute | Value |
|-----------|-------|
| **Purpose** | Display currently playing music from Plex |
| **Target Hardware** | Raspberry Pi 4/5 + 7" display |
| **Trigger** | Plex webhooks (requires Plex Pass) |
| **Focus** | Music only - album art, artist, track |
| **Philosophy** | MVP first, keep it simple |

---

## Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Backend** | Fastify | 2-3x faster than Express, TypeScript-first |
| **WebSocket** | @fastify/websocket | Native Fastify integration |
| **Frontend** | React 18 + Vite | Fast builds, small bundles |
| **Styling** | Tailwind CSS | Utility-first, easy dark theme |
| **Language** | TypeScript | Type safety throughout |
| **Runtime** | Node.js 18+ | LTS, excellent Pi support |

---

## Project Structure

```
plexsonic/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── webhook.ts           # Plex webhook endpoint
│   │   ├── services/
│   │   │   ├── storage.ts           # JSON file state persistence
│   │   │   └── websocket.ts         # WebSocket server
│   │   ├── types/
│   │   │   └── plex.ts              # Plex webhook interfaces
│   │   ├── config.ts                # Environment configuration
│   │   └── server.ts                # Fastify entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── NowPlaying.tsx       # Main display component
│   │   │   └── ConnectionStatus.tsx # WebSocket status indicator
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts      # WebSocket client + reconnect
│   │   ├── types/
│   │   │   └── plex.ts              # Shared types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css                # Tailwind styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── scripts/
│   ├── install-pi.sh                # One-line Pi installation
│   ├── setup-kiosk.sh               # Chromium kiosk setup
│   └── plexsonic.service            # Systemd service
├── data/                            # State persistence directory
├── .env.example
├── package.json                     # Root workspace config
└── README.md
```

---

## Architecture Diagram

```
Plex Server
    │
    │ POST /api/webhook (multipart form)
    ▼
┌─────────────────────────────────────────────┐
│  Backend (Fastify :3001)                    │
│                                             │
│  ┌─────────────┐    ┌──────────────────┐   │
│  │  Webhook    │───▶│  Storage Service │   │
│  │  Handler    │    │  (JSON file)     │   │
│  └─────────────┘    └──────────────────┘   │
│         │                                   │
│         ▼                                   │
│  ┌─────────────────────────────────────┐   │
│  │  WebSocket Server (/ws)              │   │
│  │  - Broadcasts state updates          │   │
│  │  - Heartbeat ping/pong (30s)         │   │
│  │  - Sends current state on connect    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Image Proxy (/api/image)            │   │
│  │  - Fetches album art from Plex       │   │
│  │  - Keeps token server-side           │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
          │ WebSocket
          ▼
┌─────────────────────────────────────────────┐
│  Frontend (React + Vite)                    │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  useWebSocket Hook                   │   │
│  │  - Auto-reconnect (exponential)      │   │
│  │  - State management                  │   │
│  └─────────────────────────────────────┘   │
│         │                                   │
│         ▼                                   │
│  ┌─────────────────────────────────────┐   │
│  │  NowPlaying Component                │   │
│  │  - Album art (400x400, primary)      │   │
│  │  - Track / Artist / Album text       │   │
│  │  - Paused state indicator            │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
          │
          ▼
    7" Display (Chromium Kiosk)
```

---

## Environment Configuration

```bash
# .env
PLEX_SERVER_URL=192.168.1.100    # Plex server IP or hostname
PLEX_SERVER_PORT=32400           # Default Plex port
PLEX_TOKEN=your-plex-token       # Get from Plex web app (see below)
PLEX_USERNAME=your-username      # Filter webhooks to this user only
BACKEND_PORT=3001                # Backend server port
```

### How to Get Your Plex Token

1. Open Plex Web App and sign in
2. Browse to any media item
3. Click "Get Info" → "View XML"
4. Look for `X-Plex-Token=` in the URL

---

## Plex Webhook Events

| Event | What Happens |
|-------|--------------|
| `media.play` | Store metadata, broadcast to frontend |
| `media.pause` | Set `isPaused: true`, keep metadata |
| `media.resume` | Set `isPaused: false` |
| `media.stop` | Keep last state (shows last album art) |

**Filtering:**
- Only process events from configured `PLEX_USERNAME`
- Only process music (`librarySectionType === 'artist'`)

---

## State Structure

```typescript
interface CurrentState {
  event: string;
  metadata: {
    title: string;            // Track name
    grandparentTitle: string; // Artist
    parentTitle: string;      // Album
    parentYear?: number;      // Album year
    thumb: string;            // Album art path
  };
  player: {
    title: string;            // Player name
    uuid: string;
  };
  timestamp: number;
  isPaused: boolean;
}
```

---

## UI Design (7" Display @ 1024x600)

```
+--------------------------------------------+
|                                            |
|        ┌──────────────────┐                |
|        │                  │                |
|        │    Album Art     │   Track Title  |
|        │    (400x400)     │   Artist Name  |
|        │                  │   Album Name   |
|        │                  │                |
|        └──────────────────┘                |
|                                            |
|              ● Now Playing                 |
+--------------------------------------------+
```

**Design Principles:**
- Album art = 60-70% visual weight
- Dark theme default
- Large, readable text (viewable from 3-6 feet)
- Minimal UI chrome
- Paused: dimmed overlay + pause icon

---

# Implementation Phases

Each phase builds on the previous and results in something testable.

---

## Phase 1: Project Setup & Backend Foundation

### 1.1 Initialize Project Structure

- [x] Create root `package.json` with workspaces
- [x] Create `backend/` folder structure
- [x] Create `frontend/` folder structure
- [x] Create `scripts/` and `data/` folders
- [x] Create `.env.example`
- [x] Create `.gitignore`

### 1.2 Backend: Basic Fastify Server

- [x] Initialize `backend/package.json` with dependencies
- [x] Create `backend/tsconfig.json`
- [x] Create `backend/src/config.ts` - environment loading
- [x] Create `backend/src/server.ts` - basic Fastify server with health check
- [x] Add dev scripts (`npm run dev`)

**Checkpoint: `curl http://localhost:3001/health` returns OK**

### 1.3 Backend: Plex Types & Webhook Endpoint

- [x] Create `backend/src/types/plex.ts` - TypeScript interfaces
- [x] Create `backend/src/routes/webhook.ts` - multipart parsing
- [x] Register webhook route in server
- [x] Add logging for incoming webhooks

**Checkpoint: Send test webhook, see it logged in console**

### 1.4 Backend: Storage Service

- [x] Create `backend/src/services/storage.ts`
- [x] Implement `saveState()`, `getState()`, `clearState()`
- [x] Integrate storage into webhook handler
- [x] Create `data/.gitkeep`

**Checkpoint: Webhook saves state to `data/current-state.json`**

### 1.5 Backend: WebSocket Server

- [x] Create `backend/src/services/websocket.ts`
- [x] Setup WebSocket endpoint at `/ws`
- [x] Send current state on client connect
- [x] Broadcast state updates from webhook handler
- [x] Add heartbeat ping/pong (30s)

**Checkpoint: Connect via browser DevTools, receive state updates**

### 1.6 Backend: Image Proxy

- [x] Add `/api/image` route to fetch album art from Plex
- [x] Accept `thumb` query parameter
- [x] Return image with proper content-type

**Checkpoint: `/api/image?thumb=/library/...` returns album art**

---

## Phase 2: Frontend Foundation

### 2.1 Initialize React + Vite

- [ ] Initialize `frontend/package.json`
- [ ] Create `frontend/vite.config.ts`
- [ ] Create `frontend/tsconfig.json`
- [ ] Create `frontend/index.html`
- [ ] Create `frontend/src/main.tsx`
- [ ] Create `frontend/src/App.tsx` (placeholder)

**Checkpoint: `npm run dev` shows React app at localhost:5173**

### 2.2 Setup Tailwind CSS

- [ ] Install Tailwind, PostCSS, Autoprefixer
- [ ] Create `frontend/tailwind.config.js`
- [ ] Create `frontend/postcss.config.js`
- [ ] Create `frontend/src/index.css` with Tailwind directives
- [ ] Configure dark theme colors

**Checkpoint: Tailwind classes work in components**

### 2.3 WebSocket Hook

- [ ] Create `frontend/src/types/plex.ts` (mirror backend types)
- [ ] Create `frontend/src/hooks/useWebSocket.ts`
- [ ] Implement connection with exponential backoff reconnect
- [ ] Implement state management
- [ ] Implement heartbeat

**Checkpoint: Hook connects, logs state updates in console**

### 2.4 Connection Status Component

- [ ] Create `frontend/src/components/ConnectionStatus.tsx`
- [ ] Show: connecting, connected, disconnected, error states
- [ ] Small, unobtrusive indicator

**Checkpoint: Status indicator shows connection state**

### 2.5 NowPlaying Component

- [ ] Create `frontend/src/components/NowPlaying.tsx`
- [ ] Layout: album art + track info
- [ ] Use image proxy for album art
- [ ] Fallback for missing art (music emoji)
- [ ] Paused state visual treatment

**Checkpoint: Full display working with live Plex data**

---

## Phase 3: Polish & Reliability

### 3.1 Error Handling

- [ ] Add React error boundary
- [ ] Handle missing metadata gracefully
- [ ] Validate environment on backend startup
- [ ] Improve error messages

### 3.2 Visual Polish

- [ ] Smooth transitions between states
- [ ] Loading state while connecting
- [ ] Paused overlay with icon
- [ ] Typography refinement

### 3.3 Logging & Debugging

- [x] Structured logging with pino
- [x] Add debug endpoint `/api/debug/state`
- [ ] Frontend console logging (dev only)

**Checkpoint: App handles edge cases gracefully**

---

## Phase 4: Raspberry Pi Deployment

### 4.1 Build Configuration

- [ ] Production build scripts
- [ ] Backend serves built frontend
- [ ] Environment validation
- [ ] Optimize bundle size

### 4.2 Deployment Scripts

- [ ] Create `scripts/plexsonic.service` (systemd)
- [ ] Create `scripts/install-pi.sh` (one-line installer)
- [ ] Create `scripts/setup-kiosk.sh` (Chromium kiosk)

### 4.3 Documentation

- [ ] Write README with setup instructions
- [ ] Document Plex webhook configuration
- [ ] Document environment variables
- [ ] Troubleshooting guide

**Checkpoint: Fresh Pi install works end-to-end**

---

## Phase 5: Future Enhancements (Post-MVP)

These are optional features for later:

- [ ] Multiple view modes (compact/standard/gallery)
- [ ] Touch gestures (swipe to change views)
- [ ] Theme system (light/high-contrast)
- [ ] Settings UI
- [ ] Plex API polling (backup if webhook missed)
- [ ] Persistent image cache
- [ ] Progress bar / track duration
- [ ] Service worker for offline support

---

## Testing Commands

### Test Webhook (curl)

```bash
# Simulate a media.play event
curl -X POST http://localhost:3001/api/webhook \
  -F 'payload={"event":"media.play","Account":{"title":"YourUsername"},"Metadata":{"title":"Track Name","grandparentTitle":"Artist","parentTitle":"Album","thumb":"/library/metadata/123/thumb/456"},"Player":{"title":"Chrome","uuid":"abc123"}}'
```

### Test WebSocket (browser console)

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

### Test Image Proxy

```bash
curl "http://localhost:3001/api/image?thumb=/library/metadata/123/thumb/456" --output test.jpg
```

---

## Resources

- [Plex Webhooks Documentation](https://support.plex.tv/articles/115002267687-webhooks/)
- [Plex API Reference](https://plexapi.dev/)
- [Fastify Documentation](https://fastify.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Raspberry Pi Kiosk Guide](https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/)

---

## Progress Tracking

Update this section as you complete phases:

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Backend | ✅ Complete | All endpoints verified working |
| Phase 2: Frontend | Not Started | |
| Phase 3: Polish | In Progress | Debug endpoint done early |
| Phase 4: Pi Deploy | Not Started | |
| Phase 5: Extras | Not Started | |

---

*Last Updated: 2025-11-29*
