/* =====================================================
   Boulevard Merchant PWA – Service Worker
   Handles: push notifications, offline cache
   ===================================================== */

const CACHE_NAME = 'boulevard-pwa-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/manifest.json',
  '/../new_logo.png'
];

// ── Install ──────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch (cache-first for assets) ───────────────────
self.addEventListener('fetch', event => {
  // Only cache same-origin GET requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// ── Push ─────────────────────────────────────────────
self.addEventListener('push', event => {
  let data = { title: 'Boulevard', body: 'You have a new notification.' };
  try { data = event.data.json(); } catch (_) { /* use defaults */ }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Boulevard', {
      body:    data.body    || '',
      icon:    data.icon    || '/icons/icon-512.png',
      badge:   '/icons/ic_notification.png',
      tag:     data.tag     || 'boulevard-notification',
      vibrate: [200, 100, 200],
      data:    data
    })
  );

  // Relay notification to all open clients so the in-app list updates
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(c => c.postMessage({ type: 'PUSH_RECEIVED', payload: data }));
    })
  );
});

// ── Notification click ───────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes('index.html') || c.url.endsWith('/'));
      if (existing) return existing.focus();
      return self.clients.openWindow('./index.html');
    })
  );
});
