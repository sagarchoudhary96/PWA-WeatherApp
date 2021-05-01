const CACHE_NAME = "weatherPwa-v1";
const DATA_CACHE_NAME = "weatherPwaData-v1";

const RESOURCE_TO_CACHE = [
  "/index.html",
  "/scripts/app.js",
  "/scripts/lockr.js",
  "/styles/ud811.css",
  "/favicon.ico",
];

self.addEventListener("install", (e) => {
  console.log("Installing Service Worker");
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(RESOURCE_TO_CACHE))
  );
});

self.addEventListener("activate", (e) => {
  console.log("Activating Service Worker");
  e.waitUntil(
    caches.keys().then((cacheKeys) => {
      return Promise.all(
        cacheKeys.map((key) => {
          if (key !== CACHE_NAME || key !== DATA_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.url.startsWith(weatherAPIUrlBase)) {
    e.respondWith(
      fetch(e.request).then((response) => {
        return caches.open(DATA_CACHE_NAME).then((cache) => {
          cache.put(e.request, response.clone());
          return response;
        });
      })
    );
  } else {
    e.respondWith(
      caches.match(e.request).then((response) => {
        return response || fetch(e.request);
      })
    );
  }
});
