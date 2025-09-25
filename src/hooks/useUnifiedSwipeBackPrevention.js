import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook unificado para prevenir swipe back navigation
 * Optimizado para iOS y Android - Reemplaza múltiples implementaciones conflictivas
 * 
 * @param {Object} options - Configuración
 * @param {boolean} options.enabled - Si está activo
 * @param {Array} options.exceptions - Selectores de elementos que permiten swipe back
 * @param {number} options.edgeThreshold - Píxeles desde el borde para detectar gesto
 * @param {number} options.swipeThreshold - Píxeles mínimos para considerar swipe
 */
const useUnifiedSwipeBackPrevention = ({
  enabled = true,
  exceptions = [],
  edgeThreshold = 50,
  swipeThreshold = 30
} = {}) => {
  const touchStartRef = useRef(null);
  const isPreventingRef = useRef(false);

  // Verificar si el elemento tiene excepciones
  const hasException = useCallback((target) => {
    if (!target) return false;
    
    return exceptions.some(selector => {
      try {
        // Para atributos data
        if (selector.startsWith('[') && selector.endsWith(']')) {
          const attribute = selector.slice(1, -1).split('=')[0];
          let current = target;
          while (current && current !== document.body) {
            if (current.hasAttribute && current.hasAttribute(attribute)) {
              return true;
            }
            current = current.parentElement;
          }
        } else {
          // Para selectores CSS
          const element = document.querySelector(selector);
          if (element && element.contains(target)) {
            return true;
          }
        }
      } catch (e) {
        console.warn('Invalid exception selector:', selector);
      }
      return false;
    });
  }, [exceptions]);

  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    const isNearLeftEdge = touch.clientX < edgeThreshold;
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      isNearLeftEdge
    };
    
    // Solo aplicar prevención si es desde el borde izquierdo y no hay excepciones
    if (isNearLeftEdge && !hasException(e.target)) {
      isPreventingRef.current = true;
      
      // Aplicar CSS de prevención de forma más agresiva
      document.body.style.overscrollBehaviorX = 'none';
      document.documentElement.style.overscrollBehaviorX = 'none';
      document.body.style.touchAction = 'pan-y';
      
      console.log('[UnifiedSwipeBackPrevention] Preventing swipe from left edge');
    }
  }, [enabled, edgeThreshold, hasException]);

  const handleTouchMove = useCallback((e) => {
    if (!enabled || !touchStartRef.current || !isPreventingRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const absDeltaX = Math.abs(deltaX);
    
    // Si es un swipe horizontal hacia la derecha desde cerca del borde izquierdo
    if (touchStartRef.current.isNearLeftEdge && 
        deltaX > swipeThreshold && 
        absDeltaX > deltaY) {
      
      console.log('[UnifiedSwipeBackPrevention] Blocking horizontal swipe:', deltaX);
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  }, [enabled, swipeThreshold]);

  const handleTouchEnd = useCallback(() => {
    if (!enabled) return;
    
    // Reset estado
    const wasPreventingLeftEdge = touchStartRef.current?.isNearLeftEdge && isPreventingRef.current;
    isPreventingRef.current = false;
    touchStartRef.current = null;
    
    // Restaurar comportamiento normal con delay para evitar rebotes
    if (wasPreventingLeftEdge) {
      setTimeout(() => {
        document.body.style.overscrollBehaviorX = 'auto';
        document.documentElement.style.overscrollBehaviorX = 'auto';
        document.body.style.touchAction = 'auto';
      }, 150);
    }
  }, [enabled]);

  // Setup de event listeners
  useEffect(() => {
    if (!enabled) return;
    
    // Configuración CSS base
    const originalBodyOverscroll = document.body.style.overscrollBehaviorX;
    const originalHtmlOverscroll = document.documentElement.style.overscrollBehaviorX;
    
    // Aplicar configuración base más suave
    document.body.style.overscrollBehaviorX = 'none';
    document.documentElement.style.overscrollBehaviorX = 'none';
    
    // Event listeners con configuración optimizada
    const passiveOptions = { passive: true, capture: false };
    const activeOptions = { passive: false, capture: false };
    
    document.addEventListener('touchstart', handleTouchStart, passiveOptions);
    document.addEventListener('touchmove', handleTouchMove, activeOptions);
    document.addEventListener('touchend', handleTouchEnd, passiveOptions);
    document.addEventListener('touchcancel', handleTouchEnd, passiveOptions);
    
    console.log('[UnifiedSwipeBackPrevention] Initialized and active');
    
    return () => {
      // Cleanup
      document.removeEventListener('touchstart', handleTouchStart, passiveOptions);
      document.removeEventListener('touchmove', handleTouchMove, activeOptions);
      document.removeEventListener('touchend', handleTouchEnd, passiveOptions);
      document.removeEventListener('touchcancel', handleTouchEnd, passiveOptions);
      
      // Restaurar configuración original
      document.body.style.overscrollBehaviorX = originalBodyOverscroll || 'auto';
      document.documentElement.style.overscrollBehaviorX = originalHtmlOverscroll || 'auto';
      document.body.style.touchAction = 'auto';
      
      console.log('[UnifiedSwipeBackPrevention] Cleaned up');
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isActive: enabled,
    isCurrentlyPreventing: isPreventingRef.current
  };
};

export default useUnifiedSwipeBackPrevention;
