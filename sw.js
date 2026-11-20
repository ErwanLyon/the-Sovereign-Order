/* The Sovereign Order v28: network-first app shell, no bulk offline content. */
const CACHE='tso-v29shell';
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


/* V29: FCM background messaging integrated with the existing PWA worker.
   Do not change the book's network-first cache and update behavior. */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: "AIzaSyB8SJEoHutE0suv7beC9bUZfOU50Wp-M5s",
  authDomain: "tso-the-sovereign-order.firebaseapp.com",
  projectId: "tso-the-sovereign-order",
  storageBucket: "tso-the-sovereign-order.firebasestorage.app",
  messagingSenderId: "345540545184",
  appId: "1:345540545184:web:8b797cf91d5683f07f97c5"
});
const tsoMessaging=firebase.messaging();
tsoMessaging.onBackgroundMessage(payload=>{
  // FCM displays notification payloads itself in the background.
  // Only display custom notifications for data-only messages.
  if(payload.notification)return;
  const data=payload.data||{};
  const title=data.title||'The Sovereign Order';
  const body=data.body||'Une nouveauté est disponible.';
  return self.registration.showNotification(title,{
    body,icon:'./icons/icon-192.png',badge:'./icons/icon-192.png',
    data:{url:data.url||'./index.html'}
  });
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=new URL(event.notification.data?.url||'./index.html',self.registration.scope);
  if(url.origin!==self.location.origin)return;
  event.waitUntil((async()=>{
    const windows=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      if(client.url.startsWith(self.registration.scope)){
        await client.focus();return;
      }
    }
    await clients.openWindow(url.href);
  })());
});
