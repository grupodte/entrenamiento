import React, { useState, useEffect } from 'react';
import { BellIcon, BellSlashIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationPermissionManager = ({ onPermissionChange }) => {
  const [permission, setPermission] = useState('default');
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Verificar soporte del navegador y estado inicial
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Este navegador no soporta notificaciones de escritorio');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      // Notificar al componente padre sobre el cambio
      if (onPermissionChange) {
        onPermissionChange(result);
      }
      
      // Si se concedió el permiso, mostrar una notificación de prueba
      if (result === 'granted') {
        new Notification('🎉 ¡Notificaciones activadas!', {
          body: 'Ahora recibirás alertas de entrenamiento y recordatorios.',
          icon: '/icons/icon-192x192.png',
          tag: 'permission-granted'
        });
      }
    } catch (error) {
      console.error('Error solicitando permisos de notificación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openBrowserSettings = () => {
    alert(
      'Para habilitar las notificaciones:\n\n' +
      '1. Haz clic en el ícono del candado 🔒 en la barra de direcciones\n' +
      '2. Cambia "Notificaciones" de "Bloquear" a "Permitir"\n' +
      '3. Recarga la página\n\n' +
      'También puedes ir a Configuración del navegador > Privacidad y seguridad > Configuración de sitios > Notificaciones'
    );
  };

  // Renderizado condicional basado en el estado del permiso
  if (permission === 'granted') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center space-x-3">
          <CheckCircleIcon className="w-8 h-8 text-green-600" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-800">
              ✨ Notificaciones activadas
            </h3>
            <p className="text-green-700 text-sm mt-1">
              Recibirás alertas de entrenamiento, recordatorios y actualizaciones de progreso.
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-4 text-green-600 hover:text-green-800 text-sm font-medium transition-colors"
        >
          {showDetails ? 'Ocultar detalles' : 'Ver qué notificaciones recibirás'}
        </button>
        
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">⏰</span>
                    <span className="text-sm font-medium text-gray-700">Recordatorios de entrenamiento</span>
                  </div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🏃‍♂️</span>
                    <span className="text-sm font-medium text-gray-700">Fin de descansos</span>
                  </div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">📈</span>
                    <span className="text-sm font-medium text-gray-700">Logros y progreso</span>
                  </div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">💪</span>
                    <span className="text-sm font-medium text-gray-700">Motivación diaria</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (permission === 'denied') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-start space-x-3">
          <BellSlashIcon className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800">
              Notificaciones bloqueadas
            </h3>
            <p className="text-red-700 text-sm mt-1">
              Las notificaciones están desactivadas en tu navegador. No recibirás alertas de entrenamiento ni recordatorios.
            </p>
            
            <div className="mt-4 space-y-3">
              <button
                onClick={openBrowserSettings}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center space-x-2"
              >
                <span>🔧</span>
                <span>Abrir configuración del navegador</span>
              </button>
              
              <div className="text-xs text-red-600">
                <p><strong>Tip:</strong> Busca el ícono del candado 🔒 en la barra de direcciones</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Estado default - solicitar permiso
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-start space-x-4">
        <div className="bg-indigo-100 p-3 rounded-full">
          <BellIcon className="w-8 h-8 text-indigo-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-indigo-900 mb-2">
            🚀 Potencia tu entrenamiento
          </h3>
          <p className="text-indigo-700 mb-4">
            Activa las notificaciones para recibir recordatorios inteligentes, alertas de descanso y celebrar tus logros.
          </p>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="flex items-center space-x-2 text-sm text-indigo-700">
              <span>⏰</span>
              <span>Recordatorios personalizados</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-indigo-700">
              <span>🎯</span>
              <span>Alertas de objetivos</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-indigo-700">
              <span>📈</span>
              <span>Progreso semanal</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-indigo-700">
              <span>🏆</span>
              <span>Logros desbloqueados</span>
            </div>
          </div>
          
          <button
            onClick={requestNotificationPermission}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Configurando...</span>
              </>
            ) : (
              <>
                <BellIcon className="w-5 h-5" />
                <span>Activar Notificaciones</span>
              </>
            )}
          </button>
          
          <div className="mt-4 flex items-start space-x-2 text-xs text-indigo-600">
            <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Privacidad:</strong> Solo recibirás notificaciones relacionadas con tu entrenamiento. 
              Puedes desactivarlas en cualquier momento en la configuración de tu navegador.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationPermissionManager;
