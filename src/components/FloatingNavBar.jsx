import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import { useDrag } from '@use-gesture/react';

const FloatingNavBar = ({ onOpenPerfil }) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [activeButton, setActiveButton] = useState('home');
  const [isStandalone, setIsStandalone] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0 });
  const [deviceOrientation, setDeviceOrientation] = useState('portrait');
  const navRef = useRef(null);
  const [bounds, setBounds] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

  // Springs optimizados para PWA
  const [{ x, y, scale, rotate }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    config: {
      mass: 0.8, // Más ligero para mejor rendimiento en móviles
      tension: 320,
      friction: 40, // Mayor fricción para movimiento más controlado
      precision: 0.01 // Mejor precisión para pantallas de alta densidad
    }
  }));

  // Detectar modo PWA y características del dispositivo
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Detectar PWA standalone
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);

      // Detectar dispositivo táctil
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasTouch);

      // Detectar safe areas (notch, etc.)
      const computedStyle = getComputedStyle(document.documentElement);
      const safeTop = parseInt(computedStyle.getPropertyValue('--sat') ||
        computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0');
      const safeBottom = parseInt(computedStyle.getPropertyValue('--sab') ||
        computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0');

      setSafeAreaInsets({
        top: Math.max(safeTop, 20), // Mínimo 20px
        bottom: Math.max(safeBottom, 20)
      });

      // Detectar orientación
      const updateOrientation = () => {
        if (screen.orientation) {
          setDeviceOrientation(screen.orientation.angle === 0 || screen.orientation.angle === 180 ? 'portrait' : 'landscape');
        } else {
          setDeviceOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
        }
      };

      updateOrientation();

      // Listeners para PWA
      screen.orientation?.addEventListener('change', updateOrientation);
      window.addEventListener('orientationchange', updateOrientation);

      return () => {
        screen.orientation?.removeEventListener('change', updateOrientation);
        window.removeEventListener('orientationchange', updateOrientation);
      };
    }
  }, []);

  // Función mejorada para calcular límites considerando PWA
  const updateBounds = useCallback(() => {
    if (navRef.current && typeof window !== 'undefined') {
      const rect = navRef.current.getBoundingClientRect();
      const margin = deviceOrientation === 'landscape' ? 15 : 20;
      const topMargin = safeAreaInsets.top + margin;
      const bottomMargin = safeAreaInsets.bottom + margin;

      setBounds({
        left: margin - rect.left,
        right: window.innerWidth - rect.right - margin,
        top: topMargin - rect.top,
        bottom: window.innerHeight - rect.bottom - bottomMargin
      });
    }
  }, [safeAreaInsets, deviceOrientation]);

  // Función de snap optimizada para PWA
  const snapToEdge = useCallback((currentX, currentY, velocityX, velocityY) => {
    if (typeof window === 'undefined') return { x: currentX, y: currentY };

    const rect = navRef.current?.getBoundingClientRect();
    if (!rect) return { x: currentX, y: currentY };

    const centerX = rect.left + rect.width / 2 + currentX;
    const centerY = rect.top + rect.height / 2 + currentY;

    // Ajustar snap threshold basado en tamaño de pantalla
    const snapThreshold = Math.min(window.innerWidth * 0.15, 80);
    const margin = deviceOrientation === 'landscape' ? 15 : 20;
    const topMargin = safeAreaInsets.top + margin;
    const bottomMargin = safeAreaInsets.bottom + margin;

    let targetX = currentX;
    let targetY = currentY;

    // Snap más agresivo en PWA standalone para evitar interferir con gestos del sistema
    const velocityThreshold = isStandalone ? 150 : 200;

    if (Math.abs(velocityX) < velocityThreshold && Math.abs(velocityY) < velocityThreshold) {
      // Snap a bordes laterales
      if (centerX < snapThreshold) {
        targetX = margin - rect.left;
      } else if (centerX > window.innerWidth - snapThreshold) {
        targetX = window.innerWidth - rect.right - margin;
      }

      // Aplicar límites verticales seguros
      const minY = topMargin - rect.top;
      const maxY = window.innerHeight - rect.bottom - bottomMargin;

      if (currentY < minY) {
        targetY = minY;
      } else if (currentY > maxY) {
        targetY = maxY;
      } else {
        targetY = currentY;
      }
    } else {
      // Con alta velocidad, solo aplicar límites
      const minY = topMargin - rect.top;
      const maxY = window.innerHeight - rect.bottom - bottomMargin;
      targetY = Math.max(minY, Math.min(maxY, currentY));

      const minX = margin - rect.left;
      const maxX = window.innerWidth - rect.right - margin;
      targetX = Math.max(minX, Math.min(maxX, currentX));
    }

    return { x: targetX, y: targetY };
  }, [safeAreaInsets, deviceOrientation, isStandalone]);

  // Hook useDrag optimizado para PWA
  const bind = useDrag(
    ({ active, movement: [mx, my], velocity: [vx, vy], direction: [dx, dy], cancel, canceled, touches }) => {
      if (canceled) return;

      // Prevenir interferencia con gestos del sistema en PWA
      if (isStandalone && touches > 1) {
        cancel();
        return;
      }

      const margin = deviceOrientation === 'landscape' ? 15 : 20;
      const topMargin = safeAreaInsets.top + margin;
      const bottomMargin = safeAreaInsets.bottom + margin;
      const rect = navRef.current?.getBoundingClientRect();

      let newX = mx;
      let newY = my;

      if (rect) {
        const minX = margin - rect.left;
        const maxX = window.innerWidth - rect.right - margin;
        const minY = topMargin - rect.top;
        const maxY = window.innerHeight - rect.bottom - bottomMargin;

        newX = Math.max(minX, Math.min(maxX, mx));
        newY = Math.max(minY, Math.min(maxY, my));
      }

      if (active) {
        // Durante el arrastre - optimizado para 60fps
        api.start({
          x: newX,
          y: newY,
          scale: 1.03, // Escala más sutil en móviles
          rotate: dx * 0.5, // Rotación muy sutil
          immediate: true,
          config: { tension: 400, friction: 50 } // Config más rápida durante drag
        });
      } else {
        // Al soltar
        const snapTarget = snapToEdge(newX, newY, vx, vy);

        api.start({
          x: snapTarget.x,
          y: snapTarget.y,
          scale: 1,
          rotate: 0,
          config: {
            mass: 0.8,
            tension: 350,
            friction: 35,
            clamp: true // Evita overshoot
          }
        });
      }
    },
    {
      rubberband: isStandalone ? 0.05 : 0.1, // Menos elástico en PWA
      from: () => [x.get(), y.get()],
      filterTaps: true,
      threshold: isTouchDevice ? 10 : 5, // Threshold mayor en touch
      preventScroll: true,
      pointer: { touch: true, capture: false }, // No capturar para permitir otros gestos
      touches: 1 // Solo un toque para evitar conflictos
    }
  );

  // Actualizar bounds cuando cambien las dependencias PWA
  useEffect(() => {
    updateBounds();

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        updateBounds();
        // Reposicionar si está fuera de límites después del resize
        const currentX = x.get();
        const currentY = y.get();
        const snapTarget = snapToEdge(currentX, currentY, 0, 0);

        if (Math.abs(snapTarget.x - currentX) > 5 || Math.abs(snapTarget.y - currentY) > 5) {
          api.start({
            x: snapTarget.x,
            y: snapTarget.y,
            config: { duration: 300 }
          });
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [updateBounds, snapToEdge, x, y, api]);

  const navButtonClass = (isActive) => {
    const baseClass = 'relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 group backdrop-blur-xl border shadow-lg hover:scale-110 active:scale-95';
    return isActive
      ? `${baseClass} bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-cyan-400/25`
      : `${baseClass} bg-white/10 border-white/20 text-gray-300 hover:text-white hover:bg-white/15 hover:border-white/30 shadow-black/20`;
  };

  const iconVariants = {
    idle: { scale: 1, rotate: 0 },
    hover: { scale: 1.1, rotate: 5 },
    tap: { scale: 0.9, rotate: -5 }
  };

  const floatingVariants = {
    initial: { y: 100, opacity: 0, scale: 0.8 },
    animate: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 20,
        delay: 0.1
      }
    }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <animated.nav
      ref={navRef}
      {...(isTouchDevice ? bind() : {})}
      style={{
        x,
        y,
        scale,
        rotate,
        cursor: isTouchDevice ? 'grab' : 'default',
        touchAction: 'none',
        willChange: 'transform',
        WebkitTouchCallout: 'none', // Prevenir menú contextual en iOS
        WebkitUserSelect: 'none',
        userSelect: 'none',
        // Optimizaciones para PWA
        transform: 'translate3d(0,0,0)', // Forzar aceleración por hardware
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      }}
      className={`fixed z-50 select-none ${deviceOrientation === 'landscape'
          ? 'bottom-4 left-1/2 transform -translate-x-1/2'
          : 'bottom-6 left-1/2 transform -translate-x-1/2'
        }`}
    >
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className={`flex items-center space-x-2 px-3 py-2 rounded-full bg-black/30 backdrop-blur-2xl border border-white/10 shadow-2xl ${isStandalone ? 'shadow-lg' : 'shadow-2xl' // Sombra más sutil en PWA
          }`}
        style={{
          // Ajustes para PWA
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        {/* Botón Inicio */}
        <motion.div variants={floatingVariants}>
          <motion.button
            onClick={() => setActiveButton('home')}
            className={navButtonClass(activeButton === 'home')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              WebkitTapHighlightColor: 'transparent', // Quitar highlight azul en iOS
            }}
          >
            <motion.div
              variants={iconVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              className="relative"
            >
              <Home className="w-5 h-5" />
              {activeButton === 'home' && (
                <motion.div
                  className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                />
              )}

              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                Inicio
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black/80"></div>
              </div>
            </motion.div>
          </motion.button>
        </motion.div>

        {/* Separador visual */}
        <div className="w-px h-6 bg-white/20"></div>

        {/* Botón Perfil */}
        <motion.div variants={floatingVariants}>
          <motion.button
            onClick={() => {
              setActiveButton('profile');
              onOpenPerfil?.();
            }}
            className={navButtonClass(activeButton === 'profile')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <motion.div
              variants={iconVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              className="relative"
            >
              <User className="w-5 h-5" />
              {activeButton === 'profile' && (
                <motion.div
                  className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                />
              )}

              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                Perfil
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black/80"></div>
              </div>
            </motion.div>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Sombra dinámica optimizada */}
      <animated.div
        className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-28 h-8 bg-black/10 blur-xl rounded-full -z-10"
        style={{
          opacity: scale.to((s) => Math.min(s, 1.2)),
          transform: scale.to((s) => `translateX(-50%) scale(${s})`),
        }}
      />

      {/* Indicador para dispositivos táctiles - oculto en landscape para ahorrar espacio */}
      {isTouchDevice && deviceOrientation === 'portrait' && (
        <motion.div
          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: isStandalone ? 2 : 3, duration: 1 }}
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 h-1 bg-white/40 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Indicador de modo PWA para desarrollo */}
      {process.env.NODE_ENV === 'development' && isStandalone && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-green-400 whitespace-nowrap font-mono">
          PWA Mode
        </div>
      )}
    </animated.nav>
  );
};

export default FloatingNavBar;