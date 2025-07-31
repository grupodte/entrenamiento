
// service-worker.js

self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  // Limpia cachés antiguas si es necesario
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'START_TIMER') {
    const { duration, exerciseName } = event.data;
    console.log(`Service Worker: Iniciando temporizador de ${duration}s para ${exerciseName}`);

    setTimeout(() => {
      console.log('Service Worker: Temporizador finalizado. Mostrando notificación.');
      self.registration.showNotification('¡Tiempo de descanso terminado!', {
        body: `¡A por el siguiente ejercicio: ${exerciseName}!`,
        icon: '/icons/icon-192x192.png', // Asegúrate de que este ícono exista
        badge: '/icons/iconodte.svg', // Un ícono más pequeño para la barra de notificaciones
        vibrate: [200, 100, 200, 100, 200], // Patrón de vibración
        sound: '/sounds/levelup.mp3', // Sonido de la notificación (puede no funcionar en todos los dispositivos)
        tag: 'rest-timer-notification', // Evita que se acumulen notificaciones
        renotify: true, // Permite que una nueva notificación con la misma etiqueta vuelva a notificar al usuario
      });
    }, duration * 1000);
  }
});
