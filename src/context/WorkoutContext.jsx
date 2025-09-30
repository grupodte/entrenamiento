import React, { createContext, useContext, useState, useCallback } from 'react';

const WorkoutContext = createContext();

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout debe usarse dentro de WorkoutProvider');
  }
  return context;
};

export const WorkoutProvider = ({ children }) => {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [onBackClick, setOnBackClick] = useState(() => () => {});

  // Función propia para formatear tiempo
  const formatWorkoutTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Activar modo workout
  const startWorkout = useCallback((_, backClickHandler) => {
    console.log('WorkoutContext: Activando workout', { backClickHandler });
    setIsWorkoutActive(true);
    if (backClickHandler) setOnBackClick(() => backClickHandler);
  }, []);

  // Desactivar modo workout
  const endWorkout = useCallback(() => {
    console.log('WorkoutContext: Desactivando workout');
    setIsWorkoutActive(false);
    setWorkoutTime(0);
    setOnBackClick(() => () => {});
  }, []);

  // Actualizar tiempo
  const updateWorkoutTime = useCallback((time) => {
    setWorkoutTime(time);
  }, []);

  const value = {
    isWorkoutActive,
    workoutTime,
    formatWorkoutTime,
    onBackClick,
    startWorkout,
    endWorkout,
    updateWorkoutTime
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
};
