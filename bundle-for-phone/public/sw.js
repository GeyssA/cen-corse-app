const CACHE_NAME = 'cen-corse-v7';
const STATIC_CACHE = 'cen-corse-static-v7';
const DYNAMIC_CACHE = 'cen-corse-dynamic-v7';
const API_CACHE = 'cen-corse-api-v7';

// Fichiers à mettre en cache statique (optimisés pour la production)
const STATIC_ASSETS = [
  '/playstore-icon.png',
  '/Logo_CENCorse.png',
  '/olivier.png',
  '/manifest.json',
  '/favicon.ico',
  '/playstore-icon.png',
  '/birds.mp3',
  '/nature-ambience-323729.mp3'
];

// Configuration de cache optimisée pour PWA
const CACHE_CONFIG = {
  STATIC_TTL: 31536000, // 1 an pour les assets statiques
  DYNAMIC_TTL: 86400,   // 1 jour pour le contenu dynamique
  API_TTL: 300,         // 5 minutes pour les API
  MAX_CACHE_SIZE: 100,  // Maximum 100 entrées par cache (augmenté pour PWA)
  MAX_AGE: 604800000,   // 7 jours maximum pour n'importe quel cache
  STRATEGY: 'cache-first' // Stratégie agressive pour PWA
};

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('🔄 Service Worker: Installation en cours...');
  
  event.waitUntil(
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
    Promise.all([
      self.clients.claim(),
      cleanOldCaches()
    ]).then(() => {
      console.log('✅ Service Worker: Activation terminée');
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
  try {
    // Essayer d'abord la requête réseau
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Mettre en cache la nouvelle version
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
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

// Fonction de nettoyage intelligente du cache
async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  
  // Supprimer les anciens caches
  const deletePromises = cacheNames
    .filter(cacheName => !currentCaches.includes(cacheName))
    .map(cacheName => {
      console.log('🗑️ Service Worker: Suppression de l\'ancien cache:', cacheName);
      return caches.delete(cacheName);
    });
  
  await Promise.all(deletePromises);
  
  // Nettoyer les caches trop volumineux
  for (const cacheName of currentCaches) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > CACHE_CONFIG.MAX_CACHE_SIZE) {
      // Supprimer les entrées les plus anciennes
      const sortedKeys = keys.sort((a, b) => {
        const aTime = a.headers.get('sw-cache-time') || '0';
        const bTime = b.headers.get('sw-cache-time') || '0';
        return parseInt(aTime) - parseInt(bTime);
      });
      
      const keysToDelete = sortedKeys.slice(0, keys.length - CACHE_CONFIG.MAX_CACHE_SIZE);
      await Promise.all(keysToDelete.map(key => cache.delete(key)));
      
      console.log(`🧹 Service Worker: Nettoyage du cache ${cacheName}: ${keysToDelete.length} entrées supprimées`);
    }
  }
}

// Nettoyage périodique du cache
setInterval(cleanOldCaches, 3600000); // Toutes les heures

// Gestion des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.ports[0].postMessage({
      cacheSize: performance.memory ? performance.memory.usedJSHeapSize : 0
    });
  }
});

// Optimisation de la mémoire - déjà gérée dans l'événement activate principal 