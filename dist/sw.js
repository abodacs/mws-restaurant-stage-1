const cacheVersion = 'mws-restaurant-stage1-v11';

const cacheResources = async () => {
  const urlsToCache = [
    '/',
    './index.html',
    './restaurant.html',
    //'js/index.js',
    /*  '/img/1.webp',
    '/img/2.webp',
    '/img/3.webp',
    '/img/4.webp',
    '/img/5.webp',
    '/img/6.webp',
    '/img/7.webp',
    '/img/8.webp',
    '/img/9.webp',
    '/img/10.webp',*/
    'img/logo.svg',
    '/img/loading_image.svg',
    'img/image_not_available.png',
    //'css/bundle.min.css',
    'dist/manifest.json',
    '//unpkg.com/leaflet@1.3.3/dist/leaflet.js',
    '//unpkg.com/leaflet@1.3.3/dist/leaflet.css',
    //'//normalize-css.googlecode.com/svn/trunk/normalize.css'
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
    caches.match(req)
      .then(response => response || fetch(req)
        .then(response => caches.open(cacheVersion)
          .then((cache) => {
            cache.put(event.request.url, response.clone()); // save the response for future
            return response; // return the fetched data
          }))

        // Offline fallback

        .catch(() => {
          return new Response('<svg role="img" aria-labelledby="offline-title" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><title id="offline-title">Offline</title><g fill="none" fill-rule="evenodd"><path fill="#D8D8D8" d="M0 0h400v300H0z"/><text fill="#9B9B9B" font-family="Helvetica Neue,Arial,Helvetica,sans-serif" font-size="72" font-weight="bold"><tspan x="93" y="172">offline</tspan></text></g></svg>', { headers: { 'Content-Type': 'image/svg+xml' } });
        })),
  );
});
