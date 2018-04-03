const cacheVersion = 'mws-restaurant-stage1-v5';

const cacheResources = async () => {
  const urlsToCache = [ './',
  './index.html',
  './restaurant.html',
  './css/styles.css',
  './data/restaurants.json',
  './js/dbhelper.js',
  './js/main.js',
  './img/1.jpg',
  './img/2.jpg',
  './img/3.jpg',
  './img/4.jpg',
  './img/5.jpg',
  './img/6.jpg',
  './img/7.jpg',
  './img/8.jpg',
  './img/9.jpg',
  './img/10.jpg',
  './sw.js'];
  const cache = await caches.open(cacheVersion)
  return cache.addAll(urlsToCache)
}
self.addEventListener("install", event => {
  console.log("Installing");
  event.waitUntil(cacheResources());
});


self.addEventListener("activate", function (event){
  console.log("SW claiming");
  self.clients.claim();
  console.log("SW activated");

  event.waitUntil(
      caches.keys()
      .then(function (keys){
          return Promise.all(keys.filter(function (key) {
              return key !== cacheVersion;
          }).map(function (key) {
              return caches.delete(key);
          }));
      })
      .then((r) => {
          console.log(r);
          return r;
      })
      .catch(console.error));
});

self.addEventListener('fetch', event => {
  console.log('fetch');

  // Let the browser do its default thing
  // for non-GET requests.
  if (event.request.method != 'GET') return;
  let url = new URL(event.request.url);
  let req = event.request;

  if (url.origin != location.origin) {
    return;
  }
  if (url.origin === location.origin && url.pathname === "/") {
    req = new Request("/index.html");
  }
  // Prevent the default, and handle the request ourselves.
    event.respondWith(
    caches.match(req)
      .then( response => {

        // Try cache, then network, then offline fallback

        return response || fetch(req)
          .then( response => {
            return caches.open(cacheVersion)
            .then(function(cache) {
              cache.put(event.request.url, response.clone());    //save the response for future
              return response;   // return the fetched data
            });
          })

        // Offline fallback

        .catch( () => {
          console.log("Offline fallback");
          return new Response('<svg role="img" aria-labelledby="offline-title" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><title id="offline-title">Offline</title><g fill="none" fill-rule="evenodd"><path fill="#D8D8D8" d="M0 0h400v300H0z"/><text fill="#9B9B9B" font-family="Helvetica Neue,Arial,Helvetica,sans-serif" font-size="72" font-weight="bold"><tspan x="93" y="172">offline</tspan></text></g></svg>', { headers: { 'Content-Type': 'image/svg+xml' }});
        });
    })
  );
});
