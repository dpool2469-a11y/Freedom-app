/* FREEDOM cache: bump CACHE_NAME whenever app files change. */
const CACHE_NAME = 'freedom-pwa-v3';
const CORE = ['./', './index.html', './style.css', './script.js', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('freedom-pwa-') && k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('message', event => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => { const req = event.request; if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return; event.respondWith(fetch(req).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE_NAME).then(cache => cache.put(req, copy)); } return res; }).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))); });
