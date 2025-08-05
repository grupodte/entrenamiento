import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

const FloatingNavBar = ({ onOpenPerfil }) => {
  const navButtonClass = ({ isActive }) =>
    twMerge(
      'relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 group',
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

  return (
    <motion.nav
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <div className="flex items-center space-x-4 px-4 py-3 rounded-full bg-black/30 backdrop-blur-2xl border border-white/10 shadow-2xl">
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
                <Home className="w-6 h-6" />
                {isActive && (
                  <motion.div
                    className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  />
                )}

                {/* Tooltip (hacia arriba ahora) */}
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  Inicio
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black/80"></div>
                </div>
              </motion.div>
            )}
          </NavLink>
        </motion.div>

        {/* Separador visual */}
        <div className="w-px h-8 bg-white/20"></div>

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
              <User className="w-6 h-6" />

              {/* Tooltip (hacia arriba ahora) */}
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                Perfil
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black/80"></div>
              </div>
            </motion.div>
          </motion.button>
        </motion.div>
      </div>

      {/* Sombra suave debajo */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-black/10 blur-xl rounded-full -z-10"></div>
    </motion.nav>
  );
};

export default FloatingNavBar;
