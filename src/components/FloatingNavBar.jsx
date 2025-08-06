import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Home, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import { useDrag } from '@use-gesture/react';

const FloatingNavBar = ({ onOpenPerfil }) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [activeButton, setActiveButton] = useState('home');
  const navRef = useRef(null);
  const [bounds, setBounds] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

  // Springs para animaciones suaves
  const [{ x, y, scale, rotate }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    config: { mass: 1, tension: 280, friction: 30 }
  }));

  // Función para calcular los límites
  const updateBounds = useCallback(() => {
    if (navRef.current && typeof window !== 'undefined') {
      const rect = navRef.current.getBoundingClientRect();
      const margin = 20;

      setBounds({
        left: margin - rect.left,
        right: window.innerWidth - rect.right - margin,
        top: margin - rect.top,
        bottom: window.innerHeight - rect.bottom - margin
      });
    }
  }, []);

  // Función para snap a los bordes
  const snapToEdge = useCallback((currentX, currentY, velocityX) => {
    if (typeof window === 'undefined') return { x: currentX, y: currentY };

    const rect = navRef.current?.getBoundingClientRect();
    if (!rect) return { x: currentX, y: currentY };

    const centerX = rect.left + rect.width / 2 + currentX;
    const snapThreshold = 100;
    const margin = 20;

    let targetX = currentX;
    let targetY = currentY;

    // Snap horizontal basado en posición y velocidad
    if (centerX < window.innerWidth / 2) {
      // Lado izquierdo
      if (centerX < snapThreshold || velocityX < -300) {
        targetX = margin - rect.left;
      }
    } else {
      // Lado derecho  
      if (centerX > window.innerWidth - snapThreshold || velocityX > 300) {
        targetX = window.innerWidth - rect.right - margin;
      }
    }

    // Mantener dentro de límites verticales
    const minY = margin - rect.top;
    const maxY = window.innerHeight - rect.bottom - margin;
    targetY = Math.max(minY, Math.min(maxY, currentY));

    return { x: targetX, y: targetY };
  }, []);

  // Configurar el hook useDrag
  const bind = useDrag(
    ({ active, movement: [mx, my], velocity: [vx, vy], direction: [dx, dy], cancel, canceled }) => {
      if (canceled) return;

      // Verificar límites durante el arrastre
      const newX = Math.max(bounds.left, Math.min(bounds.right, mx));
      const newY = Math.max(bounds.top, Math.min(bounds.bottom, my));

      if (active) {
        // Durante el arrastre
        api.start({
          x: newX,
          y: newY,
          scale: 1.05,
          rotate: dx * 2, // Rotación sutil basada en dirección
          immediate: true
        });
      } else {
        // Al soltar
        const snapTarget = snapToEdge(newX, newY, vx);

        api.start({
          x: snapTarget.x,
          y: snapTarget.y,
          scale: 1,
          rotate: 0,
          config: { mass: 1, tension: 200, friction: 25 }
        });
      }
    },
    {
      bounds,
      rubberband: true,
      from: () => [x.get(), y.get()],
      filterTaps: true,
      threshold: 5
    }
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasTouch);

      // Calcular límites iniciales
      const timer = setTimeout(updateBounds, 100);

      // Recalcular en resize
      const handleResize = () => {
        updateBounds();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(timer);
      };
    }
  }, [updateBounds]);

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
        stiffness: 100,
        damping: 15,
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
        willChange: 'transform'
      }}
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 select-none"
    >
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex items-center space-x-2 px-3 py-2 rounded-full bg-black/30 backdrop-blur-2xl border border-white/10 shadow-2xl"
      >
        {/* Botón Inicio */}
        <motion.div variants={floatingVariants}>
          <motion.button
            onClick={() => setActiveButton('home')}
            className={navButtonClass(activeButton === 'home')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onPointerDown={(e) => e.stopPropagation()} // Evita conflicto con drag
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
            onPointerDown={(e) => e.stopPropagation()} // Evita conflicto con drag
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

      {/* Sombra dinámica */}
      <animated.div
        className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-28 h-8 bg-black/10 blur-xl rounded-full -z-10"
        style={{
          opacity: scale.to((s) => Math.min(s, 1.2)),
          transform: scale.to((s) => `translateX(-50%) scale(${s})`),
        }}
      />

      {/* Indicador visual para dispositivos táctiles */}
      {isTouchDevice && (
        <motion.div
          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 3, duration: 1 }}
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
    </animated.nav>
  );
};

export default FloatingNavBar;