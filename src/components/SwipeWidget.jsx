import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Play, Download, Smartphone, Dumbbell, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import usePWAInstall from '../hooks/usePWAInstall';

const SwipeWidget = ({ isOpen, onClose, swipeProgress = 0, closeProgress = 0 }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { user, rol } = useAuth();
  
  // Hook PWA con API real
  const { 
    installPWA, 
    isInstalling,
    isInstalled,
    shouldShowWidget,
    getBrowserInfo
  } = usePWAInstall();
  
  // Información de browser/plataforma
  const browserInfo = getBrowserInfo();
  
  // Sistema de acciones simplificado
  const executeAction = useCallback((action) => {
    onClose();
    
    // Navegación inmediata sin delay innecesario
    setTimeout(() => {
      switch(action) {
        case 'install':
          navigate('/instalar');
          break;
        case 'mis-cursos':
          const destination = rol === 'admin' ? '/admin/cursos' : '/mis-cursos';
          navigate(destination);
          break;
        case 'catalogo':
          navigate('/cursos');
          break;
        case 'rutinas':
          const rutinaDestination = rol === 'admin' ? '/admin/rutinas' : '/dashboard';
          navigate(rutinaDestination);
          break;
        case 'dietas':
          const dietaDestination = rol === 'admin' ? '/admin/dietas' : '/mis-dietas';
          navigate(dietaDestination);
          break;
        default:
          // Unknown action - do nothing
          break;
      }
    }, 50);
  }, [onClose, navigate, rol]);
  
  // Event handler limpio para botones
  const handleButtonClick = useCallback((e, action) => {
    e.preventDefault();
    e.stopPropagation();
    
    executeAction(action);
  }, [executeAction]);

  // Timer para reloj
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Cálculo de progreso normalizado
  const openProgress = Math.min(swipeProgress / 200, 1);
  const closeProgressNormalized = Math.min(closeProgress / 150, 1);

  // Determinar variante de animación
  let currentVariant = 'closed';
  if (closeProgress > 0) {
    currentVariant = 'closing';
  } else if (swipeProgress > 0) {
    currentVariant = 'dragging';
  } else if (isOpen) {
    currentVariant = 'open';
  }

  // Variantes optimizadas de Framer Motion
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
      x: `${0 - closeProgressNormalized * 100}%`,
      transition: { type: 'tween', duration: 0 }
    }
  };

  const overlayVariants = {
    closed: { opacity: 0 },
    open: { opacity: 0.6 },
    dragging: { opacity: openProgress * 0.6 },
    closing: { opacity: (1 - closeProgressNormalized) * 0.6 }
  };




  // Widget de Rutinas
  const RutinasWidget = () => {
    // Caso sin usuario: no mostrar widget de rutinas
    if (!user || (rol !== 'admin' && rol !== 'alumno')) {
      return null;
    }

    return (
      <button
        onClick={(e) => handleButtonClick(e, 'rutinas')}
        data-action="rutinas"
        className="rounded-2xl p-4 flex flex-col justify-center items-center backdrop-blur-sm border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 group w-full  min-h-[180px] cursor-pointer "
        style={{ touchAction: 'manipulation' }}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/30 mb-2 group-hover:bg-orange-400/40 transition-colors">
          <Dumbbell className="w-6 h-6 text-orange-300 group-hover:text-orange-200" />
        </div>
        <div className="text-sm font-semibold text-white mb-1">
          {rol === 'admin' ? 'Gestionar Rutinas' : 'Mis Rutinas'}
        </div>
        <div className="text-xs text-gray-400 text-center">
          {rol === 'admin' ? 'Panel de rutinas' : 'Ver mis entrenamientos'}
        </div>
      </button>
    );
  };

  // Widget de Cursos con navegación por rol
  const CursosWidget = () => {
    // Caso sin usuario: mostrar sólo catálogo
    if (!user || (rol !== 'admin' && rol !== 'alumno')) {
      return (
        <button
          onClick={(e) => handleButtonClick(e, 'catalogo')}
          data-action="catalogo"
          className="rounded-2xl p-6 flex flex-col justify-center items-center backdrop-blur-sm border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 group w-full cursor-pointer min-h-[180px]"
          style={{ touchAction: 'manipulation' }}
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-purple-500/30 mb-3 group-hover:bg-purple-400/40 transition-colors">
            <BookOpen className="w-7 h-7 text-purple-300 group-hover:text-purple-200" />
          </div>
     
          <div className="text-sm text-gray-400 text-center">
            Descubre nuestros cursos
          </div>
        </button>
      );
    }

    // Caso con usuario logueado - solo botón principal
    return (
      <button
        onClick={(e) => handleButtonClick(e, 'mis-cursos')}
        data-action="mis-cursos"
        className="rounded-2xl p-4 flex flex-col justify-center items-center backdrop-blur-sm border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 group w-full cursor-pointer min-h-[180px]"
        style={{ touchAction: 'manipulation' }}
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
      </button>
    );
  };

  // Widget de Dietas
  const DietasWidget = () => {
    // Solo mostrar para usuarios autenticados
    if (!user || (rol !== 'admin' && rol !== 'alumno')) {
      return null;
    }

    return (
      <button
        onClick={(e) => handleButtonClick(e, 'dietas')}
        data-action="dietas"
        className="rounded-2xl p-4 flex flex-col justify-center items-center backdrop-blur-sm border border-green-500/20 hover:border-green-400/40 transition-all duration-300 group w-full cursor-pointer min-h-[180px]"
        style={{ touchAction: 'manipulation' }}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/30 mb-2 group-hover:bg-green-400/40 transition-colors">
          <Utensils className="w-6 h-6 text-green-300 group-hover:text-green-200" />
        </div>
        <div className="text-sm font-semibold text-white mb-1">
          {rol === 'admin' ? 'Gestionar Dietas' : 'Mis Dietas'}
        </div>
        <div className="text-xs text-gray-400 text-center">
          {rol === 'admin' ? 'Panel de dietas' : 'Tus planes nutricionales'}
        </div>
      </button>
    );
  };

  // Handler para overlay click
  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <AnimatePresence>
      {(isOpen || swipeProgress > 0 || closeProgress > 0) && (
        <>
          {/* Overlay con blur */}
          <motion.div
            className="fixed inset-0 bg-black z-overlay"
            variants={overlayVariants}
            initial="closed"
            animate={currentVariant}
            exit="closed"
            onClick={handleOverlayClick}
            style={{ backdropFilter: 'blur(8px)' }}
          />

          {/* Panel principal */}
          <motion.div
            className="fixed top-0 h-full z-drawer shadow-2xl"
            data-swipe-widget
            variants={widgetVariants}
            initial="closed"
            animate={currentVariant}
            exit="closed"
            style={{
              width: '100vw',
              left: '0',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(20px) saturate(150%)',
              touchAction: 'pan-y manipulation' // Permitir scroll vertical y optimizar toques
            }}
          >
            

            {/* Contenido principal */}
            <div className="h-full pt-20 flex items-center justify-center">
              <div className="w-full max-w-md px-4 py-8 ">
                <div className="grid grid-cols-2 gap-3 auto-rows-min ">
           
                  
                  {/* Rutinas */}
                  <div className="col-span-1">
                    <RutinasWidget />
                  </div>
                  
                  {/* Cursos */}
                  <div className="col-span-1">
                    <CursosWidget />
                  </div>

                  {/* Dietas */}
                  <div className="col-span-2">
                    <DietasWidget />
                  </div>

                   
                </div>
              </div>
            </div>

            {/* Indicador de gesto activo */}
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
