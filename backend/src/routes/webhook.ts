import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { createHmac } from 'crypto';
import type { PlexWebhookPayload, CurrentState } from '../types/plex.js';
import { Config } from '../config.js';
import { StorageService } from '../services/storage.js';

interface WebhookBody {
  payload: string;
}

export const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  const storage = new StorageService();

  fastify.post<{ Body: WebhookBody }>('/webhook', async (request, reply) => {
    try {
      let payload: string | any;
      
      // Log incoming webhook details
      fastify.log.info('Webhook received', {
        headers: request.headers,
        isMultipart: request.isMultipart(),
        contentType: request.headers['content-type']
      });
      
      // Handle multipart form data from Plex
      if (request.isMultipart()) {
        const parts = request.parts();
        let foundPayload = false;
        
        for await (const part of parts) {
          if (part.type === 'field' && part.fieldname === 'payload') {
            payload = part.value;
            foundPayload = true;
            fastify.log.info('Found payload field', { 
              payloadType: typeof payload,
              payloadLength: typeof payload === 'string' ? payload.length : undefined 
            });
            break;
          }
        }
        
        if (!foundPayload) {
          return reply.code(400).send({ error: 'Missing payload in multipart data' });
        }
      } else {
        // Handle regular JSON body
        fastify.log.info('Request body', { body: request.body });
        payload = request.body.payload;
      }
      
      if (!payload) {
        return reply.code(400).send({ error: 'Missing payload' });
      }

      // Note: Plex webhooks don't include signatures, so we skip signature verification
      // Security relies on: 
      // 1. Only accepting events from configured username
      // 2. HTTPS in production
      // 3. Firewall rules to restrict access

      // Parse the JSON payload (handle both string and object)
      let webhookData: PlexWebhookPayload;
      if (typeof payload === 'string') {
        webhookData = JSON.parse(payload);
      } else {
        // Multipart parser may have already parsed it
        webhookData = payload as any;
      }
      
      // Only process events from the configured user
      if (webhookData.Account.title !== Config.plex.username) {
        return reply.code(200).send({ status: 'ignored', reason: 'different user' });
      }

      // Create current state from webhook data
      const currentState: CurrentState = {
        event: webhookData.event,
        metadata: webhookData.Metadata,
        player: webhookData.Player,
        timestamp: Date.now(),
        isPaused: webhookData.event === 'media.pause',
      };

      // Save state to storage
      await storage.saveState(currentState);

      // Broadcast to WebSocket clients
      if (fastify.websocketServer) {
        const message = JSON.stringify({
          type: 'state-update',
          data: currentState,
        });

        fastify.websocketServer.clients.forEach((client) => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
          }
        });
      }

      // Clear state on media stop
      if (webhookData.event === 'media.stop') {
        await storage.clearState();
      }

      return reply.code(200).send({ status: 'processed' });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
};

function verifyWebhookSignature(payload: string, signature: string): boolean {
  const hmac = createHmac('sha256', Config.webhook.secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  return signature === expectedSignature;
}