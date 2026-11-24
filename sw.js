'use strict';
const root = self.registration.scope;
const prefix = 'keto-apetyt-pages|' + root + '|';
const cacheName = prefix + '534dca7db556f6e8';
const shell = ["index.html","otworz.js","manifest.webmanifest","icon-180.png","icon-192.png","icon-512.png"];
const bookURL = new URL('zeszyt.bin', root);
const bookHash = '8519279a115535224d915a13820a39ab1854c111f66c7bd851d1b030e0e2ff31';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const versionURL = new URL(bookURL);
    versionURL.searchParams.set('v', bookHash);
    const book = await fetch(versionURL, {cache:'no-store'});
    if (!book.ok) throw new Error('Nie pobrano przepiśnika.');
    const digest = await crypto.subtle.digest('SHA-256', await book.clone().arrayBuffer());
    const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('');
    if (hash !== bookHash) throw new Error('Publikacja nowego przepiśnika jest jeszcze w toku.');
    const cache = await caches.open(cacheName);
    const requests = shell.map(file => new Request(new URL(file, root), {cache:'reload'}));
    await cache.addAll(requests);
    await cache.put(bookURL.href, book);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.clients.claim();
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(prefix) && key !== cacheName).map(key => caches.delete(key)));
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(root)) return;
  const url = new URL(request.url);
  const home = request.mode === 'navigate' && url.pathname === new URL(root).pathname;
  const resource = home ? new URL('index.html', root).href : request.url;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    return await cache.match(resource) || fetch(request);
  })());
});
