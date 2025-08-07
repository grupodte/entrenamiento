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
  const lastTouchTime = useRef(0);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const now = Date.now();

    // Prevenir gestos muy rápidos consecutivos
    if (now - lastTouchTime.current < 100) {
      return;
    }
    lastTouchTime.current = now;

    setStartPos({ x: startX, y: startY });
    setCurrentPos({ x: startX, y: startY });
    setIsTracking(true);

    // Detectar si el swipe empieza desde el borde izquierdo (para abrir)
    const isFromLeftEdge = startX <= edgeThreshold && !isWidgetOpen;
    setIsEdgeSwipe(isFromLeftEdge);

    // Detectar si es un swipe para cerrar (desde dentro del widget hacia la derecha)
    const isFromWidget = isWidgetOpen && startX <= 320; // 320px = ancho del widget
    setIsClosingSwipe(isFromWidget);

    // Prevenir el gesto de navegación del navegador
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
      if (isClosingSwipe && deltaX > 0) {
        // Swipe hacia la derecha desde dentro del widget (cerrar)
        console.log('Cerrando widget con swipe hacia la derecha');
        onSwipeToClose?.(deltaX);
      } else if (isEdgeSwipe && deltaX > 0) {
        // Swipe desde el borde izquierdo hacia la derecha (abrir)
        console.log('Abriendo widget con swipe desde el borde');
        onSwipeFromEdge?.(deltaX);
      } else if (!isWidgetOpen && deltaX > 0) {
        // Swipe hacia la derecha (general)
        onSwipeRight?.(deltaX);
      } else if (!isWidgetOpen && deltaX < 0) {
        // Swipe hacia la izquierda (general)
        onSwipeLeft?.(Math.abs(deltaX));
      }
    }

    // Resetear estados
    setIsTracking(false);
    setIsEdgeSwipe(false);
    setIsClosingSwipe(false);
    document.body.style.overscrollBehaviorX = 'auto';
  }, [isTracking, currentPos, startPos, threshold, isEdgeSwipe, isClosingSwipe, isWidgetOpen, onSwipeLeft, onSwipeRight, onSwipeFromEdge, onSwipeToClose]);

  // Manejar eventos de mouse para testing en desktop
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return; // Solo botón izquierdo

    const startX = e.clientX;
    const startY = e.clientY;

    setStartPos({ x: startX, y: startY });
    setCurrentPos({ x: startX, y: startY });
    setIsTracking(true);

    const isFromLeftEdge = startX <= edgeThreshold && !isWidgetOpen;
    setIsEdgeSwipe(isFromLeftEdge);

    const isFromWidget = isWidgetOpen && startX <= 320;
    setIsClosingSwipe(isFromWidget);

    if (preventBrowserBack && (isFromLeftEdge || isFromWidget)) {
      e.preventDefault();
    }
  }, [edgeThreshold, preventBrowserBack, isWidgetOpen]);

  const handleMouseMove = useCallback((e) => {
    if (!isTracking) return;

    setCurrentPos({ x: e.clientX, y: e.clientY });

    if ((isEdgeSwipe || isClosingSwipe) && preventBrowserBack) {
      e.preventDefault();
    }
  }, [isTracking, isEdgeSwipe, isClosingSwipe, preventBrowserBack]);

  const handleMouseUp = useCallback((e) => {
    if (!isTracking) return;

    const deltaX = currentPos.x - startPos.x;
    const deltaY = currentPos.y - startPos.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > absDeltaY && absDeltaX > threshold) {
      if (isClosingSwipe && deltaX > 0) {
        console.log('Cerrando widget con mouse hacia la derecha');
        onSwipeToClose?.(deltaX);
      } else if (isEdgeSwipe && deltaX > 0) {
        console.log('Abriendo widget con mouse desde el borde');
        onSwipeFromEdge?.(deltaX);
      } else if (!isWidgetOpen && deltaX > 0) {
        onSwipeRight?.(deltaX);
      } else if (!isWidgetOpen && deltaX < 0) {
        onSwipeLeft?.(Math.abs(deltaX));
      }
    }

    setIsTracking(false);
    setIsEdgeSwipe(false);
    setIsClosingSwipe(false);
  }, [isTracking, currentPos, startPos, threshold, isEdgeSwipe, isClosingSwipe, isWidgetOpen, onSwipeLeft, onSwipeRight, onSwipeFromEdge, onSwipeToClose]);

  useEffect(() => {
    const container = containerRef.current || document;

    // Touch events
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Mouse events para testing en desktop
    container.addEventListener('mousedown', handleMouseDown, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('mousedown', handleMouseDown);
      document.body.style.overscrollBehaviorX = 'auto';
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown]);

  // Event listeners globales para mouse
  useEffect(() => {
    if (!isTracking) return;

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isTracking, handleMouseMove, handleMouseUp]);

  return {
    containerRef,
    isTracking,
    swipeProgress: isTracking && isEdgeSwipe ? Math.max(0, currentPos.x - startPos.x) : 0,
    closeProgress: isTracking && isClosingSwipe ? Math.max(0, currentPos.x - startPos.x) : 0,
    isEdgeSwipe,
    isClosingSwipe
  };
};
