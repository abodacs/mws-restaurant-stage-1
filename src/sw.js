const cacheVersion = 'mws-restaurant-stage1-v16';

const cacheResources = async () => {
  const urlsToCache = [
    '/',
    './index.html',
    './restaurant.html',
    'img/logo.svg',
    'img/loading_image.svg',
    'img/image_not_available.png',
    'css/bundle.min.css',
    '/js/index.js',
    '/js/restaurant_info.js',
    'manifest.json'
  ];
  const cache = await caches.open(cacheVersion);
  return cache.addAll(urlsToCache);
};
self.addEventListener('install', (event) => {
  event.waitUntil(cacheResources());
});
self.addEventListener('activate', (event) => {
  self.clients.claim();
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== cacheVersion).map(key => caches.delete(key))))
      .then((r) => {
        return r;
      })
      .catch(console.error),
  );
});

self.addEventListener('fetch', (event) => {
  // Let the browser do its default thing
  // for non-GET requests.
  //console.log('fetch', event.request.url);
  if (event.request.method != 'GET') return;
  const url = new URL(event.request.url);
  let req = event.request;

  if (url.origin != location.origin) {
    return;
  }
  if (url.origin === location.origin && url.pathname === '/') {
    req = new Request('/index.html');
  }
  // Prevent the default, and handle the request ourselves.
  event.respondWith(
    cacheThenNetwork(cacheVersion, req)
  );
});

// Checks the cache first or returns the network
// response if not found
const cacheThenNetwork = (cacheName, request) => {
  // Open the cache
  return caches.open(cacheName)
    .then(cache => {
      // Look for the requested resource in the cache
      return cache.match(request.url, { ignoreSearch: true })
        .then(cachedResponse => {
          // Return the cached response if found
          // otherwise fetch from the network
          return cachedResponse || fetch(request)
            .then(networkResponse => {
              cache.put(request, networkResponse.clone());
              // Add the network response to the cache and return it
              return networkResponse;
            })
            .catch(() => {
              // Offline fallback
              return new Response('<svg role="img" aria-labelledby="offline-title" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><title id="offline-title">Offline</title><g fill="none" fill-rule="evenodd"><path fill="#D8D8D8" d="M0 0h400v300H0z"/><text fill="#9B9B9B" font-family="Helvetica Neue,Arial,Helvetica,sans-serif" font-size="72" font-weight="bold"><tspan x="93" y="172">offline</tspan></text></g></svg>', { headers: { 'Content-Type': 'image/svg+xml' } });
            });
        });
    });
};
