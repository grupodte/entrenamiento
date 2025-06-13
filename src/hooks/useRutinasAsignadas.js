import { useState, useRef, useEffect, useCallback } from 'react';

const PULL_THRESHOLD = 80;

export const usePullToRefresh = (onRefresh) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const scrollRef = useRef(null);
    const isMounted = useRef(true);

    const gesture = useRef({
        startY: 0,
        startX: 0,
        active: false,
        canPull: false,
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
        const scrollTop = el?.scrollTop ?? window.scrollY ?? 0;

        // Ignorar si el gesto comienza en un componente que no permite pull
        if (e.target.closest('[data-no-pull]')) {
            cancelGesture();
            return;
        }

        if (scrollTop > 0) {
            cancelGesture();
            return;
        }

        gesture.current.canPull = true;
        gesture.current.active = true;
        gesture.current.startY = e.touches[0].clientY;
        gesture.current.startX = e.touches[0].clientX;
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!gesture.current.active || !gesture.current.canPull) return;

        const el = scrollRef.current;
        const scrollTop = el?.scrollTop ?? window.scrollY ?? 0;

        // Cancelar si el usuario desplazó durante el gesto
        if (scrollTop > 0) {
            cancelGesture();
            return;
        }

        const currentY = e.touches[0].clientY;
        const currentX = e.touches[0].clientX;
        const deltaY = currentY - gesture.current.startY;
        const deltaX = currentX - gesture.current.startX;

        // Cancelar si el movimiento es lateral (mayor deltaX)
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            cancelGesture();
            return;
        }

        if (deltaY > 0) {
            e.preventDefault(); // prevenir scroll nativo
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

    // Bloquear scroll del body durante la actualización
    useEffect(() => {
        document.body.style.overflow = isRefreshing ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isRefreshing]);

    return {
        scrollRef,
        isRefreshing,
        pullDistance,
    };
};
