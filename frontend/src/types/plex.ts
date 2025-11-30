/**
 * Frontend types mirroring backend state structure
 */

export interface AudioQuality {
  codec: string; // FLAC, MP3, AAC, etc.
  bitrate?: number; // kbps
  sampleRate?: number; // Hz (44100, 48000, 96000, etc.)
  bitDepth?: number; // 16, 24, etc.
}

export interface CurrentState {
  event: string;
  metadata: {
    title: string;
    grandparentTitle: string; // Artist
    parentTitle: string; // Album
    parentYear?: number;
    thumb: string;
    audioQuality?: AudioQuality;
    isFavorited?: boolean;
  };
  player: {
    title: string;
    uuid: string;
  };
  timestamp: number;
  isPaused: boolean;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketMessage {
  type: 'state';
  data: CurrentState | null;
}
