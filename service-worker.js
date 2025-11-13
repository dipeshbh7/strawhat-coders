const CACHE_NAME = 'ecostep-v1';
const ASSETS_TO_CACHE = [
  './ecostep.html',
  './styles.css',
  './app.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', event => {
  // Try network first, then fallback to cache
  event.respondWith(
    fetch(event.request).then(res => {
      // update cache
      const resClone = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
      return res;
    }).catch(() => caches.match(event.request))
  );
});
