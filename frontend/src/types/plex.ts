/**
 * Frontend types mirroring backend state structure
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

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketMessage {
  type: 'state';
  data: CurrentState | null;
}
