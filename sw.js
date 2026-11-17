// Lets the app open without internet. App files: fresh copy when online, saved copy when offline.
const CACHE = 'life-tracker-v30';
const APP_FILES = [
  './', './index.html', './styles.css', './app.js', './store.js', './firebase-config.js', './body-paths.js',
  './manifest.webmanifest', './icons/icon.svg', './icons/icon-180.png', './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== 'exercise-photos-v1').map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Firebase library files never change for a given version: use the saved copy first.
  if (url.origin === 'https://www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    })));
    return;
  }

  // Exercise photos never change (pinned version): keep a copy so viewed demos work offline.
  if (url.origin === 'https://cdn.jsdelivr.net' && url.pathname.startsWith('/gh/yuhonas/free-exercise-db@')) {
    event.respondWith(caches.open('exercise-photos-v1').then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => {
      c.put(req, res.clone());
      return res;
    }))));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Always ask the server whether a file changed, so updates show up right away.
  event.respondWith(
    fetch(new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' }))
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html'))),
  );
});

// ---------- Push reminders ----------
// iPhone requires every push to show a visible notification, so always show one.
self.addEventListener('push', (event) => {
  let msg = {};
  try { msg = event.data ? event.data.json() : {}; } catch { msg = { body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(msg.title || 'Time to drink water 💧', {
    body: msg.body || 'A glass of water now keeps you on track.',
    icon: './icons/icon-180.png',
    badge: './icons/icon-180.png',
    tag: msg.tag || 'water',
    data: { url: msg.url || './#water' },
  }));
});

// Tapping a notification opens (or focuses) the app on the Hydrate tab.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || './#water', self.registration.scope).href;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const win of wins) {
      if ('focus' in win) {
        if ('navigate' in win) { try { await win.navigate(target); } catch { /* keep current page */ } }
        return win.focus();
      }
    }
    return self.clients.openWindow(target);
  })());
});
