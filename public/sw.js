const VERSION = 'v1.6.0';
const CACHE = 'appforge-' + VERSION;
const CORE = [
  './',
  'index.html',
  'view.html',
  'css/custom.css',
  'css/builder.css',
  'css/stream.css',
  'css/help.css',
  'js/util.js',
  'js/blocks.js',
  'js/icons.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;

  if (url.pathname.endsWith('/view.html') || url.searchParams.get('id')) {
    event.respondWith(fetch(event.request).catch(() => caches.match('./')));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});