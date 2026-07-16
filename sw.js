// Service Worker for منصتك PWA
const CACHE_NAME = 'mansatak-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@500;700;800;900&family=Tajawal:wght@400;500;700&family=IBM+Plex+Mono:wght@500;600&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).catch(err => console.log('Cache install error:', err))
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip Firebase requests
  if (event.request.url.includes('firebase') || event.request.url.includes('google')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Return cached version but also fetch updated version
        fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response);
            });
          }
        }).catch(() => {});
        return cached;
      }

      // Not in cache, fetch from network
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Network failed, try to return offline page
        return caches.match('/');
      });
    })
  );
});

// Background sync for Firebase data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-firebase') {
    event.waitUntil(syncFirebaseData());
  }
});

async function syncFirebaseData() {
  // This will be handled by the main app
  console.log('Background sync triggered');
}
