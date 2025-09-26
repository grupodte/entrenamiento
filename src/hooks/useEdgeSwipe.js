import { useState, useRef, useCallback, useEffect } from 'react';

const useEdgeSwipe = ({
  onSwipeStart,
  onSwipeProgress,
  onSwipeEnd,
  isWidgetOpen = false,
  edgeThreshold = 30,
  swipeThreshold = 100,
  maxSwipeDistance = 250
}) => {
  const [isEdgeSwipe, setIsEdgeSwipe] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [closeProgress, setCloseProgress] = useState(0);

  const startPosRef = useRef({ x: 0, y: 0 });
  const isSwipingRef = useRef(false);
  const swipeTypeRef = useRef(null);
  const lastProgressRef = useRef(0); // Para evitar updates innecesarios
  const velocityRef = useRef({ x: 0, timestamp: 0 }); // Para calcular velocidad
  const animationFrameRef = useRef(null);

  // Función throttled para updates de progreso usando RAF
  const updateProgress = useCallback((progress, type) => {
    if (animationFrameRef.current) return; // Ya hay un update pendiente

    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = null;

      // Solo actualizar si hay cambio significativo (>1px)
      if (Math.abs(progress - lastProgressRef.current) > 1) {
        lastProgressRef.current = progress;

        if (type === 'open') {
          setSwipeProgress(progress);
        } else {
          setCloseProgress(progress);
        }
        onSwipeProgress?.(progress, type);
      }
    });
  }, [onSwipeProgress]);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const timestamp = performance.now();

    startPosRef.current = { x: startX, y: startY };
    isSwipingRef.current = false;
    lastProgressRef.current = 0;
    velocityRef.current = { x: 0, timestamp };

    // Cancelar cualquier animación pendiente
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Reset progreso de manera síncrona para mejor responsividad
    setSwipeProgress(0);
    setCloseProgress(0);

    if (isWidgetOpen) {
      swipeTypeRef.current = 'close';
      onSwipeStart?.();
    } else if (startX <= edgeThreshold) {
      setIsEdgeSwipe(true);
      swipeTypeRef.current = 'open';
      onSwipeStart?.();
    } else {
      swipeTypeRef.current = null;
    }
  }, [edgeThreshold, isWidgetOpen, onSwipeStart]);

  const handleTouchMove = useCallback((e) => {
    if (!swipeTypeRef.current) return;
    if (swipeTypeRef.current === 'open' && !isEdgeSwipe) return;

    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    const deltaX = currentX - startPosRef.current.x;
    const deltaY = currentY - startPosRef.current.y;
    const timestamp = performance.now();

    // Calcular velocidad para gestos más naturales
    const timeDelta = timestamp - velocityRef.current.timestamp;
    if (timeDelta > 0) {
      velocityRef.current = {
        x: deltaX / timeDelta,
        timestamp
      };
    }

    // Umbral más estricto para direccionalidad al inicio
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance < 10) return; // Esperar un poco más de movimiento

    // Verificar direccionalidad solo una vez al inicio del gesto
    if (!isSwipingRef.current) {
      // Ratio más estricto para evitar activación accidental
      if (Math.abs(deltaX) < Math.abs(deltaY) * 0.75) return;
    }

    if (swipeTypeRef.current === 'open') {
      if (deltaX > 5) { // Umbral más pequeño una vez iniciado
        isSwipingRef.current = true;
        const progress = Math.min(Math.max(deltaX, 0) / maxSwipeDistance, 1);
        updateProgress(progress * maxSwipeDistance, 'open');
        e.preventDefault();
      }
    } else if (swipeTypeRef.current === 'close') {
      if (deltaX < -5) {
        isSwipingRef.current = true;
        const progress = Math.min(Math.abs(deltaX) / maxSwipeDistance, 1);
        updateProgress(progress * maxSwipeDistance, 'close');
        e.preventDefault();
      }
    }
  }, [isEdgeSwipe, maxSwipeDistance, updateProgress]);

  const handleTouchEnd = useCallback((e) => {
    // Cancelar cualquier animación pendiente
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (!isSwipingRef.current) {
      setIsEdgeSwipe(false);
      setSwipeProgress(0);
      setCloseProgress(0);
      swipeTypeRef.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startPosRef.current.x;
    const velocity = Math.abs(velocityRef.current.x);

    let shouldTrigger = false;

    if (swipeTypeRef.current === 'open') {
      // Considerar tanto distancia como velocidad
      const distanceThreshold = deltaX > swipeThreshold;
      const velocityThreshold = velocity > 0.3 && deltaX > swipeThreshold * 0.6;
      shouldTrigger = distanceThreshold || velocityThreshold;
    } else if (swipeTypeRef.current === 'close') {
      const distanceThreshold = Math.abs(deltaX) > swipeThreshold && deltaX < 0;
      const velocityThreshold = velocity > 0.3 && Math.abs(deltaX) > swipeThreshold * 0.6 && deltaX < 0;
      shouldTrigger = distanceThreshold || velocityThreshold;
    }

    onSwipeEnd?.(shouldTrigger, swipeTypeRef.current);

    // Reset state
    setIsEdgeSwipe(false);
    setSwipeProgress(0);
    setCloseProgress(0);
    isSwipingRef.current = false;
    swipeTypeRef.current = null;
    lastProgressRef.current = 0;
  }, [swipeThreshold, onSwipeEnd]);

  const startCloseSwipe = useCallback((startX, startY) => {
    startPosRef.current = { x: startX, y: startY };
    swipeTypeRef.current = 'close';
    velocityRef.current = { x: 0, timestamp: performance.now() };
  }, []);

  // Event listeners con mejor manejo de passive
  useEffect(() => {
    const handleTouchStartPassive = (e) => {
      // Solo preventDefault si es necesario
      const touch = e.touches[0];
      const startX = touch.clientX;

      if ((isWidgetOpen) || (startX <= edgeThreshold)) {
        handleTouchStart(e);
      }
    };

    const handleTouchMovePassive = (e) => {
      if (swipeTypeRef.current && isSwipingRef.current) {
        handleTouchMove(e);
      }
    };

    // Usar passive: true para start, false para move/end cuando sea necesario
    document.addEventListener('touchstart', handleTouchStartPassive, { passive: true });
    document.addEventListener('touchmove', handleTouchMovePassive, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      document.removeEventListener('touchstart', handleTouchStartPassive);
      document.removeEventListener('touchmove', handleTouchMovePassive);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, edgeThreshold, isWidgetOpen]);

  return {
    isEdgeSwipe,
    swipeProgress,
    closeProgress,
    startCloseSwipe
  };
};

export default useEdgeSwipe;