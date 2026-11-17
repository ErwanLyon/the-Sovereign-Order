/* TSO V26.1 — cache minimal de l'interface uniquement.
   Les scènes, les fiches et les images ne sont pas mises en cache automatiquement. */
const SHELL='tso-v26-1-shell-2';
const FILES=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('tso-v')&&k!==SHELL).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
// Network-only for all data and images: no automatic offline download.
if(u.pathname.includes('/data/')||/\.(?:png|jpe?g|webp|gif|svg|avif)$/i.test(u.pathname))return;
if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('./index.html')));return;}
if(u.pathname.endsWith('/manifest.webmanifest')||u.pathname.endsWith('/sw.js'))return;
});
