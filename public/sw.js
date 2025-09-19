const CACHE_NAME = 'cen-corse-v4';
const STATIC_CACHE = 'cen-corse-static-v4';
const DYNAMIC_CACHE = 'cen-corse-dynamic-v4';

// Fichiers à mettre en cache statique (optimisés pour la production)
const STATIC_ASSETS = [
  '/logo_pwa.png',
  '/Logo_CENCorse.png',
  '/manifest.json',
  '/favicon.ico',
  '/photos_page_accueil/',
  '/photos_personnel/',
  '/Nos fascicules/',
  '/Logos_soutien/'
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

  // Détecter si c'est un refresh (F5, Ctrl+R, pull-to-refresh mobile)
  const isRefresh = request.headers.get('cache-control') === 'no-cache' || 
                   request.headers.get('pragma') === 'no-cache' ||
                   request.headers.get('sec-fetch-mode') === 'navigate';

  // BLOQUER les refresh dans la PWA
  if (isRefresh && (request.destination === 'document' || request.destination === 'navigate')) {
    console.log('🚫 Service Worker: Refresh bloqué dans la PWA');
    // Retourner la page actuelle depuis le cache au lieu de faire un refresh
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          return response;
        }
        // Si pas en cache, retourner la page d'accueil
        return caches.match('/');
      })
    );
    return;
  }

  // Supabase Auth & API → TOUJOURS réseau, avec gestion d'erreur
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  }
  // Pages HTML → TOUJOURS réseau, JAMAIS de cache
  else if (request.destination === 'document' || request.destination === 'navigate') {
    event.respondWith(fetch(request));
  }
  // Images et ressources statiques → cache first avec fallback
  else if (request.method === 'GET' && (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.includes('/photos_') ||
    url.pathname.includes('/Nos fascicules/') ||
    url.pathname.includes('/Logos_soutien/')
  )) {
    event.respondWith(handleStaticRequest(request));
  }
  // Toutes les autres requêtes → réseau direct
  else {
    event.respondWith(fetch(request));
  }
});

// Gestion des requêtes API avec retry et gestion d'erreur
async function handleApiRequest(request) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Service Worker: Tentative ${attempt}/${maxRetries} pour ${request.url}`);
      
      const response = await fetch(request);
      
      if (response.ok) {
        console.log(`✅ Service Worker: Succès pour ${request.url}`);
        return response;
      }
      
      // Si erreur HTTP, ne pas retry
      if (response.status >= 400 && response.status < 500) {
        console.log(`❌ Service Worker: Erreur client ${response.status} pour ${request.url}`);
        return response;
      }
      
      throw new Error(`HTTP ${response.status}`);
      
    } catch (error) {
      lastError = error;
      console.log(`❌ Service Worker: Tentative ${attempt} échouée pour ${request.url}:`, error.message);
      
      if (attempt < maxRetries) {
        // Attendre avant de retry (backoff exponentiel)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Service Worker: Attente ${delay}ms avant retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Toutes les tentatives ont échoué
  console.error(`❌ Service Worker: Échec définitif après ${maxRetries} tentatives pour ${request.url}`);
  
  // Retourner une réponse d'erreur avec timeout
  return new Response(
    JSON.stringify({ 
      error: 'Connexion impossible',
      message: 'Vérifiez votre connexion internet',
      retry: true
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Gestion des requêtes statiques avec cache-first
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('📱 Service Worker: Ressource servie depuis le cache:', request.url);
    return cachedResponse;
  }
  
  try {
    console.log('🌐 Service Worker: Récupération depuis le réseau:', request.url);
    const networkResponse = await fetch(request);
    
    // Ne mettre en cache que les requêtes http(s) et les réponses OK
    if (networkResponse.ok && request.url.startsWith('http')) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('💾 Service Worker: Ressource mise en cache:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Service Worker: Erreur lors de la récupération:', error);
    
    // Pour les images, retourner une image placeholder si pas de cache
    if (request.destination === 'image') {
      return new Response('', { 
        status: 404,
        statusText: 'Image non disponible hors ligne'
      });
    }
    
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