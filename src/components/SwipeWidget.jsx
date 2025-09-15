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
    isInstalled,
    isIOS 
  } = useInstallPWA();
  
  // Global click listener para debugging
  useEffect(() => {
    const globalClickHandler = (e) => {
      console.log('SwipeWidget: Global click detected', {
        target: e.target.tagName,
        className: e.target.className,
        coordinates: { x: e.clientX, y: e.clientY },
        element: e.target
      });
    };
    
    if (isOpen) {
      document.addEventListener('click', globalClickHandler, true);
      return () => document.removeEventListener('click', globalClickHandler, true);
    }
  }, [isOpen]);

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
      x: '-150%', // Mover más a la izquierda para compensar el centrado
      transition: { type: 'spring', stiffness: 400, damping: 40 }
    },
    open: {
      x: '-50%', // Posición centrada
      transition: { type: 'spring', stiffness: 400, damping: 40 }
    },
    dragging: {
      x: `${-150 + openProgress * 100}%`, // Ajustar para el nuevo rango
      transition: { type: 'tween', duration: 0 }
    },
    closing: {
      x: `${-50 - closeProgressNormalized * 100}%`, // Ajustar para cierre desde centro
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
    <div className="rounded-2xl p-4 flex flex-col justify-center items-center backdrop-blur-sm border border-blue-500/20">
      <div className="text-2xl font-light text-white mb-1">
        {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-xs text-gray-300 text-center">
        {currentTime.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })}
      </div>
    </div>
  );

  const PWAInstallWidget = () => {
    // Siempre mostrar el botón, ya que en móviles siempre se puede agregar manualmente
    const showInstallButton = !isInstalled;
    
    if (!showInstallButton) {
      console.log('PWA: App already installed, not showing button');
      return null;
    }
    
    const handleInstallClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('PWA: Install button clicked - navigating to install page');
      console.log('PWA: Event details:', { target: e.target, currentTarget: e.currentTarget });
      
      // Cerrar el widget y navegar a la página de instalación
      onClose();
      navigate('/instalar');
    };
    
    const handleMouseDown = (e) => {
      console.log('PWA: Mouse down detected', e.target);
    };
    
    const handleMouseUp = (e) => {
      console.log('PWA: Mouse up detected', e.target);
      e.preventDefault();
      e.stopPropagation();
      
      console.log('PWA: Install button clicked via mouseUp - navigating to install page');
      console.log('PWA: Event details:', { target: e.target, currentTarget: e.currentTarget });
      
      // Cerrar el widget y navegar a la página de instalación
      onClose();
      navigate('/instalar');
    };
    
    console.log('PWA: Rendering install widget, isInstalling:', isInstalling, 'isIOS:', isIOS, 'canAutoInstall:', shouldShowInstallButton());
    
    return (
      <button
        onClick={handleInstallClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        disabled={isInstalling}
        className="rounded-2xl p-3 flex flex-col items-center justify-center backdrop-blur-sm border border-green-500/20 hover:border-green-400/40 transition-all duration-300 group w-full disabled:opacity-50 h-full cursor-pointer hover:scale-105 active:scale-95"
        style={{ pointerEvents: 'auto', zIndex: 100 }}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/30 group-hover:bg-green-400/40 transition-colors mb-2">
          {isInstalling ? (
            <div className="w-5 h-5 border-2 border-green-300 border-t-transparent rounded-full animate-spin" />
          ) : isIOS ? (
            <Smartphone className="w-5 h-5 text-green-300 group-hover:text-green-200" />
          ) : (
            <Download className="w-5 h-5 text-green-300 group-hover:text-green-200" />
          )}
        </div>
        <div className="text-center">
          <div className="text-xs font-semibold text-white mb-1">
            {isInstalling ? 'Instalando...' : isIOS ? 'Añadir al Inicio' : 'Instalar App'}
          </div>
          <div className="text-xs text-gray-400">
            {isIOS ? 'Ver instrucciones' : 'Agregar a escritorio'}
          </div>
        </div>
      </button>
    );
  };

  const CursosWidget = () => {
    console.log('CursosWidget: Renderizando', { user: !!user, rol });
    
    const handleMisCursosClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('CursosWidget: Mis Cursos clicked', { rol, user: !!user });
      console.log('CursosWidget: Event details:', { target: e.target, currentTarget: e.currentTarget });
      
      onClose();
      if (rol === 'admin') {
        console.log('CursosWidget: Navigating to /admin/cursos');
        navigate('/admin/cursos');
      } else if (rol === 'alumno') {
        console.log('CursosWidget: Navigating to /mis-cursos');
        navigate('/mis-cursos');
      }
    };

    const handleCatalogoClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('CursosWidget: Catálogo clicked');
      console.log('CursosWidget: Event details:', { target: e.target, currentTarget: e.currentTarget });
      
      onClose();
      console.log('CursosWidget: Navigating to /cursos');
      navigate('/cursos');
    };
    
    const handleMouseDownCursos = (e) => {
      console.log('CursosWidget: Mouse down detected', e.target);
    };
    
    const handleMouseUpCursos = (e) => {
      console.log('CursosWidget: Mouse up detected', e.target);
      e.preventDefault();
      e.stopPropagation();
      
      // Determinar qué acción tomar según el contexto
      if (e.currentTarget.dataset.action === 'mis-cursos') {
        console.log('CursosWidget: Mis Cursos clicked via mouseUp', { rol, user: !!user });
        console.log('CursosWidget: Event details:', { target: e.target, currentTarget: e.currentTarget });
        
        onClose();
        if (rol === 'admin') {
          console.log('CursosWidget: Navigating to /admin/cursos');
          navigate('/admin/cursos');
        } else if (rol === 'alumno') {
          console.log('CursosWidget: Navigating to /mis-cursos');
          navigate('/mis-cursos');
        }
      } else if (e.currentTarget.dataset.action === 'catalogo') {
        console.log('CursosWidget: Catálogo clicked via mouseUp');
        console.log('CursosWidget: Event details:', { target: e.target, currentTarget: e.currentTarget });
        
        onClose();
        console.log('CursosWidget: Navigating to /cursos');
        navigate('/cursos');
      }
    };

    if (!user || (rol !== 'admin' && rol !== 'alumno')) {
      return (
        <button
          onClick={handleCatalogoClick}
          onMouseDown={handleMouseDownCursos}
          onMouseUp={handleMouseUpCursos}
          data-action="catalogo"
          className="rounded-2xl p-6 flex flex-col justify-center items-center backdrop-blur-sm border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 group w-full cursor-pointer hover:scale-105 active:scale-95"
          style={{ pointerEvents: 'auto', zIndex: 100 }}
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
        </button>
      );
    }

    return (
      <div className="space-y-3" style={{ pointerEvents: 'auto' }}>
        {/* Botón principal según el rol */}
        <button
          onClick={handleMisCursosClick}
          onMouseDown={handleMouseDownCursos}
          onMouseUp={handleMouseUpCursos}
          data-action="mis-cursos"
          className="rounded-2xl p-4 flex flex-col justify-center items-center backdrop-blur-sm border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 group w-full cursor-pointer hover:scale-105 active:scale-95"
          style={{ pointerEvents: 'auto', zIndex: 100 }}
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

        {/* Botón para catálogo (solo para alumnos) */}
        {rol === 'alumno' && (
          <button
            onClick={handleCatalogoClick}
            onMouseDown={handleMouseDownCursos}
            onMouseUp={handleMouseUpCursos}
            data-action="catalogo"
            className="rounded-2xl p-4 flex items-center gap-3 backdrop-blur-sm border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 group w-full cursor-pointer hover:scale-105 active:scale-95"
            style={{ pointerEvents: 'auto', zIndex: 100 }}
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
          </button>
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
            className="fixed top-0 h-full z-50 shadow-2xl"
            variants={widgetVariants}
            initial="closed"
            animate={currentVariant}
            exit="closed"
            style={{
              width: '95vw',
              left: '50%',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
              WebkitBackdropFilter: 'blur(20px) saturate(150%)',
              backdropFilter: 'blur(20px) saturate(150%)'
            }}
          >
            {/* Indicador de arrastre */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-white/20 rounded-full" />

            <div className="h-full pt-20 flex items-center justify-center">
              {/* Content */}
              <div
                className="w-full max-w-md px-4 py-8"
                style={{ pointerEvents: 'auto', position: 'relative', zIndex: 5 }}
              >
                <div className="grid grid-cols-2 gap-3 auto-rows-min" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}>
                  {/* Tiempo - 1 columna */}
                  <div className="col-span-1" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 20 }}>
                    <TimeWidget />
                  </div>
                  
                  {/* PWA Install Widget - 1 columna */}
                  <div className="col-span-1" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 20 }}>
                    <PWAInstallWidget />
                    
                    {/* Widget simple si PWA no está disponible */}
                    {!shouldShowInstallButton() && (
                      <div className="rounded-2xl p-3 flex flex-col items-center justify-center backdrop-blur-sm border border-gray-500/20 w-full h-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-500/30 mb-2">
                          <Smartphone className="w-5 h-5 text-gray-300" />
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-semibold text-white mb-1">
                            App Web
                          </div>
                          <div className="text-xs text-gray-400">
                            Ya disponible
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Cursos - 2 columnas */}
                  <div className="col-span-2" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 20 }}>
                    <CursosWidget />
                  </div>

                  {/* Spotify - 2 columnas completas */}
                 

                  {/* Espaciado final */}
                  <div className="col-span-2 h-4" />
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
