const CACHE='meu-treino-v30';
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

// v15: notificações
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(_){d={title:'My Training',body:e.data?e.data.text():''}}
  e.waitUntil(self.registration.showNotification(d.title||'My Training',{body:d.body||'',tag:d.tag||'mt',icon:'icon-192.png?v=4',badge:'icon-192.png?v=4',data:{url:d.url||'./'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=(e.notification.data&&e.notification.data.url)||'./';
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if('focus' in c)return c.focus()}return clients.openWindow(url)}))});
