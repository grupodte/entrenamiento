import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

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

// 5. CDNs externos - StaleWhileRevalidate
registerRoute(
  ({ url }) => /(?:vimeo|youtube|amazonaws)\.com/.test(url.hostname),
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

// === FUNCIONALIDAD DE NOTIFICACIONES AVANZADA ===

// Almacena los timers activos
const activeTimers = new Map();

// === EVENTOS PUSH DESDE SERVIDOR ===
self.addEventListener('push', (event) => {
  console.log('SW: Evento push recibido:', event);
  
  let notificationData;
  
  if (event.data) {
    try {
      notificationData = event.data.json();
      console.log('SW: Datos push recibidos:', notificationData);
    } catch (error) {
      console.error('SW: Error procesando datos push:', error);
      notificationData = {
        title: 'Nueva notificación',
        body: 'Tienes una nueva notificación de Fit',
        icon: '/icons/icon-192x192.png'
      };
    }
  } else {
    notificationData = {
      title: 'Fit - Entrenamiento',
      body: 'Nueva notificación de tu aplicación de fitness',
      icon: '/icons/icon-192x192.png'
    };
  }
  
  // Configuración avanzada de la notificación
  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    image: notificationData.image,
    vibrate: notificationData.vibrate || [200, 100, 200],
    tag: notificationData.tag || 'fit-notification',
    renotify: true,
    requireInteraction: notificationData.requireInteraction || false,
    actions: notificationData.actions || [
      {
        action: 'open',
        title: '🏋️ Abrir App',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'dismiss',
        title: '❌ Descartar'
      }
    ],
    data: {
      ...notificationData.data,
      timestamp: Date.now(),
      url: notificationData.url || '/',
      type: notificationData.type || 'general'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// === MANEJO DE MENSAJES DEL CLIENTE ===
self.addEventListener('message', (event) => {
  const { data } = event;
  
  // Funcionalidad existente de timer de descanso
  if (data && data.type === 'SCHEDULE_REST_NOTIFICATION') {
    const { duration, exerciseName, endTime } = data;
    console.log(`SW: Programando notificación para ${exerciseName} en ${duration}s`);
    
    // Cancelar timer anterior si existe
    const existingTimer = activeTimers.get('rest-timer');
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Calcular el tiempo exacto hasta la notificación
    const now = Date.now();
    const timeUntilNotification = Math.max(0, endTime - now);
    
    // Programar nueva notificación
    const timerId = setTimeout(() => {
      console.log('SW: Mostrando notificación de descanso terminado');
      
      self.registration.showNotification('¡Descanso terminado!', {
        body: `¡Es hora de continuar: ${exerciseName}! 💪`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        vibrate: [300, 100, 300, 100, 300],
        tag: 'rest-timer-finish',
        renotify: true,
        requireInteraction: false,
        actions: [
          {
            action: 'open-app',
            title: 'Abrir App'
          }
        ],
        data: {
          type: 'rest-finished',
          exerciseName: exerciseName,
          timestamp: Date.now()
        }
      });
      
      // Limpiar el timer del mapa
      activeTimers.delete('rest-timer');
    }, timeUntilNotification);
    
    // Guardar el timer
    activeTimers.set('rest-timer', timerId);
  }
  
  // Nuevo: Comunicación con el cliente para reproducir sonidos
  if (data && data.type === 'PLAY_NOTIFICATION_SOUND') {
    // Enviar mensaje a todas las ventanas/tabs abiertas
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        clientList.forEach(client => {
          if (client.visibilityState === 'visible') {
            client.postMessage({
              type: 'PLAY_SOUND',
              soundType: data.soundType || 'notification'
            });
          }
        });
      });
  }
  
  // Nuevo: Respuesta de estado del SW
  if (data && data.type === 'SW_STATUS') {
    event.ports[0].postMessage({
      status: 'active',
      features: ['push', 'notifications', 'background-sync'],
      timestamp: Date.now()
    });
  }
});

// === MANEJO AVANZADO DE CLICS EN NOTIFICACIONES ===
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Click en notificación', {
    action: event.action,
    data: event.notification.data,
    tag: event.notification.tag
  });
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/';
  
  // Manejar diferentes acciones
  if (event.action === 'dismiss') {
    // Solo cerrar la notificación (ya se hizo arriba)
    console.log('SW: Notificación descartada por el usuario');
    return;
  }
  
  // Para acción 'open', 'open-app' o click en el cuerpo de la notificación
  if (event.action === 'open' || event.action === 'open-app' || !event.action) {
    event.waitUntil(
      clients.matchAll({ 
        type: 'window', 
        includeUncontrolled: true 
      }).then((clientList) => {
        // Buscar una ventana existente que coincida con el origen
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          const targetUrlObj = new URL(targetUrl, self.registration.scope);
          
          if (clientUrl.origin === targetUrlObj.origin) {
            // Si ya existe una ventana, enfocarla y navegar si es necesario
            if (client.url !== targetUrlObj.href) {
              // Navegar a la URL específica
              return client.navigate(targetUrlObj.href).then(() => client.focus());
            } else {
              return client.focus();
            }
          }
        }
        
        // Si no hay ventana existente, abrir una nueva
        return clients.openWindow(targetUrl);
      }).then((windowClient) => {
        // Enviar datos adicionales al cliente si es necesario
        if (windowClient && notificationData.type) {
          windowClient.postMessage({
            type: 'NOTIFICATION_CLICKED',
            notificationType: notificationData.type,
            data: notificationData,
            timestamp: Date.now()
          });
        }
        
        // Reproducir sonido si la ventana está visible
        if (windowClient && windowClient.visibilityState === 'visible') {
          windowClient.postMessage({
            type: 'PLAY_SOUND',
            soundType: 'notification_click'
          });
        }
      }).catch(err => {
        console.error('SW: Error manejando click en notificación:', err);
      })
    );
  }
  
  // Manejar acciones personalizadas específicas de fitness
  if (event.action === 'start-workout') {
    event.waitUntil(
      clients.openWindow('/workout').catch(err => {
        console.error('SW: Error abriendo workout:', err);
      })
    );
  }
  
  if (event.action === 'view-progress') {
    event.waitUntil(
      clients.openWindow('/progress').catch(err => {
        console.error('SW: Error abriendo progress:', err);
      })
    );
  }
});

console.log('SW: Service Worker avanzado cargado con éxito');
