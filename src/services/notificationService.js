/**
 * Servicio para enviar notificaciones por email
 * Este servicio hace llamadas a tu API backend que maneja Resend
 */
class NotificationService {
  constructor() {
    // URL base de tu API
    this.apiUrl = import.meta.env.VITE_API_URL || '/api';
  }

  /**
   * Envía notificación de rutina asignada
   * @param {Object} params - Parámetros de la notificación
   * @param {string} params.userEmail - Email del usuario
   * @param {string} params.userName - Nombre del usuario
   * @param {string} params.rutinaName - Nombre de la rutina
   * @param {string} params.trainerName - Nombre del entrenador
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendRutinaAsignada({ userEmail, userName, rutinaName, trainerName }) {
    try {
      const response = await fetch(`${this.apiUrl}/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'rutina',
          userEmail,
          userName,
          itemName: rutinaName,
          trainerName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error enviando notificación');
      }

      console.log('✅ Notificación de rutina enviada exitosamente');
      return { success: true, data: result.data };

    } catch (error) {
      console.error('❌ Error enviando notificación de rutina:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía notificación de dieta asignada
   * @param {Object} params - Parámetros de la notificación
   * @param {string} params.userEmail - Email del usuario
   * @param {string} params.userName - Nombre del usuario
   * @param {string} params.dietaName - Nombre de la dieta
   * @param {string} params.trainerName - Nombre del entrenador
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendDietaAsignada({ userEmail, userName, dietaName, trainerName }) {
    try {
      const response = await fetch(`${this.apiUrl}/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'dieta',
          userEmail,
          userName,
          itemName: dietaName,
          trainerName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error enviando notificación');
      }

      console.log('✅ Notificación de dieta enviada exitosamente');
      return { success: true, data: result.data };

    } catch (error) {
      console.error('❌ Error enviando notificación de dieta:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía notificación de curso asignado
   * @param {Object} params - Parámetros de la notificación
   * @param {string} params.userEmail - Email del usuario
   * @param {string} params.userName - Nombre del usuario
   * @param {string} params.cursoName - Nombre del curso
   * @param {string} params.trainerName - Nombre del entrenador
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendCursoAsignado({ userEmail, userName, cursoName, trainerName }) {
    try {
      const response = await fetch(`${this.apiUrl}/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'curso',
          userEmail,
          userName,
          itemName: cursoName,
          trainerName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error enviando notificación');
      }

      console.log('✅ Notificación de curso enviada exitosamente');
      return { success: true, data: result.data };

    } catch (error) {
      console.error('❌ Error enviando notificación de curso:', error);
      return { success: false, error: error.message };
    }
  }
}

// Exportar instancia única del servicio
export const notificationService = new NotificationService();

// Ejemplos de uso:
/*
import { notificationService } from '../services/notificationService';

// En tu componente de asignación de rutinas:
const asignarRutina = async (alumnoId, rutinaId) => {
  // ... lógica de asignación ...
  
  // Enviar notificación
  await notificationService.sendRutinaAsignada({
    userEmail: alumno.email,
    userName: alumno.nombre,
    rutinaName: rutina.nombre,
    trainerName: entrenador.nombre
  });
};
*/