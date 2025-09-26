import { useEffect } from 'react';

/**
 * Hook simple para prevenir swipe back
 * Solo previene gestos de navegación, no interfiere con clicks normales
 * Ahora optimizado para trabajar junto con EdgeGestureOverlay
 */
const useSimpleSwipeBackPrevention = (enabled = true, options = {}) => {
  const {
    edgeZone = 30, // Zona de borde considerada para prevención
    swipeThreshold = 50, // Distancia mínima para considerar swipe
    debug = false
  } = options;
  useEffect(() => {
    if (!enabled) return;
    
    if (debug) {
      console.log('[useSimpleSwipeBackPrevention] Inicializando con opciones:', {
        enabled, edgeZone, swipeThreshold
      });
    }
    
    // Aplicar CSS básico - configuración mejorada
    const originalBodyOverscroll = document.body.style.overscrollBehaviorX;
    const originalDocOverscroll = document.documentElement.style.overscrollBehaviorX;
    
    document.body.style.overscrollBehaviorX = 'none';
    document.documentElement.style.overscrollBehaviorX = 'none';
    
    // Configuración adicional para prevenir gestos de navegación
    document.body.style.touchAction = 'pan-y';
    
    // Solo para dispositivos táctiles
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice) {
      let startX = null;
      let startY = null;
      let isEdgeGesture = false;
      
      const handleTouchStart = (e) => {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        
        // Determinar si el toque inició en una zona de borde
        const screenWidth = window.innerWidth;
        isEdgeGesture = startX < edgeZone || startX > (screenWidth - edgeZone);
        
        if (debug && isEdgeGesture) {
          console.log('[useSimpleSwipeBackPrevention] Gesto iniciado en zona de borde:', {
            startX, screenWidth, leftEdge: startX < edgeZone, rightEdge: startX > (screenWidth - edgeZone)
          });
        }
      };
      
      const handleTouchMove = (e) => {
        if (startX === null || startY === null || !isEdgeGesture) return;
        
        const touch = e.touches[0];
        const currentX = touch.clientX;
        const currentY = touch.clientY;
        const deltaX = currentX - startX;
        const deltaY = Math.abs(currentY - startY);
        
        // Verificar si es un gesto horizontal significativo
        const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold;
        
        if (isHorizontalSwipe) {
          // Prevenir swipe hacia la derecha desde borde izquierdo (navegación atrás)
          // Prevenir swipe hacia la izquierda desde borde derecho (navegación adelante)
          const screenWidth = window.innerWidth;
          const isBackGesture = (startX < edgeZone && deltaX > swipeThreshold);
          const isForwardGesture = (startX > (screenWidth - edgeZone) && deltaX < -swipeThreshold);
          
          if (isBackGesture || isForwardGesture) {
            e.preventDefault();
            e.stopPropagation();
            
            if (debug) {
              console.log('[useSimpleSwipeBackPrevention] Gesto de navegación prevenido:', {
                type: isBackGesture ? 'back' : 'forward',
                startX, deltaX, deltaY
              });
            }
          }
        }
      };
      
      const handleTouchEnd = () => {
        // Reset de variables
        startX = null;
        startY = null;
        isEdgeGesture = false;
      };
      
      const handleTouchCancel = () => {
        // Reset de variables en caso de cancelación
        startX = null;
        startY = null;
        isEdgeGesture = false;
      };
      
      // Event listeners con configuración optimizada
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
      document.addEventListener('touchcancel', handleTouchCancel, { passive: true });
      
      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        document.removeEventListener('touchcancel', handleTouchCancel);
        
        // Restaurar CSS original
        document.body.style.overscrollBehaviorX = originalBodyOverscroll;
        document.documentElement.style.overscrollBehaviorX = originalDocOverscroll;
        document.body.style.touchAction = '';
        
        if (debug) {
          console.log('[useSimpleSwipeBackPrevention] Limpieza completada');
        }
      };
    } else {
      // Para dispositivos no táctiles, solo limpiar CSS al desmontar
      return () => {
        document.body.style.overscrollBehaviorX = originalBodyOverscroll;
        document.documentElement.style.overscrollBehaviorX = originalDocOverscroll;
        document.body.style.touchAction = '';
      };
    }
  }, [enabled, edgeZone, swipeThreshold, debug]);
  
  return { 
    isActive: enabled,
    config: {
      edgeZone,
      swipeThreshold,
      debug
    }
  };
};

export default useSimpleSwipeBackPrevention;
