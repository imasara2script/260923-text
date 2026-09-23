const CACHE_NAME = 'text-share-viewer-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Web Share Targetでファイルやテキストが送信された時（GETパラメータ付き、またはPOSTリクエスト）
  if (url.origin === location.origin && url.pathname.endsWith('index.html')) {
    if (e.request.method === 'POST') {
      e.respondWith(
        (async () => {
          const formData = await e.request.formData();
          const title = formData.get('title') || '';
          const text = formData.get('text') || '';
          const file = formData.get('file'); // ファイル共有の場合

          let content = text;
          let fileName = title || '共有されたファイル';

          if (file && file instanceof File) {
            fileName = file.name;
            content = await file.text();
          }

          // キャッシュされたindex.htmlを返す
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match('./index.html');
          const htmlText = await cachedResponse.text();

          // クエリパラメータ付きのURLにリダイレクトするか、あるいはHTMLに直接データを埋め込む
          // ここでは安全にクエリパラメータつきへリダイレクト（GETに変換）
          const params = new URLSearchParams();
          if (fileName) params.set('title', fileName);
          if (content) params.set('text', content);

          return Response.redirect(`./index.html?${params.toString()}`, 303);
        })()
      );
      return;
    }

    // GETパラメータ付きアクセス（Share Target GET）の場合のフォールバック
    e.respondWith(
      caches.match('./index.html').then((response) => {
        return response || fetch(e.request);
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});