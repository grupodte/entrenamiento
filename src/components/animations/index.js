// Exportaciones principales
export { default as AnimatedLayout } from './AnimatedLayout';
export { default as AnimatedLoadingText } from './AnimatedLoadingText';

// Constantes y utilidades comunes para animaciones
export const animationConfig = {
  // Transiciones al estilo iOS
  ios: {
    type: 'tween',
    ease: [0.25, 0.46, 0.45, 0.94],
    duration: 0.4,
  },
  
  // Spring suave
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 25,
  },
  
  // Spring más rápido para microinteracciones
  microSpring: {
    type: 'spring',
    stiffness: 400,
    damping: 25,
  },
  
  // Fade simple
  fade: {
    type: 'tween',
    duration: 0.3,
  },
};

// Variantes comunes reutilizables
export const commonVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
};
