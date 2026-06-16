const C="expense-v2",U=["/mrdj/","/mrdj/manifest.json","/mrdj/icon-192.png","/mrdj/icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(U)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(clients.claim())});
self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});