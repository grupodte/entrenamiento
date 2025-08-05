import { motion } from 'framer-motion';

// Variantes de animación para el layout principal
const layoutVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -20,
  },
};

// Transición suave al estilo iOS
const layoutTransition = {
  type: 'tween',
  ease: [0.25, 0.46, 0.45, 0.94], // cubic-bezier similar a iOS
  duration: 0.4,
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
