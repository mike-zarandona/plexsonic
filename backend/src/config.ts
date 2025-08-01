import { config } from 'dotenv';
import { join, resolve } from 'path';

config({ path: resolve(process.cwd(), '../.env') });

export const Config = {
  plex: {
    serverUrl: process.env.PLEX_SERVER_URL || '192.168.1.100',
    serverPort: parseInt(process.env.PLEX_SERVER_PORT || '32400', 10),
    token: process.env.PLEX_TOKEN || '',
    username: process.env.PLEX_USERNAME || '',
    libraryId: process.env.PLEX_LIBRARY_ID || '',
  },
  webhook: {
    secret: process.env.WEBHOOK_SECRET || '',
  },
  server: {
    backendPort: parseInt(process.env.BACKEND_PORT || '3001', 10),
    frontendPort: parseInt(process.env.FRONTEND_PORT || '5173', 10),
  },
  features: {
    enableTouchGestures: process.env.ENABLE_TOUCH_GESTURES === 'true',
    enableAnimations: process.env.ENABLE_ANIMATIONS === 'true',
  },
  storage: {
    dataPath: join(process.cwd(), '..', 'data'),
  },
} as const;

export function validateConfig(): void {
  const required = [
    ['PLEX_TOKEN', Config.plex.token],
  ];

  const missing = required.filter(([name, value]) => !value);
  
  if (missing.length > 0) {
    const missingVars = missing.map(([name]) => name).join(', ');
    throw new Error(`Missing required environment variables: ${missingVars}`);
  }
}