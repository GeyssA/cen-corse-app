const CACHE_NAME = 'cen-corse-v4';
const STATIC_CACHE = 'cen-corse-static-v4';
const DYNAMIC_CACHE = 'cen-corse-dynamic-v4';

// Fichiers à mettre en cache statique (optimisés pour la production)
const STATIC_ASSETS = [
  '/logo_pwa.png',
  '/Logo_CENCorse.png',
  '/manifest.json',
  '/favicon.ico'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('🔄 Service Worker: Installation en cours...');
  
  event.waitUntil(
    // Créer le cache statique sans vider les anciens (pour éviter les problèmes PWA)
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('✅ Service Worker: Cache statique créé');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation terminée');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Erreur lors de l\'installation:', error);
      })
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Activation en cours...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Service Worker: Suppression de l\'ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation terminée');
        return self.clients.claim();
      })
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Pour les PWA installées, être plus permissif au démarrage
  const isInitialLoad = request.destination === 'document' && 
                       (url.pathname === '/' || url.pathname === '/auth');

  // Supabase Auth & API → TOUJOURS réseau, JAMAIS de cache
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
  }
  // Pages HTML → TOUJOURS réseau, JAMAIS de cache
  else if (request.destination === 'document' || request.destination === 'navigate') {
    // Pour le chargement initial, être encore plus permissif
    if (isInitialLoad) {
      console.log('🚀 Service Worker: Chargement initial PWA détecté, passage direct au réseau');
    }
    event.respondWith(fetch(request));
  }
  // Ressources statiques seulement → cache first
  else if (request.method === 'GET' && (
    request.destination === 'script' || 
    request.destination === 'style' || 
    request.destination === 'image' ||
    request.destination === 'font'
  )) {
    event.respondWith(handleStaticRequest(request));
  }
  // Toutes les autres requêtes → réseau direct
  else {
    event.respondWith(fetch(request));
  }
});



// Gestion des requêtes statiques avec cache-first
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    // Ne mettre en cache que les requêtes http(s)
    if (networkResponse.ok && request.url.startsWith('http')) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('❌ Service Worker: Erreur lors de la récupération:', error);
    // Retourner une page d'erreur hors ligne
    if (request.destination === 'document') {
      return caches.match('/');
    }
    return new Response('Ressource non disponible hors ligne', { status: 404 });
  }
}

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Service Worker: Synchronisation en arrière-plan...');
    event.waitUntil(performBackgroundSync());
  }
});

// Fonction de synchronisation en arrière-plan
async function performBackgroundSync() {
  try {
    // Ici vous pouvez ajouter la logique de synchronisation
    // Par exemple, envoyer les données mises en cache vers Supabase
    console.log('✅ Service Worker: Synchronisation terminée');
  } catch (error) {
    console.error('❌ Service Worker: Erreur lors de la synchronisation:', error);
  }
}

// Gestion des notifications push (optionnel)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/Logo_CENCorse.png',
      badge: '/Logo_CENCorse.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Voir',
          icon: '/Logo_CENCorse.png'
        },
        {
          action: 'close',
          title: 'Fermer',
          icon: '/Logo_CENCorse.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
}); 