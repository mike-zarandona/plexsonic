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
        fastify.log.info({
          type: part.type,
          fieldname: part.fieldname,
          mimetype: part.mimetype
        }, 'Webhook part received');

        if (part.type === 'field' && part.fieldname === 'payload') {
          const rawValue = part.value;
          fastify.log.info({ valueType: typeof rawValue, isObject: typeof rawValue === 'object' }, 'Payload field type');
          try {
            // Value might already be parsed if mimetype is application/json
            if (typeof rawValue === 'object') {
              payload = rawValue as PlexWebhookPayload;
            } else {
              payload = JSON.parse(rawValue as string);
            }
          } catch (e) {
            const strValue = typeof rawValue === 'string' ? rawValue.substring(0, 500) : String(rawValue);
            fastify.log.error({ rawValue: strValue, error: e }, 'Failed to parse webhook payload JSON');
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
      if (payload.Account.title !== config.plex.username) {
        fastify.log.info(
          `Ignoring webhook from user: ${payload.Account.title} (expected: ${config.plex.username})`
        );
        return reply.status(200).send({ status: 'ignored', reason: 'different user' });
      }

      // Filter for music only (librarySectionType === 'artist')
      if (payload.Metadata?.librarySectionType !== 'artist') {
        fastify.log.info(
          `Ignoring non-music webhook: ${payload.Metadata?.librarySectionType}`
        );
        return reply.status(200).send({ status: 'ignored', reason: 'not music' });
      }

      // Only process relevant events
      const relevantEvents = ['media.play', 'media.pause', 'media.resume', 'media.stop'];
      if (!relevantEvents.includes(payload.event)) {
        fastify.log.info(`Ignoring event type: ${payload.event}`);
        return reply.status(200).send({ status: 'ignored', reason: 'irrelevant event' });
      }

      // Log the full payload structure to debug
      fastify.log.info({
        fullPayload: JSON.stringify(payload, null, 2).substring(0, 2000)
      }, 'Full webhook payload');

      fastify.log.info({
        event: payload.event,
        track: payload.Metadata?.title,
        artist: payload.Metadata?.grandparentTitle,
        album: payload.Metadata?.parentTitle,
        player: payload.Player?.title,
        librarySectionType: payload.Metadata?.librarySectionType,
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
