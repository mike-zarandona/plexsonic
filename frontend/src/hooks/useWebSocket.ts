import { useState, useEffect, useRef, useCallback } from 'react';
import { CurrentState, ConnectionStatus, WebSocketMessage } from '../types/plex';
import { logger } from '../utils/logger';

// In dev mode (Vite on 5173), connect directly to backend; in production use same host
const isDev = window.location.port === '5173';
const WS_URL = isDev
  ? 'ws://localhost:3001/ws'
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

// Reconnect settings
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 30000;
const RETRY_MULTIPLIER = 1.5;

interface UseWebSocketReturn {
  state: CurrentState | null;
  connectionStatus: ConnectionStatus;
  reconnect: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [state, setState] = useState<CurrentState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  const wsRef = useRef<WebSocket | null>(null);
  const retryDelayRef = useRef(INITIAL_RETRY_DELAY);
  const retryTimeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus('connecting');

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        logger.log('[WebSocket] Connected');
        setConnectionStatus('connected');
        retryDelayRef.current = INITIAL_RETRY_DELAY; // Reset retry delay on success
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          logger.log('[WebSocket] Received message:', message.type, JSON.stringify(message.data, null, 2));
          if (message.type === 'state') {
            logger.log('[WebSocket] Setting state, metadata:', message.data?.metadata);
            setState(message.data);
          }
        } catch (err) {
          logger.error('[WebSocket] Failed to parse message:', err);
        }
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        logger.log('[WebSocket] Disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        wsRef.current = null;
        scheduleReconnect();
      };

      ws.onerror = (error) => {
        if (!mountedRef.current) return;
        logger.error('[WebSocket] Error:', error);
        setConnectionStatus('error');
      };
    } catch (err) {
      logger.error('[WebSocket] Failed to connect:', err);
      setConnectionStatus('error');
      scheduleReconnect();
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;

    // Clear any existing retry timeout
    if (retryTimeoutRef.current !== null) {
      clearTimeout(retryTimeoutRef.current);
    }

    const delay = retryDelayRef.current;
    logger.log(`[WebSocket] Reconnecting in ${delay}ms...`);

    retryTimeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, delay);

    // Increase delay for next retry (exponential backoff)
    retryDelayRef.current = Math.min(
      retryDelayRef.current * RETRY_MULTIPLIER,
      MAX_RETRY_DELAY
    );
  }, [connect]);

  const reconnect = useCallback(() => {
    retryDelayRef.current = INITIAL_RETRY_DELAY;
    if (retryTimeoutRef.current !== null) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    connect();
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (retryTimeoutRef.current !== null) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { state, connectionStatus, reconnect };
}
