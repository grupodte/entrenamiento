import React, { createContext, useContext, useCallback } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon,
  BoltIcon,
  TrophyIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

// Contexto para el sistema de toast
const ToastContext = createContext();

// Componente personalizado para toasts avanzados
const CustomToast = ({ 
  type, 
  message, 
  title, 
  action, 
  onAction, 
  onDismiss,
  icon: CustomIcon,
  progress 
}) => {
  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
    workout: BoltIcon,
    achievement: TrophyIcon,
    streak: FireIcon
  };

  const colors = {
    success: {
      bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      title: 'text-green-800',
      text: 'text-green-700',
      button: 'bg-green-600 hover:bg-green-700'
    },
    error: {
      bg: 'bg-gradient-to-r from-red-50 to-rose-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      title: 'text-red-800',
      text: 'text-red-700',
      button: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      bg: 'bg-gradient-to-r from-yellow-50 to-orange-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      title: 'text-yellow-800',
      text: 'text-yellow-700',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      text: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700'
    },
    workout: {
      bg: 'bg-gradient-to-r from-purple-50 to-indigo-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
      title: 'text-purple-800',
      text: 'text-purple-700',
      button: 'bg-purple-600 hover:bg-purple-700'
    },
    achievement: {
      bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
      border: 'border-amber-200',
      icon: 'text-amber-600',
      title: 'text-amber-800',
      text: 'text-amber-700',
      button: 'bg-amber-600 hover:bg-amber-700'
    },
    streak: {
      bg: 'bg-gradient-to-r from-orange-50 to-red-50',
      border: 'border-orange-200',
      icon: 'text-orange-600',
      title: 'text-orange-800',
      text: 'text-orange-700',
      button: 'bg-orange-600 hover:bg-orange-700'
    }
  };

  const IconComponent = CustomIcon || icons[type] || InformationCircleIcon;
  const colorScheme = colors[type] || colors.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={`
        ${colorScheme.bg} ${colorScheme.border} 
        border rounded-xl p-4 shadow-lg max-w-md w-full
        backdrop-blur-sm relative overflow-hidden
      `}
    >
      {/* Barra de progreso opcional */}
      {progress !== undefined && (
        <div className="absolute top-0 left-0 h-1 bg-white/20 w-full">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: progress / 1000, ease: 'linear' }}
            className={`h-full ${colorScheme.button.replace('bg-', 'bg-').replace('hover:bg-', '').split(' ')[0]} opacity-70`}
          />
        </div>
      )}

      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${colorScheme.icon}`}>
          <IconComponent className="w-6 h-6" />
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`text-sm font-semibold ${colorScheme.title} mb-1`}>
              {title}
            </h4>
          )}
          <p className={`text-sm ${colorScheme.text}`}>
            {message}
          </p>
          
          {action && onAction && (
            <button
              onClick={onAction}
              className={`
                mt-3 px-3 py-1.5 rounded-lg text-white text-xs font-medium
                ${colorScheme.button} transition-colors duration-200
              `}
            >
              {action}
            </button>
          )}
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${colorScheme.icon} hover:opacity-70 transition-opacity`}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Provider del sistema de toast
export const ToastProvider = ({ children }) => {
  // Toast básicos
  const showSuccess = useCallback((message, options = {}) => {
    return toast.custom((t) => (
      <CustomToast
        type="success"
        message={message}
        onDismiss={() => toast.dismiss(t.id)}
        {...options}
      />
    ), {
      duration: options.duration || 4000,
      position: 'top-right'
    });
  }, []);

  const showError = useCallback((message, options = {}) => {
    return toast.custom((t) => (
      <CustomToast
        type="error"
        message={message}
        onDismiss={() => toast.dismiss(t.id)}
        {...options}
      />
    ), {
      duration: options.duration || 6000,
      position: 'top-right'
    });
  }, []);

  const showWarning = useCallback((message, options = {}) => {
    return toast.custom((t) => (
      <CustomToast
        type="warning"
        message={message}
        onDismiss={() => toast.dismiss(t.id)}
        {...options}
      />
    ), {
      duration: options.duration || 5000,
      position: 'top-right'
    });
  }, []);

  const showInfo = useCallback((message, options = {}) => {
    return toast.custom((t) => (
      <CustomToast
        type="info"
        message={message}
        onDismiss={() => toast.dismiss(t.id)}
        {...options}
      />
    ), {
      duration: options.duration || 4000,
      position: 'top-right'
    });
  }, []);

  // Toasts específicos para fitness
  const showWorkoutAlert = useCallback((message, options = {}) => {
    return toast.custom((t) => (
      <CustomToast
        type="workout"
        title="🏋️ Entrenamiento"
        message={message}
        onDismiss={() => toast.dismiss(t.id)}
        {...options}
      />
    ), {
      duration: options.duration || 5000,
      position: 'top-right'
    });
  }, []);

  const showAchievement = useCallback((message, options = {}) => {
    return toast.custom((t) => (
      <CustomToast
        type="achievement"
        title="🏆 ¡Logro desbloqueado!"
        message={message}
        onDismiss={() => toast.dismiss(t.id)}
        {...options}
      />
    ), {
      duration: options.duration || 8000,
      position: 'top-center'
    });
  }, []);

  const showStreakAlert = useCallback((days, options = {}) => {
    return toast.custom((t) => (
      <CustomToast
        type="streak"
        title={`🔥 ¡Racha de ${days} días!`}
        message="¡Sigue así, estás en fuego!"
        onDismiss={() => toast.dismiss(t.id)}
        {...options}
      />
    ), {
      duration: options.duration || 6000,
      position: 'top-center'
    });
  }, []);

  const showRestTimer = useCallback((exerciseName, seconds, onStart) => {
    return toast.custom((t) => (
      <CustomToast
        type="workout"
        title="⏱️ Descanso"
        message={`${exerciseName}: ${seconds}s restantes`}
        action="Comenzar ahora"
        onAction={() => {
          onStart?.();
          toast.dismiss(t.id);
        }}
        onDismiss={() => toast.dismiss(t.id)}
        progress={seconds * 1000}
      />
    ), {
      duration: seconds * 1000,
      position: 'top-center'
    });
  }, []);

  const showProgressUpdate = useCallback((title, message, options = {}) => {
    return toast.custom((t) => (
      <CustomToast
        type="info"
        title={`📈 ${title}`}
        message={message}
        onDismiss={() => toast.dismiss(t.id)}
        {...options}
      />
    ), {
      duration: options.duration || 5000,
      position: 'bottom-right'
    });
  }, []);

  // Toast con acción personalizada
  const showActionToast = useCallback((config) => {
    return toast.custom((t) => (
      <CustomToast
        onDismiss={() => toast.dismiss(t.id)}
        {...config}
      />
    ), {
      duration: config.duration || 4000,
      position: config.position || 'top-right'
    });
  }, []);

  // Funciones de utilidad
  const dismissAll = useCallback(() => {
    toast.dismiss();
  }, []);

  const dismissToast = useCallback((toastId) => {
    toast.dismiss(toastId);
  }, []);

  const value = {
    // Básicos
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    
    // Específicos para fitness
    workout: showWorkoutAlert,
    achievement: showAchievement,
    streak: showStreakAlert,
    restTimer: showRestTimer,
    progress: showProgressUpdate,
    
    // Avanzados
    custom: showActionToast,
    
    // Utilidades
    dismiss: dismissToast,
    dismissAll
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster 
        position="top-right"
        containerStyle={{
          top: 20,
          left: 20,
          bottom: 20,
          right: 20,
        }}
        toastOptions={{
          className: '',
          style: {
            background: 'transparent',
            boxShadow: 'none'
          }
        }}
      />
    </ToastContext.Provider>
  );
};

// Hook para usar el sistema de toast
export const useAdvancedToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useAdvancedToast debe usarse dentro de ToastProvider');
  }
  
  return context;
};

// Exportar también toasts individuales para casos simples
export const advancedToast = {
  success: (message, options) => toast.success(message, options),
  error: (message, options) => toast.error(message, options),
  loading: (message, options) => toast.loading(message, options),
  dismiss: (id) => toast.dismiss(id),
  dismissAll: () => toast.dismiss()
};
