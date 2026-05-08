const CACHE = 'mauri-tick-v1';
const URLS = [
  '/', 
  '/products', 
  '/cart', 
  '/login', 
  '/register',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(URLS))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
