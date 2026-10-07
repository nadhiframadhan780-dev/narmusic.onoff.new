/**
 * NARmusic - Service Worker
 * Strategi Cache-First untuk aset statis aplikasi & fonts
 * File audio & artwork tersimpan di IndexedDB browser sehingga 100% offline-ready
 */

const CACHE_NAME = 'narmusic-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png'
];

// Install: Cache aset penting dasar
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW: Pre-cache warning', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Bersihkan cache versi lama dan klaim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Tangani permintaan
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Jangan tangani permintaan bukan HTTP/HTTPS atau API luar Spotify iFrame
  if (!request.url.startsWith('http')) return;
  if (url.hostname.includes('spotify.com') || url.hostname.includes('scdn.co')) {
    // Lewatkan langsung ke network untuk Spotify embed
    return;
  }

  // Permintaan Audio (blob: atau audio range) jangan di-cache oleh SW (audio lokal dikelola via IndexedDB)
  if (request.destination === 'audio') {
    return;
  }

  // Cache-first untuk Google Fonts & static scripts/styles/images
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Jika offline dan aset belum ada di cache
          return caches.match('/');
        });
      })
    );
    return;
  }

  // Navigasi HTML: Coba Network dulu lalu Cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // Default Stale-While-Revalidate untuk aset lainnya
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone));
        }
        return networkRes;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
