import { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { WebSocket, RawData } from 'ws';
import { getState } from './storage.js';
import { CurrentState } from '../types/plex.js';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Store all connected clients
const clients = new Set<WebSocket>();

/**
 * Broadcast state to all connected clients
 */
export function broadcast(state: CurrentState | null): void {
  const message = JSON.stringify({
    type: 'state',
    data: state,
  });

  console.log('[WebSocket] Broadcasting to', clients.size, 'clients:', JSON.stringify(state, null, 2));

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

/**
 * Register WebSocket routes
 */
export async function websocketRoutes(fastify: FastifyInstance) {
  await fastify.register(websocket);

  fastify.get('/ws', { websocket: true }, (socket, req) => {
    fastify.log.info('WebSocket client connected');
    clients.add(socket);

    // Send current state immediately on connect
    const currentState = getState();
    console.log('[WebSocket] Sending initial state to new client:', JSON.stringify(currentState, null, 2));
    socket.send(JSON.stringify({
      type: 'state',
      data: currentState,
    }));

    // Heartbeat ping/pong
    const heartbeatInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping();
      }
    }, HEARTBEAT_INTERVAL);

    // Handle pong responses (client alive)
    socket.on('pong', () => {
      fastify.log.debug('Received pong from client');
    });

    // Handle messages from client
    socket.on('message', (message: RawData) => {
      try {
        const data = JSON.parse(message.toString());
        // Handle client messages if needed (e.g., request current state)
        if (data.type === 'getState') {
          socket.send(JSON.stringify({
            type: 'state',
            data: getState(),
          }));
        }
      } catch {
        // Ignore invalid JSON
      }
    });

    // Clean up on close
    socket.on('close', () => {
      fastify.log.info('WebSocket client disconnected');
      clearInterval(heartbeatInterval);
      clients.delete(socket);
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      fastify.log.error(error, 'WebSocket error');
      clearInterval(heartbeatInterval);
      clients.delete(socket);
    });
  });
}

/**
 * Get number of connected clients
 */
export function getClientCount(): number {
  return clients.size;
}
