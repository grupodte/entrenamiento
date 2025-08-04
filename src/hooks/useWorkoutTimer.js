import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para manejar el timer principal del entrenamiento
 * Implementa la lógica de "no cuentes, calcula" usando localStorage
 */
const useWorkoutTimer = () => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Función para iniciar el entrenamiento
  const startWorkout = useCallback(() => {
    const startTime = Date.now();
    localStorage.setItem('workoutStartTime', startTime.toString());
    setIsActive(true);
  }, []);

  // Función para finalizar el entrenamiento
  const finishWorkout = useCallback(() => {
    localStorage.removeItem('workoutStartTime');
    setIsActive(false);
    setElapsedTime(0);
  }, []);

  // Función para pausar temporalmente (sin borrar el localStorage)
  const pauseWorkout = useCallback(() => {
    setIsActive(false);
  }, []);

  // Función para reanudar
  const resumeWorkout = useCallback(() => {
    const startTime = localStorage.getItem('workoutStartTime');
    if (startTime) {
      setIsActive(true);
    }
  }, []);

  // Función para calcular el tiempo transcurrido
  const calculateElapsedTime = useCallback(() => {
    const startTime = localStorage.getItem('workoutStartTime');
    if (!startTime) return 0;
    
    const now = Date.now();
    const elapsed = Math.floor((now - parseInt(startTime, 10)) / 1000);
    return elapsed > 0 ? elapsed : 0;
  }, []);

  // Effect que maneja el intervalo solo cuando está activo
  useEffect(() => {
    let intervalId = null;

    if (isActive) {
      // Actualizar inmediatamente
      setElapsedTime(calculateElapsedTime());
      
      // Luego cada segundo
      intervalId = setInterval(() => {
        setElapsedTime(calculateElapsedTime());
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isActive, calculateElapsedTime]);

  // Effect para verificar si hay un entrenamiento en curso al cargar
  useEffect(() => {
    const startTime = localStorage.getItem('workoutStartTime');
    if (startTime) {
      setIsActive(true);
      setElapsedTime(calculateElapsedTime());
    }
  }, [calculateElapsedTime]);

  return {
    elapsedTime,
    isActive,
    startWorkout,
    finishWorkout,
    pauseWorkout,
    resumeWorkout
  };
};

export default useWorkoutTimer;
