import React from 'react';
import { motion } from 'framer-motion';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAudioNotifications } from '../hooks/useAudioNotifications';
import { useAdvancedToast } from '../components/notifications/ToastSystem';
import NotificationPermissionManager from '../components/notifications/NotificationPermissionManager';
import { BellIcon, SpeakerWaveIcon, CogIcon } from '@heroicons/react/24/outline';

const NotificationSettings = () => {
  const {
    isSupported: isPushSupported,
    isSubscribed,
    subscribeToPush,
    unsubscribeFromPush,
    isLoading: isPushLoading,
    permission,
    getServiceWorkerStatus
  } = usePushNotifications();

  const {
    isSupported: isAudioSupported,
    isEnabled: isAudioEnabled,
    isAudioUnlocked,
    volume,
    testAudio,
    updatePreferences,
    getStatus: getAudioStatus
  } = useAudioNotifications();

  const toast = useAdvancedToast();

  const handleSubscribe = async () => {
    try {
      await subscribeToPush();
      toast.success('¡Suscripción exitosa!', {
        title: '🔔 Notificaciones Push'
      });
    } catch (error) {
      toast.error(`Error: ${error.message}`, {
        title: '❌ Error de Suscripción'
      });
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribeFromPush();
      toast.success('Te has desuscrito exitosamente', {
        title: '🔕 Push Desactivado'
      });
    } catch (error) {
      toast.error(`Error: ${error.message}`, {
        title: '❌ Error de Desuscripción'
      });
    }
  };

  const handleAudioTest = async () => {
    try {
      const success = await testAudio();
      if (success) {
        toast.success('Audio funcionando correctamente', {
          title: '🔊 Test de Audio'
        });
      } else {
        toast.warning('Haz clic en cualquier parte para habilitar el audio', {
          title: '🔇 Audio Suspendido'
        });
      }
    } catch (error) {
      toast.error('Error probando el audio', {
        title: '❌ Error de Audio'
      });
    }
  };

  const handleVolumeChange = (newVolume) => {
    updatePreferences({ volume: newVolume / 100 });
  };

  const handleAudioToggle = () => {
    updatePreferences({ enabled: !isAudioEnabled });
    if (!isAudioEnabled) {
      toast.success('Audio de notificaciones activado', {
        title: '🔊 Audio Activado'
      });
    } else {
      toast.info('Audio de notificaciones desactivado', {
        title: '🔇 Audio Desactivado'
      });
    }
  };

  const showTestNotifications = () => {
    // Mostrar diferentes tipos de toasts
    toast.workout('¡Es hora de entrenar! 💪');
    
    setTimeout(() => {
      toast.achievement('¡Has completado 5 entrenamientos esta semana!');
    }, 1000);
    
    setTimeout(() => {
      toast.streak(7);
    }, 2000);
    
    setTimeout(() => {
      toast.progress('Peso corporal', 'Has perdido 2kg este mes');
    }, 3000);
  };

  const showServiceWorkerInfo = async () => {
    const status = await getServiceWorkerStatus();
    const audioStatus = getAudioStatus();
    
    toast.custom({
      type: 'info',
      title: '🔧 Estado del Sistema',
      message: `SW: ${status.status}, Audio: ${audioStatus.audioContextState}`,
      duration: 6000
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔔 Configuración de Notificaciones
        </h1>
        <p className="text-gray-600">
          Personaliza cómo y cuándo recibir alertas de tu entrenamiento
        </p>
      </motion.div>

      {/* Sección de Permisos */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <NotificationPermissionManager
          onPermissionChange={(newPermission) => {
            console.log('Permiso cambiado:', newPermission);
          }}
        />
      </motion.section>

      {/* Sección de Push Notifications */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-lg">
            <BellIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Notificaciones Push
            </h2>
            <p className="text-gray-600 text-sm">
              Recibe notificaciones incluso cuando la app esté cerrada
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Estado de Suscripción</p>
              <p className="text-sm text-gray-600">
                {isPushSupported ? 
                  (isSubscribed ? 'Suscrito a notificaciones push' : 'No suscrito') :
                  'No soportado en este navegador'
                }
              </p>
            </div>
            
            {isPushSupported && permission === 'granted' && (
              <div className="flex space-x-2">
                {!isSubscribed ? (
                  <button
                    onClick={handleSubscribe}
                    disabled={isPushLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                  >
                    {isPushLoading ? '⏳ Suscribiendo...' : '📡 Suscribirse'}
                  </button>
                ) : (
                  <button
                    onClick={handleUnsubscribe}
                    disabled={isPushLoading}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                  >
                    {isPushLoading ? '⏳ Procesando...' : '🔕 Desuscribirse'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Sección de Audio */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-purple-100 p-2 rounded-lg">
            <SpeakerWaveIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Sonidos de Notificación
            </h2>
            <p className="text-gray-600 text-sm">
              Configurar alertas de audio para tus entrenamientos
            </p>
          </div>
        </div>

        {isAudioSupported ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Audio Habilitado</p>
                <p className="text-sm text-gray-600">
                  {isAudioEnabled ? 
                    (isAudioUnlocked ? 'Audio activo y desbloqueado' : 'Audio activo (requiere interacción)') :
                    'Audio desactivado'
                  }
                </p>
              </div>
              <button
                onClick={handleAudioToggle}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isAudioEnabled
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
                {isAudioEnabled ? '🔊 Activado' : '🔇 Desactivado'}
              </button>
            </div>

            {isAudioEnabled && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volumen: {Math.round(volume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(volume * 100)}
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <button
                  onClick={handleAudioTest}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  🔊 Probar Audio
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              ⚠️ El audio no es soportado en este navegador
            </p>
          </div>
        )}
      </motion.section>

      {/* Sección de Pruebas */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-green-100 p-2 rounded-lg">
            <CogIcon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Pruebas y Diagnósticos
            </h2>
            <p className="text-gray-600 text-sm">
              Prueba el funcionamiento del sistema de notificaciones
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={showTestNotifications}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            🧪 Probar Toasts
          </button>
          
          <button
            onClick={showServiceWorkerInfo}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            🔧 Estado del Sistema
          </button>
        </div>
      </motion.section>

      {/* Información adicional */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center text-gray-500 text-sm"
      >
        <p>
          💡 <strong>Consejo:</strong> Para una mejor experiencia, permite las notificaciones 
          y mantén el audio activado durante tus entrenamientos.
        </p>
      </motion.div>
    </div>
  );
};

export default NotificationSettings;
