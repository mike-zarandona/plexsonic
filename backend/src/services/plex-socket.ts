import WebSocket from 'ws';
import { Agent } from 'undici';
import { config, getPlexBaseUrl } from '../config.js';
import { broadcast } from './websocket.js';
import { saveState, getState } from './storage.js';
import {
  PlexNotificationContainer,
  PlexPlaySessionNotification,
  PlexApiMetadataResponse,
  PlexApiTrackMetadata,
  CurrentState,
  AudioQuality,
} from '../types/plex.js';

// Reconnect settings
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;
const RETRY_MULTIPLIER = 1.5;

// HTTPS agent for self-signed certs
const plexAgent = new Agent({
  connect: { rejectUnauthorized: false },
});

// Track current state
let currentRatingKey: string | null = null;
let currentState: 'playing' | 'paused' | 'stopped' = 'stopped';
let ws: WebSocket | null = null;
let retryDelay = INITIAL_RETRY_DELAY;
let retryTimeout: NodeJS.Timeout | null = null;
let isShuttingDown = false;

/**
 * Extract audio quality information from track metadata
 */
function extractAudioQuality(track: PlexApiTrackMetadata): AudioQuality | undefined {
  const media = track.Media?.[0];
  if (!media) return undefined;

  // Get stream details for sample rate and bit depth
  const audioStream = media.Part?.[0]?.Stream?.find(s => s.streamType === 2);

  return {
    codec: media.audioCodec.toUpperCase(),
    bitrate: media.bitrate,
    sampleRate: audioStream?.samplingRate,
    bitDepth: audioStream?.bitDepth,
  };
}

/**
 * Get the Plex WebSocket URL
 */
function getPlexWebSocketUrl(): string {
  const protocol = config.plex.useHttps ? 'wss' : 'ws';
  return `${protocol}://${config.plex.serverUrl}:${config.plex.serverPort}/:/websockets/notifications?X-Plex-Token=${config.plex.token}`;
}

/**
 * Fetch track metadata from Plex API
 */
async function fetchTrackMetadata(ratingKey: string): Promise<PlexApiMetadataResponse | null> {
  const url = `${getPlexBaseUrl()}/library/metadata/${ratingKey}?X-Plex-Token=${config.plex.token}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dispatcher: plexAgent as any,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`[PlexSocket] Failed to fetch metadata: ${response.status}`);
      return null;
    }

    return (await response.json()) as PlexApiMetadataResponse;
  } catch (error) {
    console.error('[PlexSocket] Error fetching metadata:', error);
    return null;
  }
}

/**
 * Check if this is a music session by fetching session details
 */
async function fetchSessionInfo(sessionKey: string): Promise<{ isMusic: boolean; username: string | null }> {
  const url = `${getPlexBaseUrl()}/status/sessions?X-Plex-Token=${config.plex.token}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dispatcher: plexAgent as any,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { isMusic: false, username: null };
    }

    const data = await response.json() as { MediaContainer: { Metadata?: Array<{ sessionKey: string; type: string; User?: { title: string } }> } };
    const session = data.MediaContainer.Metadata?.find(m => m.sessionKey === sessionKey);

    if (!session) {
      return { isMusic: false, username: null };
    }

    return {
      isMusic: session.type === 'track',
      username: session.User?.title || null,
    };
  } catch (error) {
    console.error('[PlexSocket] Error fetching session info:', error);
    return { isMusic: false, username: null };
  }
}

/**
 * Handle a play session notification
 */
