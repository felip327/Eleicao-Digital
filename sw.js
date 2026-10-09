/* sw.js — Service Worker do site de eleição do EC Alvorada.
   Troque VERSAO sempre que mudar arquivos do site, para renovar o cache. */
importScripts('js/db.js');

const VERSAO = 'v1';
const CACHE = 'ec-alvorada-' + VERSAO;

// App shell: tudo o que o site precisa para abrir sem internet.
const SHELL = [
  './',
  'index.html',
  'votar.html',
  'apuracao.html',
  'tecnico.html',
  'css/style.css',
  'js/db.js',
  'js/app.js',
  'data/candidatos.json',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'img/escudo.svg',
  'img/campo.svg',
  'img/marina.svg',
  'img/rogerio.svg',
  'img/helena.svg',
  'img/branco.svg'
];

const HOSTS_FONTES = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n.startsWith('ec-alvorada-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const mesmaOrigem = url.origin === self.location.origin;

  if (mesmaOrigem && url.pathname.includes('/api/')) return; // API: sempre rede (o app trata a falha)
  if (!mesmaOrigem && !HOSTS_FONTES.includes(url.hostname)) return;

  e.respondWith(cacheComAtualizacao(e, mesmaOrigem));
});

// Stale-while-revalidate: responde do cache na hora e atualiza em segundo plano.
async function cacheComAtualizacao(e, mesmaOrigem) {
  const req = e.request;
  const cache = await caches.open(CACHE);
  const guardado = await cache.match(req, { ignoreSearch: mesmaOrigem });

  const rede = fetch(req)
    .then((resp) => {
      if (resp && (resp.ok || resp.type === 'opaque')) cache.put(req, resp.clone());
      return resp;
    })
    .catch(() => null);

  if (guardado) { e.waitUntil(rede); return guardado; }

  const resp = await rede;
  if (resp) return resp;
  if (req.mode === 'navigate') {
    const inicio = await cache.match('index.html');
    if (inicio) return inicio;
  }
  return Response.error();
}

// Background Sync: o navegador dispara quando a conexão volta, mesmo com a aba fechada.
self.addEventListener('sync', (e) => {
  if (e.tag === 'sync-votos') e.waitUntil(DB.sincronizar());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const alvo = new URL((e.notification.data && e.notification.data.url) || 'apuracao.html', self.registration.scope).href;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const c of lista) if (c.url === alvo && 'focus' in c) return c.focus();
      return self.clients.openWindow(alvo);
    })
  );
});
