import { useCallback, useEffect } from 'react';
import { usePushNotifications } from './usePushNotifications';
import { useAudioNotifications } from './useAudioNotifications';
import { useAdvancedToast } from '../components/notifications/ToastSystem';
import { workoutScheduler } from '../utils/workoutScheduler';
import { progressTracker } from '../utils/progressTracker';

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

  // === LISTENERS AUTOMÁTICOS DE EVENTOS ===
  
  useEffect(() => {
    // Escuchar evento de descanso completado
    const handleRestCompleted = (event) => {
      const { exerciseName, showToast } = event.detail;
      
      if (showToast) {
        toast.workout(`¡Descanso terminado! Es hora de: ${exerciseName}`, {
          title: '⏰ Tiempo cumplido',
          duration: 5000
        });
      }
      
      console.log(`💪 Descanso completado automáticamente: ${exerciseName}`);
    };
    
    // Escuchar evento de agregar tiempo de descanso
    const handleAddRestTime = (event) => {
      const { additionalSeconds, exerciseName } = event.detail;
      
      toast.info(`Se agregaron ${additionalSeconds}s más de descanso para ${exerciseName}`, {
        title: '⏰ Descanso extendido',
        duration: 3000
      });
      
      // Reproducir sonido de confirmación
      audioNotifications.playSound('success');
      
      console.log(`⏰ Tiempo de descanso extendido: +${additionalSeconds}s para ${exerciseName}`);
    };
    
    // Añadir event listeners
    window.addEventListener('restCompleted', handleRestCompleted);
    window.addEventListener('addRestTime', handleAddRestTime);
    
    // Cleanup
    return () => {
      window.removeEventListener('restCompleted', handleRestCompleted);
      window.removeEventListener('addRestTime', handleAddRestTime);
    };
  }, [toast, audioNotifications]);

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
      
      // Inicializar recordatorios de entrenamiento programados
      workoutScheduler.initializeReminders();
      
      // Configurar sistema de progreso con notificaciones
      progressTracker.setNotificationSystem({
        workoutCompleted: (type, stats) => notifyWorkoutCompleted(type, stats),
        achievement: (name, description) => notifyAchievement(name, description),
        personalRecord: (exercise, newWeight, oldWeight) => notifyPRBroken(exercise, newWeight, oldWeight),
        streakMotivation: (days) => notifyStreakMotivation(days),
        weightUpdate: (newWeight, difference) => notifyWeightUpdate(newWeight, difference)
      });
      
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
   * Timer visual para descansos con sonido y notificación push
   */
  const startRestTimer = useCallback((exerciseName, seconds, onSkip, onComplete) => {
    console.log(`⏰ Iniciando timer de descanso: ${exerciseName} - ${seconds}s`);
    
    // Toast con barra de progreso y botón para saltar
    const toastId = toast.restTimer(exerciseName, seconds, () => {
      // Callback cuando el usuario salta el descanso
      if (onSkip) {
        onSkip();
      }
      toast.success('Descanso saltado - ¡A entrenar!', {
        duration: 2000
      });
      audioNotifications.playWorkoutStart();
    });
    
    // Programar notificación push y sonido cuando termine (a través del Service Worker)
    if (pushNotifications.sendMessageToSW) {
      pushNotifications.sendMessageToSW({
        type: 'SCHEDULE_REST_NOTIFICATION',
        duration: seconds,
        exerciseName,
        endTime: Date.now() + (seconds * 1000)
      });
    }
    
    // Timer local como backup (en caso de que el SW falle)
    const backupTimer = setTimeout(() => {
      console.log('Timer local completado como backup');
      if (onComplete) {
        onComplete();
      }
    }, seconds * 1000);
    
    return {
      toastId,
      timerId: backupTimer,
      cancel: () => {
        clearTimeout(backupTimer);
        toast.dismiss(toastId);
      }
    };
  }, [toast, pushNotifications, audioNotifications]);

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

  // === NOTIFICACIONES DE ENTRENAMIENTO ===

  const notifyWorkoutReminder = useCallback((workoutType, message) => {
    toast.workout(message || `¡Es hora de tu rutina de ${workoutType}! 💪`, {
      title: '⏰ Recordatorio de Entrenamiento',
      duration: 6000,
      action: 'Empezar ahora',
      onAction: () => {
        // Navegar al entrenamiento o ejecutar callback personalizado
        console.log('Iniciando entrenamiento:', workoutType);
      }
    });
    
    audioNotifications.playWorkoutStart();
  }, [toast, audioNotifications]);

  const notifyWorkoutCompleted = useCallback((workoutType, stats) => {
    const message = stats 
      ? `¡Excelente! Rutina de ${workoutType} completada: ${stats.exercises} ejercicios, ${stats.duration} min`
      : `¡Excelente trabajo! Has completado tu rutina de ${workoutType}`;
    
    toast.achievement(message, {
      title: '✅ Entrenamiento Completado',
      duration: 8000
    });
    
    audioNotifications.playAchievement();
  }, [toast, audioNotifications]);

  // === NOTIFICACIONES DE MOTIVACIÓN ===

  const notifyDailyMotivation = useCallback((customMessage) => {
    const messages = [
      '¡Hoy es un gran día para entrenar! ¿Estás listo para superarte?',
      '💪 Tu cuerpo puede hacerlo. Es tu mente la que necesita convencerse.',
      '¡Cada día eres más fuerte que ayer! ¡No te rindas!',
      '🏆 Los campeones se hacen cuando nadie los ve.',
      '¡Es hora de convertir el sudor en éxito!'
    ];
    
    const message = customMessage || messages[Math.floor(Math.random() * messages.length)];
    
    toast.custom({
      type: 'workout',
      title: '🔥 Motivación Diaria',
      message,
      duration: 7000
    });
    
    audioNotifications.playSound('success');
  }, [toast, audioNotifications]);

  const notifyStreakMotivation = useCallback((days, customMessage) => {
    const message = customMessage || `¡Increíble! Llevas ${days} días consecutivos entrenando. ¡No rompas la racha!`;
    
    toast.streak(days, {
      message,
      duration: 8000
    });
    
    // Secuencia especial de sonidos para rachas largas
    if (days >= 7) {
      audioNotifications.playCountdownSequence(3);
    } else {
      audioNotifications.playAchievement();
    }
  }, [toast, audioNotifications]);

  // === NOTIFICACIONES SOCIALES ===

  const notifySocialLike = useCallback((userName, activityType) => {
    toast.success(`A ${userName} le gustó tu ${activityType}`, {
      title: '👍 ¡Like recibido!',
      duration: 4000
    });
    
    audioNotifications.playSound('success');
  }, [toast, audioNotifications]);

  const notifySocialComment = useCallback((userName, activityType, comment) => {
    const message = comment 
      ? `${userName}: "${comment.length > 50 ? comment.slice(0, 50) + '...' : comment}"`
      : `${userName} comentó en tu ${activityType}`;
    
    toast.info(message, {
      title: '💬 Nuevo comentario',
      duration: 6000,
      action: 'Ver comentario',
      onAction: () => {
        console.log('Navegando a comentarios');
      }
    });
    
    audioNotifications.playSound('notification');
  }, [toast, audioNotifications]);

  const notifyChallengeInvite = useCallback((userName, challengeType) => {
    toast.custom({
      type: 'achievement',
      title: '🎯 ¡Desafío recibido!',
      message: `${userName} te ha retado a ${challengeType || 'un desafío de fitness'}`,
      duration: 8000,
      action: 'Ver desafío',
      onAction: () => {
        console.log('Navegando a desafío');
      }
    });
    
    audioNotifications.playAchievement();
  }, [toast, audioNotifications]);

  const notifyChallengeCompleted = useCallback((challengeName, reward) => {
    toast.achievement(
      reward 
        ? `¡Has completado "${challengeName}"! Recompensa: ${reward}`
        : `¡Felicitaciones! Has completado el desafío: ${challengeName}`,
      {
        title: '🏆 ¡Desafío completado!',
        duration: 10000
      }
    );
    
    audioNotifications.playCountdownSequence(2);
  }, [toast, audioNotifications]);

  // === SISTEMA DE RECORDATORIOS PROGRAMADOS ===

  const scheduleWorkoutReminder = useCallback((workoutData) => {
    const reminder = workoutScheduler.scheduleWorkoutReminder(workoutData);
    toast.success(`Recordatorio programado: ${workoutData.workoutType} a las ${workoutData.scheduledTime}`, {
      title: '⏰ Recordatorio creado',
      duration: 4000
    });
    return reminder;
  }, [toast]);

  const getScheduledReminders = useCallback(() => {
    return workoutScheduler.getActiveReminders();
  }, []);

  const removeWorkoutReminder = useCallback((id) => {
    workoutScheduler.removeReminder(id);
    toast.success('Recordatorio eliminado correctamente', {
      duration: 3000
    });
  }, [toast]);

  const setupDefaultReminders = useCallback(() => {
    workoutScheduler.createDefaultReminders();
    toast.success('Recordatorios por defecto configurados', {
      title: '✅ Sistema configurado',
      duration: 4000
    });
  }, [toast]);

  // === SISTEMA DE PROGRESO ===

  const recordWorkout = useCallback((workoutData) => {
    const workout = progressTracker.recordWorkout(workoutData);
    return workout;
  }, []);

  const recordWeightChange = useCallback((newWeight) => {
    const entry = progressTracker.recordWeightChange(newWeight);
    return entry;
  }, []);

  const getProgressStats = useCallback(() => {
    return progressTracker.getStats();
  }, []);

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
    notifySuccess('Probando sistema completo de notificaciones...');
    
    // Secuencia de pruebas con diferentes tipos
    const testSequence = [
      { delay: 500, fn: () => audioNotifications.testAudio() },
      { delay: 1000, fn: () => notifyWorkoutReminder('piernas') },
      { delay: 2000, fn: () => notifyDailyMotivation() },
      { delay: 3000, fn: () => notifyAchievement('Sistema de Prueba', 'Todas las notificaciones funcionan correctamente') },
      { delay: 4000, fn: () => notifyStreakMotivation(7) },
      { delay: 5000, fn: () => notifyPRBroken('Press de banca', 80, 75) },
      { delay: 6000, fn: () => notifySocialLike('Juan', 'rutina de pecho') },
      { delay: 7000, fn: () => notifyWorkoutCompleted('pecho', { exercises: 6, duration: 45 }) },
      { delay: 8000, fn: () => notifyChallengeInvite('Ana', 'desafío de 30 días') },
      { delay: 9000, fn: () => notifySuccess('✅ ¡Todas las notificaciones probadas exitosamente!') }
    ];
    
    testSequence.forEach(({ delay, fn }) => {
      setTimeout(fn, delay);
    });
  }, [
    notifySuccess, 
    audioNotifications, 
    notifyWorkoutReminder,
    notifyDailyMotivation,
    notifyAchievement, 
    notifyStreakMotivation,
    notifyPRBroken,
    notifySocialLike,
    notifyWorkoutCompleted,
    notifyChallengeInvite
  ]);

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
    
    // Entrenamientos
    workoutReminder: notifyWorkoutReminder,
    workoutCompleted: notifyWorkoutCompleted,
    
    // Recordatorios programados
    scheduleReminder: scheduleWorkoutReminder,
    getReminders: getScheduledReminders,
    removeReminder: removeWorkoutReminder,
    setupDefaultReminders,
    
    // Motivación
    dailyMotivation: notifyDailyMotivation,
    streakMotivation: notifyStreakMotivation,
    
    // Sociales
    socialLike: notifySocialLike,
    socialComment: notifySocialComment,
    challengeInvite: notifyChallengeInvite,
    challengeCompleted: notifyChallengeCompleted,
    
    // Progreso y seguimiento
    progress: notifyProgressUpdate,
    weightUpdate: notifyWeightUpdate,
    personalRecord: notifyPRBroken,
    recordWorkout,
    recordWeightChange,
    getStats: getProgressStats,
    
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
