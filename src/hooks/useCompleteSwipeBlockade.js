import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook completo para BLOQUEAR ABSOLUTAMENTE el swipe back y navegación hacia atrás
 * Combina múltiples técnicas:
 * 1. Intercepta touch events nativos
 * 2. Sobrescribe window.history methods
 * 3. Previene popstate events
 * 4. CSS overscroll-behavior
 */
const useCompleteSwipeBlockade = ({
  enabled = true,
  edgeThreshold = 0.15,
  debugLog = false
} = {}) => {
  const statsRef = useRef({ blockedTouches: 0, blockedHistory: 0 });
  const originalHistoryRef = useRef({});
  const touchStateRef = useRef({
    startX: null,
    startY: null,
    startTime: null,
    isTracking: false
  });

  // Detectar iOS/móvil
  const detectMobile = useCallback(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /iPad|iPhone|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  }, []);

  // Interceptar touch events (como antes, pero más agresivo)
  const handleTouchStart = useCallback((event) => {
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    const screenWidth = window.innerWidth;
    const edgePixels = screenWidth * edgeThreshold;
    const touchX = touch.clientX;

    const isNearLeftEdge = touchX <= edgePixels;
    const isNearRightEdge = touchX >= screenWidth - edgePixels;

    if (isNearLeftEdge || isNearRightEdge) {
      touchStateRef.current = {
        startX: touchX,
        startY: touch.clientY,
        startTime: Date.now(),
        isTracking: true
      };

      if (debugLog) {
        console.log(`[Complete Swipe Block] Tracking touch at edge: ${touchX}`);
      }
    }
  }, [edgeThreshold, debugLog]);

  const handleTouchMove = useCallback((event) => {
    if (!touchStateRef.current.isTracking || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const { startX, startY, startTime } = touchStateRef.current;
    
    const deltaX = Math.abs(touch.clientX - startX);
    const deltaY = Math.abs(touch.clientY - startY);
    const deltaTime = Date.now() - startTime;
    
    // BLOQUEO MUY AGRESIVO
    const MIN_SWIPE_DISTANCE = 10; // Muy sensible
    const MAX_SWIPE_TIME = 1000; // Tiempo amplio
    const MAX_VERTICAL_DRIFT = 150;
    
    const horizontalVelocity = deltaX / deltaTime;
    const isMovingHorizontally = deltaX > deltaY * 0.5; // Muy permisivo para horizontal
    
    const isPotentialSwipe = deltaX > MIN_SWIPE_DISTANCE && 
                           deltaTime < MAX_SWIPE_TIME && 
                           deltaY < MAX_VERTICAL_DRIFT &&
                           isMovingHorizontally &&
                           horizontalVelocity > 0.02; // Velocidad muy baja
    
    if (isPotentialSwipe) {
      event.preventDefault();
      event.stopPropagation();
      statsRef.current.blockedTouches++;
      touchStateRef.current.isTracking = false;
      
      if (debugLog) {
        console.log(`[Complete Swipe Block] 🚫 BLOCKED swipe: deltaX=${deltaX}, deltaY=${deltaY}, time=${deltaTime}ms`);
      }
    }
  }, [debugLog]);

  const handleTouchEnd = useCallback(() => {
    touchStateRef.current.isTracking = false;
  }, []);

  // Interceptar window.history methods
  const interceptHistoryMethods = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Guardar métodos originales
    originalHistoryRef.current = {
      back: window.history.back,
      forward: window.history.forward,
      go: window.history.go
    };

    // Sobrescribir métodos
    window.history.back = function() {
      statsRef.current.blockedHistory++;
      if (debugLog) {
        console.log('[Complete Swipe Block] 🚫 BLOCKED window.history.back()');
      }
      // No hacer nada - bloqueo completo
    };

    window.history.forward = function() {
      statsRef.current.blockedHistory++;
      if (debugLog) {
        console.log('[Complete Swipe Block] 🚫 BLOCKED window.history.forward()');
      }
      // No hacer nada - bloqueo completo
    };

    window.history.go = function(delta) {
      if (delta < 0) { // Navegación hacia atrás
        statsRef.current.blockedHistory++;
        if (debugLog) {
          console.log(`[Complete Swipe Block] 🚫 BLOCKED window.history.go(${delta})`);
        }
        return; // No hacer nada
      }
      // Permitir navegación hacia adelante si es necesario
      originalHistoryRef.current.go.call(this, delta);
    };

  }, [debugLog]);

  // Restaurar métodos originales
  const restoreHistoryMethods = useCallback(() => {
    if (typeof window === 'undefined' || !originalHistoryRef.current.back) return;

    window.history.back = originalHistoryRef.current.back;
    window.history.forward = originalHistoryRef.current.forward;
    window.history.go = originalHistoryRef.current.go;

    if (debugLog) {
      console.log('[Complete Swipe Block] History methods restored');
    }
  }, [debugLog]);

  // Prevenir popstate events
  const handlePopState = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    statsRef.current.blockedHistory++;
    
    if (debugLog) {
      console.log('[Complete Swipe Block] 🚫 BLOCKED popstate event');
    }
    
    return false;
  }, [debugLog]);

  // Setup principal
  useEffect(() => {
    if (!enabled) return;

    if (debugLog) {
      console.log('[Complete Swipe Block] 🛡️ ACTIVATING complete swipe blockade');
    }

    // 1. Touch events
    if ('ontouchstart' in window) {
      const options = { passive: false };
      window.addEventListener('touchstart', handleTouchStart, options);
      window.addEventListener('touchmove', handleTouchMove, options);
      window.addEventListener('touchend', handleTouchEnd, options);
    }

    // 2. History methods
    interceptHistoryMethods();

    // 3. PopState events
    window.addEventListener('popstate', handlePopState, true);

    // 4. CSS overscroll
    const originalBodyX = document.body.style.overscrollBehaviorX;
    const originalDocX = document.documentElement.style.overscrollBehaviorX;
    document.body.style.overscrollBehaviorX = 'none';
    document.documentElement.style.overscrollBehaviorX = 'none';

    // Cleanup
    return () => {
      // Remove touch listeners
      if ('ontouchstart' in window) {
        const options = { passive: false };
        window.removeEventListener('touchstart', handleTouchStart, options);
        window.removeEventListener('touchmove', handleTouchMove, options);
        window.removeEventListener('touchend', handleTouchEnd, options);
      }

      // Restore history methods
      restoreHistoryMethods();

      // Remove popstate listener
      window.removeEventListener('popstate', handlePopState, true);

      // Restore CSS
      document.body.style.overscrollBehaviorX = originalBodyX;
      document.documentElement.style.overscrollBehaviorX = originalDocX;

      if (debugLog) {
        console.log('[Complete Swipe Block] ❌ DEACTIVATED complete swipe blockade', {
          touchesBlocked: statsRef.current.blockedTouches,
          historyBlocked: statsRef.current.blockedHistory
        });
      }
    };
  }, [
    enabled,
    handleTouchStart,
    handleTouchMove, 
    handleTouchEnd,
    interceptHistoryMethods,
    restoreHistoryMethods,
    handlePopState,
    debugLog
  ]);

  return {
    isActive: enabled,
    isMobile: detectMobile(),
    stats: {
      blockedTouches: statsRef.current.blockedTouches,
      blockedHistory: statsRef.current.blockedHistory,
      totalBlocked: statsRef.current.blockedTouches + statsRef.current.blockedHistory
    }
  };
};

export default useCompleteSwipeBlockade;