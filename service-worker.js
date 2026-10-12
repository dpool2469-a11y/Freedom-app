const CACHE_NAME = 'freedom-finance-v3';
const CORE_FILES = ['./', './index.html', './style.css', './script.js', './manifest.json'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/style.css')) {
    event.respondWith(fetch(event.request, {cache: 'no-store'}).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put('./style.css', response.clone()));
      return response;
    }).catch(() => caches.match('./style.css')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
