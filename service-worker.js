const STATIC_CACHE = 'recipe-db-static-v2';
const DATA_CACHE = 'recipe-db-data-v2';

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
      .then((cache) => Promise.allSettled(
        STATIC_ASSETS.map((asset) => cache.add(new URL(asset, self.location.href).toString())),
      ))
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
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  if (url.pathname.endsWith('/recipes-v2.json')) {
    event.respondWith(fetchFreshRecipeData(event.request));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(fetchAppShell(event.request));
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
      if (!response.ok) {
        throw new Error(`Recipe request failed with ${response.status}`);
      }

      const copy = response.clone();
      caches.open(DATA_CACHE).then((cache) => cache.put(request, copy));
      return response;
    })
    .catch(() => caches.match(request));
}

function fetchAppShell(request) {
  return fetch(request)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Navigation request failed with ${response.status}`);
      }

      return response;
    })
    .catch(() => caches.match('./index.html'));
}
