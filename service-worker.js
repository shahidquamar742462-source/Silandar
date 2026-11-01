const CACHE_NAME = 'pwta-app-v13'; 
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './logo.png.jpeg'
];

// Install Event: Naya data save karna aur turant apply karna
self.addEventListener('install', (e) => {
  self.skipWaiting(); 
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Activate Event: Purana cache delete karna
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); 
          }
        })
      );
    }).then(() => self.clients.claim()) 
  );
});

// Fetch Event: Network First Strategy (Internet check karega, na hone par saved data dikhayega)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});
