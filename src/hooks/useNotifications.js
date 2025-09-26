import { useCallback } from 'react';
import { usePushNotifications } from './usePushNotifications';
import { useAudioNotifications } from './useAudioNotifications';
import { useAdvancedToast } from '../components/notifications/ToastSystem';

/**
 * Hook integrado que combina todas las funcionalidades de notificaciones:
 * - Notificaciones Push (Service Worker)
 * - Notificaciones Toast (UI)
 * - Alertas de Audio (Web Audio API)
 * 
 * Proporciona una API unificada para el sistema completo de notificaciones
 */
export const useNotifications = () => {
  // Hooks individuales
  const pushNotifications = usePushNotifications();
  const audioNotifications = useAudioNotifications();
  const toast = useAdvancedToast();

  // === CONFIGURACIÓN INICIAL ===
  
  const initializeNotifications = useCallback(async () => {
    try {
      // Intentar inicializar las notificaciones push si el permiso ya está concedido
      if (pushNotifications.permission === 'granted' && !pushNotifications.isSubscribed) {
        await pushNotifications.subscribeToPush();
      }
      
      // Desbloquear audio en la primera interacción si es posible
      if (audioNotifications.isSupported && !audioNotifications.isAudioUnlocked) {
        // Se desbloqueará automáticamente en la primera interacción del usuario
      }
      
      return true;
    } catch (error) {
      console.warn('Error inicializando notificaciones:', error);
      return false;
    }
  }, [pushNotifications, audioNotifications]);

  // === FUNCIONES DE NOTIFICACIÓN PARA FITNESS ===

  /**
   * Notificación completa cuando el descanso termina
   */
  const notifyRestComplete = useCallback((exerciseName) => {
    // Toast visible
    toast.workout(`¡Descanso terminado! Es hora de: ${exerciseName}`, {
      duration: 5000
    });
    
    // Sonido de alerta
    audioNotifications.playRestComplete();
    
    // Si la app no está visible, el Service Worker ya manejará la notificación push
  }, [toast, audioNotifications]);

  /**
   * Notificación de logro desbloqueado
   */
  const notifyAchievement = useCallback((achievementName, description) => {
    // Toast especial de logro
    toast.achievement(description || `¡Has desbloqueado: ${achievementName}!`, {
      duration: 8000
    });
    
    // Sonido especial de logro
    audioNotifications.playAchievement();
  }, [toast, audioNotifications]);

  /**
   * Notificación de racha de entrenamientos
   */
  const notifyStreak = useCallback((days, message) => {
    toast.streak(days, {
      message: message || `¡Llevas ${days} días consecutivos entrenando!`
    });
    
    // Secuencia de sonidos para celebrar
    audioNotifications.playAchievement();
  }, [toast, audioNotifications]);

  /**
   * Notificación de inicio de entrenamiento
   */
  const notifyWorkoutStart = useCallback((workoutName) => {
    toast.workout(`¡Comenzando: ${workoutName}! 💪`, {
      duration: 3000
    });
    
    audioNotifications.playWorkoutStart();
  }, [toast, audioNotifications]);

  /**
   * Countdown para ejercicios (3, 2, 1, ¡Ya!)
   */
  const startCountdown = useCallback(async (count = 3, onComplete) => {
    for (let i = count; i > 0; i--) {
      toast.custom({
        type: 'workout',
        title: '⏱️ Preparándose...',
        message: `${i}`,
        duration: 1000
      });
      
      audioNotifications.playCountdown();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Sonido de inicio
    audioNotifications.playWorkoutStart();
    
    toast.workout('¡Ya! ¡A entrenar!', {
      duration: 2000
    });
    
    if (onComplete) {
      onComplete();
    }
  }, [toast, audioNotifications]);

  /**
   * Timer visual para descansos con sonido
   */
  const startRestTimer = useCallback((exerciseName, seconds, onSkip) => {
    // Toast con barra de progreso y botón para saltar
    const toastId = toast.restTimer(exerciseName, seconds, onSkip);
    
    // Programar sonido cuando termine (a través del Service Worker si es posible)
    if (pushNotifications.sendMessageToSW) {
      pushNotifications.sendMessageToSW({
        type: 'SCHEDULE_REST_NOTIFICATION',
        duration: seconds,
        exerciseName,
        endTime: Date.now() + (seconds * 1000)
      });
    }
    
    return toastId;
  }, [toast, pushNotifications]);

  // === NOTIFICACIONES DE PROGRESO ===

  const notifyProgressUpdate = useCallback((title, message, value) => {
    toast.progress(title, message);
  }, [toast]);

  const notifyWeightUpdate = useCallback((newWeight, difference) => {
    const message = difference > 0 
      ? `Has ganado ${difference}kg 📈` 
      : `Has perdido ${Math.abs(difference)}kg 📉`;
    
    notifyProgressUpdate('Peso actualizado', message);
  }, [notifyProgressUpdate]);

  const notifyPRBroken = useCallback((exercise, newRecord, oldRecord) => {
    const improvement = newRecord - oldRecord;
    toast.achievement(
      `¡Nuevo récord en ${exercise}! Mejoraste ${improvement}kg respecto a tu marca anterior`,
      { duration: 10000 }
    );
    
    audioNotifications.playAchievement();
  }, [toast, audioNotifications]);

  // === NOTIFICACIONES DE ERROR/ÉXITO ===

  const notifyError = useCallback((message, title = 'Error') => {
    toast.error(message, { title });
    audioNotifications.playSound('error');
  }, [toast, audioNotifications]);

  const notifySuccess = useCallback((message, title = 'Éxito') => {
    toast.success(message, { title });
    audioNotifications.playSound('success');
  }, [toast, audioNotifications]);

  const notifyWarning = useCallback((message, title = 'Advertencia') => {
    toast.warning(message, { title });
    audioNotifications.playSound('warning');
  }, [toast, audioNotifications]);

  // === CONFIGURACIÓN Y UTILIDADES ===

  const requestAllPermissions = useCallback(async () => {
    try {
      // Solicitar permisos de notificación
      const notificationPermission = await pushNotifications.requestPermission();
      
      // Intentar desbloquear audio
      const audioUnlocked = await audioNotifications.unlockAudio();
      
      if (notificationPermission === 'granted') {
        await pushNotifications.subscribeToPush();
      }
      
      return {
        notifications: notificationPermission === 'granted',
        audio: audioUnlocked,
        push: pushNotifications.isSubscribed
      };
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      notifyError('No se pudieron configurar las notificaciones');
      return {
        notifications: false,
        audio: false,
        push: false
      };
    }
  }, [pushNotifications, audioNotifications, notifyError]);

  const getSystemStatus = useCallback(async () => {
    const swStatus = await pushNotifications.getServiceWorkerStatus();
    const audioStatus = audioNotifications.getStatus();
    
    return {
      push: {
        supported: pushNotifications.isSupported,
        subscribed: pushNotifications.isSubscribed,
        permission: pushNotifications.permission
      },
      audio: {
        supported: audioStatus.isSupported,
        enabled: audioStatus.isEnabled,
        unlocked: audioStatus.isAudioUnlocked,
        volume: audioStatus.volume
      },
      serviceWorker: swStatus,
      overall: {
        fullyConfigured: 
          pushNotifications.isSubscribed && 
          audioNotifications.isAudioUnlocked && 
          pushNotifications.permission === 'granted'
      }
    };
  }, [pushNotifications, audioNotifications]);

  const updateAudioSettings = useCallback((settings) => {
    audioNotifications.updatePreferences(settings);
    notifySuccess('Configuración de audio actualizada');
  }, [audioNotifications, notifySuccess]);

  const testAllSystems = useCallback(async () => {
    notifySuccess('Probando sistema de notificaciones...');
    
    setTimeout(() => audioNotifications.testAudio(), 500);
    setTimeout(() => notifyAchievement('Sistema de Prueba', 'Todas las notificaciones funcionan correctamente'), 1000);
    setTimeout(() => notifyStreak(7, 'Esta es una prueba de racha'), 2000);
  }, [notifySuccess, audioNotifications, notifyAchievement, notifyStreak]);

  // === RETURN API UNIFICADA ===
  
  return {
    // Inicialización
    initialize: initializeNotifications,
    requestPermissions: requestAllPermissions,
    
    // Notificaciones específicas de fitness
    restComplete: notifyRestComplete,
    achievement: notifyAchievement,
    streak: notifyStreak,
    workoutStart: notifyWorkoutStart,
    countdown: startCountdown,
    restTimer: startRestTimer,
    
    // Progreso
    progress: notifyProgressUpdate,
    weightUpdate: notifyWeightUpdate,
    personalRecord: notifyPRBroken,
    
    // Básicas
    success: notifySuccess,
    error: notifyError,
    warning: notifyWarning,
    
    // Toast directo para casos especiales
    toast,
    
    // Configuración
    audio: {
      updateSettings: updateAudioSettings,
      test: audioNotifications.testAudio,
      ...audioNotifications
    },
    
    push: {
      ...pushNotifications
    },
    
    // Utilidades
    getStatus: getSystemStatus,
    test: testAllSystems,
    
    // Estado general
    isFullyConfigured: 
      pushNotifications.isSubscribed && 
      audioNotifications.isAudioUnlocked && 
      pushNotifications.permission === 'granted'
  };
};
