import { FastifyInstance, FastifyRequest } from 'fastify';
import { Agent } from 'undici';
import { config, getPlexBaseUrl } from '../config.js';

interface ImageQuerystring {
  thumb: string;
}

// Create HTTPS agent that accepts self-signed certificates (Plex uses these)
const plexAgent = new Agent({
  connect: { rejectUnauthorized: false },
});

export async function imageRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: ImageQuerystring }>(
    '/api/image',
    async (request, reply) => {
      const { thumb } = request.query;

      if (!thumb) {
        return reply.status(400).send({ error: 'Missing thumb parameter' });
      }

      try {
        // Construct the full Plex URL for the image
        const imageUrl = `${getPlexBaseUrl()}${thumb}?X-Plex-Token=${config.plex.token}`;

        fastify.log.debug({ thumb }, 'Fetching image from Plex');

        // Fetch the image from Plex (use undici dispatcher for self-signed cert)
        // @ts-expect-error - Node.js fetch supports dispatcher option via undici
        const response = await fetch(imageUrl, { dispatcher: plexAgent });

        if (!response.ok) {
          fastify.log.error(
            { status: response.status, thumb },
            'Failed to fetch image from Plex'
          );
          return reply.status(response.status).send({ error: 'Failed to fetch image' });
        }

        // Get content type from Plex response
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // Stream the image back to the client
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return reply
          .header('Content-Type', contentType)
          .header('Cache-Control', 'public, max-age=86400') // Cache for 24 hours
          .send(buffer);
      } catch (error) {
        fastify.log.error(error, 'Error fetching image from Plex');
        return reply.status(500).send({ error: 'Failed to fetch image' });
      }
    }
  );
}
