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
  
  // Constantes para detección de clicks genuinos
  const CLICK_TIME_THRESHOLD = 200; // ms
  const CLICK_DISTANCE_THRESHOLD = 18; // px (tolerancia a jitter móvil)

  // Detección mejorada de elementos interactivos (incluye más casos edge)
  const isElementInteractive = useCallback((element) => {
    if (!element) return false;
    
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL'];
    const nonInteractiveTags = ['MAIN', 'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'NAV', 'SPAN', 'P'];
    let current = element;
    
    while (current && current !== document.body) {
      // Prioridad máxima: elementos con data-action
      if (current.hasAttribute('data-action')) {
        return true;
      }
      
      // Tags explícitamente interactivos
      if (interactiveTags.includes(current.tagName)) {
        return true;
      }
      
      // Elementos con roles interactivos específicos
      const role = current.getAttribute('role');
      if (role && ['button', 'link', 'menuitem', 'tab', 'switch', 'checkbox'].includes(role)) {
        return true;
      }
      
      // Elementos con handlers de eventos
      if (current.onclick || current.ontouchstart || current.ontouchend) {
        return true;
      }
      
      // Elementos Framer Motion con whileTap o onTap
      if (current.getAttribute('data-framer-motion') && 
          (current.style.cursor === 'pointer' || current.classList.contains('cursor-pointer'))) {
        return true;
      }
      
      // Solo elementos con cursor pointer Y algún indicador de interactividad
      if ((current.style.cursor === 'pointer' || current.classList.contains('cursor-pointer')) && 
          (current.onclick || current.hasAttribute('data-action') || current.getAttribute('role'))) {
        return true;
      }
      
      // Excluir elementos de layout explícitamente
      if (nonInteractiveTags.includes(current.tagName)) {
        current = current.parentElement;
        continue;
      }
      
      current = current.parentElement;
    }
    
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
    
    // Si no es un gesto válido, salir temprano
    if (!isFromLeftEdge && !isFromRightEdge && !isFromWidget) {
      console.log('Not a valid gesture area, ignoring');
      return;
    }
    
    // Para edge swipes, verificar si está en elemento interactivo
    if ((isFromLeftEdge || isFromRightEdge) && isElementInteractive(e.target)) {
      console.log('Edge swipe blocked by interactive element');
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
    
    // Solo prevenir si es claramente horizontal Y es un gesto válido
    if (absDeltaX > deltaY && absDeltaX > 15) { // Mayor threshold para evitar falsos positivos
      // Para edge swipe izquierdo: movimiento hacia la derecha
      if (isEdgeSwipe && deltaX > 20) {
        console.log('Preventing left edge swipe move, deltaX:', deltaX);
        e.preventDefault();
      }
      // Para edge swipe derecho: movimiento hacia la izquierda 
      else if (isRightEdgeSwipe && deltaX < -20) {
        console.log('Preventing right edge swipe move, deltaX:', deltaX);
        e.preventDefault();
      }
      // Para closing swipe: movimiento hacia la izquierda
      else if (isClosingSwipe && deltaX < -20) {
        console.log('Preventing close swipe move, deltaX:', deltaX);
        e.preventDefault();
      }
    }
  }, [isTracking, isEdgeSwipe, isClosingSwipe, startPos]);

  const handleTouchEnd = useCallback((e) => {
    if (!isTracking) return;
    
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    const deltaX = currentPos.x - startPos.x;
    const deltaY = currentPos.y - startPos.y;
    const totalMovement = Math.abs(deltaX) + Math.abs(deltaY);
    
    // Detectar click genuino vs swipe
    const wasClick = elapsedTime < CLICK_TIME_THRESHOLD && totalMovement < CLICK_DISTANCE_THRESHOLD;
    
    if (wasClick) {
      console.log('Genuine click detected, allowing propagation');
    } else {
      // Procesar swipe
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      if (absDeltaX > absDeltaY && absDeltaX > threshold) {
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
      }
    }
    
    // Reset estado
    setIsTracking(false);
    setIsEdgeSwipe(false);
    setIsRightEdgeSwipe(false);
    setIsClosingSwipe(false);
    document.body.style.overscrollBehaviorX = 'auto';
  }, [isTracking, currentPos, startPos, startTime, threshold, isEdgeSwipe, isClosingSwipe, onSwipeFromEdge, onSwipeToClose]);

  // Listeners simplificados - siempre en document para edge detection
  useEffect(() => {
    console.log('Setting up touch listeners, isWidgetOpen:', isWidgetOpen);
    
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

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
