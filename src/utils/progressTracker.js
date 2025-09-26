/**
 * Sistema de seguimiento de progreso fitness
 * Dispara notificaciones automáticas basadas en logros y progreso
 */

export class ProgressTracker {
  constructor() {
    this.storageKey = 'fit_user_progress';
    this.data = this.loadProgress();
    this.notifications = null; // Se inyectará desde el hook
  }

  // Inyectar sistema de notificaciones
  setNotificationSystem(notifications) {
    this.notifications = notifications;
  }

  // Cargar progreso del localStorage
  loadProgress() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const defaultData = {
        workouts: [],
        personalRecords: {},
        currentStreak: 0,
        longestStreak: 0,
        totalWorkouts: 0,
        lastWorkoutDate: null,
        weeklyGoal: 3,
        achievements: new Set(),
        weight: []
      };
      
      const parsed = stored ? JSON.parse(stored) : defaultData;
      
      // Convertir achievements array a Set si es necesario
      if (Array.isArray(parsed.achievements)) {
        parsed.achievements = new Set(parsed.achievements);
      }
      
      return { ...defaultData, ...parsed };
    } catch (error) {
      console.error('Error cargando progreso:', error);
      return this.getDefaultData();
    }
  }

  getDefaultData() {
    return {
      workouts: [],
      personalRecords: {},
      currentStreak: 0,
      longestStreak: 0,
      totalWorkouts: 0,
      lastWorkoutDate: null,
      weeklyGoal: 3,
      achievements: new Set(),
      weight: []
    };
  }

  // Guardar progreso
  saveProgress() {
    try {
      const dataToSave = {
        ...this.data,
        achievements: Array.from(this.data.achievements)
      };
      localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error guardando progreso:', error);
    }
  }

  // Registrar nuevo entrenamiento
  recordWorkout(workoutData) {
    const { type, exercises = [], duration, date = new Date() } = workoutData;
    
    const workout = {
      id: Date.now(),
      type,
      exercises,
      duration,
      date: date.toISOString(),
      timestamp: Date.now()
    };

    this.data.workouts.push(workout);
    this.data.totalWorkouts++;
    
    // Actualizar racha
    this.updateStreak(date);
    
    // Verificar récords personales en ejercicios
    exercises.forEach(exercise => {
      if (exercise.weight) {
        this.checkPersonalRecord(exercise.name, exercise.weight, exercise.reps);
      }
    });
    
    // Verificar logros
    this.checkAchievements();
    
    this.saveProgress();
    
    // Notificar entrenamiento completado
    if (this.notifications) {
      this.notifications.workoutCompleted(type, {
        exercises: exercises.length,
        duration
      });
    }

    return workout;
  }

  // Actualizar racha de entrenamientos
  updateStreak(currentDate) {
    const today = new Date(currentDate);
    const lastWorkout = this.data.lastWorkoutDate ? new Date(this.data.lastWorkoutDate) : null;
    
    if (!lastWorkout) {
      // Primer entrenamiento
      this.data.currentStreak = 1;
    } else {
      const diffDays = Math.floor((today - lastWorkout) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Día consecutivo
        this.data.currentStreak++;
      } else if (diffDays === 0) {
        // Mismo día, mantener racha
      } else {
        // Racha rota
        this.data.currentStreak = 1;
      }
    }
    
    // Actualizar récord de racha más larga
    if (this.data.currentStreak > this.data.longestStreak) {
      this.data.longestStreak = this.data.currentStreak;
    }
    
    this.data.lastWorkoutDate = today.toISOString();
    
    // Notificar racha especial
    if (this.notifications && this.data.currentStreak > 1 && this.data.currentStreak % 3 === 0) {
      this.notifications.streakMotivation(this.data.currentStreak);
    }
  }

  // Verificar récord personal
  checkPersonalRecord(exercise, weight, reps = 1) {
    const key = exercise.toLowerCase();
    const currentRecord = this.data.personalRecords[key];
    const newRecord = weight * reps; // Volumen total
    
    if (!currentRecord || newRecord > currentRecord.total) {
      const oldRecord = currentRecord ? currentRecord.total : 0;
      
      this.data.personalRecords[key] = {
        weight,
        reps,
        total: newRecord,
        date: new Date().toISOString()
      };
      
      // Notificar nuevo récord
      if (this.notifications && oldRecord > 0) {
        this.notifications.personalRecord(exercise, weight, currentRecord.weight);
      }
      
      return true;
    }
    
    return false;
  }

  // Registrar cambio de peso corporal
  recordWeightChange(newWeight) {
    const lastWeight = this.data.weight.length > 0 ? this.data.weight[this.data.weight.length - 1] : null;
    
    const weightEntry = {
      weight: newWeight,
      date: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    this.data.weight.push(weightEntry);
    
    // Mantener solo los últimos 50 registros
    if (this.data.weight.length > 50) {
      this.data.weight = this.data.weight.slice(-50);
    }
    
    this.saveProgress();
    
    // Notificar cambio significativo
    if (lastWeight && this.notifications) {
      const difference = newWeight - lastWeight.weight;
      if (Math.abs(difference) >= 0.5) { // Cambio de al menos 0.5kg
        this.notifications.weightUpdate(newWeight, difference);
      }
    }
    
    return weightEntry;
  }

  // Verificar logros
  checkAchievements() {
    const achievements = [
      {
        id: 'first_workout',
        name: 'Primer paso',
        description: '¡Has completado tu primer entrenamiento!',
        condition: () => this.data.totalWorkouts === 1
      },
      {
        id: 'week_streak',
        name: 'Una semana completa',
        description: '¡Has entrenado 7 días consecutivos!',
        condition: () => this.data.currentStreak >= 7
      },
      {
        id: 'month_consistent',
        name: 'Mes consistente',
        description: '¡Has entrenado 30 días!',
        condition: () => this.data.totalWorkouts >= 30
      },
      {
        id: 'century_club',
        name: 'Club de los 100',
        description: '¡Has completado 100 entrenamientos!',
        condition: () => this.data.totalWorkouts >= 100
      },
      {
        id: 'streak_master',
        name: 'Maestro de la consistencia',
        description: '¡Racha de 30 días consecutivos!',
        condition: () => this.data.currentStreak >= 30
      }
    ];
    
    achievements.forEach(achievement => {
      if (!this.data.achievements.has(achievement.id) && achievement.condition()) {
        this.data.achievements.add(achievement.id);
        
        // Notificar logro
        if (this.notifications) {
          this.notifications.achievement(achievement.name, achievement.description);
        }
      }
    });
  }

  // Obtener estadísticas
  getStats() {
    const thisWeek = this.getThisWeekWorkouts();
    const thisMonth = this.getThisMonthWorkouts();
    
    return {
      totalWorkouts: this.data.totalWorkouts,
      currentStreak: this.data.currentStreak,
      longestStreak: this.data.longestStreak,
      thisWeekWorkouts: thisWeek.length,
      thisMonthWorkouts: thisMonth.length,
      personalRecords: Object.keys(this.data.personalRecords).length,
      achievements: this.data.achievements.size,
      recentWeight: this.data.weight.length > 0 ? this.data.weight[this.data.weight.length - 1] : null,
      weeklyGoalProgress: (thisWeek.length / this.data.weeklyGoal) * 100
    };
  }

  // Obtener entrenamientos de esta semana
  getThisWeekWorkouts() {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    return this.data.workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= weekStart;
    });
  }

  // Obtener entrenamientos de este mes
  getThisMonthWorkouts() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return this.data.workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= monthStart;
    });
  }

  // Verificar si debe enviar motivación diaria
  shouldSendDailyMotivation() {
    const lastWorkout = this.data.lastWorkoutDate ? new Date(this.data.lastWorkoutDate) : null;
    const today = new Date();
    
    if (!lastWorkout) return true; // No ha entrenado nunca
    
    const diffDays = Math.floor((today - lastWorkout) / (1000 * 60 * 60 * 24));
    return diffDays >= 2; // No ha entrenado en 2+ días
  }
}

// Instancia global del tracker
export const progressTracker = new ProgressTracker();
