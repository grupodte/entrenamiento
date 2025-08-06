import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

const FloatingNavBar = ({ onOpenPerfil }) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const navRef = useRef(null);
  const [dragConstraints, setDragConstraints] = useState({ top: 0, left: 0, right: 0, bottom: 0 });

  useEffect(() => {
    // Conditional check for window to avoid breaking SSR
    if (typeof window !== 'undefined') {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasTouch);

      const updateConstraints = () => {
        if (navRef.current) {
          const navRect = navRef.current.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          setDragConstraints({
            top: -navRect.top,
            left: -navRect.left,
            right: viewportWidth - navRect.right,
            bottom: viewportHeight - navRect.bottom,
          });
        }
      };

      // Initial calculation
      updateConstraints();

      // Recalculate on resize
      window.addEventListener('resize', updateConstraints);

      // Cleanup listener
      return () => window.removeEventListener('resize', updateConstraints);
    }
  }, []);

  const navButtonClass = ({ isActive }) =>
    twMerge(
      'relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 group', // smaller buttons
      'backdrop-blur-xl border shadow-lg hover:scale-110 active:scale-95',
      isActive
        ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-cyan-400/25'
        : 'bg-white/10 border-white/20 text-gray-300 hover:text-white hover:bg-white/15 hover:border-white/30 shadow-black/20'
    );

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

  const dragProps = isTouchDevice ? {
    drag: true, // allow dragging in all directions
    dragConstraints: dragConstraints,
    dragTransition: { bounceStiffness: 400, bounceDamping: 15 },
    dragElastic: 0.1, // little to no elasticity
  } : {};

  return (
    <motion.nav
      ref={navRef}
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 cursor-grab active:cursor-grabbing"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      {...dragProps}
      onDragEnd={() => {
        // Recalculate constraints after dragging
        if (typeof window !== 'undefined' && navRef.current) {
          const navRect = navRef.current.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          setDragConstraints({
            top: -navRect.top,
            left: -navRect.left,
            right: viewportWidth - navRect.right,
            bottom: viewportHeight - navRect.bottom,
          });
        }
      }}
    >
      <div className="flex items-center space-x-2 px-3 py-2 rounded-full bg-black/30 backdrop-blur-2xl border border-white/10 shadow-2xl"> {/* smaller padding and spacing */}
        {/* Botón Inicio */}
        <motion.div variants={floatingVariants}>
          <NavLink to="/dashboard" className={navButtonClass}>
            {({ isActive }) => (
              <motion.div
                variants={iconVariants}
                initial="idle"
                whileHover="hover"
                whileTap="tap"
                className="relative"
              >
                <Home className="w-5 h-5" /> {/* smaller icon */}
                {isActive && (
                  <motion.div
                    className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  />
                )}

                {/* Tooltip (hacia arriba ahora) */}
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  Inicio
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black/80"></div>
                </div>
              </motion.div>
            )}
          </NavLink>
        </motion.div>

        {/* Separador visual */}
        <div className="w-px h-6 bg-white/20"></div> {/* shorter separator */}

        {/* Botón Perfil */}
        <motion.div variants={floatingVariants}>
          <motion.button
            onClick={onOpenPerfil}
            className={navButtonClass({ isActive: false })}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              variants={iconVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              className="relative"
            >
              <User className="w-5 h-5" /> {/* smaller icon */}

              {/* Tooltip (hacia arriba ahora) */}
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                Perfil
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black/80"></div>
              </div>
            </motion.div>
          </motion.button>
        </motion.div>
      </div>

      {/* Sombra suave debajo */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-28 h-8 bg-black/10 blur-xl rounded-full -z-10"></div> {/* smaller shadow */}
    </motion.nav>
  );
};

export default FloatingNavBar;
