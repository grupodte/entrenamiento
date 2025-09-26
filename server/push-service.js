const express = require('express');
const webpush = require('web-push');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.static('dist'));

// Almacenamiento en memoria para las suscripciones (en producción usar una base de datos)
const subscriptions = new Map();

// Configuración VAPID (en producción estas claves deben estar en variables de entorno)
const VAPID_KEYS = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa40HI_9PJvf8a7q_qHp9gBF1_2JjqMJt5_Wm9mKX4Xr1RnYJcN-Xw4z4WGZ9s',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'your-vapid-private-key-here'
};

// Si no hay claves VAPID, generarlas
if (VAPID_KEYS.privateKey === 'your-vapid-private-key-here') {
  const vapidKeys = webpush.generateVAPIDKeys();
  console.log('\n🔑 CLAVES VAPID GENERADAS:');
  console.log('Pública:', vapidKeys.publicKey);
  console.log('Privada:', vapidKeys.privateKey);
  console.log('\n⚠️  IMPORTANTE: Guarda estas claves en tu archivo .env:');
  console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`);
  
  VAPID_KEYS.publicKey = vapidKeys.publicKey;
  VAPID_KEYS.privateKey = vapidKeys.privateKey;
}

// Configurar web-push con las claves VAPID
webpush.setVapidDetails(
  'mailto:your-email@example.com', // En producción usar un email real
  VAPID_KEYS.publicKey,
  VAPID_KEYS.privateKey
);

// === ENDPOINTS DE LA API ===

// Obtener la clave pública VAPID
app.get('/api/vapid-public-key', (req, res) => {
  res.json({
    publicKey: VAPID_KEYS.publicKey
  });
});

// Suscribirse a notificaciones push
app.post('/api/push/subscribe', async (req, res) => {
  try {
    const { subscription, userAgent, userId, timestamp } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        error: 'Suscripción inválida',
        message: 'La suscripción debe incluir un endpoint'
      });
    }

    // Crear un ID único para la suscripción
    const subscriptionId = generateSubscriptionId(subscription.endpoint);
    
    // Guardar la suscripción
    const subscriptionData = {
      id: subscriptionId,
      subscription,
      userAgent: userAgent || 'Unknown',
      userId: userId || 'anonymous',
      createdAt: timestamp || Date.now(),
      lastUsed: Date.now(),
      isActive: true
    };
    
    subscriptions.set(subscriptionId, subscriptionData);
    
    console.log(`✅ Nueva suscripción guardada: ${subscriptionId}`);
    console.log(`📊 Total de suscripciones activas: ${subscriptions.size}`);
    
    // Enviar notificación de bienvenida
    try {
      const welcomePayload = JSON.stringify({
        title: '🎉 ¡Bienvenido a Fit!',
        body: 'Las notificaciones están configuradas correctamente. ¡Prepárate para entrenar!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: 'welcome',
        data: {
          type: 'welcome',
          timestamp: Date.now()
        },
        actions: [
          {
            action: 'open',
            title: '🏋️ Entrenar ahora'
          }
        ]
      });

      await webpush.sendNotification(subscription, welcomePayload);
      console.log('🔔 Notificación de bienvenida enviada');
    } catch (welcomeError) {
      console.warn('⚠️ Error enviando notificación de bienvenida:', welcomeError.message);
    }

    res.status(201).json({
      success: true,
      subscriptionId,
      message: 'Suscripción guardada exitosamente',
      activeSubscriptions: subscriptions.size
    });

  } catch (error) {
    console.error('❌ Error en suscripción:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Desuscribirse de notificaciones push
app.post('/api/push/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({
        error: 'Endpoint requerido para desuscripción'
      });
    }

    const subscriptionId = generateSubscriptionId(endpoint);
    const deleted = subscriptions.delete(subscriptionId);
    
    if (deleted) {
      console.log(`🗑️ Suscripción eliminada: ${subscriptionId}`);
    }
    
    res.json({
      success: true,
      message: deleted ? 'Suscripción eliminada' : 'Suscripción no encontrada',
      activeSubscriptions: subscriptions.size
    });

  } catch (error) {
    console.error('❌ Error en desuscripción:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Enviar notificación a todos los suscriptores
app.post('/api/push/send-all', async (req, res) => {
  try {
    const { title, body, data, actions, tag } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({
        error: 'Título y cuerpo son requeridos'
      });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: tag || 'broadcast',
      data: {
        ...data,
        timestamp: Date.now(),
        type: data?.type || 'broadcast'
      },
      actions: actions || [
        {
          action: 'open',
          title: '🏋️ Abrir App'
        }
      ]
    });

    const results = await sendToAllSubscriptions(payload);
    
    res.json({
      success: true,
      message: 'Notificaciones enviadas',
      results,
      totalSubscriptions: subscriptions.size
    });

  } catch (error) {
    console.error('❌ Error enviando notificaciones:', error);
    res.status(500).json({
      error: 'Error enviando notificaciones',
      message: error.message
    });
  }
});

// Enviar notificación específica de fitness
app.post('/api/push/send-fitness', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    const fitnessNotifications = {
      workout_reminder: {
        title: '💪 ¡Hora de entrenar!',
        body: data.message || '¿Listo para tu rutina de hoy?',
        actions: [
          { action: 'start-workout', title: '🏋️ Empezar' },
          { action: 'dismiss', title: '⏰ Recordar más tarde' }
        ]
      },
      rest_complete: {
        title: '⏰ ¡Descanso terminado!',
        body: data.message || `Es hora de continuar con ${data.exercise || 'el siguiente ejercicio'}`,
        actions: [
          { action: 'open', title: '💪 Continuar' }
        ]
      },
      achievement: {
        title: '🏆 ¡Nuevo logro desbloqueado!',
        body: data.message || '¡Felicitaciones por tu progreso!',
        actions: [
          { action: 'view-progress', title: '📈 Ver progreso' },
          { action: 'open', title: '🎉 Celebrar' }
        ]
      },
      streak: {
        title: `🔥 ¡Racha de ${data.days || 1} días!`,
        body: data.message || '¡Sigue así, estás en fuego!',
        actions: [
          { action: 'open', title: '💪 Continuar racha' }
        ]
      },
      weekly_summary: {
        title: '📊 Resumen semanal',
        body: data.message || 'Revisa tu progreso de la semana',
        actions: [
          { action: 'view-progress', title: '📈 Ver resumen' }
        ]
      },
      rest_timer: {
        title: '⏰ ¡Descanso terminado!',
        body: data.message || `¡Es hora de continuar: ${data.exercise || 'el siguiente ejercicio'}! 💪`,
        vibrate: [300, 100, 300, 100, 300],
        actions: [
          { action: 'open', title: '💪 Continuar entrenamiento' },
          { action: 'add-rest', title: '⏰ +30s más' }
        ]
      },
      workout_reminder: {
        title: '💪 ¡Hora de entrenar!',
        body: data.message || `Es hora de tu rutina de ${data.workoutType || 'entrenamiento'} 🏋️`,
        actions: [
          { action: 'start-workout', title: '🏃‍♂️ Empezar ahora' },
          { action: 'snooze', title: '⏰ Recordar en 15 min' }
        ]
      },
      daily_motivation: {
        title: '🔥 ¡Motivación diaria!',
        body: data.message || '¡Hoy es un gran día para entrenar! ¿Estás listo para superarte?',
        actions: [
          { action: 'open', title: '💪 ¡Vamos!' },
          { action: 'dismiss', title: '😴 Más tarde' }
        ]
      },
      streak_motivation: {
        title: `🔥 ¡Racha de ${data.days || 1} días!`,
        body: data.message || `¡Increíble! Llevas ${data.days || 1} días consecutivos entrenando. ¡No rompas la racha!`,
        actions: [
          { action: 'open', title: '🏆 Ver progreso' },
          { action: 'share', title: '📱 Compartir logro' }
        ]
      },
      personal_record: {
        title: '🏆 ¡Nuevo récord personal!',
        body: data.message || `¡Felicitaciones! Nuevo récord en ${data.exercise || 'ejercicio'}: ${data.newRecord || 'N/A'}`,
        actions: [
          { action: 'view-progress', title: '📈 Ver estadísticas' },
          { action: 'share', title: '🎉 Celebrar' }
        ]
      },
      workout_completed: {
        title: '✅ ¡Entrenamiento completado!',
        body: data.message || `¡Excelente trabajo! Has completado tu rutina de ${data.workoutType || 'entrenamiento'}`,
        actions: [
          { action: 'view-summary', title: '📊 Ver resumen' },
          { action: 'share', title: '💪 Compartir logro' }
        ]
      },
      social_like: {
        title: '👍 ¡Alguien le gustó tu progreso!',
        body: data.message || `A ${data.userName || 'alguien'} le gustó tu ${data.activityType || 'actividad'}`,
        actions: [
          { action: 'view-activity', title: '👀 Ver actividad' },
          { action: 'open', title: '💬 Responder' }
        ]
      },
      social_comment: {
        title: '💬 Nuevo comentario',
        body: data.message || `${data.userName || 'Alguien'} comentó en tu ${data.activityType || 'publicación'}`,
        actions: [
          { action: 'view-comments', title: '💬 Ver comentarios' },
          { action: 'reply', title: '✍️ Responder' }
        ]
      },
      challenge_invite: {
        title: '🎯 ¡Desafío recibido!',
        body: data.message || `${data.userName || 'Alguien'} te ha retado a un desafío de fitness`,
        actions: [
          { action: 'accept-challenge', title: '✅ Aceptar' },
          { action: 'view-challenge', title: '👀 Ver detalles' }
        ]
      }
    };

    const template = fitnessNotifications[type];
    if (!template) {
      return res.status(400).json({
        error: 'Tipo de notificación no válido',
        validTypes: Object.keys(fitnessNotifications)
      });
    }

    const payload = JSON.stringify({
      ...template,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: type,
      data: {
        type,
        ...data,
        timestamp: Date.now()
      }
    });

    const results = await sendToAllSubscriptions(payload);
    
    res.json({
      success: true,
      message: `Notificación de ${type} enviada`,
      results,
      totalSubscriptions: subscriptions.size
    });

  } catch (error) {
    console.error('❌ Error enviando notificación fitness:', error);
    res.status(500).json({
      error: 'Error enviando notificación fitness',
      message: error.message
    });
  }
});

// Obtener estadísticas de suscripciones
app.get('/api/push/stats', (req, res) => {
  const stats = {
    totalSubscriptions: subscriptions.size,
    activeSubscriptions: Array.from(subscriptions.values()).filter(sub => sub.isActive).length,
    subscriptionsByUserAgent: {},
    oldestSubscription: null,
    newestSubscription: null
  };

  Array.from(subscriptions.values()).forEach(sub => {
    // Agrupar por UserAgent
    const ua = sub.userAgent.includes('Chrome') ? 'Chrome' :
               sub.userAgent.includes('Firefox') ? 'Firefox' :
               sub.userAgent.includes('Safari') ? 'Safari' : 'Other';
    
    stats.subscriptionsByUserAgent[ua] = (stats.subscriptionsByUserAgent[ua] || 0) + 1;
    
    // Encontrar más antigua y más nueva
    if (!stats.oldestSubscription || sub.createdAt < stats.oldestSubscription) {
      stats.oldestSubscription = sub.createdAt;
    }
    if (!stats.newestSubscription || sub.createdAt > stats.newestSubscription) {
      stats.newestSubscription = sub.createdAt;
    }
  });

  res.json(stats);
});

// === FUNCIONES AUXILIARES ===

// Generar ID único para suscripción basado en endpoint
function generateSubscriptionId(endpoint) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(endpoint).digest('hex').substring(0, 8);
}

// Enviar notificación a todas las suscripciones
async function sendToAllSubscriptions(payload) {
  const results = {
    successful: 0,
    failed: 0,
    errors: []
  };

  const promises = Array.from(subscriptions.entries()).map(async ([id, subscriptionData]) => {
    try {
      await webpush.sendNotification(subscriptionData.subscription, payload);
      subscriptionData.lastUsed = Date.now();
      results.successful++;
      console.log(`✅ Notificación enviada a: ${id}`);
    } catch (error) {
      results.failed++;
      results.errors.push({
        subscriptionId: id,
        error: error.message,
        statusCode: error.statusCode
      });
      
      // Si la suscripción es inválida (410 Gone), eliminarla
      if (error.statusCode === 410) {
        console.log(`🗑️ Eliminando suscripción inválida: ${id}`);
        subscriptions.delete(id);
      } else {
        console.error(`❌ Error enviando a ${id}:`, error.message);
      }
    }
  });

  await Promise.all(promises);
  return results;
}

// === ENDPOINTS DE TESTING PARA DESARROLLO ===

// Panel de control simple para testing
app.get('/api/push/test-panel', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>🔔 Panel de Pruebas Push</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 5px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .stats { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        input, textarea { width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 3px; }
      </style>
    </head>
    <body>
      <h1>🔔 Panel de Pruebas - Notificaciones Push</h1>
      <div class="stats">
        <h3>📊 Estadísticas</h3>
        <p>Suscripciones activas: <strong>${subscriptions.size}</strong></p>
        <button onclick="refreshStats()">🔄 Actualizar</button>
      </div>
      
      <h3>🧪 Enviar Notificación de Prueba</h3>
      <input id="title" placeholder="Título de la notificación" value="🏋️ ¡Prueba desde servidor!" />
      <textarea id="body" placeholder="Mensaje">Esta es una notificación de prueba desde el servidor de Fit.</textarea>
      <button onclick="sendTest()">📤 Enviar a Todos</button>
      
      <h3>💪 Notificaciones de Fitness</h3>
      <div style="margin: 10px 0;">
        <h4>Entrenamientos:</h4>
        <button onclick="sendFitness('workout_reminder', {workoutType: 'piernas'})">💪 Recordatorio de Entrenamiento</button>
        <button onclick="sendFitness('rest_timer', {exercise: 'Press de banca'})">⏰ Descanso Terminado</button>
        <button onclick="sendFitness('workout_completed', {workoutType: 'pecho'})">✅ Entrenamiento Completado</button>
      </div>
      
      <div style="margin: 10px 0;">
        <h4>Progreso y Logros:</h4>
        <button onclick="sendFitness('achievement', {name: 'Primer mes'})">🏆 Logro Desbloqueado</button>
        <button onclick="sendFitness('personal_record', {exercise: 'Press banca', newRecord: '80kg'})">🏆 Nuevo Récord</button>
        <button onclick="sendFitness('streak_motivation', {days: 5})">🔥 Motivación Racha</button>
      </div>
      
      <div style="margin: 10px 0;">
        <h4>Motivación:</h4>
        <button onclick="sendFitness('daily_motivation')">🔥 Motivación Diaria</button>
      </div>
      
      <div style="margin: 10px 0;">
        <h4>Sociales:</h4>
        <button onclick="sendFitness('social_like', {userName: 'Juan', activityType: 'rutina de pecho'})">👍 Like Recibido</button>
        <button onclick="sendFitness('social_comment', {userName: 'Ana', activityType: 'entrenamiento'})">💬 Nuevo Comentario</button>
        <button onclick="sendFitness('challenge_invite', {userName: 'Carlos'})">🎯 Desafío Recibido</button>
      </div>
      
      <script>
        async function sendTest() {
          const title = document.getElementById('title').value;
          const body = document.getElementById('body').value;
          
          try {
            const response = await fetch('/api/push/send-all', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title, body })
            });
            const result = await response.json();
            alert('✅ ' + result.message);
            refreshStats();
          } catch (error) {
            alert('❌ Error: ' + error.message);
          }
        }
        
        async function sendFitness(type, data = {}) {
          try {
            const response = await fetch('/api/push/send-fitness', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, data })
            });
            const result = await response.json();
            alert('✅ ' + result.message);
          } catch (error) {
            alert('❌ Error: ' + error.message);
          }
        }
        
        function refreshStats() {
          location.reload();
        }
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

// Servir la aplicación React para todas las rutas no API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// === INICIAR SERVIDOR ===

app.listen(PORT, () => {
  console.log('\n🚀 Servidor Push iniciado correctamente');
  console.log(`📡 Servidor ejecutándose en: http://localhost:${PORT}`);
  console.log(`🧪 Panel de pruebas: http://localhost:${PORT}/api/push/test-panel`);
  console.log(`🔑 Clave pública VAPID: ${VAPID_KEYS.publicKey.substring(0, 20)}...`);
  console.log(`📊 Suscripciones activas: ${subscriptions.size}\n`);
});

module.exports = app;
