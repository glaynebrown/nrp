/* Offline support.
   - App files: network first (an upload shows up right away), saved copy offline.
   - Firebase SDK + Google Fonts: saved copy first (versioned, never change).
   - Database/login go straight to the network; Firestore keeps its own offline copy. */
const APP_CACHE = 'nrp-app-v2';
const APP_FILES = [
  './', 'index.html', 'styles.css', 'app.js', 'content.js', 'store.js', 'ink.js',
  'firebase-config.js', 'manifest.json', 'icon-192.png', 'apple-touch-icon.png', 'logo-nrp.png', 'logo-heart.png',
];
const SDK = ['app', 'auth', 'firestore'].map(n => `https://www.gstatic.com/firebasejs/10.14.1/firebase-${n}-compat.js`);
const HOME = new URL('./', self.location).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(APP_CACHE)
    .then(cache => Promise.allSettled([...APP_FILES, ...SDK].map(u => cache.add(u))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== APP_CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function networkFirst(request, key = request) {
  const cache = await caches.open(APP_CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(key, res.clone());
    return res;
  } catch (err) {
    const saved = await cache.match(key);
    if (saved) return saved;
    throw err;
  }
}
async function cacheFirst(request) {
  const cache = await caches.open(APP_CACHE);
  const saved = await cache.match(request);
  if (saved) return saved;
  const res = await fetch(request);
  if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    event.respondWith(req.mode === 'navigate' ? networkFirst(req, HOME) : networkFirst(req));
  } else if ((url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/'))
    || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(req));
  }
});
