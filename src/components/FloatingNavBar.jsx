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

  // Springs para animaciones suaves - sin inercia inicial hacia abajo
  const [{ x, y, scale, rotate }, api] = useSpring(() => ({
    x: 0,
    y: 0, // Comenzar en la posición inicial sin desplazamiento
    scale: 1,
    rotate: 0,
    config: { mass: 1, tension: 280, friction: 35 } // Más fricción para menos rebote
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
  const snapToEdge = useCallback((currentX, currentY, velocityX, velocityY) => {
    if (typeof window === 'undefined') return { x: currentX, y: currentY };

    const rect = navRef.current?.getBoundingClientRect();
    if (!rect) return { x: currentX, y: currentY };

    const centerX = rect.left + rect.width / 2 + currentX;
    const centerY = rect.top + rect.height / 2 + currentY;
    const snapThreshold = 80;
    const margin = 20;

    let targetX = currentX;
    let targetY = currentY;

    // Solo hacer snap si la velocidad es muy baja (movimiento deliberado)
    if (Math.abs(velocityX) < 200 && Math.abs(velocityY) < 200) {
      // Snap horizontal solo a los bordes laterales
      if (centerX < snapThreshold) {
        targetX = margin - rect.left;
      } else if (centerX > window.innerWidth - snapThreshold) {
        targetX = window.innerWidth - rect.right - margin;
      }

      // NO hacer snap vertical automático - mantener posición Y actual
      // Solo ajustar si está fuera de límites
      const minY = margin - rect.top;
      const maxY = window.innerHeight - rect.bottom - margin;

      if (currentY < minY) {
        targetY = minY;
      } else if (currentY > maxY) {
        targetY = maxY;
      } else {
        // Mantener la posición Y actual
        targetY = currentY;
      }
    } else {
      // Con velocidad alta, solo aplicar límites, no snap
      const minY = margin - rect.top;
      const maxY = window.innerHeight - rect.bottom - margin;
      targetY = Math.max(minY, Math.min(maxY, currentY));

      const minX = margin - rect.left;
      const maxX = window.innerWidth - rect.right - margin;
      targetX = Math.max(minX, Math.min(maxX, currentX));
    }

    return { x: targetX, y: targetY };
  }, []);

  // Configurar el hook useDrag
  const bind = useDrag(
    ({ active, movement: [mx, my], velocity: [vx, vy], direction: [dx, dy], cancel, canceled }) => {
      if (canceled) return;

      // Verificar límites durante el arrastre con menos restricción
      const margin = 20;
      const rect = navRef.current?.getBoundingClientRect();

      let newX = mx;
      let newY = my;

      if (rect) {
        const minX = margin - rect.left;
        const maxX = window.innerWidth - rect.right - margin;
        const minY = margin - rect.top;
        const maxY = window.innerHeight - rect.bottom - margin;

        newX = Math.max(minX, Math.min(maxX, mx));
        newY = Math.max(minY, Math.min(maxY, my));
      }

      if (active) {
        // Durante el arrastre - respuesta inmediata
        api.start({
          x: newX,
          y: newY,
          scale: 1.05,
          rotate: dx * 1, // Rotación más sutil
          immediate: true
        });
      } else {
        // Al soltar - aplicar snap si es necesario
        const snapTarget = snapToEdge(newX, newY, vx, vy);

        api.start({
          x: snapTarget.x,
          y: snapTarget.y,
          scale: 1,
          rotate: 0,
          config: { mass: 1, tension: 300, friction: 30 } // Animación más rápida
        });
      }
    },
    {
      // Remover bounds fijos para mejor control manual
      rubberband: 0.1, // Menos efecto elástico
      from: () => [x.get(), y.get()],
      filterTaps: true,
      threshold: 8, // Mayor threshold para evitar drags accidentales
      preventScroll: true, // Prevenir scroll durante drag
      pointer: { touch: true } // Optimizar para touch
    }
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasTouch);

      // Calcular límites iniciales sin setTimeout para evitar movimiento inicial
      updateBounds();

      // Recalcular en resize con debounce
      let resizeTimeout;
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(updateBounds, 150);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimeout);
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