import { promises as fs } from 'fs';
import { join } from 'path';
import type { CurrentState } from '../types/plex.js';
import { Config } from '../config.js';

export class StorageService {
  private readonly filePath: string;

  constructor() {
    this.filePath = join(Config.storage.dataPath, 'current-state.json');
  }

  async saveState(state: CurrentState): Promise<void> {
    try {
      await fs.mkdir(Config.storage.dataPath, { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify(state, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save state:', error);
      throw error;
    }
  }

  async getState(): Promise<CurrentState | null> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data) as CurrentState;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      console.error('Failed to read state:', error);
      throw error;
    }
  }

  async clearState(): Promise<void> {
    try {
      await fs.unlink(this.filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Failed to clear state:', error);
        throw error;
      }
    }
  }
}