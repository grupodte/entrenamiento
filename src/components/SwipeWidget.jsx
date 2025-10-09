import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Utensils, BookOpen } from 'lucide-react';
import arrow from '../assets/arrow.svg';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Import background images
import rutinaImage from '../assets/rutina.webp';
import cursoImage from '../assets/curso.webp';
import dietaImage from '../assets/dieta.webp';

const SwipeWidget = ({ isOpen, onClose }) => {
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

  // Sin cálculos de progreso ya que no hay swipe

  // Estado para fade-in optimizado
  const [shouldUseFadeIn, setShouldUseFadeIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldUseFadeIn(true);
      const timer = setTimeout(() => setShouldUseFadeIn(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Memoizar la variante actual
  const currentVariant = useMemo(() => {
    if (isOpen) return shouldUseFadeIn ? 'fadeIn' : 'open';
    return 'closed';
  }, [isOpen, shouldUseFadeIn]);

  // Variantes simplificadas sin swipe
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
    fadeIn: {
      x: '0%',
      opacity: 1,
      transition: {
        opacity: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
        x: { duration: 0 }
      }
    }
  }), []);

  const overlayVariants = useMemo(() => ({
    closed: { opacity: 0 },
    open: {
      opacity: 0.5,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    },
    fadeIn: {
      opacity: 0.5,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    }
  }), []);

  // Componentes memoizados para evitar re-renders
  const WidgetButton = React.memo(({ action, icon: Icon, title, subtitle, backgroundImage, shadow }) => (
    <button
      onClick={(e) => handleButtonClick(e, action)}
      data-action={action}
      className="relative rounded-[10px] px-[24px] pb-[40px] flex flex-col justify-end overflow-hidden"
      style={{
        touchAction: 'manipulation',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        boxShadow: shadow,
        width: '100%', // Responsive width
        maxWidth: '380px',
        height: '222px',
        willChange: 'transform', // Hint para GPU
        backfaceVisibility: 'hidden' // Evitar flickering
      }}
    >
      
      <div className="relative z-10 w-full flex flex-row justify-between items-center">
        <div className="text-white text-[39px] font-normal">{title}</div>
        <img src={arrow} alt="arrow" className="w-6 h-6" />
      </div>

    </button>
  ));

  // Configuraciones de widgets memoizadas
  const widgetConfigs = useMemo(() => [
    {
      action: 'rutinas',
      icon: Dumbbell,
      title: rol === 'admin' ? 'Rutinas' : 'Mis rutinas',
      backgroundImage: rutinaImage,
    },
    {
      action: 'mis-cursos',
      icon: BookOpen,
      title: rol === 'admin' ? 'Cursos' : 'Mis cursos',
      backgroundImage: cursoImage,
    },
    {
      action: 'dietas',
      icon: Utensils,
      title: rol === 'admin' ? 'Dietas' : 'Mi dieta',
      backgroundImage: dietaImage,
    }
  ], [rol]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Manejador para prevenir propagación de eventos de scroll
  const handleScrollContainerTouch = useCallback((e) => {
    // Permitir que los eventos de touch pasen al scroll container
    e.stopPropagation();
  }, []);

  // Prevenir cierre accidental durante scroll
  const handleScrollStart = useCallback(() => {
    // Opcional: marcar que se está scrolleando para prevenir cierre accidental
  }, []);

  // Sin indicador de progreso ya que no hay swipe

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Overlay optimizado */}
          <motion.div
            className="fixed inset-0 z-overlay"
            variants={overlayVariants}
            initial={shouldUseFadeIn ? "fadeIn" : "open"}
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
            data-widget-panel
            variants={widgetVariants}
            initial={shouldUseFadeIn ? "fadeIn" : "open"}
            animate={currentVariant}
            exit="closed"
            style={{
              width: '100vw',
              left: '0',
              backgroundColor: '#FFFFFF',
              touchAction: 'manipulation', // Permitir scroll vertical
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              overflow: 'hidden' // Prevenir scroll en el contenedor principal
            }}
          >
            {/* Contenido principal */}
            <div className="h-full flex flex-col">
              {/* Contenedor con scroll vertical */}
              <div 
                className="
                  flex-1 
                  overflow-y-auto 
                  overscroll-contain
                  scrollbar-hide
                  px-4
                "
                style={{
                  paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
                  paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
                  touchAction: 'pan-y',
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth'
                }}
                onTouchStart={handleScrollContainerTouch}
                onScrollCapture={handleScrollStart}
              >
                {/* Grid de widgets con scroll vertical */}
                <div className="flex flex-col justify-start mx-auto space-y-4 w-full max-w-[400px]">
                  {widgetConfigs.map((config) => (
                    <WidgetButton key={config.action} {...config} />
                  ))}
                </div>
                
                {/* Espaciado adicional al final para mejor UX y safe area */}
                <div className="h-8" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default React.memo(SwipeWidget);