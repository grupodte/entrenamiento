import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook para capturar y prevenir gestos de arrastre desde los bordes de la pantalla
 * Evita que el navegador reciba estos gestos y active la navegación hacia atrás/adelante
 */
const useEdgeGestureCapture = (options = {}) => {
  const {
    enabled = true,
    edgeWidth = 20, // Ancho de la zona sensible en píxeles
    preventThreshold = 30, // Distancia mínima para considerar gesto
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
        
        logDebug('Gesto de navegación prevenido', {
          edge: edgeTypeRef.current,
          deltaX,
          deltaY,
          prevented: true
        });
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

    // Detectar si es un dispositivo táctil
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (!isTouchDevice) {
      logDebug('Dispositivo no táctil detectado, deshabilitando captura');
      return;
    }

    logDebug('Inicializando captura de gestos de borde', {
      edgeWidth,
      preventThreshold,
      screenWidth: window.innerWidth
    });

    // Agregar event listeners con configuración específica
    document.addEventListener('touchstart', handleTouchStart, { 
      passive: true,
      capture: true 
    });
    
    document.addEventListener('touchmove', handleTouchMove, { 
      passive: false, // Necesario para preventDefault
      capture: true 
    });
    
    document.addEventListener('touchend', handleTouchEnd, { 
      passive: true,
      capture: true 
    });
    
    document.addEventListener('touchcancel', handleTouchCancel, { 
      passive: true,
      capture: true 
    });

    // Cleanup
    return () => {
      document.removeEventListener('touchstart', handleTouchStart, { capture: true });
      document.removeEventListener('touchmove', handleTouchMove, { capture: true });
      document.removeEventListener('touchend', handleTouchEnd, { capture: true });
      document.removeEventListener('touchcancel', handleTouchCancel, { capture: true });
      
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
