import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para manejar gestos verticales de swipe
 * - Swipe hacia abajo desde el top: Abre SwipeWidget
 * - Swipe hacia arriba dentro del widget: Cierra SwipeWidget
 */
export const useVerticalSwipe = ({
  onSwipeDown, // Callback para swipe hacia abajo (abrir)
  onSwipeUp,   // Callback para swipe hacia arriba (cerrar)
  isWidgetOpen = false,
  topEdgeThreshold = 50, // Pixels desde el top para detectar swipe de apertura
  threshold = 80 // Distancia mínima para activar swipe
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [startTime, setStartTime] = useState(0);
  
  const lastTouchTime = useRef(0);

  // Constantes para detección de clicks vs swipes
  const CLICK_TIME_THRESHOLD = 200;
  const CLICK_DISTANCE_THRESHOLD = 15;

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    const now = Date.now();
    const startX = touch.clientX;
    const startY = touch.clientY;
    
    // Throttling básico
    if (now - lastTouchTime.current < 50) {
      return;
    }
    lastTouchTime.current = now;

    // Determinar si es un gesto válido
    const isFromTopEdge = startY <= topEdgeThreshold && !isWidgetOpen;
    const isInsideWidget = isWidgetOpen; // Cualquier parte del widget puede iniciar cierre

    console.log('VerticalSwipe TouchStart:', {
      startY,
      topEdgeThreshold,
      isWidgetOpen,
      isFromTopEdge,
      isInsideWidget
    });

    // Solo trackear si es un gesto válido
    if (!isFromTopEdge && !isInsideWidget) {
      return;
    }

    setStartPos({ x: startX, y: startY });
    setCurrentPos({ x: startX, y: startY });
    setStartTime(now);
    setIsTracking(true);

    console.log('VerticalSwipe: Starting tracking');
  }, [topEdgeThreshold, isWidgetOpen]);

  const handleTouchMove = useCallback((e) => {
    if (!isTracking) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - startPos.y;
    const deltaX = Math.abs(touch.clientX - startPos.x);
    const absDeltaY = Math.abs(deltaY);

    setCurrentPos({ x: touch.clientX, y: touch.clientY });

    // Solo prevenir si es claramente vertical
    if (absDeltaY > deltaX && absDeltaY > 20) {
      // Para swipe de apertura: desde top hacia abajo
      if (!isWidgetOpen && deltaY > 30) {
        console.log('VerticalSwipe: Preventing open swipe, deltaY:', deltaY);
        e.preventDefault();
      }
      // Para swipe de cierre: hacia arriba dentro del widget
      else if (isWidgetOpen && deltaY < -30) {
        console.log('VerticalSwipe: Preventing close swipe, deltaY:', deltaY);
        e.preventDefault();
      }
    }
  }, [isTracking, startPos, isWidgetOpen]);

  const handleTouchEnd = useCallback((e) => {
    if (!isTracking) return;

    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    const deltaY = currentPos.y - startPos.y;
    const deltaX = currentPos.x - startPos.x;
    const totalMovement = Math.abs(deltaX) + Math.abs(deltaY);

    // Detectar si fue un click o un swipe
    const wasClick = elapsedTime < CLICK_TIME_THRESHOLD && totalMovement < CLICK_DISTANCE_THRESHOLD;

    console.log('VerticalSwipe TouchEnd:', {
      deltaY,
      elapsedTime,
      totalMovement,
      wasClick,
      isWidgetOpen
    });

    if (!wasClick) {
      const absDeltaY = Math.abs(deltaY);
      const absDeltaX = Math.abs(deltaX);

      // Solo procesar si es principalmente vertical
      if (absDeltaY > absDeltaX && absDeltaY > threshold) {
        // Swipe hacia abajo para abrir (desde top edge)
        if (!isWidgetOpen && deltaY > 0 && startPos.y <= topEdgeThreshold) {
          console.log('VerticalSwipe: Opening widget, deltaY:', deltaY);
          onSwipeDown?.(deltaY);
        }
        // Swipe hacia arriba para cerrar (dentro del widget)
        else if (isWidgetOpen && deltaY < 0) {
          console.log('VerticalSwipe: Closing widget, deltaY:', Math.abs(deltaY));
          onSwipeUp?.(Math.abs(deltaY));
        }
      }
    }

    // Reset estado
    setIsTracking(false);
    setStartPos({ x: 0, y: 0 });
    setCurrentPos({ x: 0, y: 0 });
  }, [isTracking, currentPos, startPos, startTime, threshold, isWidgetOpen, topEdgeThreshold, onSwipeDown, onSwipeUp]);

  // Event listeners globales
  useEffect(() => {
    const options = { passive: false };
    
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, options);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isTracking,
    swipeProgress: isTracking && !isWidgetOpen ? Math.max(0, currentPos.y - startPos.y) : 0,
    closeProgress: isTracking && isWidgetOpen ? Math.max(0, startPos.y - currentPos.y) : 0
  };
};

export default useVerticalSwipe;