async function handlePlaySessionNotification(notification: PlexPlaySessionNotification): Promise<void> {
  const { ratingKey, state, sessionKey } = notification;

  // Check if this is a music session for our user
  const sessionInfo = await fetchSessionInfo(sessionKey);

  if (!sessionInfo.isMusic) {
    return;
  }

  if (sessionInfo.username && sessionInfo.username !== config.plex.username) {
    return;
  }

  // Handle state changes
  if (state === 'stopped') {
    currentState = 'stopped';
    // Keep displaying last track on stop (don't clear)
    return;
  }

  const newIsPaused = state === 'paused';
  const trackChanged = ratingKey !== currentRatingKey;
  const pauseStateChanged = (state === 'paused') !== (currentState === 'paused');

  // Update tracked state
  currentRatingKey = ratingKey;
  currentState = state === 'paused' ? 'paused' : 'playing';

  // If track changed, fetch new metadata and broadcast
  if (trackChanged) {
    const metadata = await fetchTrackMetadata(ratingKey);
    if (!metadata || !metadata.MediaContainer.Metadata?.[0]) {
      return;
    }

    const track = metadata.MediaContainer.Metadata[0];

    // Only process music tracks
    if (track.type !== 'track') {
      return;
    }

    const thumb = track.parentThumb || track.thumb || '';
    const audioQuality = extractAudioQuality(track);
    const isFavorited = track.userRating !== undefined && track.userRating >= 8;

    const newState: CurrentState = {
      event: 'media.play',
      metadata: {
        title: track.title,
        grandparentTitle: track.grandparentTitle || 'Unknown Artist',
        parentTitle: track.parentTitle || 'Unknown Album',
        parentYear: track.parentYear,
        thumb,
        audioQuality,
        isFavorited,
      },
      player: {
        title: 'Plex',
        uuid: notification.clientIdentifier,
      },
      timestamp: Date.now(),
      isPaused: newIsPaused,
    };

    await saveState(newState);
    broadcast(newState);
  } else if (pauseStateChanged) {
    // Just pause state changed, update existing state
    const existingState = getState();
    if (existingState) {
      const updatedState: CurrentState = {
        ...existingState,
        event: newIsPaused ? 'media.pause' : 'media.resume',
        isPaused: newIsPaused,
        timestamp: Date.now(),
      };
      await saveState(updatedState);
      broadcast(updatedState);
    }
  }
}

/**
 * Handle incoming WebSocket message
 */
function handleMessage(data: WebSocket.RawData): void {
  try {
    const message = JSON.parse(data.toString()) as PlexNotificationContainer;

    // Only process PlaySessionStateNotification
    const container = message.NotificationContainer;
    if (container.type !== 'playing' || !container.PlaySessionStateNotification) {
      return;
    }

    // Process each notification
    for (const notification of container.PlaySessionStateNotification) {
      handlePlaySessionNotification(notification);
    }
  } catch (error) {
    console.error('[PlexSocket] Error parsing message:', error);
  }
}

/**
 * Schedule a reconnection attempt
 */
function scheduleReconnect(): void {
  if (isShuttingDown) return;

  if (retryTimeout) {
    clearTimeout(retryTimeout);
  }

  retryTimeout = setTimeout(() => {
    if (!isShuttingDown) {
      connect();
    }
  }, retryDelay);

  // Exponential backoff
  retryDelay = Math.min(retryDelay * RETRY_MULTIPLIER, MAX_RETRY_DELAY);
}

/**
 * Connect to Plex WebSocket
 */
function connect(): void {
  if (isShuttingDown) return;

  // Clean up existing connection
  if (ws) {
    ws.terminate();
    ws = null;
  }

  const url = getPlexWebSocketUrl();

  try {
    ws = new WebSocket(url, {
      rejectUnauthorized: false, // Accept self-signed certs
    });

    ws.on('open', () => {
      console.log('[PlexSocket] Connected to Plex');
      retryDelay = INITIAL_RETRY_DELAY; // Reset retry delay on success
    });

    ws.on('message', handleMessage);

    ws.on('close', () => {
      ws = null;
      scheduleReconnect();
    });

    ws.on('error', (error) => {
      console.error('[PlexSocket] Error:', error.message);
    });
  } catch (error) {
    console.error('[PlexSocket] Failed to connect:', error);
    scheduleReconnect();
  }
}

/**
 * Initialize Plex WebSocket connection
 */
export function initPlexSocket(): void {
  connect();
}

/**
 * Gracefully shutdown the Plex WebSocket connection
 */
export function shutdownPlexSocket(): void {
  isShuttingDown = true;

  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }

  if (ws) {
    ws.close();
    ws = null;
  }
}
