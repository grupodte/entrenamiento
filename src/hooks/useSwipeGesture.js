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
  const [isClosingSwipe, setIsClosingSwipe] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const containerRef = useRef(null);
  const lastTouchTime = useRef(0);
  
  // Constantes para detección de clicks genuinos
  const CLICK_TIME_THRESHOLD = 200; // ms
  const CLICK_DISTANCE_THRESHOLD = 18; // px (tolerancia a jitter móvil)

  // Detección robusta de elementos interactivos (solo para elementos realmente clickeables)
  const isElementInteractive = useCallback((element) => {
    if (!element) return false;
    
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'];
    const nonInteractiveTags = ['MAIN', 'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'NAV'];
    let current = element;
    
    while (current && current !== document.body) {
      // Prioridad máxima: elementos con data-action
      if (current.hasAttribute('data-action')) {
        console.log('Interactive: data-action element found:', current.tagName);
        return true;
      }
      
      // Excluir explícitamente elementos de layout que no deberían bloquear edge swipe
      if (nonInteractiveTags.includes(current.tagName)) {
        current = current.parentElement;
        continue;
      }
      
      // Tags explícitamente interactivos
      if (interactiveTags.includes(current.tagName)) {
        console.log('Interactive: interactive tag found:', current.tagName);
        return true;
      }
      
      // Elementos con roles interactivos específicos
      const role = current.getAttribute('role');
      if (role && ['button', 'link', 'menuitem', 'tab'].includes(role)) {
        console.log('Interactive: interactive role found:', role);
        return true;
      }
      
      // Elementos con handlers de click explícitos
      if (current.onclick) {
        console.log('Interactive: onclick handler found on:', current.tagName);
        return true;
      }
      
      // Solo elementos con cursor pointer que también tienen algún indicador de interactividad
      if (current.classList.contains('cursor-pointer') && 
          (current.onclick || current.hasAttribute('data-action') || current.getAttribute('role'))) {
        console.log('Interactive: cursor-pointer with interaction found:', current.tagName);
        return true;
      }
      
      current = current.parentElement;
    }
    
    console.log('Not interactive: element and parents are non-interactive:', element.tagName);
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
    const isFromWidget = isWidgetOpen && startX > window.innerWidth * 0.1;
    
    console.log('Gesture analysis:', {
      isFromLeftEdge,
      isFromWidget,
      startX,
      edgeThreshold,
      windowWidth: window.innerWidth
    });
    
    // Si no es un gesto válido, salir temprano
    if (!isFromLeftEdge && !isFromWidget) {
      console.log('Not a valid gesture area, ignoring');
      return;
    }
    
    // Solo para edge swipes, verificar si está en elemento interactivo
    if (isFromLeftEdge && isElementInteractive(e.target)) {
      console.log('Edge swipe blocked by interactive element');
      return;
    }
    
    console.log('Starting gesture tracking');
    setStartPos({ x: startX, y: startY });
    setCurrentPos({ x: startX, y: startY });
    setStartTime(now);
    setIsTracking(true);
    setIsEdgeSwipe(isFromLeftEdge);
    setIsClosingSwipe(isFromWidget);
    
    // Prevenir scroll horizontal solo para edge swipe
    if (isFromLeftEdge) {
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
        isClosingSwipe,
        currentX: touch.clientX
      });
    }
    
    setCurrentPos({ x: touch.clientX, y: touch.clientY });
    
    // Solo prevenir si es claramente horizontal
    if (absDeltaX > deltaY && absDeltaX > 5) {
      // Para edge swipe: movimiento hacia la derecha
      if (isEdgeSwipe && deltaX > 0) {
        console.log('Preventing edge swipe move, deltaX:', deltaX);
        e.preventDefault();
      }
      // Para closing swipe: movimiento hacia la izquierda
      else if (isClosingSwipe && deltaX < 0) {
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
          console.log('Edge swipe completed:', deltaX);
          onSwipeFromEdge?.(deltaX);
        } else if (isClosingSwipe && deltaX < 0) {
          console.log('Close swipe completed:', Math.abs(deltaX));
          onSwipeToClose?.(Math.abs(deltaX));
        }
      }
    }
    
    // Reset estado
    setIsTracking(false);
    setIsEdgeSwipe(false);
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
    swipeProgress: isTracking && isEdgeSwipe ? Math.max(0, currentPos.x - startPos.x) : 0,
    closeProgress: isTracking && isClosingSwipe ? Math.max(0, startPos.x - currentPos.x) : 0,
    isEdgeSwipe,
    isClosingSwipe
  };
};
