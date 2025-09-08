import { motion } from 'framer-motion';

// Variantes simplificadas para evitar conflictos con AdminLayout
const layoutVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

// Transición rápida para no interferir con otras animaciones
const layoutTransition = {
  duration: 0.1,
};

/**
 * AnimatedLayout - Wrapper global para todas las páginas
 * Proporciona transiciones suaves de entrada/salida
 */
const AnimatedLayout = ({ children, className = '' }) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={layoutVariants}
      transition={layoutTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedLayout;
