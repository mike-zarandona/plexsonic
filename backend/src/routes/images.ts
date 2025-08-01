import { FastifyPluginAsync } from 'fastify';
import { PlexApiService } from '../services/plex-api.js';
import { ImageCacheService } from '../services/image-cache.js';

export const imageRoutes: FastifyPluginAsync = async (fastify) => {
  const plexApi = new PlexApiService();
  const imageCache = new ImageCacheService();

  fastify.get<{
    Querystring: {
      thumb: string;
      width?: string;
      height?: string;
    }
  }>('/api/image', async (request, reply) => {
    try {
      const { thumb, width = '1200', height = '1200' } = request.query;

      console.log('DEBUG - Image request received:', { thumb, width, height });

      if (!thumb) {
        return reply.code(400).send({ error: 'Missing thumb parameter' });
      }

      // Build the Plex image URL
      const imageUrl = plexApi.buildAlbumArtUrl(
        thumb,
        parseInt(width, 10),
        parseInt(height, 10)
      );
      
      console.log('DEBUG - Built Plex image URL:', imageUrl);

      // Try to get from cache first
      const cachedImage = await imageCache.fetchAndCacheImage(imageUrl);

      console.log('DEBUG - Cached image result:', cachedImage ? `Buffer of ${cachedImage.length} bytes` : 'null');

      if (cachedImage) {
        reply.type('image/jpeg');
        return reply.send(cachedImage);
      } else {
        console.log('DEBUG - No image found, returning 404');
        return reply.code(404).send({ error: 'Image not found' });
      }
    } catch (error) {
      fastify.log.error('Error fetching image:', error);
      return reply.code(500).send({ error: 'Failed to fetch image' });
    }
  });

  // Debug endpoint to test image URLs manually
  fastify.get<{
    Querystring: {
      testUrl: string;
    }
  }>('/api/debug/image', async (request, reply) => {
    try {
      const { testUrl } = request.query;
      
      if (!testUrl) {
        return reply.code(400).send({ error: 'Missing testUrl parameter' });
      }

      console.log('DEBUG - Testing direct image URL:', testUrl);
      
      // Try to fetch the image directly
      const response = await fetch(testUrl);
      console.log('DEBUG - Direct fetch response:', response.status, response.statusText);
      
      if (!response.ok) {
        return reply.code(404).send({ 
          error: 'Image not found', 
          status: response.status,
          statusText: response.statusText 
        });
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      console.log('DEBUG - Direct fetch buffer size:', buffer.length, 'bytes');
      
      reply.type('image/jpeg');
      return reply.send(buffer);
    } catch (error) {
      console.error('DEBUG - Direct fetch error:', error);
      return reply.code(500).send({ error: 'Failed to fetch image', details: error.message });
    }
  });
};