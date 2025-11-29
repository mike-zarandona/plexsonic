import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { webhookRoutes } from './routes/webhook.js';
import { imageRoutes } from './routes/images.js';
import { initStorage, getState } from './services/storage.js';
import { websocketRoutes, getClientCount } from './services/websocket.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const frontendDistPath = resolve(__dirname, '../../frontend/dist');

// Validate environment early with helpful error message
let config: typeof import('./config.js').config;
try {
  const configModule = await import('./config.js');
  config = configModule.config;
} catch (err) {
  console.error('\n❌ Configuration Error:\n');
  console.error((err as Error).message);
  console.error('\n📝 Make sure you have a .env file with the required variables.');
  console.error('   Copy .env.example to .env and fill in your values.\n');
  process.exit(1);
}

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

// In production, serve frontend static files
if (isProduction && existsSync(frontendDistPath)) {
  await fastify.register(fastifyStatic, {
    root: frontendDistPath,
    prefix: '/',
  });

  // SPA fallback: serve index.html for non-API routes
  fastify.setNotFoundHandler((request, reply) => {
    // Don't handle API or WebSocket routes
    if (request.url.startsWith('/api') || request.url.startsWith('/ws')) {
      reply.code(404).send({ error: 'Not Found' });
      return;
    }
    reply.sendFile('index.html');
  });

  fastify.log.info(`Serving frontend from ${frontendDistPath}`);
} else if (isProduction) {
  fastify.log.warn(`Frontend build not found at ${frontendDistPath}`);
  fastify.log.warn('Run "npm run build" to build the frontend');
}

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
