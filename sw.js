// sw.js

const CACHE_VERSION = 2;
const CACHE_NAME = `takaka-static-v${CACHE_VERSION}`;
const API_CACHE_NAME = `takaka-api-v${CACHE_VERSION}`;
const ALL_CACHES = [CACHE_NAME, API_CACHE_NAME];

self.addEventListener('install', event => {
  // Activate the new service worker as soon as it's installed
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  // Clean up old caches to save space
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!ALL_CACHES.includes(cacheName)) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all open client pages
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // We only cache GET requests. Other methods like POST are not cacheable.
  if (request.method !== 'GET') {
    return;
  }
  
  // API requests: Use a "Network falling back to Cache" strategy.
  // This ensures users get the freshest data when online, but can still see cached content when offline.
  if (url.href.includes('/xrpc/')) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          // If the network request is successful, clone it, cache it, and return it.
          const responseToCache = networkResponse.clone();
          caches.open(API_CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        })
        .catch(async () => {
          // If the network request fails (e.g., offline), try to find a match in the cache.
          const cachedResponse = await caches.match(request);
          return cachedResponse; // This will be undefined if not in cache, leading to a browser network error.
        })
    );
    return;
  }

  // Static assets (local files, fonts, CDN scripts): Use a "Cache First" strategy.
  // This is ideal for assets that don't change often, making the app load instantly on repeat visits.
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // If we have a cached response, return it immediately.
        if (cachedResponse) {
          return cachedResponse;
        }
        // Otherwise, fetch from the network, cache the result, and return it.
        return fetch(request).then(networkResponse => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        });
      })
  );
});


// --- Push Notification Logic ---

self.addEventListener('push', event => {
  const data = event.data.json();
  
  const title = data.title;
  const options = {
    body: data.body,
    icon: '/vite.svg', // A default icon
    badge: '/vite.svg', // An icon for the notification tray
    data: {
      url: data.url || '/' // URL to open on click
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        client.navigate(urlToOpen);
        return client.focus();
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
