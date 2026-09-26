const CACHE_NAME = 'vexa-remote-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/styles/main.css',
  '/src/app.js',
  '/src/router.js',
  '/src/state.js',
  '/src/ui/remote.js',
  '/src/ui/devices.js',
  '/src/ui/settings.js',
  '/src/tv/TVAdapter.js',
  '/src/tv/SamsungAdapter.js',
  '/src/tv/LGAdapter.js',
  '/src/tv/AndroidTVAdapter.js',
  '/src/tv/GoogleTVAdapter.js',
  '/src/tv/GenericAdapter.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Не кэшируем WebSocket и API-запросы к gateway
  if (event.request.url.includes('/api/') || event.request.url.startsWith('ws')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
