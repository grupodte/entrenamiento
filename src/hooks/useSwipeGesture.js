import { useState, useEffect, useCallback, useRef } from 'react';

export const useSwipeGesture = ({
  onSwipeFromEdge,
  onSwipeToClose,
  threshold = 50,
  edgeThreshold = 30,
  isWidgetOpen = false
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [isEdgeSwipe, setIsEdgeSwipe] = useState(false);
  const [isRightEdgeSwipe, setIsRightEdgeSwipe] = useState(false);
  const [isClosingSwipe, setIsClosingSwipe] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const containerRef = useRef(null);
  const lastTouchTime = useRef(0);
  
  // Constantes para detección de clicks genuinos - VALORES MEJORADOS
  const CLICK_TIME_THRESHOLD = 250; // ms - aumentado para ser más permisivo
  const CLICK_DISTANCE_THRESHOLD = 25; // px - aumentado para mejor tolerancia a jitter móvil

  // Detección simplificada de elementos interactivos - Solo bloquear elementos claramente interactivos
  const isElementInteractive = useCallback((element) => {
    if (!element) return false;
    
    let current = element;
    console.log('Checking element interactivity:', {
      tagName: element.tagName,
      className: element.className,
      hasDataAction: element.hasAttribute('data-action'),
      onclick: !!element.onclick
    });
    
    while (current && current !== document.body) {
      console.log('Checking current element:', {
        tagName: current.tagName,
        className: current.className,
        hasDataAction: current.hasAttribute('data-action'),
        onclick: !!current.onclick,
        isInteractiveTag: ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(current.tagName)
      });
      
      // Solo bloquear elementos con data-action
      if (current.hasAttribute('data-action')) {
        console.log('Blocked by data-action');
        return true;
      }
      
      // Solo bloquear botones, links e inputs reales
      if (['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(current.tagName)) {
        console.log('Blocked by interactive tag:', current.tagName);
        return true;
      }
      
      // Solo bloquear elementos con onclick explícito
      if (current.onclick) {
        console.log('Blocked by onclick');
        return true;
      }
      
      current = current.parentElement;
    }
    
    console.log('Element allowed - not interactive');
    // Por defecto, permitir el swipe (no bloquear)
    return false;
  }, []);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    const now = Date.now();
    const startX = touch.clientX;
    const startY = touch.clientY;
    
    console.log('TouchStart detected:', {
      x: startX,
      y: startY,
      edgeThreshold,
      isWidgetOpen,
      target: e.target.tagName,
      className: e.target.className
    });
    
    // Throttling básico
    if (now - lastTouchTime.current < 50) {
      console.log('TouchStart throttled');
      return;
    }
    lastTouchTime.current = now;
    
    // Determinar tipo de gesto ANTES de verificar interactividad
    const isFromLeftEdge = startX <= edgeThreshold && !isWidgetOpen;
    const isFromRightEdge = startX >= (window.innerWidth - edgeThreshold) && !isWidgetOpen;
    const isFromWidget = isWidgetOpen && startX < window.innerWidth * 0.8; // Para cerrar desde dentro del widget
    
    console.log('Gesture analysis:', {
      isFromLeftEdge,
      isFromRightEdge,
      isFromWidget,
      startX,
      edgeThreshold,
      windowWidth: window.innerWidth
    });
    
    // Si no es un gesto válido, salir temprano SIN interferir
    if (!isFromLeftEdge && !isFromRightEdge && !isFromWidget) {
      console.log('Not a valid gesture area, ignoring - allowing normal touch events');
      return;
    }
    
    // Verificar si el touch está en un elemento interactivo
    if ((isFromLeftEdge || isFromRightEdge || isFromWidget) && isElementInteractive(e.target)) {
      console.log('Gesture blocked by interactive element - allowing normal touch events:', {
        tagName: e.target.tagName,
        className: e.target.className,
        id: e.target.id,
        hasDataAction: e.target.hasAttribute('data-action'),
        onclick: !!e.target.onclick,
        cursor: getComputedStyle(e.target).cursor
      });
      return;
    }
    
    console.log('Starting gesture tracking');
    setStartPos({ x: startX, y: startY });
    setCurrentPos({ x: startX, y: startY });
    setStartTime(now);
    setIsTracking(true);
    setIsEdgeSwipe(isFromLeftEdge);
    setIsRightEdgeSwipe(isFromRightEdge);
    setIsClosingSwipe(isFromWidget);
    
    // Prevenir scroll horizontal para edge swipes
    if (isFromLeftEdge || isFromRightEdge) {
      document.body.style.overscrollBehaviorX = 'none';
      console.log('Edge swipe initiated, preventing horizontal scroll');
    }
  }, [edgeThreshold, isWidgetOpen, isElementInteractive]);

  const handleTouchMove = useCallback((e) => {
    if (!isTracking) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startPos.x;
    const deltaY = Math.abs(touch.clientY - startPos.y);
    const absDeltaX = Math.abs(deltaX);
    
    // Log detallado del movimiento
    if (absDeltaX > 10) {
      console.log('TouchMove progress:', {
        deltaX,
        absDeltaX,
        deltaY,
        isEdgeSwipe,
        isRightEdgeSwipe,
        isClosingSwipe,
        currentX: touch.clientX
      });
    }
    
    setCurrentPos({ x: touch.clientX, y: touch.clientY });
    
    // Solo prevenir si es claramente horizontal Y es un gesto válido Y supera un threshold mayor
    if (absDeltaX > deltaY && absDeltaX > 35) { // Threshold más alto para ser más conservador
      // Para edge swipe izquierdo: movimiento hacia la derecha
      if (isEdgeSwipe && deltaX > 45) {
        console.log('Preventing left edge swipe move, deltaX:', deltaX);
        e.preventDefault();
      }
      // Para edge swipe derecho: movimiento hacia la izquierda 
      else if (isRightEdgeSwipe && deltaX < -45) {
        console.log('Preventing right edge swipe move, deltaX:', deltaX);
        e.preventDefault();
      }
      // Para closing swipe: movimiento hacia la izquierda
      else if (isClosingSwipe && deltaX < -45) {
        console.log('Preventing close swipe move, deltaX:', deltaX);
        e.preventDefault();
      }
    }
  }, [isTracking, isEdgeSwipe, isClosingSwipe, startPos, isRightEdgeSwipe]);

  const handleTouchEnd = useCallback((e) => {
    if (!isTracking) {
      // Si no estamos tracking, no interferir con eventos normales
      return;
    }
    
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    const deltaX = currentPos.x - startPos.x;
    const deltaY = currentPos.y - startPos.y;
    const totalMovement = Math.abs(deltaX) + Math.abs(deltaY);
    
    // Detectar click genuino vs swipe con thresholds más permisivos
    const wasClick = elapsedTime < CLICK_TIME_THRESHOLD && totalMovement < CLICK_DISTANCE_THRESHOLD;
    
    if (wasClick) {
      console.log('Genuine click detected, allowing propagation - NO preventDefault');
      // Reset estado pero NO prevenir el evento - permitir que el click se propague normalmente
      setIsTracking(false);
      setIsEdgeSwipe(false);
      setIsRightEdgeSwipe(false);
      setIsClosingSwipe(false);
      document.body.style.overscrollBehaviorX = 'auto';
      return;
    }
    
    // Solo procesar como swipe si el movimiento es significativo
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    console.log('TouchEnd swipe analysis:', {
      absDeltaX,
      absDeltaY,
      threshold,
      deltaX,
      isEdgeSwipe,
      passesThreshold: absDeltaX > Math.max(threshold, 25)
    });
    
    // Threshold más alto para swipes para evitar falsos positivos
    if (absDeltaX > absDeltaY && absDeltaX > Math.max(threshold, 40)) {
      if (isEdgeSwipe && deltaX > 0) {
        console.log('Left edge swipe completed - opening SwipeWidget:', deltaX);
        onSwipeFromEdge?.(deltaX);
      } else if (isRightEdgeSwipe && deltaX < 0) {
        console.log('Right edge swipe detected but not executing navigation - preventing back navigation');
        // NO ejecutar onSwipeFromEdge para evitar navegación hacia atrás
        // onSwipeFromEdge?.(Math.abs(deltaX));
      } else if (isClosingSwipe && deltaX < 0) {
        console.log('SwipeWidget close swipe completed:', Math.abs(deltaX));
        onSwipeToClose?.(Math.abs(deltaX));
      }
    } else {
      console.log('Swipe did not meet threshold requirements');
    }
    
    // Reset estado
    setIsTracking(false);
    setIsEdgeSwipe(false);
    setIsRightEdgeSwipe(false);
    setIsClosingSwipe(false);
    document.body.style.overscrollBehaviorX = 'auto';
  }, [isTracking, currentPos, startPos, startTime, threshold, isEdgeSwipe, isRightEdgeSwipe, isClosingSwipe, onSwipeFromEdge, onSwipeToClose]);

  // Listeners simplificados - siempre en document para edge detection
  useEffect(() => {
    console.log('Setting up touch listeners, isWidgetOpen:', isWidgetOpen);
    
    // touchstart y touchend como passive para no interferir con clicks
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false }); // Este necesita preventDefault
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      console.log('Cleaning up touch listeners');
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.overscrollBehaviorX = 'auto';
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    isTracking,
    swipeProgress: isTracking && (isEdgeSwipe || isRightEdgeSwipe) ? 
      (isEdgeSwipe ? Math.max(0, currentPos.x - startPos.x) : Math.max(0, startPos.x - currentPos.x)) : 0,
    closeProgress: isTracking && isClosingSwipe ? Math.max(0, startPos.x - currentPos.x) : 0,
    isEdgeSwipe,
    isRightEdgeSwipe,
    isClosingSwipe
  };
};
