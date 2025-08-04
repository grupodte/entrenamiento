// service-worker.js

// Almacena los timers activos
const activeTimers = new Map();

self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const { data } = event;
  
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
          exerciseName: exerciseName
        }
      });
      
      // Limpiar el timer del mapa
      activeTimers.delete('rest-timer');
    }, timeUntilNotification);
    
    // Guardar el timer
    activeTimers.set('rest-timer', timerId);
    
    // Mostrar notificación inicial (opcional)
    self.registration.showNotification('Descanso iniciado', {
      body: `Descansa ${duration} segundos. Siguiente: ${exerciseName}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'rest-timer-start',
      silent: true,
      data: {
        type: 'rest-started',
        duration: duration,
        exerciseName: exerciseName
      }
    });
  }
  
  // Mantener compatibilidad con el mensaje anterior
  if (data && data.type === 'START_TIMER') {
    const { duration, exerciseName } = data;
    const endTime = Date.now() + (duration * 1000);
    
    // Redirigir al nuevo sistema
    self.postMessage({
      type: 'SCHEDULE_REST_NOTIFICATION',
      duration: duration,
      exerciseName: exerciseName,
      endTime: endTime
    });
  }
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Click en notificación', event.notification.data);
  
  event.notification.close();
  
  if (event.action === 'open-app' || !event.action) {
    // Abrir o enfocar la aplicación
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Si hay una ventana abierta, enfocarla
          for (const client of clientList) {
            if (client.url.includes(self.registration.scope)) {
              return client.focus();
            }
          }
          // Si no hay ventana abierta, abrir una nueva
          return clients.openWindow('/');
        })
    );
  }
});

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('SW: Notificación cerrada', event.notification.data);
});
