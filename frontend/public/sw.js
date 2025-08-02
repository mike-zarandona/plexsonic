// PlexSonic v2 Service Worker
// Provides offline asset caching for improved reliability

const CACHE_NAME = 'plexsonic-v2-1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/placeholder-album.svg',
  OFFLINE_URL
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Force activation of new service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached assets when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Skip API requests - they need to be fresh
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Skip WebSocket connections
  if (event.request.url.includes('ws://') || event.request.url.includes('wss://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Try to fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response (stream can only be consumed once)
            const responseToCache = response.clone();

            // Cache successful responses for static assets
            if (shouldCache(event.request.url)) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // Network failed, serve offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // For other requests, return a placeholder image
            if (event.request.destination === 'image') {
              return caches.match('/placeholder-album.svg');
            }
          });
      })
  );
});

// Helper function to determine if a URL should be cached
function shouldCache(url) {
  // Cache static assets (JS, CSS, images, fonts)
  const staticAssetExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2'];
  
  return staticAssetExtensions.some(ext => url.includes(ext)) ||
         url.endsWith('/') ||
         url.includes('index.html');
}

// Handle background sync for failed requests (future feature)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    // Could retry failed API requests here
  }
});

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('[SW] Push notification received:', data);
    
    // Could show notifications for now playing changes
  }
});