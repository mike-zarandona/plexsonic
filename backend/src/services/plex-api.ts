import { Config } from '../config';
import { PlexWebhookPayload, CurrentState } from '../types/plex';

interface PlexSession {
  id: string;
  sessionKey: string;
  username: string;
  userThumb: string;
  duration: number;
  viewOffset: number;
  progress: number;
  state: 'playing' | 'paused' | 'buffering';
  media: {
    title: string;
    grandparentTitle?: string;
    parentTitle?: string;
    thumb?: string;
    art?: string;
    type: string;
    index?: number;
    parentIndex?: number;
    year?: number;
    ratingKey: string;
  };
  player: {
    title: string;
    address: string;
    machineIdentifier: string;
    platform: string;
  };
  transcodeSession?: {
    videoDecision: string;
    audioDecision: string;
    throttled: boolean;
    progress: number;
  };
}

interface PlexApiResponse<T> {
  size: number;
  data: T;
}

export class PlexApiService {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    const { serverUrl, serverPort, token } = Config.plex;
    this.baseUrl = `http://${serverUrl}:${serverPort}`;
    this.headers = {
      'X-Plex-Token': token,
      'Accept': 'application/json',
    };
  }

  private async makeRequest<T>(endpoint: string, retries = 3): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          headers: this.headers,
          signal: controller.signal,
          // @ts-ignore - Node.js specific option for self-signed certs
          agent: new (await import('https')).Agent({ rejectUnauthorized: false }),
        });

        clearTimeout(timeout);

        if (!response.ok) {
          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`Plex API client error: ${response.status} ${response.statusText}`);
          }
          // Retry on server errors (5xx)
          throw new Error(`Plex API error: ${response.status} ${response.statusText}`);
        }

        return await response.json() as T;
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on client errors or abort errors
        if (error.message?.includes('client error') || error.name === 'AbortError') {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          console.log(`Retrying Plex API request ${endpoint} (attempt ${attempt + 2}/${retries})`);
        }
      }
    }

    console.error(`Failed to call Plex API ${endpoint} after ${retries} attempts:`, lastError);
    throw lastError || new Error('Unknown error');
  }

  async getCurrentSessions(): Promise<PlexSession[]> {
    try {
      const response = await this.makeRequest<any>('/status/sessions');
      
      if (!response.MediaContainer || !response.MediaContainer.Metadata) {
        return [];
      }

      return response.MediaContainer.Metadata.map((session: any) => this.normalizeSession(session));
    } catch (error) {
      console.error('Failed to get current sessions:', error);
      return [];
    }
  }

  async getCurrentUserSession(): Promise<PlexSession | null> {
    const sessions = await this.getCurrentSessions();
    
    // Filter for the configured user if username is set
    if (Config.plex.username) {
      const userSession = sessions.find(s => s.username === Config.plex.username);
      return userSession || null;
    }

    // Otherwise return the first session
    return sessions[0] || null;
  }

  async getMediaMetadata(ratingKey: string): Promise<any> {
    try {
      const response = await this.makeRequest<any>(`/library/metadata/${ratingKey}`);
      return response.MediaContainer?.Metadata?.[0] || null;
    } catch (error) {
      console.error(`Failed to get metadata for ${ratingKey}:`, error);
      return null;
    }
  }

  private normalizeSession(session: any): PlexSession {
    console.log('DEBUG - Raw session data from Plex:', JSON.stringify({
      title: session.title,
      type: session.type,
      thumb: session.thumb,
      art: session.art,
      parentThumb: session.parentThumb,
      grandparentThumb: session.grandparentThumb,
      grandparentArt: session.grandparentArt,
      // Include some other fields for context
      grandparentTitle: session.grandparentTitle,
      parentTitle: session.parentTitle
    }, null, 2));
    
    return {
      id: session.guid || session.key,
      sessionKey: session.sessionKey,
      username: session.User?.title || 'Unknown',
      userThumb: session.User?.thumb || '',
      duration: parseInt(session.duration) || 0,
      viewOffset: parseInt(session.viewOffset) || 0,
      progress: session.viewOffset && session.duration 
        ? Math.round((session.viewOffset / session.duration) * 100)
        : 0,
      state: session.Player?.state || 'playing',
      media: {
        title: session.title,
        grandparentTitle: session.grandparentTitle,
        parentTitle: session.parentTitle,
        thumb: session.thumb,
        art: session.art,
        type: session.type,
        index: session.index,
        parentIndex: session.parentIndex,
        year: session.year || session.parentYear,
        ratingKey: session.ratingKey,
      },
      player: {
        title: session.Player?.title || 'Unknown Player',
        address: session.Player?.address || '',
        machineIdentifier: session.Player?.machineIdentifier || '',
        platform: session.Player?.platform || '',
      },
      transcodeSession: session.TranscodeSession ? {
        videoDecision: session.TranscodeSession.videoDecision,
        audioDecision: session.TranscodeSession.audioDecision,
        throttled: session.TranscodeSession.throttled === '1',
        progress: parseFloat(session.TranscodeSession.progress) || 0,
      } : undefined,
    };
  }

  sessionToCurrentState(session: PlexSession): CurrentState {
    return {
      event: session.state === 'paused' ? 'media.pause' : 'media.play',
      metadata: {
        librarySectionType: session.media.type === 'track' ? 'artist' : 
                           session.media.type === 'episode' ? 'show' : 'movie',
        ratingKey: session.media.ratingKey,
        key: `/library/metadata/${session.media.ratingKey}`,
        parentRatingKey: '',
        grandparentRatingKey: '',
        guid: '',
        librarySectionID: 0,
        type: session.media.type as any,
        title: session.media.title,
        grandparentKey: '',
        parentKey: '',
        grandparentTitle: session.media.grandparentTitle || '',
        parentTitle: session.media.parentTitle || '',
        summary: '',
        index: session.media.index || 0,
        parentIndex: session.media.parentIndex || 0,
        ratingCount: 0,
        thumb: session.media.thumb || '',
        art: session.media.art || '',
        parentThumb: '',
        grandparentThumb: '',
        grandparentArt: '',
        addedAt: 0,
        updatedAt: 0,
        parentYear: session.media.year,
      },
      player: {
        local: false,
        publicAddress: session.player.address,
        title: session.player.title,
        uuid: session.player.machineIdentifier,
      },
      timestamp: Date.now(),
      isPaused: session.state === 'paused',
    };
  }

  buildAlbumArtUrl(thumb: string, width: number = 1200, height: number = 1200): string {
    if (!thumb) return '';
    
    const { serverUrl, serverPort, token } = Config.plex;
    const params = new URLSearchParams({
      width: width.toString(),
      height: height.toString(),
      minSize: '1',
      upscale: '1',
      url: thumb,
      'X-Plex-Token': token,
    });

    return `http://${serverUrl}:${serverPort}/photo/:/transcode?${params}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest<any>('/');
      return response.MediaContainer?.machineIdentifier !== undefined;
    } catch (error) {
      console.error('Plex connection test failed:', error);
      return false;
    }
  }
}