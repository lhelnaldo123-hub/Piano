/* Grand Keys offline support. Change VERSION whenever you upload a new piano.html. */
const VERSION='gk-v16';
const CORE=['./','./piano.html','./gk-notes.js','./gk-hymns.js','./gk-manifest.json','./gk-icon-192.png','./gk-icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>Promise.allSettled(CORE.map(u=>c.add(u)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==VERSION).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 e.respondWith(fetch(r,{cache:'no-store'}).then(x=>{const c=x.clone();caches.open(VERSION).then(h=>h.put(r,c));return x}).catch(()=>caches.match(r,{ignoreSearch:true}).then(x=>x||caches.match('./piano.html'))))});