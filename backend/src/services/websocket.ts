import { FastifyInstance, FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import { StorageService } from './storage.js';

interface WebSocketMessage {
  type: 'ping' | 'state-request';
  data?: any;
}

export async function setupWebSocket(fastify: FastifyInstance): Promise<void> {
  const storage = new StorageService();

  fastify.get('/ws', { websocket: true }, async (socket: WebSocket, req: FastifyRequest) => {
    fastify.log.info('WebSocket client connected');

    // Send current state on connection
    try {
      const currentState = await storage.getState();
      if (currentState) {
        socket.send(JSON.stringify({
          type: 'state-update',
          data: currentState,
        }));
      }
    } catch (error) {
      fastify.log.error('Failed to send initial state:', error);
    }

    // Set up heartbeat
    let isAlive = true;
    const heartbeatInterval = setInterval(() => {
      if (!isAlive) {
        socket.terminate();
        return;
      }
      isAlive = false;
      socket.ping();
    }, 30000); // 30 seconds

    socket.on('pong', () => {
      isAlive = true;
    });

    // Handle incoming messages
    socket.on('message', async (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'ping':
            socket.send(JSON.stringify({ type: 'pong' }));
            break;
            
          case 'state-request':
            const state = await storage.getState();
            socket.send(JSON.stringify({
              type: 'state-update',
              data: state,
            }));
            break;
            
          default:
            fastify.log.warn('Unknown message type:', message.type);
        }
      } catch (error) {
        fastify.log.error('Failed to handle WebSocket message:', error);
      }
    });

    // Clean up on disconnect
    socket.on('close', () => {
      clearInterval(heartbeatInterval);
      fastify.log.info('WebSocket client disconnected');
    });

    socket.on('error', (error) => {
      fastify.log.error('WebSocket error:', error);
    });
  });
}