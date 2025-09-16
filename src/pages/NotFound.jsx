import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Dumbbell, ShieldAlert } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  const { user, rol } = useAuth();
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Redirigir según el estado del usuario
          if (user) {
            if (rol === 'admin') {
              navigate('/admin', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          } else {
            navigate('/login', { replace: true });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, user, rol]);

  const handleRedirectNow = () => {
    if (user) {
      if (rol === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Si no hay historial, redirigir al inicio
      handleRedirectNow();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {/* Video de fondo */}
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src="/backgrounds/loginbg.mp4" type="video/mp4" />
      </video>

      {/* Capa oscura */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      <div className="relative z-10 w-full max-w-md p-4">
        {/* Card principal con animación */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
          className="rounded-2xl border border-red-500/20 bg-gray-900/30 backdrop-blur-md shadow-2xl overflow-hidden"
        >
          {/* Header con logo DTE */}
          <div className="bg-gradient-to-r from-red-500/10 to-red-600/5 px-6 py-4 border-b border-red-500/20">
            <div className="flex items-center justify-center gap-3">
              {/* Logo DTE */}
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.57346 17.1469C13.3084 17.1469 17.1469 13.3084 17.1469 8.57346C17.1469 3.83847 13.3084 0 8.57346 0C3.83847 0 0 3.83847 0 8.57346C0 13.3084 3.83847 17.1469 8.57346 17.1469Z" fill="white"/>
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-white">DTE Fit</h2>
                <p className="text-xs text-gray-300">Tu entrenador personal</p>
              </div>
            </div>
          </div>

          <div className="p-6 text-center">
            {/* Icono 404 animado */}
            <motion.div 
              className="mb-6"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
            >
              <div className="relative inline-block">
                <ShieldAlert className="w-20 h-20 text-red-500 mx-auto mb-3" strokeWidth={1.5} />
                <motion.div 
                  className="absolute -top-2 -right-2 bg-cyan-400 text-gray-900 font-bold text-xs px-2 py-1 rounded-full"
                  initial={{ opacity: 0, rotate: -15 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                >
                  404
                </motion.div>
              </div>
              <div className="w-20 h-1 bg-gradient-to-r from-red-500 to-cyan-400 mx-auto rounded-full"></div>
            </motion.div>

            {/* Mensaje principal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <h1 className="text-2xl font-bold text-white mb-3">
                ¡Ups! Te perdiste
              </h1>
              
              <p className="text-gray-300 mb-6 text-sm">
                Esta página no existe o fue movida. No te preocupes, 
                te ayudamos a encontrar el camino de vuelta a tu entrenamiento.
              </p>
            </motion.div>

            {/* Countdown con diseño fitness */}
            <motion.div 
              className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-cyan-400/30"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Dumbbell className="w-4 h-4 text-cyan-400" />
                <p className="text-sm text-gray-300">
                  Redirección automática en:
                </p>
              </div>
              
              <motion.div 
                className="text-3xl font-bold text-cyan-400 mb-2"
                key={countdown}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {countdown}s
              </motion.div>
              
              <p className="text-xs text-gray-400">
                {user 
                  ? `Volver a tu ${rol === 'admin' ? 'Panel de Administración' : 'Dashboard de Entrenamiento'}`
                  : 'Ir al inicio de sesión'
                }
              </p>
            </motion.div>

            {/* Botones de acción con estilo fitness */}
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <button
                onClick={handleRedirectNow}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-gray-900 font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/30 border border-cyan-300/30 transform hover:scale-105"
              >
                <Home className="w-4 h-4" />
                {user 
                  ? `${rol === 'admin' ? 'Ir al Admin Panel' : 'Volver al Dashboard'}`
                  : 'Ir al Login'
                }
              </button>
              
              <button
                onClick={handleGoBack}
                className="w-full flex items-center justify-center gap-2 bg-gray-700/50 hover:bg-gray-600/60 text-gray-200 font-semibold py-3 px-4 rounded-xl transition-all duration-300 border border-gray-600/50 backdrop-blur-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver atrás
              </button>
            </motion.div>

            {/* Footer con mensaje de soporte */}
            <motion.div 
              className="mt-6 pt-4 border-t border-gray-700/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <p className="text-xs text-gray-400 mb-2">
                ¿Seguís teniendo problemas?
              </p>
              <p className="text-xs text-cyan-300 font-medium">
                Contactá a soporte: DTE Fit está aquí para ayudarte
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Mensaje adicional fuera del card */}
        <motion.div 
          className="mt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <p className="text-xs text-gray-400">
            💪 DTE Fit - Transformando vidas a través del entrenamiento
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
