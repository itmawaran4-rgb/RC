const CACHE = 'rc-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting(); // ← مهم: يطبّق التحديث فوراً
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // ← مهم: يتحكم بالصفحات فوراً
});

self.addEventListener('fetch', e => {
  // network first للـ HTML — دائماً يجيب من السيرفر أولاً
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('./index.html'))
    );
    return;
  }
  // cache first للباقي
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
