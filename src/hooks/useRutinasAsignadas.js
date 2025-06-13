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
        startScrollTop: 0,
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
        if (!el) return;

        const scrollTop = el.scrollTop;
        const isScrollable = el.scrollHeight > el.clientHeight;

        // Guardar scrollTop de inicio y validar contexto
        gesture.current.startScrollTop = scrollTop;

        if (
            e.target.closest('[data-no-pull]') ||
            !isScrollable ||
            scrollTop > 0
        ) {
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
        if (!el) return;

        const scrollTop = el.scrollTop;

        // Si el usuario ya no está arriba, cancelar
        if (scrollTop > 0 || gesture.current.startScrollTop > 0) {
            cancelGesture();
            return;
        }

        const currentY = e.touches[0].clientY;
        const currentX = e.touches[0].clientX;
        const deltaY = currentY - gesture.current.startY;
        const deltaX = currentX - gesture.current.startX;

        // Cancelar si es gesto lateral o si es hacia arriba
        if (Math.abs(deltaX) > Math.abs(deltaY) || deltaY < 0) {
            cancelGesture();
            return;
        }

        // Solo si el usuario arrastra hacia abajo desde el tope
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
