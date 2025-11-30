import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { config } from '../config.js';
import { CurrentState } from '../types/plex.js';

let currentState: CurrentState | null = null;

/**
 * Initialize storage - ensure data directory exists and load state
 */
export async function initStorage(): Promise<void> {
  const dir = dirname(config.data.stateFile);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  // Try to load existing state
  try {
    const data = await readFile(config.data.stateFile, 'utf-8');
    currentState = JSON.parse(data);
  } catch {
    // File doesn't exist or is invalid, that's fine
    currentState = null;
  }
}

/**
 * Get current playback state
 */
export function getState(): CurrentState | null {
  return currentState;
}

/**
 * Save current playback state
 */
export async function saveState(state: CurrentState): Promise<void> {
  currentState = state;
  await writeFile(config.data.stateFile, JSON.stringify(state, null, 2), 'utf-8');
}
