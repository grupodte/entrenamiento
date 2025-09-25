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
    const isNearLeftEdge = touch.clientX < 50; // Solo borde izquierdo y más selectivo
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      isNearLeftEdge
    };
    
    // Solo preparar CSS si está cerca del borde izquierdo
    // NO bloquear el evento aún - esperar al touchmove
    if (isNearLeftEdge) {
      // Aplicar CSS preventivo
      document.body.style.overscrollBehavior = 'none';
      document.body.style.overscrollBehaviorX = 'none';
      document.documentElement.style.overscrollBehavior = 'none';
      document.documentElement.style.overscrollBehaviorX = 'none';
      document.body.style.touchAction = 'pan-y';
      
      console.log('[UNIFIED_SWIPE_BLOCK] Monitoring touch near left edge');
    }
  }, [enabled]);

  const handleTouchMove = useCallback((e) => {
    if (!enabled || !touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Solo bloquear swipes hacia la derecha desde el borde izquierdo
    if (touchStartRef.current.isNearLeftEdge && 
        deltaX > 30 && // Movimiento hacia la derecha de al menos 30px
        absDeltaX > absDeltaY && // Movimiento principalmente horizontal
        absDeltaX > 30) { // Movimiento significativo
      
      isCurrentlyBlockingRef.current = true;
      
      console.log('[UNIFIED_SWIPE_BLOCK] Blocking swipe back gesture:', {
        deltaX,
        deltaY,
        startX: touchStartRef.current.x,
        currentX: touch.clientX
      });
      
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
    
    // Event listeners inteligentes
    const passiveOptions = { passive: true, capture: true };
    const activeOptions = { passive: false, capture: true };
    
    document.addEventListener('touchstart', handleTouchStart, passiveOptions);
    document.addEventListener('touchmove', handleTouchMove, activeOptions); // Solo este necesita preventDefault
    document.addEventListener('touchend', handleTouchEnd, passiveOptions);
    document.addEventListener('touchcancel', handleTouchEnd, passiveOptions);
    
    // También agregar listeners para otros eventos relacionados
    document.addEventListener('gesturestart', (e) => { e.preventDefault(); return false; }, activeOptions);
    document.addEventListener('gesturechange', (e) => { e.preventDefault(); return false; }, activeOptions);
    document.addEventListener('gestureend', (e) => { e.preventDefault(); return false; }, activeOptions);
    
    console.log('[ABSOLUTE_SWIPE_BLOCK] Ultra-aggressive prevention ACTIVE');
    
    return () => {
      // Cleanup event listeners solamente
      document.removeEventListener('touchstart', handleTouchStart, passiveOptions);
      document.removeEventListener('touchmove', handleTouchMove, activeOptions);
      document.removeEventListener('touchend', handleTouchEnd, passiveOptions);
      document.removeEventListener('touchcancel', handleTouchEnd, passiveOptions);
      document.removeEventListener('gesturestart', (e) => { e.preventDefault(); return false; }, activeOptions);
      document.removeEventListener('gesturechange', (e) => { e.preventDefault(); return false; }, activeOptions);
      document.removeEventListener('gestureend', (e) => { e.preventDefault(); return false; }, activeOptions);
      
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
