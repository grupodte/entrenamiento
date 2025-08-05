import { motion } from 'framer-motion';
import { clsx } from 'clsx';

// Variantes para diferentes tipos de botones
const buttonVariants = {
  primary: {
    rest: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
  },
  secondary: {
    rest: { scale: 1 },
    hover: { scale: 1.01 },
    tap: { scale: 0.99 },
  },
  icon: {
    rest: { scale: 1, rotate: 0 },
    hover: { scale: 1.1, rotate: 2 },
    tap: { scale: 0.95, rotate: -2 },
  },
  destructive: {
    rest: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.97 },
  },
};

// Transiciones suaves
const buttonTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

/**
 * AnimatedButton - Botón con microinteracciones fluidas
 */
const AnimatedButton = ({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  loading = false,
  onClick,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center transition-colors duration-200';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2',
    secondary: 'bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-2',
    icon: 'p-2 rounded-full hover:bg-white/10',
    destructive: 'bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2',
  };

  return (
    <motion.button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      variants={buttonVariants[variant]}
      initial="rest"
      whileHover={!disabled ? "hover" : "rest"}
      whileTap={!disabled ? "tap" : "rest"}
      transition={buttonTransition}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <motion.div
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        children
      )}
    </motion.button>
  );
};

export default AnimatedButton;
