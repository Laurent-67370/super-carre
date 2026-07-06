// Service Worker — Super Carré PWA
// Stratégie hybride :
//   - index.html (le jeu) : RÉSEAU D'ABORD → la dernière version est toujours
//     récupérée quand il y a une connexion ; le cache ne sert qu'en secours hors-ligne.
//     => les mises à jour sont vues automatiquement au prochain lancement (connecté).
//   - icônes / manifest : CACHE D'ABORD → ressources stables, chargement instantané.
const CACHE_VERSION = 'super-carre-v81';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

// Installation : pré-cache + activation immédiate de la nouvelle version
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation : suppression des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Est-ce une requête vers le document principal du jeu ?
function estDocumentJeu(request) {
  if (request.mode === 'navigate') return true;
  const url = new URL(request.url);
  return url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (estDocumentJeu(event.request)) {
    // RÉSEAU D'ABORD : on tente le réseau (revalidation forcée pour toujours
    // avoir la dernière version, sans dépendre du cache HTTP edge/navigateur),
    // on met à jour le cache, secours = cache hors-ligne.
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put('./index.html', clone));
          }
          return response;
        })
        .catch(() => caches.match('./index.html').then((c) => c || caches.match('./')))
    );
    return;
  }

  // CACHE D'ABORD pour le reste (icônes, manifest…)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
