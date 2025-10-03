/**
 * Sistema de notificaciones específico para iOS
 * iOS no soporta notificaciones push de la misma manera que Android
 */

class NotificacionesIOS {
  constructor() {
    this.isIOS = this.detectarIOS();
    this.isStandalone = this.detectarPWAStandalone();
    this.activeTimers = new Set();
    this.notificationQueue = [];
    
    console.log('📱 iOS detectado:', this.isIOS);
    console.log('📱 PWA Standalone:', this.isStandalone);
    
    if (this.isIOS) {
      this.inicializarSistemaIOS();
    }
  }

  detectarIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  detectarPWAStandalone() {
    return window.navigator.standalone === true ||
           window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches;
  }

  inicializarSistemaIOS() {
    console.log('🍎 Inicializando sistema iOS...');
    
    // Solicitar permisos inmediatamente en iOS
    this.solicitarPermisosIOS();
    
    // Configurar listeners específicos de iOS
    this.configurarListenersIOS();
    
    // Sistema de fallback para notificaciones
    this.configurarFallbackNotificaciones();
  }

  async solicitarPermisosIOS() {
    if (!('Notification' in window)) {
      console.log('❌ Notificaciones no soportadas en este dispositivo');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('🔔 Permisos iOS:', permission);
      
      if (permission === 'granted') {
        // En iOS, probar inmediatamente que funcionen
        this.probarNotificacionIOS();
      }
      
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Error solicitando permisos iOS:', error);
      return false;
    }
  }

  probarNotificacionIOS() {
    try {
      const testNotification = new Notification('🍎 iOS Configurado', {
        body: 'Las notificaciones están funcionando en tu iPhone',
        icon: '/icons/pwa-icon.png',
        badge: '/icons/pwa-icon.png',
        tag: 'ios-test',
        requireInteraction: false,
        silent: false
      });

      testNotification.onclick = () => {
        console.log('✅ Test notification clicked');
        testNotification.close();
      };

      setTimeout(() => {
        testNotification.close();
      }, 4000);

      console.log('✅ Notificación de prueba iOS enviada');
    } catch (error) {
      console.error('❌ Error en notificación de prueba iOS:', error);
    }
  }

