import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import { Config, validateConfig } from './config.js';
import { webhookRoutes } from './routes/webhook.js';
import { imageRoutes } from './routes/images.js';
import { setupWebSocket } from './services/websocket.js';
import { PlexApiService } from './services/plex-api.js';
import { StorageService } from './services/storage.js';

async function start() {
  try {
    // Validate configuration
    validateConfig();

    const fastify = Fastify({
      logger: {
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      },
    });

    // Register plugins
    await fastify.register(cors, {
      origin: [
        `http://localhost:${Config.server.frontendPort}`,
        'http://localhost:5173', // Vite default
        'http://localhost:3000', // Alternative frontend port
      ],
      credentials: true,
    });

    await fastify.register(websocket);
    await fastify.register(multipart);

    // Register routes
    await fastify.register(webhookRoutes, { prefix: '/api' });
    await fastify.register(imageRoutes);
    
    // Debug route to check current sessions
    fastify.get('/api/debug/sessions', async (request, reply) => {
      try {
        const plexApi = new PlexApiService();
        const sessions = await plexApi.getCurrentSessions();
        console.log('DEBUG - Current sessions:', JSON.stringify(sessions, null, 2));
        return { sessions };
      } catch (error) {
        console.error('DEBUG - Error getting sessions:', error);
        return reply.code(500).send({ error: 'Failed to get sessions', details: error.message });
      }
    });

    // Debug route to check stored state
    fastify.get('/api/debug/state', async (request, reply) => {
      try {
        const storage = new StorageService();
        const currentState = await storage.getState();
        console.log('DEBUG - Stored state:', JSON.stringify(currentState, null, 2));
        return { currentState };
      } catch (error) {
        console.error('DEBUG - Error getting stored state:', error);
        return reply.code(500).send({ error: 'Failed to get stored state', details: error.message });
      }
    });
    
    // Setup WebSocket
    await setupWebSocket(fastify);

    // Health check
    fastify.get('/health', async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Initialize services
    const plexApi = new PlexApiService();
    const storage = new StorageService();

    // Test Plex connection and fetch current state on startup
    try {
      const isConnected = await plexApi.testConnection();
      if (isConnected) {
        fastify.log.info('Successfully connected to Plex server');
        
        // Fetch current playing session
        const currentSession = await plexApi.getCurrentUserSession();
        if (currentSession) {
          const currentState = plexApi.sessionToCurrentState(currentSession);
          await storage.saveState(currentState);
          fastify.log.info('Fetched and saved current Plex session');
        } else {
          fastify.log.info('No active Plex sessions found');
        }
      } else {
        fastify.log.warn('Failed to connect to Plex server');
      }
    } catch (error) {
      fastify.log.error('Error during Plex initialization:', error);
    }

    // Start server
    await fastify.listen({
      port: Config.server.backendPort,
      host: '0.0.0.0',
    });

    fastify.log.info(`Server running on port ${Config.server.backendPort}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();