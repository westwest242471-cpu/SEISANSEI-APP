const CACHE_NAME = 'prod-man-v5.5';
const urlsToCache = ['index.html', 'manifest.json'];

// インストール時に強制的に最新にする
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// 古いキャッシュを確実に捨てる
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// オフライン対応
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // ネットワークから取得できれば最新を、できなければキャッシュを返す
      return fetch(event.request).catch(() => response);
    })
  );
});
