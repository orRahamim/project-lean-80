const STATIC_CACHE = 'recipe-db-static-v1';
const DATA_CACHE = 'recipe-db-data-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, DATA_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.endsWith('/recipes-v2.json')) {
    event.respondWith(fetchFreshRecipeData(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cached) => cached || fetch(event.request))
      .catch(() => caches.match('./index.html')),
  );
});

function fetchFreshRecipeData(request) {
  return fetch(request)
    .then((response) => {
      const copy = response.clone();
      caches.open(DATA_CACHE).then((cache) => cache.put(request, copy));
      return response;
    })
    .catch(() => caches.match(request));
}
