import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, User, Target, ArrowLeft, MoreHorizontal, X, Menu, PanelLeftOpen } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingNavBar = ({ 
  onOpenPerfil, 
  isPerfilOpen = false,
  // Props para ProgressDock (solo en RutinaDetalle)
  showProgressDock = false,
  onToggleProgressDock = null,
  progressGlobal = 0,
  // Props para botón dinámico Home/Back
  onBackClick = null,
  // Props para SwipeWidget (solo en Dashboard)
  onOpenSwipeWidget = null,
  isSwipeWidgetOpen = false
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [activeButton, setActiveButton] = useState('home');
  const [isStandalone, setIsStandalone] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0 });
  const [deviceOrientation, setDeviceOrientation] = useState('portrait');
  const navRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  
  // Estados para colapso/expansión
  const [isExpanded, setIsExpanded] = useState(false);
  const autoCloseTimeoutRef = useRef(null);
  
  // Detectar rutas específicas
  const isInRutinaDetalle = location.pathname.includes('/rutina/');
  const shouldShowProgressButton = isInRutinaDetalle && onToggleProgressDock;
  const shouldShowSwipeButton = !isInRutinaDetalle && onOpenSwipeWidget; // Solo en Dashboard
  
  // Funciones para manejo de expansión
  const startAutoCloseTimer = useCallback(() => {
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
    }
    autoCloseTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 4000); // 4 segundos
  }, []);
  
  const clearAutoCloseTimer = useCallback(() => {
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }
  }, []);
  
  const toggleExpanded = useCallback(() => {
    if (isExpanded) {
      setIsExpanded(false);
      clearAutoCloseTimer();
    } else {
      setIsExpanded(true);
      startAutoCloseTimer();
    }
  }, [isExpanded, startAutoCloseTimer, clearAutoCloseTimer]);

  // Sincronizar activeButton con el estado del drawer
  useEffect(() => {
    if (!isPerfilOpen && activeButton === 'profile') {
      setActiveButton('home');
    }
  }, [isPerfilOpen, activeButton]);

  // Detectar modo PWA y características del dispositivo
  useEffect(() => {
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://');
    setIsStandalone(isStandaloneMode);

    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch);

    const computedStyle = getComputedStyle(document.documentElement);
    const safeTop = parseInt(
      computedStyle.getPropertyValue('--sat') ||
      computedStyle.getPropertyValue('env(safe-area-inset-top)') ||
      '0'
    );
    const safeBottom = parseInt(
      computedStyle.getPropertyValue('--sab') ||
      computedStyle.getPropertyValue('env(safe-area-inset-bottom)') ||
      '0'
    );

    setSafeAreaInsets({
      top: Math.max(safeTop, 20),
      bottom: Math.max(safeBottom, 20),
    });

    const updateOrientation = () => {
      if (screen.orientation) {
        setDeviceOrientation(
          screen.orientation.angle === 0 || screen.orientation.angle === 180
            ? 'portrait'
            : 'landscape'
        );
      } else {
        setDeviceOrientation(
          window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
        );
      }
    };

    updateOrientation();
    screen.orientation?.addEventListener('change', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);

    return () => {
      screen.orientation?.removeEventListener('change', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  // Posición inicial centrada
  useEffect(() => {
    if (typeof window !== 'undefined' && navRef.current) {
      const rect = navRef.current.getBoundingClientRect();
      const centerX = (window.innerWidth - rect.width) / 2;
      const bottomY =
        window.innerHeight - rect.height - (safeAreaInsets.bottom + 24);

      setPosition({ x: centerX, y: bottomY });
      setInitialPosition({ x: centerX, y: bottomY });
    }
  }, [safeAreaInsets]);

  // Calcular límites válidos
  const getBounds = useCallback(() => {
    if (!navRef.current || typeof window === 'undefined') {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const rect = navRef.current.getBoundingClientRect();
    const margin = deviceOrientation === 'landscape' ? 15 : 20;
    const topMargin = safeAreaInsets.top + margin;
    const bottomMargin = safeAreaInsets.bottom + margin;

    return {
      minX: margin,
      maxX: window.innerWidth - rect.width - margin,
      minY: topMargin,
      maxY: window.innerHeight - rect.height - bottomMargin,
    };
  }, [safeAreaInsets, deviceOrientation]);

  // Snap a los bordes
  const snapToEdge = useCallback(
    (currentX, currentY) => {
      if (typeof window === 'undefined')
        return { x: currentX, y: currentY };

      const bounds = getBounds();
      const snapThreshold = Math.min(window.innerWidth * 0.15, 80);
      const centerX =
        currentX +
        (navRef.current?.getBoundingClientRect().width || 0) / 2;

      let targetX = currentX;
      let targetY = Math.max(bounds.minY, Math.min(bounds.maxY, currentY));

      if (centerX < snapThreshold) {
        targetX = bounds.minX;
      } else if (centerX > window.innerWidth - snapThreshold) {
        targetX = bounds.maxX;
      }

      return { x: targetX, y: targetY };
    },
    [getBounds]
  );

  // Manejar inicio del arrastre
  const handleDragStart = useCallback(
    (clientX, clientY) => {
      setIsDragging(true);
      setDragStart({ x: clientX - position.x, y: clientY - position.y });
    },
    [position]
  );

  // Manejar movimiento del arrastre
  const handleDragMove = useCallback(
    (clientX, clientY) => {
      if (!isDragging) return;

      const bounds = getBounds();
      const newX = Math.max(
        bounds.minX,
        Math.min(bounds.maxX, clientX - dragStart.x)
      );
      const newY = Math.max(
        bounds.minY,
        Math.min(bounds.maxY, clientY - dragStart.y)
      );

      setPosition({ x: newX, y: newY });
    },
    [isDragging, dragStart, getBounds]
  );

  // Manejar fin del arrastre
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    const snappedPosition = snapToEdge(position.x, position.y);
    setPosition(snappedPosition);
  }, [isDragging, position, snapToEdge]);

  // Event listeners para mouse
  useEffect(() => {
    if (!isTouchDevice) return;

    const handleMouseMove = (e) => handleDragMove(e.clientX, e.clientY);
    const handleMouseUp = () => handleDragEnd();

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd, isTouchDevice]);

  // Event listeners para touch
  useEffect(() => {
    if (!isTouchDevice) return;

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => handleDragEnd();

    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd, isTouchDevice]);

  // Reposicionar en resize
  useEffect(() => {
    const handleResize = () => {
      const bounds = getBounds();
      const constrainedX = Math.max(
        bounds.minX,
        Math.min(bounds.maxX, position.x)
      );
      const constrainedY = Math.max(
        bounds.minY,
        Math.min(bounds.maxY, position.y)
      );

      if (constrainedX !== position.x || constrainedY !== position.y) {
        setPosition({ x: constrainedX, y: constrainedY });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, getBounds]);
  
  // Cleanup del timeout al desmontar
  useEffect(() => {
    return () => {
      clearAutoCloseTimer();
    };
  }, [clearAutoCloseTimer]);

  // Reiniciar timer cuando el usuario interactúa
  const handleUserInteraction = useCallback(() => {
    if (isExpanded) {
      clearAutoCloseTimer();
      startAutoCloseTimer();
    }
  }, [isExpanded, clearAutoCloseTimer, startAutoCloseTimer]);
  
  const navButtonClass = (isActive, isProgressButton = false) => {
    const baseClass =
      'relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 group backdrop-blur-xl border shadow-lg hover:scale-110 active:scale-95';
    
    if (isProgressButton && isActive) {
      return `${baseClass} bg-emerald-500/30 border-emerald-400/60 text-emerald-300 shadow-emerald-400/40 ring-2 ring-emerald-400/30`;
    } else if (isProgressButton) {
      return `${baseClass} bg-emerald-500/10 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400/60 hover:shadow-emerald-400/30 shadow-emerald-500/20`;
    }
    
    return isActive
      ? `${baseClass} bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-cyan-400/25`
      : `${baseClass} bg-white/10 border-white/20 text-gray-300 hover:text-white hover:bg-white/15 hover:border-white/30 shadow-black/20`;
  };

  return (
    <nav
      ref={navRef}
      className="fixed z-[99999] select-none"
      style={{
        left: position.x,
        top: position.y,
        transform: isDragging ? 'scale(1.03)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.3s ease',
        cursor: isTouchDevice ? (isDragging ? 'grabbing' : 'grab') : 'default',
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
      onMouseDown={(e) => {
        if (!isTouchDevice) return;
        e.preventDefault();
        handleDragStart(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        if (!isTouchDevice) return;
        e.preventDefault();
        const touch = e.touches[0];
        handleDragStart(touch.clientX, touch.clientY);
      }}
    >
      <motion.div
        className={`flex items-center rounded-full backdrop-blur-md ${isStandalone ? 'shadow-lg' : 'shadow-2xl'}
          }`}
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
        animate={{
          width: isExpanded ? 'auto' : '40px',
          paddingLeft: isExpanded ? '10px' : '2px',
          paddingRight: isExpanded ? '10px' : '2px',
          paddingTop: '4px',
          paddingBottom: '4px',
          borderRadius: isExpanded ? '20px' : '20px',
          scale: isExpanded ? 1 : 1
        }}
        transition={{ 
          type: "spring",
          stiffness: 600,
          damping: 35,
          mass: 0.5
        }}
        onMouseEnter={handleUserInteraction}
      >
        {/* Estado Colapsado - Botón Toggle */}
        <AnimatePresence>
          {!isExpanded && (
            <motion.button
              key="toggle-button"
              onClick={toggleExpanded}
              className="relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 group backdrop-blur-md border shadow-lg hover:scale-105 active:scale-95 bg-white/10 border-white/20 text-gray-300 hover:text-white hover:bg-white/15 hover:border-white/30 shadow-black/20"
              onPointerDown={(e) => e.stopPropagation()}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
              transition={{ 
                type: "spring",
                stiffness: 800,
                damping: 30,
                mass: 0.4
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative">
                <Menu className="w-4 h-4" />
                
                {/* Indicador de notificación si hay progreso */}
                {progressGlobal > 0 && (
                  <motion.div 
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
                
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  Menú
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black/80"></div>
                </div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
        
        {/* Estado Expandido - Todos los botones */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              key="expanded-buttons"
              className="flex items-center space-x-1.5"
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30, scale: 0.9 }}
              transition={{ 
                type: "spring",
                stiffness: 700,
                damping: 30,
                mass: 0.4,
                delay: 0.05
              }}
            >
              
              {/* Botón Inicio/Atrás Dinámico */}
              <motion.button
                onClick={() => {
                  if (isInRutinaDetalle && onBackClick) {
                    onBackClick();
                  } else {
                    setActiveButton('home');
                    navigate('/dashboard');
                  }
                  handleUserInteraction();
                }}
                className={navButtonClass(activeButton === 'home')}
                onPointerDown={(e) => e.stopPropagation()}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 800,
                  damping: 32,
                  delay: 0.08
                }}
              >
                <div className="relative">
                  {/* Icono dinámico con animación */}
                  <AnimatePresence mode="wait">
                    {isInRutinaDetalle ? (
                      <motion.div
                        key="back-arrow"
                        initial={{ opacity: 0, rotate: -180, scale: 0.5 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 180, scale: 0.5 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="home-icon"
                        initial={{ opacity: 0, rotate: 180, scale: 0.5 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: -180, scale: 0.5 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <Home className="w-4 h-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Dot indicator */}
                  {activeButton === 'home' && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
                  )}
                  
                  {/* Tooltip dinámico */}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    {isInRutinaDetalle ? 'Salir' : 'Inicio'}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black/80"></div>
                  </div>
                </div>
              </motion.button>

              
              {/* Separador */}
              <motion.div 
                className="w-px h-5 bg-white/20"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 800,
                  damping: 32,
                  delay: 0.10
                }}
              />
              
              {/* Botón SwipeWidget - Solo en Dashboard */}
              {shouldShowSwipeButton && (
                <>
                  <motion.button
                    onClick={() => {
                      onOpenSwipeWidget();
                      handleUserInteraction();
                    }}
                    className={navButtonClass(isSwipeWidgetOpen)}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 800,
                      damping: 32,
                      delay: 0.12
                    }}
                  >
                    <div className="relative">
                      <PanelLeftOpen className="w-4 h-4" />
                      
                      {/* Dot indicator cuando está activo */}
                      {isSwipeWidgetOpen && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
                      )}
                      
                      {/* Tooltip */}
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        Menú
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black/80"></div>
                      </div>
                    </div>
                  </motion.button>
                  
                  {/* Separador visual adicional */}
                  <motion.div 
                    className="w-px h-5 bg-white/20"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 800,
                      damping: 32,
                      delay: 0.14
                    }}
                  />
                </>
              )}
              
              {/* Botón ProgressDock - Solo en RutinaDetalle */}
              {shouldShowProgressButton && (
                <>
                  <motion.button
                    onClick={() => {
                      onToggleProgressDock();
                      setActiveButton('progress');
                      handleUserInteraction();
                    }}
                    className={navButtonClass(showProgressDock, true)}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      boxShadow: showProgressDock 
                        ? ['0 0 0 0 rgba(16, 185, 129, 0.4)', '0 0 0 8px rgba(16, 185, 129, 0)', '0 0 0 0 rgba(16, 185, 129, 0.4)']
                        : ['0 0 0 0 rgba(16, 185, 129, 0.2)', '0 0 0 4px rgba(16, 185, 129, 0)', '0 0 0 0 rgba(16, 185, 129, 0.2)']
                    }}
                    transition={{ 
                      type: "spring",
                      stiffness: 800,
                      damping: 32,
                      delay: 0.12,
                      boxShadow: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ 
                          rotate: showProgressDock ? 0 : [0, 10, -10, 0],
                          scale: showProgressDock ? 1 : [1, 1.1, 1]
                        }}
                        transition={{
                          rotate: {
                            duration: 1.5,
                            repeat: showProgressDock ? 0 : Infinity,
                            ease: "easeInOut"
                          },
                          scale: {
                            duration: 2,
                            repeat: showProgressDock ? 0 : Infinity,
                            ease: "easeInOut"
                          }
                        }}
                      >
                        <Target className="w-4 h-4" />
                      </motion.div>
                      
                      {/* Dot indicator cuando está activo */}
                      {showProgressDock && (
                        <motion.div 
                          className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        />
                      )}
                      
                      {/* Pulso sutil cuando no está activo para llamar atención */}
                      {!showProgressDock && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full"
                          animate={{
                            scale: [0, 1.2, 0],
                            opacity: [0.8, 0.4, 0.8]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      )}
                      
                      {/* Mini indicador de progreso mejorado */}
                      {progressGlobal > 0 && (
                        <motion.div 
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center border border-white/30"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          whileHover={{ scale: 1.1 }}
                        >
                          <span className="text-[7px] font-bold text-white drop-shadow">
                            {Math.round(progressGlobal)}
                          </span>
                        </motion.div>
                      )}
                      
                      {/* Tooltip mejorado */}
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-emerald-600/90 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap backdrop-blur-sm border border-emerald-400/30">
                        <span className="font-medium">Progreso</span>
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-emerald-600/90"></div>
                      </div>
                    </div>
                  </motion.button>
                  
                  {/* Separador visual adicional */}
                  <motion.div 
                    className="w-px h-5 bg-white/20"
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 800,
                      damping: 32,
                      delay: 0.14
                    }}
                  />
                </>
              )}

              
              {/* Botón Perfil - Solo visible si NO estamos en RutinaDetalle */}
              {!isInRutinaDetalle && (
                <motion.button
                onClick={() => {
                  if (!isPerfilOpen) {
                    setActiveButton('profile');
                    onOpenPerfil?.();
                  }
                  handleUserInteraction();
                }}
                className={navButtonClass(activeButton === 'profile' && isPerfilOpen)}
                onPointerDown={(e) => e.stopPropagation()}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 800,
                  damping: 32,
                  delay: shouldShowSwipeButton ? 0.16 : 0.12
                }}
              >
                <div className="relative">
                  <User className="w-4 h-4" />
                  {activeButton === 'profile' && isPerfilOpen && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
                  )}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    Perfil
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black/80"></div>
                  </div>
                </div>
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Sombra dinámica */}
      <div
        className="absolute top-1.5 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black/10 blur-xl rounded-full -z-10"
        style={{
          opacity: isDragging ? 0.6 : 0.3,
          transform: `translateX(-50%) scale(${isDragging ? 1.1 : 1})`,
          width: isExpanded ? '200px' : '96px',
          transition: 'all 0.25s ease-in-out',
        }}
      />

    
    </nav>
  );
};

export default FloatingNavBar;
