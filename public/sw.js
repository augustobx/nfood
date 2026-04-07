self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Bypasses the service worker for everything (dummy for PWA installability)
  event.respondWith(fetch(event.request));
});
