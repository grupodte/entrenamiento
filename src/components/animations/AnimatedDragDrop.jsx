import { motion } from 'framer-motion';

// Variantes para elementos arrastrados
const draggableVariants = {
  rest: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  drag: {
    scale: 1.05,
    rotate: 2,
    zIndex: 999,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  },
};

// Variantes para zonas de drop
const dropZoneVariants = {
  inactive: {
    scale: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    transition: {
      duration: 0.2,
    },
  },
  active: {
    scale: 1.02,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    transition: {
      duration: 0.2,
    },
  },
  hover: {
    scale: 1.05,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * AnimatedDraggable - Wrapper para elementos que se pueden arrastrar
 */
export const AnimatedDraggable = ({ 
  children, 
  className = '', 
  isDragging = false,
  ...props 
}) => {
  return (
    <motion.div
      className={className}
      variants={draggableVariants}
      initial="rest"
      animate={isDragging ? "drag" : "rest"}
      whileHover={{ scale: 1.02 }}
      drag={false} // Controlado por dnd-kit
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * AnimatedDropZone - Zona de drop animada
 */
export const AnimatedDropZone = ({ 
  children, 
  className = '', 
  isOver = false,
  isActive = false,
  ...props 
}) => {
  const getAnimationState = () => {
    if (isOver) return 'hover';
    if (isActive) return 'active';
    return 'inactive';
  };

  return (
    <motion.div
      className={`border-2 border-dashed rounded-lg p-4 ${className}`}
      variants={dropZoneVariants}
      initial="inactive"
      animate={getAnimationState()}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * AnimatedDragOverlay - Overlay para elementos mientras se arrastran
 */
export const AnimatedDragOverlay = ({ children, className = '' }) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: 1.05,
        rotate: 5,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      style={{
        cursor: 'grabbing',
        pointerEvents: 'none',
      }}
    >
      {children}
    </motion.div>
  );
};

export default { AnimatedDraggable, AnimatedDropZone, AnimatedDragOverlay };
