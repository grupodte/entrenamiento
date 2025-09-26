import { useState, useEffect, useCallback, useRef } from 'react';

// Configuraciones de sonidos predefinidos
const SOUND_CONFIGS = {
  notification: {
    frequency: 800,
    duration: 200,
    pattern: [{ freq: 800, dur: 200 }],
    volume: 0.1
  },
  success: {
    frequency: 1000,
    duration: 150,
    pattern: [
      { freq: 800, dur: 100 },
      { freq: 1000, dur: 100 },
      { freq: 1200, dur: 150 }
    ],
    volume: 0.15
  },
  error: {
    frequency: 400,
    duration: 300,
    pattern: [
      { freq: 400, dur: 150 },
      { freq: 350, dur: 150 }
    ],
    volume: 0.12
  },
  warning: {
    frequency: 600,
    duration: 250,
    pattern: [
      { freq: 600, dur: 125 },
      { freq: 600, dur: 125 }
    ],
    volume: 0.1
  },
  rest_complete: {
    frequency: 880,
    duration: 400,
    pattern: [
      { freq: 440, dur: 100 },
      { freq: 660, dur: 100 },
      { freq: 880, dur: 200 }
    ],
    volume: 0.2
  },
  achievement: {
    frequency: 1200,
    duration: 600,
    pattern: [
      { freq: 523, dur: 150 }, // C
      { freq: 659, dur: 150 }, // E
      { freq: 784, dur: 150 }, // G
      { freq: 1047, dur: 150 } // C
    ],
    volume: 0.15
  },
  workout_start: {
    frequency: 1000,
    duration: 300,
    pattern: [
      { freq: 1000, dur: 100 },
      { freq: 1200, dur: 100 },
      { freq: 1000, dur: 100 }
    ],
    volume: 0.15
  },
  countdown: {
    frequency: 800,
    duration: 100,
    pattern: [{ freq: 800, dur: 100 }],
    volume: 0.1
  }
};

