const CACHE_NAME = 'sapra-v1';
const urlsToCache = [
  '/SAPRA2-main/',
  '/SAPRA2-main/main.html',
  '/SAPRA2-main/main.css',
  '/SAPRA2-main/main.js',
  '/SAPRA2-main/utils.js',
  '/SAPRA2-main/pages/Work_flow.html',
  '/SAPRA2-main/images/SAPRA_WHITE-100.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
