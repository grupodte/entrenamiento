import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook avanzado para prevenir swipe back navigation en móviles
 * Bloquea gestos de navegación del navegador pero permite SwipeWidget
 */
const usePreventSwipeBack = ({
  enabled = true,
  exceptions = [], // Array de elementos que pueden permitir swipe back
  edgeThreshold = 50, // Píxeles desde el borde donde se detecta el gesto
  swipeThreshold = 30 // Píxeles mínimos para considerar un swipe
} = {}) => {
  const touchStartRef = useRef(null);
  const isPreventingRef = useRef(false);
  const preventionTimeoutRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    const isNearEdge = touch.clientX < edgeThreshold;
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      isNearEdge
    };
    
    // Si el toque empieza cerca del borde izquierdo, prepararse para prevenir
    if (isNearEdge) {
      isPreventingRef.current = true;
      
      // Limpiar timeout previo si existe
      if (preventionTimeoutRef.current) {
        clearTimeout(preventionTimeoutRef.current);
      }
      
      // Prevenir overscroll más agresivamente
      document.body.style.overscrollBehaviorX = 'none';
      document.documentElement.style.overscrollBehaviorX = 'none';
      document.body.style.touchAction = 'pan-y';
      
      console.log('[PreventSwipeBack] Touch near edge detected, preventing swipe back');
    }
  }, [enabled, edgeThreshold]);

  const handleTouchMove = useCallback((e) => {
    if (!enabled || !touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const absDeltaX = Math.abs(deltaX);
    
    // Si es un swipe horizontal hacia la derecha desde cerca del borde
    if (touchStartRef.current.isNearEdge && 
        deltaX > swipeThreshold && 
        absDeltaX > deltaY) {
      
      console.log('[PreventSwipeBack] Potential swipe back detected:', {
        deltaX,
        target: e.target.tagName,
        className: e.target.className,
        hasDataAction: e.target.hasAttribute?.('data-action'),
        exceptions: exceptions
      });
      
      // Verificar si el elemento target tiene excepciones
      const hasException = exceptions.some(selector => {
        // Si el selector es para atributos data
        if (selector.startsWith('[') && selector.endsWith(']')) {
          const attribute = selector.slice(1, -1);
          // Verificar si el target o algún ancestro tiene el atributo
          let current = e.target;
          while (current && current !== document.body) {
            if (current.hasAttribute && current.hasAttribute(attribute.split('=')[0])) {
              console.log(`[PreventSwipeBack] Exception found - ${attribute}`);
              return true;
            }
            current = current.parentElement;
          }
        } else {
          // Método original para clases CSS
          const element = document.querySelector(selector);
          if (element && element.contains(e.target)) {
            console.log(`[PreventSwipeBack] Exception found - ${selector}`);
            return true;
          }
        }
        return false;
      });
      
      if (!hasException) {
        console.log('[PreventSwipeBack] Blocking browser back gesture - deltaX:', deltaX);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      } else {
        console.log('[PreventSwipeBack] Allowing gesture due to exception');
      }
    }
    
    // Si no es un gesto de navegación, permitir el comportamiento normal
    if (!touchStartRef.current.isNearEdge || absDeltaX <= deltaY) {
      isPreventingRef.current = false;
    }
  }, [enabled, exceptions, swipeThreshold]);

  const handleTouchEnd = useCallback((e) => {
    if (!enabled) return;
    
    // Reset estado
    isPreventingRef.current = false;
    const wasNearEdge = touchStartRef.current?.isNearEdge;
    touchStartRef.current = null;
    
    // Solo restaurar si estábamos previniendo
    if (wasNearEdge) {
      // Restaurar comportamiento normal después de un breve delay
      preventionTimeoutRef.current = setTimeout(() => {
        document.body.style.overscrollBehaviorX = 'auto';
        document.documentElement.style.overscrollBehaviorX = 'auto';
        document.body.style.touchAction = 'auto';
        console.log('[PreventSwipeBack] Restored normal scroll behavior');
      }, 150);
    }
  }, [enabled]);
  
  // Removido handlePopState - useNoBack se encarga del historial

  useEffect(() => {
    if (!enabled) return;
    
    // Aplicar estilos CSS base para PWA
    const originalBodyOverscroll = document.body.style.overscrollBehaviorX;
    const originalHtmlOverscroll = document.documentElement.style.overscrollBehaviorX;
    const originalBodyTouchAction = document.body.style.touchAction;
    
    // Configurar CSS base para prevenir swipe back de forma más suave
    document.body.style.overscrollBehaviorX = 'none';
    document.documentElement.style.overscrollBehaviorX = 'none';
    
    // Agregar meta tag para iOS si no existe
    let metaTag = document.querySelector('meta[name="format-detection"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'format-detection';
      metaTag.content = 'telephone=no';
      document.head.appendChild(metaTag);
    }
    
    // Event listeners con configuración menos agresiva para no interferir con useSwipeGesture
    const touchOptions = { passive: false, capture: false }; // CAMBIADO: capture: false
    const passiveOptions = { passive: true, capture: false }; // CAMBIADO: capture: false
    
    document.addEventListener('touchstart', handleTouchStart, passiveOptions); // CAMBIADO: passive
    document.addEventListener('touchmove', handleTouchMove, touchOptions);
    document.addEventListener('touchend', handleTouchEnd, passiveOptions);
    document.addEventListener('touchcancel', handleTouchEnd, passiveOptions);
    // popstate manejado por useNoBack

    console.log('[PreventSwipeBack] Hook initialized and active');

    return () => {
      // Cleanup event listeners
      document.removeEventListener('touchstart', handleTouchStart, passiveOptions);
      document.removeEventListener('touchmove', handleTouchMove, touchOptions);
      document.removeEventListener('touchend', handleTouchEnd, passiveOptions);
      document.removeEventListener('touchcancel', handleTouchEnd, passiveOptions);
      
      // Limpiar timeout si existe
      if (preventionTimeoutRef.current) {
        clearTimeout(preventionTimeoutRef.current);
      }
      
      // Restaurar comportamiento original
      document.body.style.overscrollBehaviorX = originalBodyOverscroll || 'auto';
      document.documentElement.style.overscrollBehaviorX = originalHtmlOverscroll || 'auto';
      document.body.style.touchAction = originalBodyTouchAction || 'auto';
      
      console.log('[PreventSwipeBack] Hook cleaned up');
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

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
