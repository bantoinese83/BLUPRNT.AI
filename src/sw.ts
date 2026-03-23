const CACHENAME = "blueprint-ai-v1";

self.addEventListener("install", (event: any) => {
  event.waitUntil(
    caches.open(CACHENAME).then((cache) => {
      return cache.addAll(["/", "/index.html", "/manifest.json"]);
    })
  );
});

self.addEventListener("fetch", (event: any) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
