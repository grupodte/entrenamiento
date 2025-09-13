// ✅ SwipeWidget.jsx actualizado para compatibilidad con el fix del gesture
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Music, BookOpen, Play, Users, Download, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useInstallPWA from '../hooks/useInstallPWA';
import SpotifyWidget from './SpotifyWidget';

const SwipeWidget = ({ isOpen, onClose, swipeProgress = 0, closeProgress = 0 }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { user, rol } = useAuth();
  
  // Hook para instalación PWA
  const { 
    handleInstallApp, 
    shouldShowInstallButton, 
    getInstallButtonText, 
    isInstalling,
    isIOS 
  } = useInstallPWA();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Aplicar clases CSS contextuales
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('widget-active');
      document.documentElement.classList.add('widget-active');
    } else {
      document.body.classList.remove('widget-active');
      document.documentElement.classList.remove('widget-active');
    }

    return () => {
      document.body.classList.remove('widget-active');
      document.documentElement.classList.remove('widget-active');
    };
  }, [isOpen]);

  const openProgress = Math.min(swipeProgress / 200, 1);
  const closeProgressNormalized = Math.min(closeProgress / 150, 1);

  let currentVariant = 'closed';
  if (closeProgress > 0) {
    currentVariant = 'closing';
  } else if (swipeProgress > 0) {
    currentVariant = 'dragging';
  } else if (isOpen) {
    currentVariant = 'open';
  }

  const widgetVariants = {
    closed: {
      x: '-100%',
      transition: { type: 'spring', stiffness: 400, damping: 40 }
    },
    open: {
      x: '0%',
      transition: { type: 'spring', stiffness: 400, damping: 40 }
    },
    dragging: {
      x: `${-100 + openProgress * 100}%`,
      transition: { type: 'tween', duration: 0 }
    },
    closing: {
      x: `${-closeProgressNormalized * 100}%`,
      transition: { type: 'tween', duration: 0 }
    }
  };

  const overlayVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 },
    dragging: { opacity: openProgress * 0.6 },
    closing: { opacity: (1 - closeProgressNormalized) * 0.6 }
  };

  const TimeWidget = () => (
    <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 p-6 flex flex-col justify-center items-center backdrop-blur-sm border border-blue-500/20">
      <div className="text-3xl font-light text-white mb-1">
        {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-sm text-gray-300 text-center">
        {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
    </div>
  );

  const PWAInstallWidget = () => {
    if (!shouldShowInstallButton()) return null;
    
    const handleInstallClick = async () => {
      const success = await handleInstallApp();
      if (success && !isIOS) {
        // Cerrar el widget después de una instalación exitosa
        setTimeout(() => onClose(), 1000);
      }
    };
    
    return (
      <motion.button
        onClick={handleInstallClick}
        disabled={isInstalling}
        className="rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 p-4 flex items-center gap-3 backdrop-blur-sm border border-green-500/20 hover:border-green-400/40 transition-all duration-300 group w-full disabled:opacity-50"
        whileHover={{ scale: isInstalling ? 1 : 1.02 }}
        whileTap={{ scale: isInstalling ? 1 : 0.98 }}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/30 group-hover:bg-green-400/40 transition-colors">
          {isInstalling ? (
            <div className="w-6 h-6 border-2 border-green-300 border-t-transparent rounded-full animate-spin" />
          ) : isIOS ? (
            <Smartphone className="w-6 h-6 text-green-300 group-hover:text-green-200" />
          ) : (
            <Download className="w-6 h-6 text-green-300 group-hover:text-green-200" />
          )}
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold text-white mb-1">
            {isInstalling ? 'Instalando...' : getInstallButtonText()}
          </div>
          <div className="text-xs text-gray-400">
            {isIOS ? 'Añadir a pantalla de inicio' : 'Acceso rápido desde escritorio'}
          </div>
        </div>
        
        {/* Indicador de instalación */}
        {!isInstalling && (
          <div className="w-2 h-2 bg-green-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
        )}
      </motion.button>
    );
  };

  const CursosWidget = () => {
    const handleMisCursosClick = () => {
      onClose();
      if (rol === 'admin') {
        navigate('/admin/cursos');
      } else if (rol === 'alumno') {
        navigate('/mis-cursos');
      }
    };

    const handleCatalogoClick = () => {
      onClose();
      navigate('/cursos');
    };

    if (!user || (rol !== 'admin' && rol !== 'alumno')) {
      return (
        <motion.button
          onClick={handleCatalogoClick}
          className="rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 p-6 flex flex-col justify-center items-center backdrop-blur-sm border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 group w-full"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-purple-500/30 mb-3 group-hover:bg-purple-400/40 transition-colors">
            <BookOpen className="w-7 h-7 text-purple-300 group-hover:text-purple-200" />
          </div>
          <div className="text-base font-semibold text-white mb-1">
            Ver Catálogo
          </div>
          <div className="text-sm text-gray-400 text-center">
            Descubre nuestros cursos
          </div>
        </motion.button>
      );
    }

    return (
      <div className="space-y-3">
        {/* Botón principal según el rol */}
        <motion.button
          onClick={handleMisCursosClick}
          className="rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 p-4 flex flex-col justify-center items-center backdrop-blur-sm border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 group w-full"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/30 mb-2 group-hover:bg-purple-400/40 transition-colors">
            <BookOpen className="w-6 h-6 text-purple-300 group-hover:text-purple-200" />
          </div>
          <div className="text-sm font-semibold text-white mb-1">
            {rol === 'admin' ? 'Gestionar Cursos' : 'Mis Cursos'}
          </div>
          <div className="text-xs text-gray-400 text-center">
            {rol === 'admin' ? 'Panel admin' : 'Tus cursos asignados'}
          </div>
        </motion.button>

        {/* Botón para catálogo (solo para alumnos) */}
        {rol === 'alumno' && (
          <motion.button
            onClick={handleCatalogoClick}
            className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 p-4 flex items-center gap-3 backdrop-blur-sm border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 group w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/30 group-hover:bg-blue-400/40 transition-colors">
              <Play className="w-5 h-5 text-blue-300 group-hover:text-blue-200" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-white">
                Explorar Catálogo
              </div>
              <div className="text-xs text-gray-400">
                Descubre todos los cursos
              </div>
            </div>
          </motion.button>
        )}
      </div>
    );
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {(isOpen || swipeProgress > 0 || closeProgress > 0) && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            variants={overlayVariants}
            initial="closed"
            animate={currentVariant}
            exit="closed"
            onClick={handleOverlayClick}
            style={{ backdropFilter: 'blur(8px)' }}
          />

          <motion.div
            className="fixed left-0 top-0 h-full w-80 z-50 shadow-2xl"
            variants={widgetVariants}
            initial="closed"
            animate={currentVariant}
            exit="closed"
            style={{
        
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
              WebkitBackdropFilter: 'blur(20px) saturate(150%)',
              backdropFilter: 'blur(20px) saturate(150%)'
            }}
          >
            {/* Indicador de arrastre */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-white/20 rounded-full" />

            <div className="h-full flex flex-col bg-gradient-to-br from-gray-900/95 via-purple-900/30 to-gray-900/95">
              {/* Header */}
              <div className="p-4 pt-16">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-white">Panel Rápido</h2>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                <p className="text-gray-400 text-sm">Accede rápidamente a tus herramientas</p>
              </div>

              {/* Content */}
              <div
                className="flex-1 px-4 pb-8 overflow-y-auto scrollbar-hide"
                style={{ pointerEvents: 'auto' }}
              >
                <div className="space-y-4">
                  {/* Tiempo */}
                  <TimeWidget />
                  
                  {/* PWA Install Widget */}
                  <PWAInstallWidget />
                  
                  {/* Cursos */}
                  <CursosWidget />

                  {/* Spotify */}
                  <div style={{ pointerEvents: 'auto' }}>
                    <SpotifyWidget />
                  </div>

                  {/* Espaciado final */}
                  <div className="h-4" />
                </div>
              </div>
            </div>

            {(swipeProgress > 0 || closeProgress > 0) && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-1 h-16 bg-cyan-400/60 rounded-full animate-pulse" />
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SwipeWidget;
