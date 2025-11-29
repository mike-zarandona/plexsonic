import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { webhookRoutes } from './routes/webhook.js';
import { imageRoutes } from './routes/images.js';
import { initStorage, getState } from './services/storage.js';
import { websocketRoutes, getClientCount } from './services/websocket.js';

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

// Register CORS
await fastify.register(cors, {
  origin: true,
});

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: Date.now() };
});

// Debug endpoint - view current state
fastify.get('/api/debug/state', async () => {
  return {
    state: getState(),
    clients: getClientCount(),
    timestamp: Date.now(),
  };
});

// Register routes
await fastify.register(websocketRoutes);
await fastify.register(webhookRoutes);
await fastify.register(imageRoutes);

// Start server
const start = async () => {
  try {
    // Initialize storage
    await initStorage();
    fastify.log.info('Storage initialized');

    await fastify.listen({ port: config.backend.port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${config.backend.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export { fastify };
