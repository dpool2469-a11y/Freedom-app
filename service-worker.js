const CACHE='freedom-complete-v1';
const FILES=['./','./index.html','./style.css','./script.js','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('freedom-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;event.respondWith(fetch(req).then(res=>{if(res&&res.status===200&&new URL(req.url).origin===self.location.origin){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return res;}).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));});
