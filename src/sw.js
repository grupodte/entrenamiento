import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// Activación instantánea del nuevo Service Worker
self.addEventListener('install', (event) => {
  // Tomar control sin esperar al cierre de las pestañas antiguas
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Reclamar inmediatamente los clientes abiertos
  event.waitUntil(self.clients.claim());
});

// Precachear archivos estáticos generados por Vite
precacheAndRoute(self.__WB_MANIFEST);

// Limpiar cachés obsoletos
cleanupOutdatedCaches();

// === ESTRATEGIAS DE CACHÉ AVANZADAS ===

// 1. APIs de Spotify - NetworkFirst (datos frescos críticos)
registerRoute(
  ({ url }) => url.hostname === 'api.spotify.com',
  new NetworkFirst({
    cacheName: 'spotify-api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutos
      }),
    ],
  })
);

// 2. APIs de Supabase - StaleWhileRevalidate (balance velocidad/frescura)
registerRoute(
  ({ url }) => url.hostname.includes('supabase.co') && url.pathname.includes('/rest/v1/'),
  new StaleWhileRevalidate({
    cacheName: 'supabase-api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 15 * 60, // 15 minutos
      }),
      // Plugin para Background Sync (sincronización offline)
      new BackgroundSyncPlugin('supabase-sync', {
        maxRetentionTime: 24 * 60 // 24 horas
      })
    ],
  })
);

// 3. Imágenes - CacheFirst (rendimiento)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
      }),
    ],
  })
);

// 4. Fuentes - CacheFirst (casi nunca cambian)
registerRoute(
  ({ url }) => url.pathname.match(/\.(woff|woff2|ttf|otf|eot)$/),
  new CacheFirst({
    cacheName: 'fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 año
      }),
    ],
  })
);

// 5. CDNs externos - StaleWhileRevalidate (EXCLUYENDO videos de streaming)
registerRoute(
  ({ url, request }) => {
    // Solo cachear recursos que NO sean videos de streaming
    const isStreamingVideo = url.hostname.includes('stream.mux.com') || 
                           url.pathname.includes('.m3u8') ||
                           url.pathname.includes('/video/') ||
                           request.destination === 'video';
    
    return /(?:vimeo|youtube|amazonaws)\.com/.test(url.hostname) && !isStreamingVideo;
  },
  new StaleWhileRevalidate({
    cacheName: 'external-assets-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1 día
      }),
    ],
  })
);

// 6. Rutas de video de Mux - NetworkFirst (NUNCA cachear)
registerRoute(
  ({ url, request }) => {
    return url.hostname.includes('stream.mux.com') || 
           url.pathname.includes('.m3u8') ||
           request.destination === 'video';
  },
  new NetworkFirst({
    cacheName: 'video-streaming-cache',
    networkTimeoutSeconds: 10, // Timeout rápido
    plugins: [
      new ExpirationPlugin({
        maxEntries: 0, // No cachear videos
        maxAgeSeconds: 0,
      }),
    ],
  })
);

// === PÁGINA OFFLINE PERSONALIZADA ===

// Crear una página offline HTML embebida
const offlineHTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sin Conexión - DD Entrenamiento</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
      max-width: 400px;
      padding: 2rem;
    }
    .logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(45deg, #6366f1, #8b5cf6);
      border-radius: 50%;
      margin: 0 auto 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
    }
    h1 { color: #6366f1; margin-bottom: 1rem; }
    p { color: #9ca3af; margin-bottom: 2rem; }
    button {
      background: #6366f1;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
    }
    button:hover { background: #4f46e5; }
    .features {
      background: rgba(255,255,255,0.05);
      padding: 1.5rem;
      border-radius: 12px;
      margin-top: 2rem;
      text-align: left;
    }
    .feature {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
    }
    .feature:last-child { margin-bottom: 0; }
    .feature-icon {
      width: 20px;
      height: 20px;
      background: #10b981;
      border-radius: 4px;
      margin-right: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">💪</div>
    <h1>Sin Conexión</h1>
    <p>No hay conexión a Internet, pero aún puedes usar algunas funciones.</p>
    
    <div class="features">
      <div class="feature">
        <div class="feature-icon"></div>
        <span>Rutinas guardadas disponibles</span>
      </div>
      <div class="feature">
        <div class="feature-icon"></div>
        <span>Cronómetros de entrenamiento</span>
      </div>
      <div class="feature">
        <div class="feature-icon"></div>
        <span>Historial local</span>
      </div>
    </div>
    
    <button onclick="window.location.reload()">Intentar de Nuevo</button>
  </div>
</body>
</html>
`;

// Manejar navegación offline
const navigationHandler = async (params) => {
  try {
    return await fetch(params.event.request);
  } catch (error) {
    // Si no hay conexión, servir página offline
    return new Response(offlineHTML, {
      headers: { 'Content-Type': 'text/html' },
    });
  }
};

// Registrar el manejador de navegación
const navigationRoute = new NavigationRoute(navigationHandler, {
  // No aplicar a rutas de API
  denylist: [/^\/_/, /\/api\//],
});

registerRoute(navigationRoute);


// === MANEJO BÁSICO DE MENSAJES ===
self.addEventListener('message', (event) => {
  const { data } = event;
  
  // Permitir saltar la espera cuando la app lo solicite
  if (data && data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // Solo mantener respuesta de estado básica
  if (data && data.type === 'SW_STATUS') {
    event.ports[0].postMessage({
      status: 'active',
      features: ['cache', 'offline'],
      timestamp: Date.now()
    });
  }
});

console.log('SW: Service Worker cargado - Solo cache y offline');