export const useAudioNotifications = () => {
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isEnabled, setIsEnabled] = useState(true);
  const unlockAttempted = useRef(false);
  const pendingSounds = useRef([]);

  // Verificar soporte del navegador
  useEffect(() => {
    const checkSupport = () => {
      const supported = 
        (window.AudioContext || window.webkitAudioContext) &&
        typeof navigator !== 'undefined';
      
      setIsSupported(supported);
      
      if (supported) {
        initializeAudioContext();
      }
    };

    checkSupport();
  }, []);

  // Inicializar AudioContext
  const initializeAudioContext = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      setAudioContext(ctx);
      
      // Verificar si el audio ya está desbloqueado
      if (ctx.state === 'running') {
        setIsAudioUnlocked(true);
      } else {
        console.log('AudioContext creado pero suspendido. Requiere interacción del usuario.');
      }
    } catch (error) {
      console.warn('No se pudo crear AudioContext:', error);
      setIsSupported(false);
    }
  }, []);

  // Patrón de desbloqueo por gesto del usuario
  const unlockAudio = useCallback(async () => {
    if (!audioContext || unlockAttempted.current) return false;

    unlockAttempted.current = true;

    try {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Reproducir un sonido silencioso para desbloquear
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configurar sonido silencioso
      gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      oscillator.type = 'sine';
      
      // Reproducir por un momento muy corto
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.01);
      
      setIsAudioUnlocked(true);
      console.log('Audio desbloqueado exitosamente');
      
      // Reproducir sonidos pendientes
      if (pendingSounds.current.length > 0) {
        pendingSounds.current.forEach(soundConfig => {
          playSound(soundConfig.type, soundConfig.options);
        });
        pendingSounds.current = [];
      }
      
      return true;
    } catch (error) {
      console.warn('Error desbloqueando audio:', error);
      return false;
    }
  }, [audioContext]);

  // Crear y reproducir un sonido
  const createSound = useCallback((config, customVolume = null) => {
    if (!audioContext || !isAudioUnlocked) {
      return null;
    }

    try {
      const masterGain = audioContext.createGain();
      masterGain.connect(audioContext.destination);
      
      const effectiveVolume = (customVolume ?? config.volume) * volume;
      masterGain.gain.setValueAtTime(effectiveVolume, audioContext.currentTime);
      
      let currentTime = audioContext.currentTime;
      
      config.pattern.forEach((note, index) => {
        const oscillator = audioContext.createOscillator();
        const noteGain = audioContext.createGain();
        
        oscillator.connect(noteGain);
        noteGain.connect(masterGain);
        
        // Configurar la nota
        oscillator.frequency.setValueAtTime(note.freq, currentTime);
        oscillator.type = 'sine';
        
        // Envelope ADSR suave
        const noteDuration = note.dur / 1000;
        const attackTime = Math.min(0.01, noteDuration * 0.1);
        const releaseTime = Math.min(0.05, noteDuration * 0.3);
        
        noteGain.gain.setValueAtTime(0, currentTime);
        noteGain.gain.linearRampToValueAtTime(1, currentTime + attackTime);
        noteGain.gain.setValueAtTime(1, currentTime + noteDuration - releaseTime);
        noteGain.gain.exponentialRampToValueAtTime(0.001, currentTime + noteDuration);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + noteDuration);
        
        currentTime += noteDuration + 0.02; // Pequeña pausa entre notas
      });
      
      return true;
    } catch (error) {
      console.warn('Error creando sonido:', error);
      return false;
    }
  }, [audioContext, isAudioUnlocked, volume]);

  // Función principal para reproducir sonidos
  const playSound = useCallback((soundType = 'notification', options = {}) => {
    if (!isEnabled || !isSupported) {
      return false;
    }

    const config = SOUND_CONFIGS[soundType] || SOUND_CONFIGS.notification;
    
    if (!isAudioUnlocked) {
      // Agregar a la cola de sonidos pendientes
      pendingSounds.current.push({ type: soundType, options });
      console.log(`Sonido ${soundType} agregado a la cola. Audio no desbloqueado.`);
      return false;
    }

    return createSound(config, options.volume);
  }, [isEnabled, isSupported, isAudioUnlocked, createSound]);

  // Reproducir secuencia de sonidos
  const playSequence = useCallback(async (sequence, delay = 200) => {
    if (!isEnabled || !isAudioUnlocked) return false;

    for (let i = 0; i < sequence.length; i++) {
      playSound(sequence[i]);
      if (i < sequence.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return true;
  }, [isEnabled, isAudioUnlocked, playSound]);

  // Sonidos específicos para fitness
  const playRestComplete = useCallback(() => {
    return playSound('rest_complete');
  }, [playSound]);

  const playAchievement = useCallback(() => {
    return playSound('achievement');
  }, [playSound]);

  const playWorkoutStart = useCallback(() => {
    return playSound('workout_start');
  }, [playSound]);

  const playCountdown = useCallback(() => {
    return playSound('countdown');
  }, [playSound]);

  const playCountdownSequence = useCallback(async (count = 3) => {
    const sequence = Array(count).fill('countdown');
    await playSequence(sequence, 1000);
    playWorkoutStart();
  }, [playSequence, playWorkoutStart]);

  // Configurar evento de interacción del usuario automático
  useEffect(() => {
    if (!audioContext || isAudioUnlocked) return;

    const handleUserInteraction = () => {
      unlockAudio();
    };

    // Lista de eventos que pueden desbloquear el audio
    const events = ['click', 'touchstart', 'keydown', 'mousedown'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [audioContext, isAudioUnlocked, unlockAudio]);

  // Función para testear el audio
  const testAudio = useCallback(() => {
    if (!isAudioUnlocked) {
      return unlockAudio().then(success => {
        if (success) {
          return playSound('success');
        }
        return false;
      });
    }
    return playSound('success');
  }, [isAudioUnlocked, unlockAudio, playSound]);

  // Configuración de preferencias de audio
  const updatePreferences = useCallback((preferences) => {
    if (typeof preferences.volume === 'number') {
      setVolume(Math.max(0, Math.min(1, preferences.volume)));
    }
    if (typeof preferences.enabled === 'boolean') {
      setIsEnabled(preferences.enabled);
    }
  }, []);

  // Obtener información del estado
  const getStatus = useCallback(() => {
    return {
      isSupported,
      isEnabled,
      isAudioUnlocked,
      volume,
      audioContextState: audioContext?.state || 'not-created',
      pendingSoundsCount: pendingSounds.current.length
    };
  }, [isSupported, isEnabled, isAudioUnlocked, volume, audioContext]);

  return {
    // Estado
    isSupported,
    isEnabled,
    isAudioUnlocked,
    volume,

    // Funciones principales
    playSound,
    playSequence,
    unlockAudio,
    testAudio,

    // Sonidos específicos
    playRestComplete,
    playAchievement,
    playWorkoutStart,
    playCountdown,
    playCountdownSequence,

    // Configuración
    updatePreferences,
    setVolume,
    setIsEnabled,

    // Utilidades
    getStatus
  };
};
