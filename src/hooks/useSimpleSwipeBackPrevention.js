import { useEffect } from 'react';

/**
 * Hook simple para prevenir swipe back
 * Solo previene gestos de navegación, no interfiere con clicks normales
 */
const useSimpleSwipeBackPrevention = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return;
    
    // Aplicar CSS básico
    document.body.style.overscrollBehaviorX = 'none';
    document.documentElement.style.overscrollBehaviorX = 'none';
    
    // Solo para dispositivos táctiles
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice) {
      let startX = null;
      
      const handleTouchStart = (e) => {
        startX = e.touches[0].clientX;
      };
      
      const handleTouchMove = (e) => {
        if (startX === null) return;
        
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;
        
        // Solo prevenir si es un swipe desde el borde izquierdo hacia la derecha
        if (startX < 30 && deltaX > 50) {
          e.preventDefault();
        }
      };
      
      // Event listeners con passive: false solo para touchmove
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      
      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        
        // Restaurar CSS original
        document.body.style.overscrollBehaviorX = '';
        document.documentElement.style.overscrollBehaviorX = '';
      };
    }
  }, [enabled]);
  
  return { isActive: enabled };
};

export default useSimpleSwipeBackPrevention;
