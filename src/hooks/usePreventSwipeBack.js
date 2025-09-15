import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook avanzado para prevenir swipe back navigation en móviles
 * Bloquea gestos de navegación del navegador pero permite SwipeWidget
 */
const usePreventSwipeBack = ({
  enabled = true,
  exceptions = [] // Array de elementos que pueden permitir swipe back
} = {}) => {
  const touchStartRef = useRef(null);
  const isPreventingRef = useRef(false);

  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    
    // Si el toque empieza muy cerca del borde izquierdo, prepararse para prevenir
    if (touch.clientX < 20) {
      isPreventingRef.current = true;
      // Prevenir overscroll más agresivamente
      document.body.style.overscrollBehaviorX = 'none';
      document.documentElement.style.overscrollBehaviorX = 'none';
    }
  }, [enabled]);

  const handleTouchMove = useCallback((e) => {
    if (!enabled || !touchStartRef.current || !isPreventingRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const absDeltaX = Math.abs(deltaX);
    
    // Si es un swipe horizontal hacia la derecha desde muy cerca del borde
    if (absDeltaX > deltaY && deltaX > 10 && touchStartRef.current.x < 20) {
      // Verificar si el elemento target tiene excepciones
      const hasException = exceptions.some(selector => {
        const element = document.querySelector(selector);
        return element && element.contains(e.target);
      });
      
      if (!hasException) {
        console.log('[PreventSwipeBack] Blocking browser back gesture');
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, [enabled, exceptions]);

  const handleTouchEnd = useCallback((e) => {
    if (!enabled) return;
    
    // Reset estado
    isPreventingRef.current = false;
    touchStartRef.current = null;
    
    // Restaurar comportamiento normal después de un breve delay
    setTimeout(() => {
      document.body.style.overscrollBehaviorX = 'auto';
      document.documentElement.style.overscrollBehaviorX = 'auto';
    }, 100);
  }, [enabled]);
  
  const handlePopState = useCallback((e) => {
    if (!enabled) return;
    console.log('[PreventSwipeBack] Navigation event detected');
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    
    // Configurar CSS base para prevenir swipe back
    document.body.style.overscrollBehaviorX = 'none';
    document.documentElement.style.overscrollBehaviorX = 'none';
    
    // Event listeners
    const options = { passive: false };
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('popstate', handlePopState);

    return () => {
      // Cleanup
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('popstate', handlePopState);
      
      // Restaurar comportamiento original
      document.body.style.overscrollBehaviorX = 'auto';
      document.documentElement.style.overscrollBehaviorX = 'auto';
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd, handlePopState]);

  return {
    isActive: enabled,
    addException: (selector) => {
      if (!exceptions.includes(selector)) {
        exceptions.push(selector);
      }
    }
  };
};

export default usePreventSwipeBack;
