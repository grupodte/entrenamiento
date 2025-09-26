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
  const rafRef = useRef(null);

  // Función para actualizar progreso con RAF para mejor performance
  const updateProgress = useCallback((progress, type) => {
    if (rafRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (type === 'open') {
        setSwipeProgress(progress);
      } else {
        setCloseProgress(progress);
      }
      onSwipeProgress?.(progress, type);
    });
  }, [onSwipeProgress]);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;

    startPosRef.current = { x: startX, y: startY };
    isSwipingRef.current = false;

    // Reset progreso
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

    // Verificar que sea más horizontal que vertical
    if (Math.abs(deltaX) < Math.abs(deltaY) * 0.7) return;

    if (swipeTypeRef.current === 'open') {
      if (deltaX > 5) {
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
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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

    let shouldTrigger = false;

    if (swipeTypeRef.current === 'open') {
      shouldTrigger = deltaX > swipeThreshold;
    } else if (swipeTypeRef.current === 'close') {
      shouldTrigger = Math.abs(deltaX) > swipeThreshold && deltaX < 0;
    }

    onSwipeEnd?.(shouldTrigger, swipeTypeRef.current);

    // Reset
    setIsEdgeSwipe(false);
    setSwipeProgress(0);
    setCloseProgress(0);
    isSwipingRef.current = false;
    swipeTypeRef.current = null;
  }, [swipeThreshold, onSwipeEnd]);

  const startCloseSwipe = useCallback((startX, startY) => {
    startPosRef.current = { x: startX, y: startY };
    swipeTypeRef.current = 'close';
  }, []);

  // Event listeners más simples
  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isEdgeSwipe,
    swipeProgress,
    closeProgress,
    startCloseSwipe
  };
};

export default useEdgeSwipe;