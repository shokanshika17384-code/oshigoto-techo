// おしごと手帖（スマホ用の版）：電波がなくても開けるように、アプリの仕組みだけを端末に置いておく。
// 予定やメモなどのデータは扱わない（データは暗号化して IndexedDB にあり、ここは通らない）。
// 新しい版を置くと、この内容（版の印）が変わる。新しい版は取り込んだあと待機し、
// 画面の「更新する」（SKIP_WAITING）で切り替わる。アプリを全部閉じて開き直したときも切り替わる。
// 同じ場所（github.io など）に置いたほかのアプリの保管は消さない。消すのはこのアプリの古い版だけ
const PREFIX = 'oshigoto-techo-';
const VERSION = `${PREFIX}fb8d53d6e71c`;
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(FILES)),
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (c) => {
      const hit = await c.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try {
        return await fetch(req);
      } catch (err) {
        if (req.mode === 'navigate') {
          const page = await c.match('./index.html');
          if (page) return page;
        }
        throw err;
      }
    }),
  );
});
