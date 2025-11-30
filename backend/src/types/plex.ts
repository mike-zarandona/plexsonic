/**
 * Plex webhook payload types
 * Reference: https://support.plex.tv/articles/115002267687-webhooks/
 */

export interface PlexAccount {
  id: number;
  thumb: string;
  title: string;
}

export interface PlexServer {
  title: string;
  uuid: string;
}

export interface PlexPlayer {
  local: boolean;
  publicAddress: string;
  title: string;
  uuid: string;
}

export interface PlexMetadata {
  librarySectionType: string;
  ratingKey: string;
  key: string;
  parentRatingKey?: string;
  grandparentRatingKey?: string;
  guid: string;
  librarySectionID: number;
  type: string;
  title: string;
  grandparentKey?: string;
  parentKey?: string;
  grandparentTitle?: string; // Artist
  parentTitle?: string; // Album
  parentYear?: number;
  summary?: string;
  index?: number;
  parentIndex?: number;
  thumb?: string; // Track thumb
  parentThumb?: string; // Album thumb
  grandparentThumb?: string; // Artist thumb
  art?: string;
  grandparentArt?: string;
  addedAt: number;
  updatedAt: number;
}

export interface PlexWebhookPayload {
  event: PlexWebhookEvent;
  user: boolean;
  owner: boolean;
  Account: PlexAccount;
  Server: PlexServer;
  Player: PlexPlayer;
  Metadata: PlexMetadata;
}

export type PlexWebhookEvent =
  | 'media.play'
  | 'media.pause'
  | 'media.resume'
  | 'media.stop'
  | 'media.scrobble'
  | 'media.rate'
  | 'library.on.deck'
  | 'library.new'
  | 'admin.database.backup'
  | 'admin.database.corrupted'
  | 'device.new'
  | 'playback.started';

/**
 * Plex WebSocket notification types
 * These come from ws://PLEX:32400/:/websockets/notifications
 */
export interface PlexNotificationContainer {
  NotificationContainer: {
    type: string;
    size: number;
    PlaySessionStateNotification?: PlexPlaySessionNotification[];
    ActivityNotification?: unknown[];
    StatusNotification?: unknown[];
  };
}

export interface PlexPlaySessionNotification {
  sessionKey: string;
  clientIdentifier: string;
  guid: string;
  ratingKey: string;
  url: string;
  key: string;
  viewOffset: number;
  playQueueItemID?: number;
  state: 'playing' | 'paused' | 'stopped' | 'buffering';
}

/**
 * Plex API metadata response (JSON format)
 * From /library/metadata/{ratingKey}
 */
export interface PlexApiMetadataResponse {
  MediaContainer: {
    size: number;
    Metadata: PlexApiTrackMetadata[];
  };
}

export interface PlexApiTrackMetadata {
  ratingKey: string;
  key: string;
  parentRatingKey: string;
  grandparentRatingKey: string;
  guid: string;
  type: string;
  title: string;
  grandparentKey: string;
  parentKey: string;
  grandparentTitle: string; // Artist
  parentTitle: string; // Album
  parentYear?: number;
  index: number;
  parentIndex: number;
  thumb?: string;
  parentThumb?: string;
  grandparentThumb?: string;
  duration: number;
}

/**
 * Application state structure
 */
export interface CurrentState {
  event: string;
  metadata: {
    title: string;
    grandparentTitle: string; // Artist
    parentTitle: string; // Album
    parentYear?: number;
    thumb: string;
  };
  player: {
    title: string;
    uuid: string;
  };
  timestamp: number;
  isPaused: boolean;
}
