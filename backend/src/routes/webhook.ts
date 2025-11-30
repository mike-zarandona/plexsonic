import { FastifyInstance, FastifyRequest } from 'fastify';
import multipart from '@fastify/multipart';
import { PlexWebhookPayload, CurrentState } from '../types/plex.js';
import { config } from '../config.js';
import { saveState } from '../services/storage.js';
import { broadcast } from '../services/websocket.js';

export async function webhookRoutes(fastify: FastifyInstance) {
  // Register multipart support for this route
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max for thumbnails
    },
  });

  fastify.post('/api/webhook', async (request: FastifyRequest, reply) => {
    try {
      const parts = request.parts();
      let payload: PlexWebhookPayload | null = null;

      for await (const part of parts) {
        if (part.type === 'field' && part.fieldname === 'payload') {
          try {
            // Value might already be parsed if mimetype is application/json
            if (typeof part.value === 'object') {
              payload = part.value as PlexWebhookPayload;
            } else {
              payload = JSON.parse(part.value as string);
            }
          } catch {
            fastify.log.error('Failed to parse webhook payload JSON');
            return reply.status(400).send({ error: 'Invalid JSON payload' });
          }
        }
        // We ignore the thumb file part - we'll fetch it via image proxy
      }

      if (!payload) {
        fastify.log.warn('No payload found in webhook request');
        return reply.status(400).send({ error: 'No payload found' });
      }

      // Filter by username
      if (payload.Account?.title !== config.plex.username) {
        return reply.status(200).send({ status: 'ignored', reason: 'different user' });
      }

      // Filter for music only (librarySectionType === 'artist')
      if (payload.Metadata?.librarySectionType !== 'artist') {
        return reply.status(200).send({ status: 'ignored', reason: 'not music' });
      }

      // Ensure required fields exist
      if (!payload.Metadata || !payload.Player) {
        fastify.log.warn('Webhook missing Metadata or Player');
        return reply.status(400).send({ error: 'Invalid payload structure' });
      }

      // Only process relevant events
      const relevantEvents = ['media.play', 'media.pause', 'media.resume', 'media.stop'];
      if (!relevantEvents.includes(payload.event)) {
        return reply.status(200).send({ status: 'ignored', reason: 'irrelevant event' });
      }

      fastify.log.info({
        event: payload.event,
        track: payload.Metadata?.title,
        artist: payload.Metadata?.grandparentTitle,
        player: payload.Player?.title,
      }, 'Processing webhook');

      // Get the best available thumb (prefer album/parent thumb)
      const thumb = payload.Metadata.parentThumb || payload.Metadata.thumb || '';

      // Build state from current webhook metadata
      const state: CurrentState = {
        event: payload.event,
        metadata: {
          title: payload.Metadata.title,
          grandparentTitle: payload.Metadata.grandparentTitle || 'Unknown Artist',
          parentTitle: payload.Metadata.parentTitle || 'Unknown Album',
          parentYear: payload.Metadata.parentYear,
          thumb,
        },
        player: {
          title: payload.Player.title,
          uuid: payload.Player.uuid,
        },
        timestamp: Date.now(),
        isPaused: payload.event === 'media.pause',
      };

      // Handle different events
      if (payload.event === 'media.play' || payload.event === 'media.resume' || payload.event === 'media.pause') {
        await saveState(state);
        broadcast(state);
      }
      // media.stop: we keep the last state displayed

      return reply.status(200).send({ status: 'ok' });
    } catch (err) {
      fastify.log.error(err, 'Error processing webhook');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
