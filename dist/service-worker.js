const CACHE='frog-faceoff-checkpoint-v25';
const FILES=['./style.css?v=wood-checkpoint-25','./app.js?v=wood-checkpoint-25','./screen-fit.js?v=wood-checkpoint-25'];
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('frog-showdown-mobile-')||k.startsWith('frog-faceoff-checkpoint-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
// Network-first HTML: never serve an old home page or obsolete Brain Boost bar.
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;if(req.mode==='navigate'||req.destination==='document'){event.respondWith(fetch(req,{cache:'no-store'}).catch(()=>new Response('Please reconnect and refresh Froggy Faceoff.',{status:503,headers:{'Content-Type':'text/plain'}})));}});
