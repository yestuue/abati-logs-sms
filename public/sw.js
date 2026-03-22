const CACHE = 'abati-v2';
const OFFLINE_URL = '/offline.html';

// Pages to pre-cache on install
const PRECACHE = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install — cache essentials
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy: network-first for pages/API, cache-first for assets
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Always go to network for API calls — never cache these
  if (url.pathname.startsWith('/api/')) return;

  // Next.js internals — skip caching
  if (url.pathname.startsWith('/_next/')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match(e.request).then(cached => cached || new Response('', { status: 503 }))
      )
    );
    return;
  }

  // Pages: network-first, fall back to cache, then offline page
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(cached =>
          cached || caches.match(OFFLINE_URL)
        )
      )
  );
});

// Push notifications — SMS alerts
self.addEventListener('push', e => {
  const data = e.data?.json() || { title: 'Abati SMS', body: 'New message received!' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      vibrate: [200, 100, 200],
      tag: 'sms-notification',
      renotify: true,
      actions: [
        { action: 'view', title: 'View SMS' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// Notification click — open dashboard/sms
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      const existing = list.find(c => c.url.includes('/dashboard'));
      if (existing) return existing.focus();
      return clients.openWindow('/dashboard/sms');
    })
  );
});
