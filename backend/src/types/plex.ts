export interface PlexWebhookPayload {
  event: 'media.play' | 'media.pause' | 'media.resume' | 'media.stop';
  user: boolean;
  owner: boolean;
  Account: {
    id: number;
    thumb: string;
    title: string;
  };
  Server: {
    title: string;
    uuid: string;
  };
  Player: {
    local: boolean;
    publicAddress: string;
    title: string;
    uuid: string;
  };
  Metadata: {
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
  };
}

export interface CurrentState {
  event: string;
  metadata: PlexWebhookPayload['Metadata'];
  player: PlexWebhookPayload['Player'];
  timestamp: number;
  isPaused: boolean;
}