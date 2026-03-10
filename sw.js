const CACHE_NAME = 'prod-man-v6.6-offline';

// ここに書かれたファイルは、インストール時にスマホの中に「ダウンロード」されます
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js'
];

// インストール時にキャッシュを保存
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and adding files');
      return cache.addAll(urlsToCache);
    })
  );
});

// 古いバージョンのキャッシュを掃除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 通信リクエストを横取りする処理（ここがオフラインの要！）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // 1. まずは通常通りインターネット（ネットワーク）を見に行く
    fetch(event.request)
      .then((response) => {
        // ネットに繋がっていれば、最新のデータをスマホのキャッシュにも上書き保存する
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        // 2. ネットに繋がっていない（オフライン）場合は、スマホの中のキャッシュから返す！
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // GitHub Pages特有のURL対策（〇〇.html と書いてなくてもトップページを返す）
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
