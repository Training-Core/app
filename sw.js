const CACHE='meu-treino-v22';
const FILES=['./','./index.html','./manifest.webmanifest','./apple-touch-icon.png','./icon-192.png','./icon-512.png'];
// cache:'reload' ignora o cache do navegador, para nunca guardar arquivo velho
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==self.location.origin)return; // API (Supabase) nunca passa pelo cache
  if(u.searchParams.has('v')){ // arquivos versionados (ícones): sempre da rede, cache só se estiver offline
    e.respondWith(fetch(e.request,{cache:'reload'}).catch(()=>caches.match(e.request,{ignoreSearch:true})));return;
  }
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>{
    const net=fetch(e.request).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}return r}).catch(()=>hit||caches.match('./index.html'));
    return hit||net;
  }));
});
