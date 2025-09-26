import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Utensils, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SwipeWidget = ({ isOpen, onClose, swipeProgress = 0, closeProgress = 0 }) => {
  const navigate = useNavigate();
  const { user, rol } = useAuth();

  // Memoizar las acciones para evitar recrear funciones
  const executeAction = useCallback((action) => {
    onClose();

    // Usar requestAnimationFrame para mejor timing
    requestAnimationFrame(() => {
      switch (action) {
        case 'mis-cursos':
          navigate(rol === 'admin' ? '/admin/cursos' : '/mis-cursos');
          break;
        case 'catalogo':
          navigate('/cursos');
          break;
        case 'rutinas':
          navigate(rol === 'admin' ? '/admin/rutinas' : '/dashboard');
          break;
        case 'dietas':
          navigate(rol === 'admin' ? '/admin/dietas' : '/mis-dietas');
          break;
        default:
          break;
      }
    });
  }, [onClose, navigate, rol]);

  const handleButtonClick = useCallback((e, action) => {
    e.preventDefault();
    e.stopPropagation();
    executeAction(action);
  }, [executeAction]);

  // Memoizar cálculos de progreso para evitar recálculos innecesarios
  const progressValues = useMemo(() => ({
    openProgress: Math.min(swipeProgress / 200, 1),
    closeProgressNormalized: Math.min(closeProgress / 150, 1)
  }), [swipeProgress, closeProgress]);

  // Estado para fade-in optimizado
  const [shouldUseFadeIn, setShouldUseFadeIn] = useState(false);

  useEffect(() => {
    if (isOpen && swipeProgress === 0 && closeProgress === 0) {
      setShouldUseFadeIn(true);
      const timer = setTimeout(() => setShouldUseFadeIn(false), 300); // Reducido
      return () => clearTimeout(timer);
    }
  }, [isOpen, swipeProgress, closeProgress]);

  // Memoizar la variante actual
  const currentVariant = useMemo(() => {
    if (closeProgress > 0) return 'closing';
    if (swipeProgress > 0) return 'dragging';
    if (isOpen) return shouldUseFadeIn ? 'fadeIn' : 'open';
    return 'closed';
  }, [closeProgress, swipeProgress, isOpen, shouldUseFadeIn]);

  // Variantes optimizadas con hardware acceleration
  const widgetVariants = useMemo(() => ({
    closed: {
      x: '-100%',
      opacity: 0,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 45,
        mass: 0.8
      }
    },
    open: {
      x: '0%',
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 45,
        mass: 0.8
      }
    },
    dragging: {
      x: `${-100 + progressValues.openProgress * 100}%`,
      opacity: Math.max(0.4, progressValues.openProgress),
      transition: { type: 'tween', duration: 0, ease: 'linear' }
    },
    closing: {
      x: `${0 - progressValues.closeProgressNormalized * 100}%`,
      opacity: 1 - progressValues.closeProgressNormalized * 0.6,
      transition: { type: 'tween', duration: 0, ease: 'linear' }
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
        opacity: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }, // easeOut custom
        x: { duration: 0 }
      }
    }
  }), [progressValues]);

  const overlayVariants = useMemo(() => ({
    closed: { opacity: 0 },
    open: {
      opacity: 0.5,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    },
    dragging: {
      opacity: progressValues.openProgress * 0.5,
      transition: { duration: 0 }
    },
    closing: {
      opacity: (1 - progressValues.closeProgressNormalized) * 0.5,
      transition: { duration: 0 }
    },
    initial: { opacity: 0 },
    fadeIn: {
      opacity: 0.5,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    }
  }), [progressValues]);

  // Componentes memoizados para evitar re-renders
  const WidgetButton = React.memo(({ action, icon: Icon, title, subtitle, gradient, shadow }) => (
    <button
      onClick={(e) => handleButtonClick(e, action)}
      data-action={action}
      className="relative rounded-2xl p-8 flex flex-col justify-between cursor-pointer overflow-hidden group transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        touchAction: 'manipulation',
        background: gradient,
        boxShadow: shadow,
        width: '380px',
        height: '222px',
        willChange: 'transform', // Hint para GPU
        backfaceVisibility: 'hidden' // Evitar flickering
      }}
    >
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon className="text-white w-8 h-8" />
          <div className="flex-1">
            <div className="text-white text-lg font-bold mb-1">
              {title}
            </div>
            <div className="text-white/80 text-sm">
              {subtitle}
            </div>
          </div>
        </div>
        <div className="text-white/90 group-hover:translate-x-1 transition-transform duration-200">
          →
        </div>
      </div>
    </button>
  ));

  // Configuraciones de widgets memoizadas
  const widgetConfigs = useMemo(() => [
    {
      action: 'rutinas',
      icon: Dumbbell,
      title: rol === 'admin' ? 'Rutinas' : 'Mis rutinas',
      subtitle: rol === 'admin' ? 'Panel de rutinas' : 'Mis entrenamientos',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      shadow: '0 4px 20px rgba(239, 68, 68, 0.3)'
    },
    {
      action: 'mis-cursos',
      icon: BookOpen,
      title: rol === 'admin' ? 'Cursos' : 'Mis cursos',
      subtitle: rol === 'admin' ? 'Panel admin' : 'Tus cursos asignados',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      shadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
    },
    {
      action: 'dietas',
      icon: Utensils,
      title: rol === 'admin' ? 'Dietas' : 'Mi dieta',
      subtitle: rol === 'admin' ? 'Panel de dietas' : 'Tu plan nutricional',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      shadow: '0 4px 20px rgba(245, 158, 11, 0.3)'
    }
  ], [rol]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Indicador de progreso memoizado
  const ProgressIndicator = React.memo(() => {
    if (swipeProgress === 0 && closeProgress === 0) return null;

    return (
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <div
          className="w-1 bg-cyan-400/60 rounded-full transition-opacity duration-200"
          style={{
            height: '64px',
            opacity: Math.max(progressValues.openProgress, progressValues.closeProgressNormalized),
            willChange: 'opacity'
          }}
        />
      </div>
    );
  });

  return (
    <AnimatePresence mode="wait">
      {(isOpen || swipeProgress > 0 || closeProgress > 0) && (
        <>
          {/* Overlay optimizado */}
          <motion.div
            className="fixed inset-0 z-overlay"
            variants={overlayVariants}
            initial={isOpen && shouldUseFadeIn ? "initial" : (isOpen ? "open" : "closed")}
            animate={currentVariant}
            exit="closed"
            onClick={handleOverlayClick}
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)', // Safari
              willChange: 'opacity'
            }}
          />

          {/* Panel principal optimizado */}
          <motion.div
            className="fixed top-0 h-full z-drawer"
            data-swipe-widget
            variants={widgetVariants}
            initial={isOpen && shouldUseFadeIn ? "initial" : (isOpen ? "open" : "closed")}
            animate={currentVariant}
            exit="closed"
            style={{
              width: '100vw',
              left: '0',
              backgroundColor: '#FFFFFF',
              touchAction: 'pan-y manipulation',
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
          >
            {/* Contenido principal */}
            <div className="h-full flex flex-col">
              <div className="flex-1 flex flex-col justify-start mx-auto space-y-2 pt-[calc(env(safe-area-inset-top)+24px)]">
                {widgetConfigs.map((config, index) => (
                  <WidgetButton key={config.action} {...config} />
                ))}
              </div>
            </div>

            <ProgressIndicator />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default React.memo(SwipeWidget);