import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react';

// Variantes para el feedback
const feedbackVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: -50,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -50,
    transition: {
      duration: 0.2,
    },
  },
};

// Iconos para diferentes tipos de feedback
const feedbackIcons = {
  success: CheckCircle,
  error: X,
  warning: AlertCircle,
  info: Info,
};

// Colores para diferentes tipos
const feedbackColors = {
  success: 'bg-green-500/90 text-white',
  error: 'bg-red-500/90 text-white',
  warning: 'bg-yellow-500/90 text-white',
  info: 'bg-blue-500/90 text-white',
};

/**
 * AnimatedFeedback - Componente de feedback visual animado
 */
const AnimatedFeedback = ({
  show,
  type = 'success',
  message,
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const Icon = feedbackIcons[type];

  useEffect(() => {
    setIsVisible(show);
    
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={feedbackVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={`
            fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg
            backdrop-blur-md flex items-center gap-3 max-w-sm
            ${feedbackColors[type]}
          `}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{message}</span>
          
          <button
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
            className="ml-2 hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Hook para usar el feedback de manera más sencilla
 */
export const useFeedback = () => {
  const [feedback, setFeedback] = useState({
    show: false,
    type: 'success',
    message: '',
  });

  const showFeedback = (type, message, duration = 3000) => {
    setFeedback({ show: true, type, message });
    
    if (duration > 0) {
      setTimeout(() => {
        setFeedback(prev => ({ ...prev, show: false }));
      }, duration);
    }
  };

  const hideFeedback = () => {
    setFeedback(prev => ({ ...prev, show: false }));
  };

  return {
    feedback,
    showFeedback,
    hideFeedback,
    showSuccess: (message, duration) => showFeedback('success', message, duration),
    showError: (message, duration) => showFeedback('error', message, duration),
    showWarning: (message, duration) => showFeedback('warning', message, duration),
    showInfo: (message, duration) => showFeedback('info', message, duration),
  };
};

export default AnimatedFeedback;
