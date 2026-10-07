// SIES QMS ERP Service Worker for PWA Installation & Caching
const CACHE_NAME = 'sies-qms-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through fetch for localhost / API calls
});