  configurarListenersIOS() {
    // Listener para cuando la app regresa al foreground
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 App iOS volvió a foreground');
        this.procesarColaNotificaciones();
      }
    });

    // Listener para cuando la app va a background
    window.addEventListener('pagehide', () => {
      console.log('📱 App iOS fue a background');
    });

    // Listener específico para PWA standalone
    if (this.isStandalone) {
      window.addEventListener('appinstalled', () => {
        console.log('📱 PWA instalada en iOS');
      });
    }
  }

  configurarFallbackNotificaciones() {
    // En iOS, las notificaciones solo funcionan si:
    // 1. La app está en foreground, o
    // 2. El usuario interactuó recientemente
    
    this.fallbackActive = true;
    console.log('📱 Sistema fallback iOS activado');
  }

  async mostrarNotificacionIOS(data) {
    if (!this.isIOS) {
      return false;
    }

    try {
      const permission = Notification.permission;
      
      if (permission !== 'granted') {
        console.log('❌ Sin permisos para notificaciones iOS');
        return false;
      }

      // En iOS, verificar si la app está visible
      const appVisible = document.visibilityState === 'visible' && !document.hidden;
      
      if (appVisible) {
        // App visible: mostrar toast interno en lugar de notificación del sistema
        console.log('📱 App visible, mostrando toast interno');
        this.mostrarToastInterno(data);
        return true;
      }

      // App no visible: intentar notificación del sistema
      console.log('📱 App no visible, intentando notificación sistema iOS');
      
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/icons/pwa-icon.png',
        badge: '/icons/pwa-icon.png',
        tag: data.tag || 'ios-notification',
        requireInteraction: true, // Importante en iOS
        silent: false,
        data: data.data || {}
      });

      notification.onclick = () => {
        console.log('📱 Notificación iOS clickeada');
        
        // En iOS PWA, navegar correctamente
        if (this.isStandalone) {
          const url = data.data?.url || '/';
          window.location.href = url;
        } else {
          window.focus();
        }
        
        notification.close();
      };

      // Auto-cerrar después de 10 segundos
      setTimeout(() => {
        notification.close();
      }, 10000);

      return true;
      
    } catch (error) {
      console.error('❌ Error mostrando notificación iOS:', error);
      
      // Fallback: guardar en cola para mostrar cuando app esté visible
      this.notificationQueue.push(data);
      console.log('📱 Notificación agregada a cola iOS');
      
      return false;
    }
  }

  mostrarToastInterno(data) {
    // Crear toast visual interno para cuando la app está visible
    const toast = document.createElement('div');
    toast.className = 'ios-toast-notification';
    toast.innerHTML = `
      <div style="
        position: fixed;
        top: 50px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        z-index: 10000;
        max-width: 90vw;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        backdrop-filter: blur(10px);
      ">
        <div style="font-weight: 600; margin-bottom: 4px;">${data.title}</div>
        <div style="font-size: 14px; opacity: 0.9;">${data.body}</div>
      </div>
    `;

    document.body.appendChild(toast);

    // Animación de entrada
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
    toast.style.transition = 'all 0.3s ease-out';
    
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);

    // Auto-remover después de 4 segundos
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 4000);

    console.log('📱 Toast interno iOS mostrado');
  }

  procesarColaNotificaciones() {
    if (this.notificationQueue.length === 0) return;

    console.log(`📱 Procesando ${this.notificationQueue.length} notificaciones en cola`);
    
    this.notificationQueue.forEach((data, index) => {
      setTimeout(() => {
        this.mostrarToastInterno({
          ...data,
          title: `⏰ ${data.title}`,
          body: data.body + ' (perdida mientras app estaba cerrada)'
        });
      }, index * 500);
    });

    this.notificationQueue = [];
  }

  // Funciones principales adaptadas para iOS
  async notificarDiaEntrenamientoIOS(tipoEntrenamiento, hora = null) {
    console.log(`🍎 Programando entrenamiento iOS: ${tipoEntrenamiento}`);

    const ahora = new Date();
    const horaNotificacion = hora ? new Date(hora) : new Date(ahora.getTime() + 3000);
    
    const data = {
      title: '🏋️ ¡Es hora de entrenar!',
      body: `Tu rutina de ${tipoEntrenamiento} te está esperando 💪`,
      icon: '/icons/pwa-icon.png',
      tag: `workout-ios-${Date.now()}`,
      data: {
        type: 'workout-reminder',
        workoutType: tipoEntrenamiento,
        url: this.isStandalone ? '/dashboard' : `${window.location.origin}/dashboard`
      }
    };

    const tiempoHasta = horaNotificacion.getTime() - ahora.getTime();
    
    const timerId = setTimeout(() => {
      this.mostrarNotificacionIOS(data);
      this.activeTimers.delete(timerId);
    }, Math.max(0, tiempoHasta));

    this.activeTimers.add(timerId);
    
    console.log(`🍎 Entrenamiento iOS programado para ${horaNotificacion.toLocaleTimeString()}`);
    return true;
  }

  async notificarFinPausaIOS(ejercicio, tiempoPausa = 60) {
    console.log(`🍎 Programando fin pausa iOS: ${ejercicio} (${tiempoPausa}s)`);

    const data = {
      title: '⏱️ ¡Pausa terminada!',
      body: `Es hora de continuar con ${ejercicio} 💪`,
      icon: '/icons/pwa-icon.png',
      tag: `rest-ios-${Date.now()}`,
      data: {
        type: 'rest-finished',
        exerciseName: ejercicio,
        url: this.isStandalone ? '/dashboard' : `${window.location.origin}/dashboard`
      }
    };

    const timerId = setTimeout(() => {
      this.mostrarNotificacionIOS(data);
      this.activeTimers.delete(timerId);
    }, tiempoPausa * 1000);

    this.activeTimers.add(timerId);
    
    console.log(`🍎 Fin pausa iOS programado en ${tiempoPausa}s`);
    return { finPausa: Date.now() + (tiempoPausa * 1000), ejercicio, duracion: tiempoPausa };
  }

  // Función de prueba específica para iOS
  async probarNotificacionesIOS() {
    if (!this.isIOS) {
      console.log('❌ Esta función es solo para iOS');
      return false;
    }

    console.log('🧪 === PRUEBA ESPECÍFICA iOS ===');
    console.log('📱 Dispositivo:', navigator.userAgent);
    console.log('📱 Standalone:', this.isStandalone);
    console.log('📱 Permisos:', Notification.permission);

    // Limpiar timers anteriores
    this.limpiarTimers();

    // Prueba 1: Notificación inmediata (app visible)
    console.log('🍎 Prueba 1: Toast interno (ahora)');
    this.mostrarToastInterno({
      title: '🧪 Prueba iOS 1',
      body: 'Esta es una notificación cuando la app está visible'
    });

    // Prueba 2: Notificación después de 3 segundos
    setTimeout(() => {
      console.log('🍎 Prueba 2: Sistema de notificación (3s)');
      this.notificarDiaEntrenamientoIOS('Piernas iOS');
    }, 3000);

    // Prueba 3: Notificación de pausa después de 6 segundos
    setTimeout(() => {
      console.log('🍎 Prueba 3: Fin de pausa (6s)');
      this.notificarFinPausaIOS('Press de banca iOS', 3);
    }, 6000);

    console.log('✅ 3 pruebas iOS programadas');
    console.log('📱 INSTRUCCIÓN iOS:');
    console.log('   1. Espera 3s, luego MINIMIZA la app (botón home)');
    console.log('   2. Espera a ver si aparece notificación');
    console.log('   3. Si aparece, haz clic en ella');

    return true;
  }

  limpiarTimers() {
    console.log('🧹 Limpiando timers iOS...');
    this.activeTimers.forEach(timerId => {
      clearTimeout(timerId);
    });
    this.activeTimers.clear();
    this.notificationQueue = [];
    console.log('✅ Timers iOS limpiados');
  }
}

// Solo crear instancia si es iOS
const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

let notificacionesIOS = null;

if (esIOS) {
  notificacionesIOS = new NotificacionesIOS();
  
  // Exponer funciones globales específicas para iOS
  window.probarNotificacionesIOS = () => {
    return notificacionesIOS.probarNotificacionesIOS();
  };
  
  window.limpiarTimersIOS = () => {
    return notificacionesIOS.limpiarTimers();
  };
  
  console.log('🍎 Sistema iOS cargado');
  console.log('🧪 Funciones disponibles en iOS:');
  console.log('   • probarNotificacionesIOS() - Prueba específica iOS');
  console.log('   • limpiarTimersIOS() - Limpiar timers iOS');
} else {
  console.log('📱 No es iOS, sistema iOS no cargado');
}

export default notificacionesIOS;
