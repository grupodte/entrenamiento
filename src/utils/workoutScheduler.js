/**
 * Sistema de recordatorios de entrenamiento programados
 * Funciona con notificaciones push y almacenamiento local
 */

export class WorkoutScheduler {
  constructor() {
    this.storageKey = 'fit_workout_reminders';
    this.scheduledReminders = this.loadReminders();
  }

  // Cargar recordatorios del localStorage
  loadReminders() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error cargando recordatorios:', error);
      return [];
    }
  }

  // Guardar recordatorios en localStorage
  saveReminders() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.scheduledReminders));
    } catch (error) {
      console.error('Error guardando recordatorios:', error);
    }
  }

  // Programar recordatorio de entrenamiento
  scheduleWorkoutReminder(workoutData) {
    const { 
      workoutType, 
      scheduledTime, 
      days = [], // [1,2,3,4,5] para lun-vie
      message,
      id = Date.now().toString()
    } = workoutData;

    const reminder = {
      id,
      workoutType,
      scheduledTime, // "09:00" formato HH:MM
      days,
      message: message || `¡Es hora de tu rutina de ${workoutType}! 💪`,
      isActive: true,
      createdAt: Date.now()
    };

    this.scheduledReminders.push(reminder);
    this.saveReminders();
    this.setupNextReminder(reminder);
    
    return reminder;
  }

  // Configurar el próximo recordatorio
  setupNextReminder(reminder) {
    if (!reminder.isActive) return;

    const nextDate = this.getNextReminderDate(reminder);
    if (!nextDate) return;

    const timeUntilReminder = nextDate.getTime() - Date.now();
    
    // Solo programar si es en las próximas 24 horas
    if (timeUntilReminder > 0 && timeUntilReminder <= 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        this.sendWorkoutReminder(reminder);
        this.setupNextReminder(reminder); // Programar el siguiente
      }, timeUntilReminder);
    }
  }

  // Calcular próxima fecha de recordatorio
  getNextReminderDate(reminder) {
    const now = new Date();
    const [hours, minutes] = reminder.scheduledTime.split(':').map(Number);
    
    // Si no hay días específicos, asumir diario
    if (!reminder.days.length) {
      const nextDate = new Date();
      nextDate.setHours(hours, minutes, 0, 0);
      
      // Si ya pasó hoy, programar para mañana
      if (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      
      return nextDate;
    }

    // Buscar el próximo día válido
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() + i);
      checkDate.setHours(hours, minutes, 0, 0);
      
      const dayOfWeek = checkDate.getDay(); // 0=domingo, 1=lunes, etc.
      
      if (reminder.days.includes(dayOfWeek) && checkDate > now) {
        return checkDate;
      }
    }
    
    return null;
  }

  // Enviar recordatorio de entrenamiento
  async sendWorkoutReminder(reminder) {
    try {
      // Enviar notificación push desde el servidor
      const response = await fetch('/api/push/send-fitness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'workout_reminder',
          data: {
            workoutType: reminder.workoutType,
            message: reminder.message
          }
        })
      });

      if (!response.ok) {
        console.warn('Error enviando recordatorio push:', response.status);
      }

      console.log('Recordatorio enviado:', reminder.workoutType);
    } catch (error) {
      console.error('Error enviando recordatorio:', error);
    }
  }

  // Inicializar todos los recordatorios activos
  initializeReminders() {
    this.scheduledReminders
      .filter(reminder => reminder.isActive)
      .forEach(reminder => this.setupNextReminder(reminder));
  }

  // Desactivar recordatorio
  deactivateReminder(id) {
    const reminder = this.scheduledReminders.find(r => r.id === id);
    if (reminder) {
      reminder.isActive = false;
      this.saveReminders();
    }
  }

  // Eliminar recordatorio
  removeReminder(id) {
    this.scheduledReminders = this.scheduledReminders.filter(r => r.id !== id);
    this.saveReminders();
  }

  // Obtener recordatorios activos
  getActiveReminders() {
    return this.scheduledReminders.filter(r => r.isActive);
  }

  // Crear recordatorios por defecto
  createDefaultReminders() {
    const defaultReminders = [
      {
        workoutType: 'piernas',
        scheduledTime: '09:00',
        days: [1, 3, 5], // Lunes, miércoles, viernes
        message: '🦵 ¡Es hora de entrenar piernas! No dejes que te venzan las sentadillas 💪'
      },
      {
        workoutType: 'pecho',
        scheduledTime: '18:00',
        days: [2, 4], // Martes, jueves
        message: '💪 ¡Rutina de pecho y brazos! Es momento de trabajar el tren superior 🔥'
      },
      {
        workoutType: 'cardio',
        scheduledTime: '07:00',
        days: [6], // Sábado
        message: '🏃‍♂️ ¡Cardio matutino! Empieza el fin de semana con energía'
      }
    ];

    defaultReminders.forEach(reminder => {
      this.scheduleWorkoutReminder(reminder);
    });
  }
}

// Instancia global del scheduler
export const workoutScheduler = new WorkoutScheduler();
