import { motion } from 'framer-motion';

// Variantes para la lista contenedora
const listVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
};

// Variantes para cada item de la lista
const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

/**
 * AnimatedList - Contenedor para listas con animación stagger
 */
export const AnimatedList = ({ children, className = '', staggerDelay = 0.1 }) => {
  const customListVariants = {
    ...listVariants,
    visible: {
      ...listVariants.visible,
      transition: {
        ...listVariants.visible.transition,
        staggerChildren: staggerDelay,
      },
    },
  };

  return (
    <motion.div
      variants={customListVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * AnimatedListItem - Item individual de lista animada
 */
export const AnimatedListItem = ({ children, className = '', delay = 0 }) => {
  const customItemVariants = {
    ...itemVariants,
    visible: {
      ...itemVariants.visible,
      transition: {
        ...itemVariants.visible.transition,
        delay,
      },
    },
  };

  return (
    <motion.div
      variants={customItemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default { AnimatedList, AnimatedListItem };
