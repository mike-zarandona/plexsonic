export interface PlexMetadata {
  librarySectionType: 'artist' | 'movie' | 'show';
  ratingKey: string;
  key: string;
  parentRatingKey: string;
  grandparentRatingKey: string;
  guid: string;
  librarySectionID: number;
  type: 'track' | 'movie' | 'episode';
  title: string;
  grandparentKey: string;
  parentKey: string;
  grandparentTitle: string;
  parentTitle: string;
  summary: string;
  index: number;
  parentIndex: number;
  ratingCount: number;
  thumb: string;
  art: string;
  parentThumb: string;
  grandparentThumb: string;
  grandparentArt: string;
  addedAt: number;
  updatedAt: number;
  parentYear?: number;
  year?: number;
}

export interface PlexPlayer {
  local: boolean;
  publicAddress: string;
  title: string;
  uuid: string;
}

export interface CurrentState {
  event: string;
  metadata: PlexMetadata;
  player: PlexPlayer;
  timestamp: number;
  isPaused: boolean;
}

export interface WebSocketMessage {
  type: 'state-update' | 'pong';
  data?: CurrentState | null;
}