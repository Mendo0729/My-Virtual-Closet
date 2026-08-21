const CACHE_NAME = 'my-virtual-closet-v1'
const APP_SHELL_URLS = ['/', '/manifest.webmanifest', '/icons/logo-my-virtual-closet.png']

const isCacheableAsset = (request) =>
  ['document', 'script', 'style', 'image', 'font', 'manifest'].includes(request.destination)

async function cacheUrl(cache, url) {
  try {
    const response = await fetch(url, { cache: 'reload' })
    if (response.ok) {
      await cache.put(url, response.clone())
    }
    return response
  } catch {
    return null
  }
}

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME)
  await Promise.allSettled(APP_SHELL_URLS.map((url) => cacheUrl(cache, url)))

  const indexResponse = await cacheUrl(cache, '/')
  if (!indexResponse) return

  const html = await indexResponse.text()
  const assetPaths = Array.from(html.matchAll(/(?:src|href)=["']([^"'#]+)["']/g))
    .map((match) => match[1])
    .filter((path) => path.startsWith('/') && !path.startsWith('/ai'))

  await Promise.allSettled(assetPaths.map((path) => cacheUrl(cache, path)))
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheAppShell())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/ai')) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME)
            await cache.put('/', response.clone())
          }
          return response
        })
        .catch(async () => (await caches.match(request)) || (await caches.match('/'))),
    )
    return
  }

  if (!isCacheableAsset(request)) return

  event.respondWith(
    caches.match(request).then(async (cachedResponse) => {
      if (cachedResponse) return cachedResponse

      const response = await fetch(request)
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME)
        await cache.put(request, response.clone())
      }
      return response
    }),
  )
})
