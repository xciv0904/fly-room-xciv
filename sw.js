const CACHE_NAME = "fly-room-static-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", event => {
  const request = event.request;
  if(request.method !== "GET") return;
  const url = new URL(request.url);
  if(url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if(response.ok) await cache.put(request, response.clone());
      return response;
    } catch(error) {
      return (await cache.match(request)) || Response.error();
    }
  })());
});
