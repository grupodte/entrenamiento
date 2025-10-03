import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook personalizado para manejar el timer de descanso
 * Implementa la lógica robusta con localStorage solamente
 */
const useRestTimer = () => {
  const [isResting, setIsResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [exerciseName, setExerciseName] = useState('');
  const [originalDuration, setOriginalDuration] = useState(0);
  const intervalRef = useRef(null);


  // Función para calcular el tiempo restante basado en restEndTime
  const calculateTimeLeft = useCallback(() => {
    const restEndTime = localStorage.getItem('restEndTime');
    if (!restEndTime) return 0;
    
    const now = Date.now();
    const endTime = parseInt(restEndTime, 10);
    const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
    
    return remaining;
  }, []);

  // Función para iniciar el descanso
  const startRest = useCallback((duration, nextExerciseName = 'Siguiente ejercicio') => {
    // Calcular el tiempo de finalización
    const endTime = Date.now() + (duration * 1000);
    
    // Guardar en localStorage
    localStorage.setItem('restEndTime', endTime.toString());
    localStorage.setItem('restExerciseName', nextExerciseName);
    localStorage.setItem('restOriginalDuration', duration.toString());
    
    // Actualizar estado
    setIsResting(true);
    setTimeLeft(duration);
    setExerciseName(nextExerciseName);
    setOriginalDuration(duration);
  }, []);

  // Función para finalizar el descanso
  const finishRest = useCallback(() => {
    // Limpiar localStorage
    localStorage.removeItem('restEndTime');
    localStorage.removeItem('restExerciseName');
    localStorage.removeItem('restOriginalDuration');
    
    // Limpiar intervalo
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Resetear estado
    setIsResting(false);
    setTimeLeft(0);
    setExerciseName('');
    setOriginalDuration(0);
    
    console.log('Descanso finalizado');
  }, []);

  // Función para omitir el descanso
  const skipRest = useCallback(() => {
    console.log('Descanso omitido por el usuario');
    finishRest();
  }, [finishRest]);

  // Effect principal que maneja el timer
  useEffect(() => {
    if (isResting) {
      // Calcular tiempo inicial
      const initialTimeLeft = calculateTimeLeft();
      setTimeLeft(initialTimeLeft);
      
      // Si ya expiró, finalizar inmediatamente
      if (initialTimeLeft <= 0) {
        finishRest();
        return;
      }
      
      // Intervalo para actualizar la UI
      intervalRef.current = setInterval(() => {
        const remaining = calculateTimeLeft();
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          finishRest();
        }
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isResting, calculateTimeLeft, finishRest]);

  // Effect para verificar si hay un descanso en curso al cargar/recargar
  useEffect(() => {
    const restEndTime = localStorage.getItem('restEndTime');
    const storedExerciseName = localStorage.getItem('restExerciseName');
    const storedDuration = localStorage.getItem('restOriginalDuration');
    
    if (restEndTime && storedExerciseName && storedDuration) {
      const remaining = calculateTimeLeft();
      
      if (remaining > 0) {
        // Hay un descanso en curso
        setIsResting(true);
        setExerciseName(storedExerciseName);
        setOriginalDuration(parseInt(storedDuration, 10));
        setTimeLeft(remaining);
        console.log(`Descanso reanudado: ${remaining}s restantes`);
      } else {
        // El descanso ya expiró mientras estaba fuera
        localStorage.removeItem('restEndTime');
        localStorage.removeItem('restExerciseName');
        localStorage.removeItem('restOriginalDuration');
        
        // Opcional: mostrar una notificación o alerta de que el descanso terminó
        if (navigator.vibrate) {
          navigator.vibrate([300, 100, 300]);
        }
        console.log('El descanso expiró mientras la app estaba inactiva');
      }
    }
  }, [calculateTimeLeft]);

  // Función helper para formatear el tiempo
  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    isResting,
    timeLeft,
    exerciseName,
    originalDuration,
    startRest,
    finishRest,
    skipRest,
    formatTime
  };
};

export default useRestTimer;
