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
    // Vider tous les anciens caches d'abord
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️ Service Worker: Suppression de l\'ancien cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
    .then(() => {
      // Créer le nouveau cache statique
      return caches.open(STATIC_CACHE);
    })
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

  // Stratégie pour les requêtes API Supabase
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  }
  // Stratégie pour les pages HTML - toujours réseau d'abord
  else if (request.destination === 'document' || request.destination === 'navigate') {
    event.respondWith(handlePageRequest(request));
  }
  // Stratégie pour les ressources statiques
  else if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
  }
  // Stratégie pour les autres requêtes
  else {
    event.respondWith(fetch(request));
  }
});

// Gestion des requêtes de pages - réseau d'abord, puis cache
async function handlePageRequest(request) {
  // Pour les pages HTML, toujours vider le cache et forcer le réseau
  if (request.destination === 'document' || request.destination === 'navigate') {
    console.log('🔄 Service Worker: Page HTML détectée, vidage du cache pour:', request.url);
    
    // Vider le cache pour cette page
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.delete(request);
    
    // Vider aussi le cache statique si c'est la page d'accueil
    if (request.url.endsWith('/') || request.url.includes('index')) {
      await cache.delete('/');
    }
  }

  try {
    // Essayer d'abord la requête réseau avec no-cache pour les pages
    const networkRequest = new Request(request, {
      cache: 'no-cache',
      headers: {
        ...request.headers,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const networkResponse = await fetch(networkRequest);
    
    if (networkResponse.ok) {
      // Ne pas mettre en cache les pages HTML pour éviter les problèmes
      if (request.destination !== 'document' && request.destination !== 'navigate') {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📡 Service Worker: Hors ligne, utilisation du cache pour:', request.url);
    
    // En cas d'échec réseau, essayer le cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si pas en cache, retourner une page d'erreur hors ligne
    return caches.match('/');
  }
}

// Gestion des requêtes API avec synchronisation hors ligne
async function handleApiRequest(request) {
  try {
    // Essayer d'abord la requête réseau
    const networkResponse = await fetch(request);
    // Ne mettre en cache que les requêtes GET et http(s)
    if (
      networkResponse.ok &&
      request.method === 'GET' &&
      request.url.startsWith('http')
    ) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('📡 Service Worker: Hors ligne, utilisation du cache pour:', request.url);
    // En cas d'échec réseau, essayer le cache (seulement pour GET)
    if (request.method === 'GET' && request.url.startsWith('http')) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    // Si pas en cache ou méthode non supportée, retourner une réponse d'erreur
    return new Response(
      JSON.stringify({ 
        error: 'Hors ligne - Impossible de récupérer les données',
        offline: true 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

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