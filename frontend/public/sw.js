/* RE-CIRCLE service worker — offline-tolerant app shell.
   Caches: HTML shell + static assets. API calls fall through to network. */

const CACHE_NAME = 'recircle-v1'
const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GETs
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // API calls: always network, never cache (fresh data matters)
  if (url.pathname.startsWith('/lots') || url.pathname.startsWith('/auth') ||
      url.pathname.startsWith('/earnings') || url.pathname.startsWith('/admin') ||
      url.pathname.startsWith('/ai') || url.pathname.startsWith('/prices') ||
      url.pathname.startsWith('/recyclers') || url.pathname.startsWith('/ws')) {
    return
  }

  // Navigation / HTML shell: network-first with cache fallback (offline)
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // Static assets: cache-first, refresh in background
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone()
            caches.open(CACHE_NAME).then((c) => c.put(request, copy)).catch(() => {})
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
