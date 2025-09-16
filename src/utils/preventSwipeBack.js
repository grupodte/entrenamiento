import React from 'react';

/**
 * Utilidades para prevenir el swipe back del navegador
 * Uso: importar y llamar las funciones en componentes donde sea necesario
 */

/**
 * Previene el swipe back aplicando estilos CSS específicos al elemento
 * @param {HTMLElement} element - Elemento al cual aplicar la prevención
 */
export const applySwipeBackPrevention = (element) => {
  if (!element) return;
  
  element.style.overscrollBehaviorX = 'none';
  element.style.webkitOverscrollBehaviorX = 'none';
  element.style.touchAction = 'pan-y';
  element.style.userSelect = 'none';
  element.style.webkitUserSelect = 'none';
  element.style.webkitTouchCallout = 'none';
};

/**
 * Hook personalizado para React que aplica prevención de swipe back
 * @param {React.RefObject} ref - Ref del elemento a proteger
 */
export const usePreventSwipeBack = (ref) => {
  React.useEffect(() => {
    if (ref.current) {
      applySwipeBackPrevention(ref.current);
    }
  }, [ref]);
};

/**
 * Previene eventos touch horizontales en un elemento específico
 * @param {HTMLElement} element - Elemento al cual agregar los event listeners
 * @returns {Function} - Función para limpiar los event listeners
 */
export const preventHorizontalSwipe = (element) => {
  if (!element) return () => {};
  
  let startX = null;
  let startY = null;
  
  const handleTouchStart = (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  };
  
  const handleTouchMove = (e) => {
    if (startX === null || startY === null) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    
    // Prevenir swipe horizontal desde los bordes
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Desde borde izquierdo
      if (startX < 50 && deltaX > 0) {
        e.preventDefault();
        e.stopPropagation();
      }
      // Desde borde derecho
      if (startX > window.innerWidth - 50 && deltaX < 0) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };
  
  const handleTouchEnd = () => {
    startX = null;
    startY = null;
  };
  
  element.addEventListener('touchstart', handleTouchStart, { passive: false });
  element.addEventListener('touchmove', handleTouchMove, { passive: false });
  element.addEventListener('touchend', handleTouchEnd, { passive: false });
  
  // Retornar función de limpieza
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
};

/**
 * Clase CSS personalizada que se puede aplicar a elementos específicos
 * Para usar en Tailwind o CSS modules
 */
export const swipeBackPreventionClass = {
  overscrollBehaviorX: 'none',
  WebkitOverscrollBehaviorX: 'none',
  touchAction: 'pan-y',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  WebkitTouchCallout: 'none'
};

/**
 * Componente HOC que envuelve otro componente aplicando prevención de swipe back
 * @param {React.Component} Component - Componente a envolver
 * @returns {React.Component} - Componente envuelto con prevención
 */
export const withSwipeBackPrevention = (Component) => {
  return React.forwardRef((props, ref) => {
    const innerRef = React.useRef(null);
    const componentRef = ref || innerRef;
    
    React.useEffect(() => {
      if (componentRef.current) {
        const cleanup = preventHorizontalSwipe(componentRef.current);
        applySwipeBackPrevention(componentRef.current);
        
        return cleanup;
      }
    }, [componentRef]);
    
    return <Component ref={componentRef} {...props} />;
  });
};

// Exportar todo como default también
const preventSwipeBackUtils = {
  applySwipeBackPrevention,
  usePreventSwipeBack,
  preventHorizontalSwipe,
  swipeBackPreventionClass,
  withSwipeBackPrevention
};

export default preventSwipeBackUtils;
