import React, { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { PlayIcon, PauseIcon, StopIcon } from '@heroicons/react/24/outline';

const RestTimerExample = () => {
  const notifications = useNotifications();
  const [currentTimer, setCurrentTimer] = useState(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [exerciseName, setExerciseName] = useState('Press de banca');
  const [restSeconds, setRestSeconds] = useState(90);

  const startRestTimer = () => {
    if (currentTimer) {
      // Cancelar timer anterior
      currentTimer.cancel();
    }

    // Iniciar nuevo timer de descanso
    const timer = notifications.restTimer(
      exerciseName,
      restSeconds,
      // onSkip callback
      () => {
        console.log('Usuario saltó el descanso');
        setIsTimerActive(false);
        setCurrentTimer(null);
      },
      // onComplete callback
      () => {
        console.log('Descanso completado automáticamente');
        setIsTimerActive(false);
        setCurrentTimer(null);
      }
    );

    setCurrentTimer(timer);
    setIsTimerActive(true);

    // Toast de inicio
    notifications.toast.info(`Iniciando descanso de ${restSeconds}s para ${exerciseName}`, {
      title: '⏰ Timer iniciado',
      duration: 2000
    });
  };

  const cancelTimer = () => {
    if (currentTimer) {
      currentTimer.cancel();
      setCurrentTimer(null);
      setIsTimerActive(false);
      notifications.warning('Timer de descanso cancelado');
    }
  };

  const testNotificationComplete = () => {
    // Simular que el descanso terminó (para pruebas)
    notifications.restComplete(exerciseName);
  };

  const testAllNotifications = () => {
    // Demostrar diferentes tipos de notificaciones
    setTimeout(() => notifications.workoutStart('Rutina de Pecho'), 0);
    setTimeout(() => notifications.success('Ejercicio guardado correctamente'), 1000);
    setTimeout(() => notifications.achievement('Primer mes', '¡Has completado 30 días de entrenamiento!'), 2000);
    setTimeout(() => notifications.streak(7), 3000);
    setTimeout(() => notifications.personalRecord('Press de banca', 80, 75), 4000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🎯 Ejemplo: Sistema de Descanso
        </h2>
        
        <div className="space-y-4">
          {/* Configuración */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ejercicio
              </label>
              <input
                type="text"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre del ejercicio"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descanso (segundos)
              </label>
              <select
                value={restSeconds}
                onChange={(e) => setRestSeconds(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={30}>30 segundos</option>
                <option value={60}>1 minuto</option>
                <option value={90}>1.5 minutos</option>
                <option value={120}>2 minutos</option>
                <option value={180}>3 minutos</option>
              </select>
            </div>
          </div>

          {/* Controles */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={startRestTimer}
              disabled={isTimerActive}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isTimerActive
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <PlayIcon className="w-5 h-5" />
              <span>Iniciar Descanso</span>
            </button>

            <button
              onClick={cancelTimer}
              disabled={!isTimerActive}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                !isTimerActive
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <StopIcon className="w-5 h-5" />
              <span>Cancelar</span>
            </button>
          </div>

          {/* Estado actual */}
          {isTimerActive && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-medium">
                ⏰ Timer activo para: <span className="font-bold">{exerciseName}</span>
              </p>
              <p className="text-blue-600 text-sm mt-1">
                • Recibirás una notificación push cuando termine el descanso
              </p>
              <p className="text-blue-600 text-sm">
                • Se reproducirá un sonido automáticamente
              </p>
              <p className="text-blue-600 text-sm">
                • Puedes agregar +30s más desde la notificación
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sección de pruebas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          🧪 Pruebas del Sistema
        </h3>
        
        <div className="space-y-3">
          <button
            onClick={testNotificationComplete}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            🔔 Simular Descanso Terminado
          </button>
          
          <button
            onClick={testAllNotifications}
            className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors ml-0 sm:ml-3"
          >
            🎨 Mostrar Todas las Notificaciones
          </button>
          
          <button
            onClick={() => notifications.test()}
            className="w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors ml-0 sm:ml-3"
          >
            🔧 Test Completo del Sistema
          </button>
        </div>
      </div>

      {/* Información del sistema */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          📋 Funcionalidades Implementadas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span>Notificación push cuando termina el descanso</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span>Sonido automático de alerta</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span>Toast visual con progreso</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span>Botón para saltar descanso</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span>Botón "+30s más" en la notificación</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span>Funciona incluso con la app cerrada</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span>Vibración en dispositivos móviles</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✅</span>
              <span>Navegación inteligente al hacer clic</span>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>💡 Consejo:</strong> Para la mejor experiencia, asegúrate de tener las notificaciones 
            habilitadas y el audio desbloqueado. Puedes configurar todo en la página de <strong>/notificaciones</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RestTimerExample;
