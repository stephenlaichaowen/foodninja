const staticCache = "site-static-v4";
const dynamicCache = "site-dynamic-v6";
const assets = [
  "/",
  "/index.html",
  "/js/app.js",
  "/js/ui.js",
  "/js/materialize.min.js",
  "/css/materialize.min.css",
  "/css/styles.css",
  "/img/dish.png",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://fonts.gstatic.com/s/materialicons/v67/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2",
  "/pages/fallback.html",
];

// cache size limit function
const limitCacheSize = (name, size) => {
  caches.open(name).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(limitCacheSize(name, size))
      }
    })
  })
}

// Install Service Worker
self.addEventListener("install", (evt) => {
  // console.log(`Service Worker has been installed`);
  self.skipWaiting();

  evt.waitUntil(
    caches.open(staticCache).then((cache) => {
      console.log(`caching shell assets`);
      // Goes out to the server and pulls out all the request
      cache.addAll(assets);
    })
  );
});

// Activate Service Worker
self.addEventListener("activate", (evt) => {
  console.log(`Service Worker has been activated`);

  evt.waitUntil(
    caches.keys().then((keys) => {
      // keys are cacheName
      console.log(keys);
      // delete the old caches
      return Promise.all(
        keys
          .filter((key) => key !== staticCache && key !== dynamicCache)
          .map((key) => caches.delete(key))
      );
    })
  );
});

// fetch event
// Show Install Banner
self.addEventListener("fetch", (evt) => {
  // console.log('fetch event', evt);

  // intercept request
  evt.respondWith(
    caches.match(evt.request).then((cacheRes) => {
        // if cache is empty, proceed request to server, or fetch assets in cache
        return (cacheRes || fetch(evt.request).then((fetchRes) => {
            return caches.open(dynamicCache).then((cache) => {
              cache.put(evt.request.url, fetchRes.clone());
              // limitCacheSize(dynamicCache, 5)
              return fetchRes;
            });
          })
        );
      }).catch(() => {
        if (evt.request.url.indexOf(".html") > -1) {
          return caches.match("/pages/fallback.html");
        }
      })
  );
});
