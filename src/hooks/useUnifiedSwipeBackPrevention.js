import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook ULTRA-AGRESIVO para prevenir swipe back navigation
 * BLOQUEO ABSOLUTO - Sin excepciones, sin tolerancia
 * Optimizado para iOS y Android - Prevención total
 * 
 * @param {Object} options - Configuración
 * @param {boolean} options.enabled - Si está activo
 */
const useUnifiedSwipeBackPrevention = ({
  enabled = true
} = {}) => {
  const touchStartRef = useRef(null);
  const isCurrentlyBlockingRef = useRef(false);
  
  // Thresholds ultra-estrictos para bloqueo absoluto
  const EDGE_THRESHOLD = 100; // Zona más amplia desde bordes
  const SWIPE_THRESHOLD = 10; // Threshold mínimo para activar bloqueo

  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    const isNearLeftEdge = touch.clientX < EDGE_THRESHOLD;
    const isNearRightEdge = touch.clientX > (window.innerWidth - EDGE_THRESHOLD);
    const isNearAnyEdge = isNearLeftEdge || isNearRightEdge;
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      isNearLeftEdge,
      isNearRightEdge,
      isNearAnyEdge
    };
    
    // BLOQUEO ABSOLUTO - Sin excepciones
    if (isNearAnyEdge) {
      isCurrentlyBlockingRef.current = true;
      
      // Prevenir inmediatamente cualquier gesto desde los bordes
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // Aplicar CSS ultra-agresivo
      document.body.style.overscrollBehavior = 'none';
      document.body.style.overscrollBehaviorX = 'none';
      document.documentElement.style.overscrollBehavior = 'none';
      document.documentElement.style.overscrollBehaviorX = 'none';
      document.body.style.touchAction = 'pan-y';
      document.body.style.webkitTouchCallout = 'none';
      
      console.log('[ABSOLUTE_SWIPE_BLOCK] Blocked touch from edge:', {
        x: touch.clientX,
        isNearLeftEdge,
        isNearRightEdge,
        windowWidth: window.innerWidth
      });
      
      return false;
    }
  }, [enabled]);

  const handleTouchMove = useCallback((e) => {
    if (!enabled || !touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // BLOQUEO ABSOLUTO de cualquier movimiento horizontal desde bordes
    if (touchStartRef.current.isNearAnyEdge) {
      // Si hay CUALQUIER movimiento horizontal, bloquearlo inmediatamente
      if (absDeltaX > SWIPE_THRESHOLD) {
        console.log('[ABSOLUTE_SWIPE_BLOCK] Blocking ANY horizontal movement:', {
          deltaX,
          deltaY,
          absDeltaX,
          fromLeftEdge: touchStartRef.current.isNearLeftEdge,
          fromRightEdge: touchStartRef.current.isNearRightEdge
        });
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    }
    
    // También bloquear movimientos horizontales significativos desde cualquier parte de la pantalla
    if (absDeltaX > absDeltaY && absDeltaX > 30) {
      console.log('[ABSOLUTE_SWIPE_BLOCK] Blocking significant horizontal swipe from anywhere');
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  }, [enabled]);

  const handleTouchEnd = useCallback(() => {
    if (!enabled) return;
    
    // Reset estado
    touchStartRef.current = null;
    isCurrentlyBlockingRef.current = false;
    
    // Mantener configuración agresiva - NO restaurar automáticamente
    console.log('[ABSOLUTE_SWIPE_BLOCK] Touch ended - maintaining aggressive CSS');
  }, [enabled]);

  // Setup ultra-agresivo con event listeners
  useEffect(() => {
    if (!enabled) return;
    
    // Configuración CSS PERMANENTE ultra-agresiva
    document.body.style.overscrollBehavior = 'none';
    document.body.style.overscrollBehaviorX = 'none';
    document.body.style.overscrollBehaviorY = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehaviorX = 'none';
    document.documentElement.style.overscrollBehaviorY = 'none';
    document.body.style.touchAction = 'pan-y';
    document.body.style.webkitTouchCallout = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.userSelect = 'none';
    
    // Event listeners ultra-agresivos - NO PASSIVE
    const aggressiveOptions = { passive: false, capture: true };
    
    document.addEventListener('touchstart', handleTouchStart, aggressiveOptions);
    document.addEventListener('touchmove', handleTouchMove, aggressiveOptions);
    document.addEventListener('touchend', handleTouchEnd, aggressiveOptions);
    document.addEventListener('touchcancel', handleTouchEnd, aggressiveOptions);
    
    // También agregar listeners para otros eventos relacionados
    document.addEventListener('gesturestart', (e) => { e.preventDefault(); return false; }, aggressiveOptions);
    document.addEventListener('gesturechange', (e) => { e.preventDefault(); return false; }, aggressiveOptions);
    document.addEventListener('gestureend', (e) => { e.preventDefault(); return false; }, aggressiveOptions);
    
    console.log('[ABSOLUTE_SWIPE_BLOCK] Ultra-aggressive prevention ACTIVE');
    
    return () => {
      // Cleanup event listeners solamente
      document.removeEventListener('touchstart', handleTouchStart, aggressiveOptions);
      document.removeEventListener('touchmove', handleTouchMove, aggressiveOptions);
      document.removeEventListener('touchend', handleTouchEnd, aggressiveOptions);
      document.removeEventListener('touchcancel', handleTouchEnd, aggressiveOptions);
      document.removeEventListener('gesturestart', (e) => { e.preventDefault(); return false; }, aggressiveOptions);
      document.removeEventListener('gesturechange', (e) => { e.preventDefault(); return false; }, aggressiveOptions);
      document.removeEventListener('gestureend', (e) => { e.preventDefault(); return false; }, aggressiveOptions);
      
      // NO restaurar CSS - mantener bloqueo permanente
      console.log('[ABSOLUTE_SWIPE_BLOCK] Event listeners cleaned up - CSS stays aggressive');
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isActive: enabled,
    isCurrentlyPreventing: isCurrentlyBlockingRef.current
  };
};

export default useUnifiedSwipeBackPrevention;
