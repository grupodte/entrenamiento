import { useState, useEffect, useCallback, useRef } from 'react';

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeFromEdge,
  onSwipeToClose,
  threshold = 50,
  edgeThreshold = 30,
  preventBrowserBack = true,
  isWidgetOpen = false
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [isEdgeSwipe, setIsEdgeSwipe] = useState(false);
  const [isClosingSwipe, setIsClosingSwipe] = useState(false);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;

    setStartPos({ x: startX, y: startY });
    setCurrentPos({ x: startX, y: startY });
    setIsTracking(true);

    // Detectar si el swipe empieza desde el borde izquierdo
    const isFromLeftEdge = startX <= edgeThreshold;
    setIsEdgeSwipe(isFromLeftEdge);

    // Detectar si es un swipe para cerrar (desde dentro del widget hacia la izquierda)
    const isFromWidget = isWidgetOpen && startX <= 320; // 320px = ancho del widget
    setIsClosingSwipe(isFromWidget);

    // Prevenir el gesto de navegación del navegador si empieza desde el borde
    if (preventBrowserBack && (isFromLeftEdge || isFromWidget)) {
      e.preventDefault();
      document.body.style.overscrollBehaviorX = 'none';
    }
  }, [edgeThreshold, preventBrowserBack, isWidgetOpen]);

  const handleTouchMove = useCallback((e) => {
    if (!isTracking) return;

    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;

    setCurrentPos({ x: currentX, y: currentY });

    // Si es un swipe desde el borde o para cerrar, prevenir el comportamiento por defecto
    if ((isEdgeSwipe || isClosingSwipe) && preventBrowserBack) {
      e.preventDefault();
    }
  }, [isTracking, isEdgeSwipe, isClosingSwipe, preventBrowserBack]);

  const handleTouchEnd = useCallback((e) => {
    if (!isTracking) return;

    const deltaX = currentPos.x - startPos.x;
    const deltaY = currentPos.y - startPos.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Solo procesar si el movimiento horizontal es mayor que el vertical
    if (absDeltaX > absDeltaY && absDeltaX > threshold) {
      if (isClosingSwipe && deltaX < 0) {
        // Swipe hacia la izquierda desde dentro del widget (cerrar)
        onSwipeToClose?.(Math.abs(deltaX));
      } else if (isEdgeSwipe && deltaX > 0) {
        // Swipe desde el borde izquierdo hacia la derecha (abrir)
        onSwipeFromEdge?.(deltaX);
      } else if (deltaX > 0) {
        // Swipe hacia la derecha
        onSwipeRight?.(deltaX);
      } else {
        // Swipe hacia la izquierda
        onSwipeLeft?.(Math.abs(deltaX));
      }
    }

    // Resetear estados
    setIsTracking(false);
    setIsEdgeSwipe(false);
    setIsClosingSwipe(false);
    document.body.style.overscrollBehaviorX = 'auto';
  }, [isTracking, currentPos, startPos, threshold, isEdgeSwipe, isClosingSwipe, onSwipeLeft, onSwipeRight, onSwipeFromEdge, onSwipeToClose]);

  useEffect(() => {
    const container = containerRef.current || document;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      document.body.style.overscrollBehaviorX = 'auto';
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    isTracking,
    swipeProgress: isTracking ? Math.max(0, currentPos.x - startPos.x) : 0,
    closeProgress: isTracking && isClosingSwipe ? Math.max(0, Math.abs(currentPos.x - startPos.x)) : 0,
    isEdgeSwipe,
    isClosingSwipe
  };
};
