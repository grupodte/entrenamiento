/**
 * Funciones principales para notificaciones del sistema de entrenamiento
 * - Notificar días de entrenamiento programados
 * - Notificar cuando una pausa termina
 */

class NotificacionesEntrenamiento {
  constructor() {
    this.swRegistration = null;
    this.activeTimers = new Set(); // Para trackear timers activos
    this.isTestRunning = false; // Prevenir spam de tests
    this.init();
  }

  async init() {
    try {
      // Esperar a que el SW esté listo
      this.swRegistration = await navigator.serviceWorker.ready;
      console.log('✅ NotificacionesEntrenamiento: Service Worker listo');
      
      // Verificar permisos
      await this.verificarPermisos();
    } catch (error) {
      console.error('❌ Error inicializando notificaciones:', error);
    }
  }

  async verificarPermisos() {
    if (!('Notification' in window)) {
      throw new Error('Las notificaciones no son soportadas');
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.warn('⚠️ Permisos de notificación no concedidos');
      return false;
    }

    console.log('✅ Permisos de notificación: OK');
    return true;
  }

  /**
   * 1. FUNCIÓN PRINCIPAL: Notificar día de entrenamiento
   */
  async notificarDiaEntrenamiento(tipoEntrenamiento, hora = null) {
    console.log(`🏋️ Programando notificación de entrenamiento: ${tipoEntrenamiento}`);

    try {
      const ahora = new Date();
      let horaNotificacion;

      // Si no se especifica hora, usar hora actual + 1 minuto (para pruebas)
      if (!hora) {
        horaNotificacion = new Date(ahora.getTime() + 60000); // +1 minuto
      } else {
        horaNotificacion = new Date(hora);
      }

      const notificationData = {
        title: '🏋️ ¡Es hora de entrenar!',
        body: `Tu rutina de ${tipoEntrenamiento} te está esperando 💪`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: `workout-${tipoEntrenamiento.toLowerCase()}`,
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300],
        actions: [
          {
            action: 'start-workout',
            title: '🚀 Empezar ahora',
            icon: '/icons/icon-72x72.png'
          },
          {
            action: 'snooze',
            title: '⏰ Recordar en 10 min'
          },
          {
            action: 'dismiss',
            title: '❌ No hoy'
          }
        ],
        data: {
          type: 'workout-reminder',
          workoutType: tipoEntrenamiento,
          timestamp: horaNotificacion.getTime(),
          url: '/dashboard'
        }
      };

      // Programar usando setTimeout si es para muy pronto
      const tiempoHasta = horaNotificacion.getTime() - ahora.getTime();
      
      if (tiempoHasta <= 60000) { // Si es dentro de 1 minuto, usar setTimeout
        setTimeout(() => {
          this.mostrarNotificacion(notificationData);
        }, Math.max(0, tiempoHasta));
        
        console.log(`⏰ Notificación programada para ${horaNotificacion.toLocaleTimeString()}`);
        return true;
      }

      // Para tiempos más largos, guardar en localStorage y usar Web Workers o similar
      this.programarNotificacionLargoPlazo(notificationData, horaNotificacion);
      return true;

    } catch (error) {
      console.error('❌ Error notificando día de entrenamiento:', error);
      return false;
    }
  }

  /**
   * 2. FUNCIÓN PRINCIPAL: Notificar fin de pausa
   */
  async notificarFinPausa(ejercicio, tiempoPausa = 60) {
    console.log(`⏸️ Programando fin de pausa: ${ejercicio} (${tiempoPausa}s)`);

    try {
      const finPausa = Date.now() + (tiempoPausa * 1000);

      // Enviar al Service Worker
      if (this.swRegistration && this.swRegistration.active) {
        this.swRegistration.active.postMessage({
          type: 'SCHEDULE_REST_NOTIFICATION',
          duration: tiempoPausa,
          exerciseName: ejercicio,
          endTime: finPausa
        });
      }

      // También programar localmente como backup
      setTimeout(() => {
        this.mostrarNotificacionFinPausa(ejercicio);
      }, tiempoPausa * 1000);

      console.log(`⏰ Fin de pausa programado para ${new Date(finPausa).toLocaleTimeString()}`);
      return { finPausa, ejercicio, duracion: tiempoPausa };

    } catch (error) {
      console.error('❌ Error programando fin de pausa:', error);
      return null;
    }
  }

  // Función auxiliar para mostrar notificación de fin de pausa
  async mostrarNotificacionFinPausa(ejercicio) {
    const notificationData = {
      title: '⏱️ ¡Pausa terminada!',
      body: `Es hora de continuar con ${ejercicio} 💪`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'rest-complete',
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500],
      actions: [
        {
          action: 'continue',
          title: '💪 Continuar',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'extend',
          title: '⏰ +30s más'
        }
      ],
      data: {
        type: 'rest-finished',
        exerciseName: ejercicio,
        timestamp: Date.now(),
        url: '/dashboard'
      }
    };

    return this.mostrarNotificacion(notificationData);
  }

  // Función auxiliar general para mostrar notificaciones
  async mostrarNotificacion(data) {
    try {
      if (!await this.verificarPermisos()) {
        console.warn('❌ No se pueden mostrar notificaciones: sin permisos');
        return false;
      }

      // Verificar si la app está visible
      const appVisible = document.visibilityState === 'visible' && document.hasFocus();
      console.log(`👀 App visible: ${appVisible}`);

      if (this.swRegistration && !appVisible) {
        // App no visible: usar Service Worker
        await this.swRegistration.showNotification(data.title, {
          body: data.body,
          icon: data.icon,
          badge: data.badge,
          tag: data.tag,
          requireInteraction: data.requireInteraction,
          vibrate: data.vibrate,
          actions: data.actions,
          data: data.data
        });
        console.log('✅ Notificación mostrada via Service Worker');
      } else {
        // App visible: notificación directa más sutil
        const notification = new Notification(data.title, {
          body: data.body,
          icon: data.icon,
          tag: data.tag,
          requireInteraction: false, // Menos intrusiva cuando app visible
          silent: true // Sin sonido cuando app visible
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        setTimeout(() => notification.close(), 5000);
        console.log('✅ Notificación directa mostrada');
      }

      return true;
    } catch (error) {
      console.error('❌ Error mostrando notificación:', error);
      return false;
    }
  }

  // Para notificaciones de largo plazo (más de 1 minuto)
  programarNotificacionLargoPlazo(data, fechaHora) {
    // Guardar en localStorage para persistencia
    const notificacionesProgramadas = JSON.parse(
      localStorage.getItem('notificacionesProgramadas') || '[]'
    );

    const id = `notif_${Date.now()}`;
    notificacionesProgramadas.push({
      id,
      data,
      fechaHora: fechaHora.getTime(),
      creada: Date.now()
    });

    localStorage.setItem('notificacionesProgramadas', JSON.stringify(notificacionesProgramadas));
    console.log(`💾 Notificación guardada para ${fechaHora.toLocaleString()}`);

    // Verificar cada minuto las notificaciones pendientes
    this.iniciarVerificadorNotificaciones();
  }

  iniciarVerificadorNotificaciones() {
    if (this.verificadorInterval) {
      return; // Ya está iniciado
    }

    this.verificadorInterval = setInterval(() => {
      this.verificarNotificacionesPendientes();
    }, 60000); // Cada minuto

    // Verificar inmediatamente también
    this.verificarNotificacionesPendientes();
  }

  verificarNotificacionesPendientes() {
    const notificacionesProgramadas = JSON.parse(
      localStorage.getItem('notificacionesProgramadas') || '[]'
    );

    const ahora = Date.now();
    const pendientes = [];

    notificacionesProgramadas.forEach(notif => {
      if (notif.fechaHora <= ahora) {
        // Es hora de mostrar esta notificación
        this.mostrarNotificacion(notif.data);
        console.log(`⏰ Notificación ejecutada: ${notif.data.title}`);
      } else {
        // Aún no es hora
        pendientes.push(notif);
      }
    });

    // Actualizar localStorage solo con las pendientes
    localStorage.setItem('notificacionesProgramadas', JSON.stringify(pendientes));
  }

  // === MÉTODOS DE PRUEBA ===

  async probarNotificacionEntrenamiento() {
    console.log('🧪 === PRUEBA: Notificación de día de entrenamiento ===');
    
    // Programar para 3 segundos en el futuro
    const futuro = new Date(Date.now() + 3000);
    
    await this.notificarDiaEntrenamiento('Piernas y Glúteos', futuro);
    
    console.log('✅ Prueba programada. La notificación aparecerá en 3 segundos.');
    console.log('💡 Minimiza la ventana para ver si aparece cuando la app no está visible.');
    
    return true;
  }

  async probarNotificacionPausa() {
    console.log('🧪 === PRUEBA: Notificación de fin de pausa ===');
    
    const resultado = await this.notificarFinPausa('Press de banca', 5); // 5 segundos
    
    if (resultado) {
      console.log('✅ Prueba programada. El fin de pausa se notificará en 5 segundos.');
      console.log('💡 Minimiza la ventana para ver si aparece cuando la app no está visible.');
    }
    
    return resultado;
  }

  async probarAmbas() {
    // Prevenir spam de tests
    if (this.isTestRunning) {
      console.log('⚠️ Test ya en progreso, usa limpiarTodo() para reiniciar');
      return false;
    }

    this.isTestRunning = true;
    console.log('🧲 === PRUEBA COMPLETA (NUEVA SESIÓN) ===');
    
    // Limpiar timers anteriores primero
    this.limpiarTimers();
    this.isTestRunning = true;
    
    console.log('🔔 Se ejecutará UNA prueba de cada tipo');
    
    // Solo una prueba de entrenamiento (3 segundos)
    const timer1 = setTimeout(async () => {
      console.log('🏁 PRUEBA 1: Notificación de entrenamiento');
      await this.mostrarNotificacion({
        title: '🏁 ¡Es hora de entrenar!',
        body: 'Tu rutina de Piernas y Glúteos te está esperando 💪',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: 'test-workout',
        requireInteraction: true,
        vibrate: [300, 100, 300],
        actions: [{
          action: 'start-workout',
          title: '🚀 Empezar ahora'
        }],
        data: {
          type: 'workout-reminder',
          workoutType: 'Piernas',
          url: '/dashboard'
        }
      });
      this.activeTimers.delete(timer1);
    }, 3000);
    
    // Solo una prueba de pausa (8 segundos)
    const timer2 = setTimeout(async () => {
      console.log('🏁 PRUEBA 2: Notificación de fin de pausa');
      await this.mostrarNotificacion({
        title: '⏱️ ¡Pausa terminada!',
        body: 'Es hora de continuar con Press de banca 💪',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: 'test-rest',
        requireInteraction: true,
        vibrate: [500, 200, 500],
        actions: [{
          action: 'continue',
          title: '💪 Continuar'
        }],
        data: {
          type: 'rest-finished',
          exerciseName: 'Press de banca',
          url: '/dashboard'
        }
      });
      this.activeTimers.delete(timer2);
      
      // Finalizar test
      setTimeout(() => {
        this.isTestRunning = false;
        console.log('✅ === PRUEBA COMPLETA FINALIZADA ===');
      }, 1000);
    }, 8000);
    
    // Trackear timers
    this.activeTimers.add(timer1);
    this.activeTimers.add(timer2);
    
    console.log('✅ 2 pruebas programadas: 3s y 8s');
    console.log('📱 INSTRUCCIÓN: Minimiza la ventana AHORA para ver notificaciones');
    
    return true;
  }

  // Limpiar todos los timers activos
  limpiarTimers() {
    console.log('🧹 Limpiando timers activos...');
    this.activeTimers.forEach(timerId => {
      clearTimeout(timerId);
      clearInterval(timerId);
    });
    this.activeTimers.clear();
    this.isTestRunning = false;
    console.log('✅ Timers limpiados');
  }

  // Limpiar recursos
  destruir() {
    this.limpiarTimers();
    if (this.verificadorInterval) {
      clearInterval(this.verificadorInterval);
      this.verificadorInterval = null;
    }
  }
}

// Crear instancia global
const notificacionesEntrenamiento = new NotificacionesEntrenamiento();

// Exponer funciones globales para pruebas fáciles
window.probarNotificaciones = () => {
  return notificacionesEntrenamiento.probarAmbas();
};

window.probarEntrenamiento = () => {
  return notificacionesEntrenamiento.probarNotificacionEntrenamiento();
};

window.probarPausa = () => {
  return notificacionesEntrenamiento.probarNotificacionPausa();
};

// Función para limpiar todo
window.limpiarTodo = () => {
  notificacionesEntrenamiento.limpiarTimers();
  console.clear();
  console.log('🧹 Sistema de notificaciones limpiado y listo');
};

// Exportar para uso en otros archivos
export default notificacionesEntrenamiento;

console.log('🔔 Sistema de notificaciones cargado (versión sin spam)');
console.log('🧲 Pruebas disponibles:');
console.log('  • probarNotificaciones() - Prueba ambas funciones (SIN SPAM)');
console.log('  • probarEntrenamiento() - Solo día de entrenamiento');
console.log('  • probarPausa() - Solo fin de pausa');
console.log('  • limpiarTodo() - Limpiar timers y consola');
console.log('');
console.log('👉 Para probar: ejecuta probarNotificaciones() y minimiza ventana inmediatamente');
