const CACHE_NAME = 'prod-man-v8.0'; // ← v6.6 から v6.7 などの新しい名前に変更！

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // すぐに新しいバージョンを待機状態からアクティブにする
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAllだと1つでもファイルがないと失敗するため、確実に保存できるものだけ保存する
      return Promise.allSettled(
        urlsToCache.map(url => cache.add(url).catch(err => console.log('Cache fail:', url, err)))
      );
    })
  );
});

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
  self.clients.claim(); // すぐにコントロールを開始する
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // POSTリクエストや拡張機能の通信はキャッシュしない
          if (event.request.method === 'GET' && event.request.url.startsWith('http')) {
            cache.put(event.request, resClone);
          }
        });
        return response;
      })
      .catch(() => {
        // オフライン時はキャッシュを探す
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // URLがディレクトリで終わっている等の場合、index.htmlを返す
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('./');
          }
        });
      })
  );
});







