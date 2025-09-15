// ✅ useSwipeGesture.js corregido para evitar bloquear botones personalizados
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
  const [startTime, setStartTime] = useState(0);
  const containerRef = useRef(null);
  const lastTouchTime = useRef(0);
  const CLICK_TIME_THRESHOLD = 200; // ms
  const CLICK_DISTANCE_THRESHOLD = 10; // px

  const isElementInteractive = (targetElement, eTarget) => {
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'RANGE'];
    let isInteractive = false;
    let currentElement = targetElement;
    
    while (currentElement && currentElement !== eTarget) {
      const tagName = currentElement.tagName;
      const computedStyle = window.getComputedStyle(currentElement);
      
      if (
        // Elementos interactivos por tag
        interactiveTags.includes(tagName) ||
        // Elementos con role interactivo
        currentElement.hasAttribute('role') ||
        // Elementos con event handlers
        currentElement.onclick ||
        currentElement.onmousedown ||
        currentElement.onmouseup ||
        currentElement.ontouchstart ||
        currentElement.ontouchend ||
        // Elementos marcados como interactivos
        currentElement.dataset?.interactive === 'true' ||
        // Elementos con cursor pointer
        computedStyle.cursor === 'pointer' ||
        // Elementos clickeables por clase CSS
        currentElement.classList.contains('cursor-pointer') ||
        currentElement.classList.contains('hover:scale-105') ||
        currentElement.classList.contains('active:scale-95')
      ) {
        isInteractive = true;
        break;
      }
      currentElement = currentElement.parentElement;
    }
    return isInteractive;
  };

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const now = Date.now();

    if (now - lastTouchTime.current < 100) return;
    lastTouchTime.current = now;

    setStartPos({ x: startX, y: startY });
    setCurrentPos({ x: startX, y: startY });
    setStartTime(now);
    setIsTracking(true);

    const isFromLeftEdge = startX <= edgeThreshold && !isWidgetOpen;
    setIsEdgeSwipe(isFromLeftEdge);
    const isFromWidget = isWidgetOpen && startX <= window.innerWidth * 0.95;
    setIsClosingSwipe(isFromWidget);

    // Solo prevenir si es desde el borde y NO es un elemento interactivo
    const isInteractive = isElementInteractive(e.target, e.currentTarget);
    if (!isInteractive && preventBrowserBack && isFromLeftEdge && !isWidgetOpen) {
      // Solo prevenir en borde izquierdo para apertura
      e.preventDefault();
      document.body.style.overscrollBehaviorX = 'none';
    }
    
    // No prevenir eventos en el widget abierto para permitir clicks
  }, [edgeThreshold, preventBrowserBack, isWidgetOpen]);

  const handleTouchMove = useCallback((e) => {
    if (!isTracking) return;
    const touch = e.touches[0];
    setCurrentPos({ x: touch.clientX, y: touch.clientY });

    // Calcular si realmente se está haciendo un swipe horizontal
    const deltaX = Math.abs(touch.clientX - startPos.x);
    const deltaY = Math.abs(touch.clientY - startPos.y);
    const isHorizontalSwipe = deltaX > deltaY && deltaX > 10;

    // Solo prevenir si es claramente un swipe horizontal y no es un elemento interactivo
    if (isHorizontalSwipe && (isEdgeSwipe || isClosingSwipe) && preventBrowserBack) {
      if (!isElementInteractive(e.target, e.currentTarget)) {
        e.preventDefault();
      }
    }
  }, [isTracking, isEdgeSwipe, isClosingSwipe, preventBrowserBack, startPos]);

  const handleTouchEnd = useCallback((e) => {
    if (!isTracking) return;
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    
    const deltaX = currentPos.x - startPos.x;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(currentPos.y - startPos.y);
    const totalMovement = absDeltaX + absDeltaY;
    
    // Detectar si fue un click genuino o un swipe
    const wasClick = elapsedTime < CLICK_TIME_THRESHOLD && totalMovement < CLICK_DISTANCE_THRESHOLD;
    
    // Si fue un click genuino, no hacer nada para permitir que el evento click se propague
    if (wasClick) {
      console.log('Detectado como click genuino, permitiendo propagación');
    } else if (absDeltaX > absDeltaY && absDeltaX > threshold) {
      // Fue un swipe, procesar normalmente
      if (isClosingSwipe && deltaX < 0) onSwipeToClose?.(Math.abs(deltaX)); // Cambiado: cierre con swipe izquierda
      else if (isEdgeSwipe && deltaX > 0) onSwipeFromEdge?.(deltaX);
      else if (!isWidgetOpen && deltaX > 0) onSwipeRight?.(deltaX);
      else if (!isWidgetOpen && deltaX < 0) onSwipeLeft?.(Math.abs(deltaX));
    }

    setIsTracking(false);
    setIsEdgeSwipe(false);
    setIsClosingSwipe(false);
    document.body.style.overscrollBehaviorX = 'auto';
  }, [isTracking, currentPos, startPos, startTime, threshold, isEdgeSwipe, isClosingSwipe, isWidgetOpen, onSwipeLeft, onSwipeRight, onSwipeFromEdge, onSwipeToClose, CLICK_TIME_THRESHOLD, CLICK_DISTANCE_THRESHOLD]);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
    setIsTracking(true);
    const isFromLeftEdge = e.clientX <= edgeThreshold && !isWidgetOpen;
    setIsEdgeSwipe(isFromLeftEdge);
    const isFromWidget = isWidgetOpen && e.clientX <= window.innerWidth * 0.95;
    setIsClosingSwipe(isFromWidget);
    if (!isElementInteractive(e.target, e.currentTarget) && preventBrowserBack && (isFromLeftEdge || isFromWidget)) {
      e.preventDefault();
    }
  }, [edgeThreshold, preventBrowserBack, isWidgetOpen]);

  const handleMouseMove = useCallback((e) => {
    if (!isTracking) return;
    setCurrentPos({ x: e.clientX, y: e.clientY });
    if ((isEdgeSwipe || isClosingSwipe) && preventBrowserBack) {
      if (!isElementInteractive(e.target, e.currentTarget)) {
        e.preventDefault();
      }
    }
  }, [isTracking, isEdgeSwipe, isClosingSwipe, preventBrowserBack]);

  const handleMouseUp = useCallback((e) => {
    if (!isTracking) return;
    const deltaX = currentPos.x - startPos.x;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(currentPos.y - startPos.y);

    if (absDeltaX > absDeltaY && absDeltaX > threshold) {
      if (isClosingSwipe && deltaX < 0) onSwipeToClose?.(Math.abs(deltaX)); // Cambiado: cierre con swipe izquierda
      else if (isEdgeSwipe && deltaX > 0) onSwipeFromEdge?.(deltaX);
      else if (!isWidgetOpen && deltaX > 0) onSwipeRight?.(deltaX);
      else if (!isWidgetOpen && deltaX < 0) onSwipeLeft?.(Math.abs(deltaX));
    }

    setIsTracking(false);
    setIsEdgeSwipe(false);
    setIsClosingSwipe(false);
  }, [isTracking, currentPos, startPos, threshold, isEdgeSwipe, isClosingSwipe, isWidgetOpen, onSwipeLeft, onSwipeRight, onSwipeFromEdge, onSwipeToClose]);

  useEffect(() => {
    const container = containerRef.current || document;
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    container.addEventListener('mousedown', handleMouseDown, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('mousedown', handleMouseDown);
      document.body.style.overscrollBehaviorX = 'auto';
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown]);

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