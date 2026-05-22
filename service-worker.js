const CACHE_NAME = 'web-bluetooth-vsc4-20260522-4';

function addToCache(request, networkResponse) {
  if (request.method !== 'GET' || !networkResponse || !networkResponse.ok) {
    return Promise.resolve();
  }

  return caches.open(CACHE_NAME)
    .then(cache => cache.put(request, networkResponse));
}

function getCacheResponse(request) {
  return caches.open(CACHE_NAME).then(cache => {
    return cache.match(request);
  });
}

function getNetworkOrCacheResponse(request) {
  const freshRequest = new Request(request, { cache: 'reload' });

  return fetch(freshRequest).then(networkResponse => {
    addToCache(request, networkResponse.clone());
    return networkResponse;
  }).catch(_ => {
    return getCacheResponse(request)
      .then(cacheResponse => cacheResponse || Response.error());
  });
}

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(getNetworkOrCacheResponse(event.request));
  }
});
