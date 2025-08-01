import { createReadStream, existsSync } from 'fs';
import { mkdir, stat, readdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';
import { Config } from '../config';

interface CacheEntry {
  url: string;
  path: string;
  size: number;
  timestamp: number;
}

export class ImageCacheService {
  private cacheDir: string;
  private maxCacheSize: number = 100 * 1024 * 1024; // 100MB
  private maxAge: number = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    this.cacheDir = join(Config.storage.dataPath, 'image-cache');
    this.ensureCacheDir();
  }

  private async ensureCacheDir(): Promise<void> {
    if (!existsSync(this.cacheDir)) {
      await mkdir(this.cacheDir, { recursive: true });
    }
  }

  private getCacheKey(url: string): string {
    return crypto.createHash('md5').update(url).digest('hex');
  }

  private getCachePath(url: string): string {
    const key = this.getCacheKey(url);
    return join(this.cacheDir, `${key}.jpg`);
  }

  async getCachedImage(url: string): Promise<string | null> {
    const cachePath = this.getCachePath(url);
    
    try {
      if (existsSync(cachePath)) {
        const stats = await stat(cachePath);
        const age = Date.now() - stats.mtimeMs;
        
        if (age < this.maxAge) {
          return cachePath;
        } else {
          // Cache expired, delete it
          await unlink(cachePath);
        }
      }
    } catch (error) {
      console.error('Error checking cache:', error);
    }
    
    return null;
  }

  async cacheImage(url: string, imageData: Buffer): Promise<string> {
    const cachePath = this.getCachePath(url);
    
    try {
      await this.ensureCacheDir();
      await writeFile(cachePath, imageData);
      
      // Clean up old cache if needed
      await this.cleanupCache();
      
      return cachePath;
    } catch (error) {
      console.error('Error caching image:', error);
      throw error;
    }
  }

  async fetchAndCacheImage(url: string): Promise<Buffer | null> {
    try {
      console.log('DEBUG - Fetching image from URL:', url);
      
      // Check cache first
      const cachedPath = await this.getCachedImage(url);
      if (cachedPath) {
        console.log('DEBUG - Found cached image at:', cachedPath);
        return await this.readCachedImage(cachedPath);
      }

      console.log('DEBUG - No cache found, fetching from Plex server...');
      
      // Fetch from URL
      const response = await fetch(url, {
        // @ts-ignore - Node.js specific option for self-signed certs
        agent: new (await import('https')).Agent({ rejectUnauthorized: false }),
      });
      console.log('DEBUG - Fetch response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      console.log('DEBUG - Downloaded image buffer size:', buffer.length, 'bytes');
      
      // Cache for future use
      await this.cacheImage(url, buffer);
      console.log('DEBUG - Image cached successfully');
      
      return buffer;
    } catch (error) {
      console.error('Error fetching image:', error);
      return null;
    }
  }

  private async readCachedImage(path: string): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const stream = createReadStream(path);
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  }

  private async cleanupCache(): Promise<void> {
    try {
      const files = await readdir(this.cacheDir);
      const entries: CacheEntry[] = [];
      let totalSize = 0;

      // Get info about all cached files
      for (const file of files) {
        const filePath = join(this.cacheDir, file);
        const stats = await stat(filePath);
        
        entries.push({
          url: '',
          path: filePath,
          size: stats.size,
          timestamp: stats.mtimeMs,
        });
        
        totalSize += stats.size;
      }

      // If cache is too large, remove oldest files
      if (totalSize > this.maxCacheSize) {
        // Sort by timestamp (oldest first)
        entries.sort((a, b) => a.timestamp - b.timestamp);
        
        // Remove files until we're under the limit
        let currentSize = totalSize;
        for (const entry of entries) {
          if (currentSize <= this.maxCacheSize * 0.8) break; // Keep 80% to avoid frequent cleanups
          
          await unlink(entry.path);
          currentSize -= entry.size;
        }
      }
    } catch (error) {
      console.error('Error cleaning cache:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      const files = await readdir(this.cacheDir);
      for (const file of files) {
        await unlink(join(this.cacheDir, file));
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}