// Service worker minimal : rend l'app installable et utilisable hors ligne (coquille uniquement).
// L'envoi d'une attestation nécessite toujours le réseau.
const CACHE_NAME = 'presence-esisar-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add('/')).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  const cacheResponse = (response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request.mode === 'navigate' ? '/' : request, copy));
    }
    return response;
  };

  if (request.mode === 'navigate') {
    // Réseau d'abord pour toujours récupérer la dernière version, cache en secours hors ligne.
    event.respondWith(fetch(request).then(cacheResponse).catch(() => caches.match('/')));
  } else {
    // Assets hachés par Vite : le cache est sûr et plus rapide.
    event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request).then(cacheResponse)));
  }
});
