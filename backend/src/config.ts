import { config as dotenvConfig } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from project root
dotenvConfig({ path: resolve(__dirname, '../../.env') });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export const config = {
  plex: {
    serverUrl: requireEnv('PLEX_SERVER_URL'),
    serverPort: optionalEnv('PLEX_SERVER_PORT', '32400'),
    token: requireEnv('PLEX_TOKEN'),
    username: requireEnv('PLEX_USERNAME'),
  },
  backend: {
    port: parseInt(optionalEnv('BACKEND_PORT', '3001'), 10),
  },
  data: {
    dir: resolve(__dirname, '../../data'),
    stateFile: resolve(__dirname, '../../data/current-state.json'),
  },
} as const;

export function getPlexBaseUrl(): string {
  return `http://${config.plex.serverUrl}:${config.plex.serverPort}`;
}
