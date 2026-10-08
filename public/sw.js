// SIES QMS ERP Service Worker - Automatic Cache Invalidation & Direct Network Pass-Through
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Always fetch directly from network to guarantee latest code
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
