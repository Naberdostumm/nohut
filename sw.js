/* ============================================================
   sw.js — Servis çalışanı

   Amaç: uygulamanın kendisi telefonda saklansın ki internet
   kesikken bile AÇILSIN. Kayıtlar buluttan geldiği için veri
   yine bağlantı ister — ama program açılır ve durumu anlatır.

   Yöntem: önce ağ, olmazsa kopya (network-first). Böylece
   çevrimiçiyken her zaman en güncel sürüm gelir.
   ============================================================ */
var KOPYA = 'nohut-v1';
var KABUK = ['/', '/manifest.json', '/simge-192.png', '/simge-512.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(KOPYA).then(function (k) {
    return k.addAll(KABUK).catch(function () { });
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (adlar) {
      return Promise.all(adlar.filter(function (a) { return a !== KOPYA; })
        .map(function (a) { return caches.delete(a); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var istek = e.request;
  if (istek.method !== 'GET') return;

  var url = new URL(istek.url);
  // Bulut istekleri asla önbelleğe alınmaz — veri her zaman taze olmalı
  if (url.origin !== location.origin) return;

  e.respondWith(
    fetch(istek).then(function (yanit) {
      if (yanit && yanit.ok) {
        var kopya = yanit.clone();
        caches.open(KOPYA).then(function (k) { k.put(istek, kopya); });
      }
      return yanit;
    }).catch(function () {
      return caches.match(istek).then(function (k) {
        if (k) return k;
        if (istek.mode === 'navigate') return caches.match('/');
        return new Response('', { status: 504 });
      });
    })
  );
});
