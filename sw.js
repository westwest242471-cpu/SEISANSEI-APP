const CACHE_NAME = 'prod-man-v6.4';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// インストール時にキャッシュを作成
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 古いバージョンのキャッシュを完全に削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Old cache deleted:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ネットワーク優先（Network First）の戦略に修正
// ネットが繋がれば最新を、ダメならキャッシュを表示
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // ネットワーク成功。最新をキャッシュに保存して返す
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        // ネットワーク失敗（オフラインなど）。キャッシュから返す
        return caches.match(event.request);
      })
  );
});
