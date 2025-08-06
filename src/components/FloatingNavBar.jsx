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

  // SPRING con posición, escala y rotación
  const [{ x, y, scale, rotate }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    config: { mass: 1, tension: 280, friction: 35 },
  }));

  // Cargar posición guardada si existe
  useEffect(() => {
    const saved = localStorage.getItem('floatingNavPos');
    if (saved) {
      const { x: savedX, y: savedY } = JSON.parse(saved);
      api.start({ x: savedX, y: savedY, immediate: true });
    }
  }, [api]);

  // Guardar posición actual al soltar
  const savePosition = (xVal, yVal) => {
    localStorage.setItem('floatingNavPos', JSON.stringify({ x: xVal, y: yVal }));
  };

  // Recalcular límites dinámicos
  const updateBounds = useCallback(() => {
    if (navRef.current && typeof window !== 'undefined') {
      const rect = navRef.current.getBoundingClientRect();
      const margin = 20;
      setBounds({
        left: margin - rect.left,
        right: window.innerWidth - rect.right - margin,
        top: margin - rect.top,
        bottom: window.innerHeight - rect.bottom - margin,
      });
    }
  }, []);

  // Snap inteligente
  const snapToEdge = useCallback((currentX, currentY, velocityX, velocityY) => {
    if (typeof window === 'undefined') return { x: currentX, y: currentY };
    const rect = navRef.current?.getBoundingClientRect();
    if (!rect) return { x: currentX, y: currentY };

    const centerX = rect.left + rect.width / 2 + currentX;
    const snapThreshold = 80;
    const margin = 20;

    let targetX = currentX;
    let targetY = currentY;

    // Snap horizontal suave
    if (Math.abs(velocityX) < 200 && centerX < snapThreshold) {
      targetX = margin - rect.left;
    } else if (Math.abs(velocityX) < 200 && centerX > window.innerWidth - snapThreshold) {
      targetX = window.innerWidth - rect.right - margin;
    }

    // Respetar límites verticales
    const minY = margin - rect.top;
    const maxY = window.innerHeight - rect.bottom - margin;
    targetY = Math.max(minY, Math.min(maxY, currentY));

    return { x: targetX, y: targetY };
  }, []);

  // Drag con elasticidad + inercia
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
          // Elasticidad: permite un poco de "rebote"
          newX = Math.max(minX - 40, Math.min(maxX + 40, mx));
          newY = Math.max(minY - 40, Math.min(maxY + 40, my));
        } else {
          // Snap final
          const snapTarget = snapToEdge(mx, my, vx, vy);
          newX = Math.max(minX, Math.min(maxX, snapTarget.x));
          newY = Math.max(minY, Math.min(maxY, snapTarget.y));
          savePosition(newX, newY);
        }
      }

      api.start({
        x: newX,
        y: newY,
        scale: active ? 1.05 : 1,
        rotate: active ? 2 : 0,
        config: active
          ? { tension: 300, friction: 25 }
          : { tension: 180, friction: 25, velocity: vx + vy },
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

  // Detectar touch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasTouch);
      updateBounds();
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

  // Clases dinámicas
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
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="flex items-center space-x-2 px-3 py-2 rounded-full bg-black/30 backdrop-blur-2xl border border-white/10 shadow-2xl"
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
