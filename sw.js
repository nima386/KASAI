const CACHE = 'kasai-v43-timepush-i18n6-safearea1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './styles/premium-ux.css',
  './icons/kasai-icon.svg',
  './icons/app-logo-b5.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/icon-b5-192.png',
  './icons/icon-b5-512.png',
  './icons/icon-b5-maskable-512.png',
  './icons/apple-touch-icon-b5.png',
  './splash/01-you-vs-you.html',
  './splash/02-dont-stop.html',
  './splash/03-discipline.html',
  './splash/04-push-repeat.html',
  './splash/05-burn-brighter.html',
  './splash/06-no-excuses.html',
  './splash/07-fire-rose.html',
  './splash/08-fire-orb.html',
  './splash/10-fire-vortex.html',
  './splash/12-fire-cube.html',
  './vendor/supabase-js-2.js',
  './vendor/forge-quotes-365.js',
  './js/core/version.js',
  './js/core/dom.js',
  './js/core/state.js',
  './js/core/mock-data.js',
  './js/core/ux.js',
  './js/features/ui.js',
  './js/features/sync.js',
  './js/features/run.js',
  './js/features/training.js',
  './js/features/settings.js',
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
      (async () => {
        const url = new URL(e.request.url);
        const isAppShell = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
        const cacheKey = isAppShell ? './index.html' : e.request;
        const cache = await caches.open(CACHE);
        const cached = await cache.match(cacheKey);
        const network = fetch(e.request, {cache:'no-store'}).then(res => {
          if (res && res.status === 200) cache.put(cacheKey, res.clone());
          return res;
        });
        try {
          return await Promise.race([
            network,
            new Promise((_, reject) => setTimeout(() => reject(new Error('network timeout')), cached ? 2200 : 4500))
          ]);
        } catch (_) {
          e.waitUntil(network.catch(() => {}));
          return (await cache.match(cacheKey)) || cache.match('./index.html');
        }
      })()
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

self.addEventListener('push', e => {
  let payload = {};
  try {
    payload = e.data ? e.data.json() : {};
  } catch (_) {
    payload = { title: 'KASAI', body: e.data ? e.data.text() : '' };
  }
  const title = payload.title || 'KASAI Training';
  const options = {
    body: payload.body || 'Dein Training wartet auf dich.',
    tag: payload.tag || 'kasai-training',
    badge: './icons/icon-192.png',
    icon: './icons/icon-192.png',
    data: {
      url: payload.url || './index.html',
      type: payload.type || 'training'
    }
  };
  e.waitUntil(self.registration.showNotification(title, options));
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
