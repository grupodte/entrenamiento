// Service Worker para FitApp PWA - Versión Avanzada
const CACHE_NAME = 'fitapp-v2.0';
const RUNTIME_CACHE = 'fitapp-runtime-v2';
const IMAGES_CACHE = 'fitapp-images-v2';
const API_CACHE = 'fitapp-api-v2';

// URLs estáticas para cache inmediato
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png'
];

// Páginas importantes para cache offline
const IMPORTANT_PAGES = [
  '/dashboard',
  '/login',
  '/register',
  '/instalar',
  '/admin'
];

// Estrategias de cache
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'CACHE_FIRST',
  NETWORK_FIRST: 'NETWORK_FIRST',
  STALE_WHILE_REVALIDATE: 'STALE_WHILE_REVALIDATE'
};

// Helper para determinar estrategia de cache
const getCacheStrategy = (url) => {
  if (url.includes('/api/')) return CACHE_STRATEGIES.NETWORK_FIRST;
  if (url.match(/\.(png|jpg|jpeg|svg|webp|gif)$/)) return CACHE_STRATEGIES.CACHE_FIRST;
  if (url.includes('/assets/')) return CACHE_STRATEGIES.CACHE_FIRST;
  return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
};

// Helper para limpiar caches antiguos
const cleanupOldCaches = async () => {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.startsWith('fitapp-') && 
    ![CACHE_NAME, RUNTIME_CACHE, IMAGES_CACHE, API_CACHE].includes(name)
  );
  
  return Promise.all(
    oldCaches.map(cacheName => {
      console.log('Eliminando cache antiguo:', cacheName);
      return caches.delete(cacheName);
    })
  );
};

// Install event - cache recursos estáticos
self.addEventListener('install', event => {
  console.log('SW: Instalando service worker v2.0');
  
  event.waitUntil(
    Promise.all([
      // Cache de assets estáticos
      caches.open(CACHE_NAME).then(cache => {
        console.log('SW: Cacheando assets estáticos');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Pre-cache de páginas importantes
      caches.open(RUNTIME_CACHE).then(cache => {
        console.log('SW: Pre-cacheando páginas importantes');
        return Promise.allSettled(
          IMPORTANT_PAGES.map(url => 
            fetch(url).then(response => {
              if (response.ok) {
                return cache.put(url, response.clone());
              }
            }).catch(() => console.log(`SW: No se pudo pre-cachear ${url}`))
          )
        );
      })
    ])
  );
  
  // Activar inmediatamente el nuevo SW
  self.skipWaiting();
});

// Activate event - limpiar caches antiguos y tomar control
self.addEventListener('activate', event => {
  console.log('SW: Activando service worker v2.0');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      cleanupOldCaches(),
      // Tomar control de todos los clientes inmediatamente
      self.clients.claim()
    ])
  );
  
  console.log('SW: Service worker activado y listo');
});

// Estrategias de cache
const cacheFirst = async (request) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(IMAGES_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('SW: Error en cache-first:', error);
    return new Response('Sin conexión', { status: 503, statusText: 'Service Unavailable' });
  }
};

const networkFirst = async (request) => {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      // Solo cachear GET requests
      if (request.method === 'GET') {
        cache.put(request, networkResponse.clone());
      }
    }
    return networkResponse;
  } catch (error) {
    console.log('SW: Red no disponible, buscando en cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(
      JSON.stringify({ error: 'Sin conexión', offline: true }), 
      { 
        status: 503, 
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

const staleWhileRevalidate = async (request) => {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const cache = caches.open(RUNTIME_CACHE);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => {
    console.log('SW: Error de red en stale-while-revalidate');
    return cachedResponse || new Response('Sin conexión', { status: 503 });
  });
  
  return cachedResponse || fetchPromise;
};

// Fetch event - estrategias inteligentes de caching
self.addEventListener('fetch', event => {
  // Solo manejar requests HTTP(S)
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // Ignore requests con parámetros de cache-busting
  if (event.request.url.includes('sw-precache')) {
    return;
  }
  
  const url = new URL(event.request.url);
  const strategy = getCacheStrategy(url.href);
  
  event.respondWith(
    (async () => {
      // Estrategia específica para diferentes tipos de contenido
      switch (strategy) {
        case CACHE_STRATEGIES.CACHE_FIRST:
          return cacheFirst(event.request);
          
        case CACHE_STRATEGIES.NETWORK_FIRST:
          return networkFirst(event.request);
          
        case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
        default:
          return staleWhileRevalidate(event.request);
      }
    })()
  );
});

// Manejo de sincronización en background (cuando vuelve la conexión)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('SW: Sincronización en background');
    event.waitUntil(
      // Aquí podrías implementar lógica para sincronizar datos
      // que se guardaron mientras no había conexión
      Promise.resolve()
    );
  }
});

// Manejo de actualizaciones de la app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION_INFO',
      version: '2.0',
      cacheName: CACHE_NAME
    });
  }
});
