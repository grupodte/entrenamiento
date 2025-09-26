import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook para capturar y prevenir gestos de arrastre desde los bordes de la pantalla
 * Evita que el navegador reciba estos gestos y active la navegación hacia atrás/adelante
 * Optimizado especialmente para iOS Chrome PWA
 */
const useEdgeGestureCapture = (options = {}) => {
  const {
    enabled = true,
    edgeWidth = 40, // Más ancho para iOS - zona sensible en píxeles
    preventThreshold = 20, // Menor threshold para captura más temprana
    debug = false
  } = options;

  const isCapturingRef = useRef(false);
  const startPositionRef = useRef({ x: 0, y: 0 });
  const edgeTypeRef = useRef(null); // 'left' | 'right' | null

  const logDebug = useCallback((message, data = {}) => {
    if (debug) {
      console.log(`[EdgeGestureCapture] ${message}`, data);
    }
  }, [debug]);

  const isInEdgeZone = useCallback((x, screenWidth) => {
    const leftEdge = x <= edgeWidth;
    const rightEdge = x >= (screenWidth - edgeWidth);
    
    if (leftEdge) return 'left';
    if (rightEdge) return 'right';
    return null;
  }, [edgeWidth]);

  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;

    const touch = e.touches[0];
    const screenWidth = window.innerWidth;
    const edgeType = isInEdgeZone(touch.clientX, screenWidth);

    if (edgeType) {
      isCapturingRef.current = true;
      edgeTypeRef.current = edgeType;
      startPositionRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };

      logDebug('Iniciando captura de gesto desde borde', {
        edge: edgeType,
        startX: touch.clientX,
        screenWidth
      });
    }
  }, [enabled, isInEdgeZone, logDebug]);

  const handleTouchMove = useCallback((e) => {
    if (!enabled || !isCapturingRef.current || !edgeTypeRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startPositionRef.current.x;
    const deltaY = Math.abs(touch.clientY - startPositionRef.current.y);
    
    // Determinar si es un gesto horizontal significativo
    const isHorizontalGesture = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > preventThreshold;
    
    if (isHorizontalGesture) {
      // Prevenir gestos de navegación del navegador
      const isNavigationGesture = 
        (edgeTypeRef.current === 'left' && deltaX > preventThreshold) ||  // Swipe derecha desde borde izquierdo
        (edgeTypeRef.current === 'right' && deltaX < -preventThreshold);   // Swipe izquierda desde borde derecho

      if (isNavigationGesture) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Para iOS, también prevenir cualquier comportamiento por defecto
        try {
          if (e.cancelable) {
            e.preventDefault();
          }
        } catch (err) {
          logDebug('Error previniendo evento:', err);
        }
        
        logDebug('Gesto de navegación prevenido', {
          edge: edgeTypeRef.current,
          deltaX,
          deltaY,
          prevented: true,
          eventCancelable: e.cancelable
        });
        
        return false;
      }
    }
  }, [enabled, preventThreshold, logDebug]);

  const handleTouchEnd = useCallback((e) => {
    if (isCapturingRef.current) {
      logDebug('Finalizando captura de gesto', {
        edge: edgeTypeRef.current
      });
    }

    // Reset del estado
    isCapturingRef.current = false;
    edgeTypeRef.current = null;
    startPositionRef.current = { x: 0, y: 0 };
  }, [logDebug]);

  const handleTouchCancel = useCallback((e) => {
    logDebug('Gesto cancelado');
    
    // Reset del estado en caso de cancelación
    isCapturingRef.current = false;
    edgeTypeRef.current = null;
    startPositionRef.current = { x: 0, y: 0 };
  }, [logDebug]);

  useEffect(() => {
    if (!enabled) return;
    
    // Detectar iOS específicamente
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
    const isPWA = window.navigator.standalone || 
                  window.matchMedia('(display-mode: standalone)').matches ||
                  window.matchMedia('(display-mode: fullscreen)').matches;
    
    // Detectar si es un dispositivo táctil
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (!isTouchDevice) {
      logDebug('Dispositivo no táctil detectado, deshabilitando captura');
      return;
    }

    logDebug('Inicializando captura de gestos de borde', {
      edgeWidth,
      preventThreshold,
      screenWidth: window.innerWidth,
      isIOS,
      isChrome,
      isPWA,
      userAgent: navigator.userAgent
    });
    
    // Configuración especial para iOS PWA
    if (isIOS && isPWA) {
      document.body.style.webkitUserSelect = 'none';
      document.body.style.webkitTouchCallout = 'none';
      document.documentElement.style.webkitUserSelect = 'none';
      document.documentElement.style.webkitTouchCallout = 'none';
    }

    // Agregar event listeners con configuración específica para iOS
    const eventOptions = {
      touchstart: { passive: true, capture: true },
      touchmove: { passive: false, capture: true }, // Necesario para preventDefault
      touchend: { passive: true, capture: true },
      touchcancel: { passive: true, capture: true }
    };
    
    // Para iOS PWA, usamos configuración más agresiva
    if (isIOS && isPWA) {
      eventOptions.touchmove.passive = false;
    }
    
    document.addEventListener('touchstart', handleTouchStart, eventOptions.touchstart);
    document.addEventListener('touchmove', handleTouchMove, eventOptions.touchmove);
    document.addEventListener('touchend', handleTouchEnd, eventOptions.touchend);
    document.addEventListener('touchcancel', handleTouchCancel, eventOptions.touchcancel);
    
    // Event listeners adicionales para iOS
    if (isIOS) {
      document.addEventListener('gesturestart', (e) => {
        e.preventDefault();
        logDebug('Gesture start prevenido');
      }, { passive: false, capture: true });
      
      document.addEventListener('gesturechange', (e) => {
        e.preventDefault();
        logDebug('Gesture change prevenido');
      }, { passive: false, capture: true });
      
      document.addEventListener('gestureend', (e) => {
        e.preventDefault();
        logDebug('Gesture end prevenido');
      }, { passive: false, capture: true });
    }

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', handleTouchStart, { capture: true });
      document.removeEventListener('touchmove', handleTouchMove, { capture: true });
      document.removeEventListener('touchend', handleTouchEnd, { capture: true });
      document.removeEventListener('touchcancel', handleTouchCancel, { capture: true });
      
      // Limpiar event listeners específicos de iOS
      if (isIOS) {
        document.removeEventListener('gesturestart', null, { capture: true });
        document.removeEventListener('gesturechange', null, { capture: true });
        document.removeEventListener('gestureend', null, { capture: true });
      }
      
      // Restaurar estilos de iOS PWA
      if (isIOS && isPWA) {
        document.body.style.webkitUserSelect = '';
        document.body.style.webkitTouchCallout = '';
        document.documentElement.style.webkitUserSelect = '';
        document.documentElement.style.webkitTouchCallout = '';
      }
      
      logDebug('Limpieza de event listeners completada');
    };
  }, [
    enabled,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    logDebug,
    edgeWidth,
    preventThreshold
  ]);

  return {
    isCapturing: isCapturingRef.current,
    edgeType: edgeTypeRef.current,
    config: {
      enabled,
      edgeWidth,
      preventThreshold
    }
  };
};

export default useEdgeGestureCapture;
