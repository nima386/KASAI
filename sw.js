const CACHE = 'kasai-v43-notif2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/kasai-icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './vendor/supabase-js-2.js',
  './vendor/forge-quotes-365.js',
  './js/core/dom.js',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(asset => c.add(asset))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function shouldBypassCache(request) {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return true;
  if (url.pathname.includes('/auth/v1/') || url.pathname.includes('/rest/v1/')) return true;
  if (request.headers.get('authorization')) return true;
  return false;
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (shouldBypassCache(e.request)) {
    e.respondWith(fetch(e.request));
    return;
  }
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => {
        if (e.request.mode === 'navigate' || e.request.destination === 'document') {
          return caches.match('./index.html');
        }
        return caches.match(e.request);
      });
    })
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const targetUrl = e.notification?.data?.url || './';
  e.waitUntil(
    self.clients.matchAll({type:'window', includeUncontrolled:true}).then(clients => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
