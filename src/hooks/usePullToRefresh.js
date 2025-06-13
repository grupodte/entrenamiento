import { useState, useRef, useEffect, useCallback } from 'react';

const PULL_THRESHOLD = 80;

export const usePullToRefresh = (onRefresh) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const scrollRef = useRef(null);
    const isMounted = useRef(true);

    // Gesto unificado
    const gesture = useRef({
        startY: 0,
        active: false,   // Si hay un gesto en curso
        canPull: false,  // Si se puede hacer pull (solo cuando scrollTop está arriba)
    });

    const resetPull = () => {
        const start = pullDistance;
        const duration = 200;
        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            setPullDistance(start * (1 - progress));
            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    };

    const cancelGesture = () => {
        gesture.current.active = false;
        gesture.current.canPull = false;
        setPullDistance(0);
    };

    const handleTouchStart = useCallback((e) => {
        const el = scrollRef.current;
        const scrollTop = el?.scrollTop ?? 0;

        // Si no estás bien arriba, cancelá pull completamente
        if (scrollTop > 0) {
            gesture.current.active = false;
            gesture.current.canPull = false;
            return;
        }

        gesture.current.canPull = true;
        gesture.current.active = true;
        gesture.current.startY = e.touches[0].clientY;
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!gesture.current.active || !gesture.current.canPull) return;

        const el = scrollRef.current;
        const scrollTop = el?.scrollTop ?? 0;

        // Si el usuario scrolleó mientras arrastraba, cancelá el gesto
        if (scrollTop > 0) {
            gesture.current.canPull = false;
            gesture.current.active = false;
            return;
        }

        const currentY = e.touches[0].clientY;
        const deltaY = currentY - gesture.current.startY;

        if (deltaY > 0) {
            e.preventDefault();
            const dampened = Math.min(deltaY * 0.4, PULL_THRESHOLD + 40);
            setPullDistance(dampened);
        }
    }, []);
    

    const handleTouchEnd = useCallback(async () => {
        if (!gesture.current.active || !gesture.current.canPull) return;

        gesture.current.active = false;

        if (pullDistance > PULL_THRESHOLD) {
            setIsRefreshing(true);
            try {
                await onRefresh?.();
            } finally {
                if (isMounted.current) setIsRefreshing(false);
            }
        }

        resetPull();
    }, [pullDistance, onRefresh]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        // Attach listeners
        el.addEventListener('touchstart', handleTouchStart, { passive: true });
        el.addEventListener('touchmove', handleTouchMove, { passive: false });
        el.addEventListener('touchend', handleTouchEnd);

        return () => {
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchmove', handleTouchMove);
            el.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    return {
        scrollRef,
        isRefreshing,
        pullDistance,
    };
};
