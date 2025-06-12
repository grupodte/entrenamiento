import { useState, useRef, useEffect, useCallback } from 'react';

const PULL_THRESHOLD = 80; // px

export const usePullToRefresh = (onRefresh) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const scrollRef = useRef(null);

    const gestureRef = useRef({
        startY: 0,
        isDragging: false,
        readyToPull: false,
    });

    const resetPull = () => {
        let start = pullDistance;
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

    const handleTouchStart = useCallback((e) => {
        const scrollTop = scrollRef.current?.scrollTop || 0;
        gestureRef.current.readyToPull = scrollTop <= 0;

        if (gestureRef.current.readyToPull) {
            gestureRef.current.startY = e.touches[0].clientY;
            gestureRef.current.isDragging = true;
        }
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!gestureRef.current.isDragging || !gestureRef.current.readyToPull) return;

        const currentY = e.touches[0].clientY;
        const distance = currentY - gestureRef.current.startY;

        if (distance > 0) {
            e.preventDefault();
            const dampened = Math.min(distance * 0.4, PULL_THRESHOLD + 40);
            setPullDistance(dampened);
        }
    }, []);

    const handleTouchEnd = useCallback(async () => {
        if (!gestureRef.current.isDragging) return;

        gestureRef.current.isDragging = false;

        if (pullDistance > PULL_THRESHOLD) {
            setIsRefreshing(true);
            await onRefresh();
            setIsRefreshing(false);
        }

        resetPull();
    }, [pullDistance, onRefresh]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        el.addEventListener('touchstart', handleTouchStart, { passive: true });
        el.addEventListener('touchmove', handleTouchMove, { passive: false });
        el.addEventListener('touchend', handleTouchEnd);

        return () => {
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchmove', handleTouchMove);
            el.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return { isRefreshing, pullDistance, scrollRef };
};
