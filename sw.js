'use strict';
const prefix = 'keto-apetyt-pages|' + self.registration.scope + '|';
const cacheName = prefix + 'a6effc7826721527';
const assets = ["./index.html","./otworz.js","./manifest.webmanifest","./icon-180.png","./icon-192.png","./icon-512.png","./zeszyt.bin"];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    const requests = assets.map(path => new Request(new URL(path, self.registration.scope), {credentials:'same-origin', cache:'reload'}));
    await cache.addAll(requests);
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(prefix) && key !== cacheName).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  const url = new URL(request.url);
  const root = new URL(self.registration.scope);
  const directoryHome = request.mode === 'navigate' && url.pathname === root.pathname;
  const resource = directoryHome ? new URL('index.html',root).href : request.url;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const hit = await cache.match(resource);
    return hit || fetch(request);
  })());
});
