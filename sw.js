/* The Sovereign Order V27.1: network-first app shell, no bulk offline content. */
const CACHE='tso-v27-1-shell';
const SHELL=['./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    // Do not block activation if an optional asset is temporarily unavailable.
    await Promise.allSettled(SHELL.map(async path=>{
      const response=await fetch(new Request(path,{cache:'no-store'}));
      if(response.ok)await cache.put(path,response);
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name.startsWith('tso-v')&&name!==CACHE).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  // Content and images are fetched on demand and never bulk-cached.
  if(url.pathname.includes('/data/')||/\.(?:png|jpe?g|webp|gif|svg|avif)$/i.test(url.pathname))return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(new Request(request,{cache:'no-store'}));
        if(response.ok){
          const cache=await caches.open(CACHE);
          await cache.put('./index.html',response.clone());
        }
        return response;
      }catch(error){
        return (await caches.match('./index.html'))||Response.error();
      }
    })());
  }
});
