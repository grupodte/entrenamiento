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

  // Estado para controlar animación fade-in cada vez que se abre
  const [shouldUseFadeIn, setShouldUseFadeIn] = useState(false);
  
  // Effect para activar fade-in cada vez que se abre desde cerrado
  useEffect(() => {
    if (isOpen && swipeProgress === 0 && closeProgress === 0) {
      // Solo usar fadeIn si se abre sin gesto de swipe
      setShouldUseFadeIn(true);
      const timer = setTimeout(() => setShouldUseFadeIn(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen, swipeProgress, closeProgress]);

  // Determinar variante de animación
  let currentVariant = 'closed';
  if (closeProgress > 0) {
    currentVariant = 'closing';
  } else if (swipeProgress > 0) {
    currentVariant = 'dragging';
  } else if (isOpen) {
    // Usar fadeIn cada vez que shouldUseFadeIn esté activo
    currentVariant = shouldUseFadeIn ? 'fadeIn' : 'open';
  }

  // Variantes optimizadas de Framer Motion con fade-in
  const widgetVariants = {
    closed: {
      x: '-100%',
      opacity: 0,
      transition: { type: 'spring', stiffness: 400, damping: 40 }
    },
    open: {
      x: '0%',
      opacity: 1,
      transition: { 
        type: 'spring', 
        stiffness: 400, 
        damping: 40,
        opacity: { duration: 0.6, ease: 'easeOut' }
      }
    },
    dragging: {
      x: `${-100 + openProgress * 100}%`,
      opacity: Math.max(0.3, openProgress),
      transition: { type: 'tween', duration: 0 }
    },
    closing: {
      x: `${0 - closeProgressNormalized * 100}%`,
      opacity: 1 - closeProgressNormalized * 0.7,
      transition: { type: 'tween', duration: 0 }
    },
    initial: {
      x: '0%',
      opacity: 0,
      transition: { duration: 0 }
    },
    fadeIn: {
      x: '0%',
      opacity: 1,
      transition: { 
        opacity: { duration: 0.8, ease: 'easeOut' },
        x: { duration: 0 }
      }
    }
  };

  const overlayVariants = {
    closed: { opacity: 0 },
    open: { 
      opacity: 0.6,
      transition: { duration: 0.6, ease: 'easeOut' }
    },
    dragging: { opacity: openProgress * 0.6 },
    closing: { opacity: (1 - closeProgressNormalized) * 0.6 },
    initial: { opacity: 0 },
    fadeIn: { 
      opacity: 0.6,
      transition: { duration: 0.8, ease: 'easeOut' }
    }
  };




  // Widget de Rutinas
  const RutinasWidget = () => {
    return (
      <button
        onClick={(e) => handleButtonClick(e, 'rutinas')}
        data-action="rutinas"
        className="relative rounded-2xl p-8 flex flex-col justify-between cursor-pointer overflow-hidden group transition-all duration-300 hover:scale-[1.02]"
        style={{ 
          touchAction: 'manipulation',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
          width: '380px',
          height: '222px'
        }}
      >
        {/* Contenido */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <div className="text-white text-lg font-bold mb-1">
              {rol === 'admin' ? 'Rutinas' : 'Mis rutinas'}
            </div>
            <div className="text-white/80 text-sm">
              {rol === 'admin' ? 'Panel de rutinas' : 'Mis entrenamientos'}
            </div>
          </div>
          <div className="text-white/90 group-hover:translate-x-1 transition-transform duration-200">
            →
          </div>
        </div>
      </button>
    );
  };

  // Widget de Cursos
  const CursosWidget = () => {
    return (
      <button
        onClick={(e) => handleButtonClick(e, 'mis-cursos')}
        data-action="mis-cursos"
        className="relative rounded-2xl p-8 flex flex-col justify-between cursor-pointer overflow-hidden group transition-all duration-300 hover:scale-[1.02]"
        style={{ 
          touchAction: 'manipulation',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
          width: '380px',
          height: '222px'
        }}
      >
        {/* Contenido */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <div className="text-white text-lg font-bold mb-1">
              {rol === 'admin' ? 'Cursos' : 'Mis cursos'}
            </div>
            <div className="text-white/80 text-sm">
              {rol === 'admin' ? 'Panel admin' : 'Tus cursos asignados'}
            </div>
          </div>
          <div className="text-white/90 group-hover:translate-x-1 transition-transform duration-200">
            →
          </div>
        </div>
      </button>
    );
  };

  // Widget de Dietas
  const DietasWidget = () => {
    return (
      <button
        onClick={(e) => handleButtonClick(e, 'dietas')}
        data-action="dietas"
        className="relative rounded-2xl p-6 flex flex-col justify-between cursor-pointer overflow-hidden group transition-all duration-300 hover:scale-[1.02]"
        style={{ 
          touchAction: 'manipulation',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
          width: '380px',
          height: '222px'
        }}
      >
        {/* Contenido */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <div className="text-white text-lg font-bold mb-1">
              {rol === 'admin' ? 'Dietas' : 'Mi dieta'}
            </div>
            <div className="text-white/80 text-sm">
              {rol === 'admin' ? 'Panel de dietas' : 'Tu plan nutricional'}
            </div>
          </div>
          <div className="text-white/90 group-hover:translate-x-1 transition-transform duration-200">
            →
          </div>
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
            initial={isOpen && shouldUseFadeIn ? "initial" : (isOpen ? "open" : "closed")}
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
            initial={isOpen && shouldUseFadeIn ? "initial" : (isOpen ? "open" : "closed")}
            animate={currentVariant}
            exit="closed"
            style={{
              width: '100vw',
              left: '0',
              backdropFilter: 'blur(5px)',
              backgroundColor: '#FFFFFF',
              touchAction: 'pan-y manipulation' // Permitir scroll vertical y optimizar toques
            }}
          >
            

            {/* Contenido principal */}
            <div className="h-full flex flex-col">
              <div className="flex-1 flex flex-col justify-center mx-auto space-y-2" >
                
                {/* Rutinas */}
                <RutinasWidget />
                
                {/* Cursos */}
                <CursosWidget />

                {/* Dietas */}
                <DietasWidget />

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
