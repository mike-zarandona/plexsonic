import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import { Config, validateConfig } from './config.js';
import { webhookRoutes } from './routes/webhook.js';
import { setupWebSocket } from './services/websocket.js';

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
    
    // Setup WebSocket
    await setupWebSocket(fastify);

    // Health check
    fastify.get('/health', async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

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