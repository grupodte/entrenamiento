import React, { useState, useEffect, useRef } from 'react';
import { Home, User } from 'lucide-react';
import { useSpring, animated } from 'react-spring';
import { useDrag } from '@use-gesture/react';
import { motion } from 'framer-motion';

const FloatingNavBar = ({ onOpenPerfil }) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [activeButton, setActiveButton] = useState('home');
  const navRef = useRef(null);

  // Spring principal (posición y escala)
  const [{ x, y, scale, rotate }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    config: { mass: 1, tension: 280, friction: 35 },
  }));

  // Hook de drag
  const bind = useDrag(
    ({ active, movement: [mx, my], velocity: [vx, vy] }) => {
      const rect = navRef.current?.getBoundingClientRect();
      const margin = 20;

      let newX = mx;
      let newY = my;

      if (rect) {
        const minX = margin - rect.left;
        const maxX = window.innerWidth - rect.right - margin;
        const minY = margin - rect.top;
        const maxY = window.innerHeight - rect.bottom - margin;

        if (active) {
          // Permitir elasticidad en los bordes
          newX = Math.max(minX - 40, Math.min(maxX + 40, mx));
          newY = Math.max(minY - 40, Math.min(maxY + 40, my));
        } else {
          // Ajustar posición final con límites
          newX = Math.max(minX, Math.min(maxX, mx));
          newY = Math.max(minY, Math.min(maxY, my));

          // Snap a bordes si queda cerca
          const snapMargin = 60;
          if (newX < minX + snapMargin) newX = minX;
          if (newX > maxX - snapMargin) newX = maxX;
        }
      }

      api.start({
        x: newX,
        y: newY,
        scale: active ? 1.05 : 1,
        rotate: active ? 2 : 0,
        config: active
          ? { tension: 300, friction: 25 } // En movimiento
          : { tension: 180, friction: 25, velocity: vx + vy }, // Inercia al soltar
      });
    },
    {
      from: () => [x.get(), y.get()],
      filterTaps: true,
      threshold: 8,
      preventScroll: true,
      pointer: { touch: true },
    }
  );

  // Detectar dispositivo táctil
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasTouch);
    }
  }, []);

  // Mantener dentro de pantalla al redimensionar
  useEffect(() => {
    const handleResize = () => {
      const rect = navRef.current?.getBoundingClientRect();
      if (!rect) return;
      const margin = 20;
      const minX = margin - rect.left;
      const maxX = window.innerWidth - rect.right - margin;
      const minY = margin - rect.top;
      const maxY = window.innerHeight - rect.bottom - margin;

      api.start({
        x: Math.max(minX, Math.min(maxX, x.get())),
        y: Math.max(minY, Math.min(maxY, y.get())),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [api, x, y]);

  // Estilos dinámicos para botones
  const navButtonClass = (isActive) => {
    const baseClass =
      'relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 group backdrop-blur-xl border shadow-lg hover:scale-110 active:scale-95';
    return isActive
      ? `${baseClass} bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-cyan-400/25`
      : `${baseClass} bg-white/10 border-white/20 text-gray-300 hover:text-white hover:bg-white/15 hover:border-white/30 shadow-black/20`;
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
      }}
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 select-none"
    >
      <motion.div
        className="flex items-center space-x-2 px-3 py-2 rounded-full bg-black/30 backdrop-blur-2xl border border-white/10 shadow-2xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      >
        {/* Botón Inicio */}
        <motion.button
          onClick={() => setActiveButton('home')}
          className={navButtonClass(activeButton === 'home')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Home className="w-5 h-5" />
        </motion.button>

        <div className="w-px h-6 bg-white/20"></div>

        {/* Botón Perfil */}
        <motion.button
          onClick={() => {
            setActiveButton('profile');
            onOpenPerfil?.();
          }}
          className={navButtonClass(activeButton === 'profile')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <User className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Sombra dinámica */}
      <animated.div
        className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-28 h-8 bg-black/10 blur-xl rounded-full -z-10"
        style={{
          opacity: scale.to((s) => Math.min(s, 1.2)),
          transform: scale.to((s) => `translateX(-50%) scale(${s})`),
        }}
      />
    </animated.nav>
  );
};

export default FloatingNavBar;
