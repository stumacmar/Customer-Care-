/*
 * Minimal offline-first service worker.
 * The app is a self-contained PWA whose data lives in the browser, so the only
 * thing the network is needed for is the app shell. We cache the shell on
 * install and serve it cache-first, falling back to the network for anything
 * we haven't seen. This is deliberately simple — the audience uses this
 * standing outside a house, often with no signal.
 */
const CACHE = 'plot-clock-v2'
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  // Navigation requests: always fetch the freshest HTML from the network
  // (bypassing the browser's HTTP cache) so a new deploy is picked up on the
  // next load. Fall back to the cached shell only when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() =>
        caches.match('./index.html').then((r) => r || caches.match('./'))
      )
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {})
          return response
        })
        .catch(() => cached)
    })
  )
})
