import { useState, useRef, useEffect, useCallback } from 'react';

const PULL_THRESHOLD = 80; // Distancia en píxeles para activar el refresh

export const usePullToRefresh = (onRefresh) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const scrollRef = useRef(null);

    // Usamos refs para las variables del gesto para evitar re-renders innecesarios
    // y problemas con closures en los event listeners.
    const gestureRef = useRef({ startY: 0, isDragging: false });

    const handleTouchStart = useCallback((e) => {
        // Solo iniciar si estamos en la cima del scroll
        if (scrollRef.current && scrollRef.current.scrollTop === 0) {
            gestureRef.current.startY = e.touches[0].clientY;
            gestureRef.current.isDragging = true;
        }
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!gestureRef.current.isDragging) return;

        const currentY = e.touches[0].clientY;
        const distance = currentY - gestureRef.current.startY;

        // Solo nos interesa el gesto de arrastrar hacia abajo
        if (distance > 0) {
            e.preventDefault(); // Previene el comportamiento de scroll nativo mientras arrastramos
            // Aplicamos una "resistencia" para que no se sienta lineal
            const dampenedDistance = Math.min(distance * 0.4, PULL_THRESHOLD + 40);
            setPullDistance(dampenedDistance);
        }
    }, []);

    const handleTouchEnd = useCallback(async () => {
        if (!gestureRef.current.isDragging) return;

        gestureRef.current.isDragging = false;

        // Si se superó el umbral, ejecutar la función de refresh
        if (pullDistance > PULL_THRESHOLD) {
            setIsRefreshing(true);
            await onRefresh();
            setIsRefreshing(false);
        }

        // Resetear la distancia de arrastre con una transición suave (manejada por CSS)
        setPullDistance(0);
    }, [pullDistance, onRefresh]);

    useEffect(() => {
        const scrollElement = scrollRef.current;
        if (!scrollElement) return;

        scrollElement.addEventListener('touchstart', handleTouchStart, { passive: true });
        scrollElement.addEventListener('touchmove', handleTouchMove, { passive: false });
        scrollElement.addEventListener('touchend', handleTouchEnd);

        return () => {
            scrollElement.removeEventListener('touchstart', handleTouchStart);
            scrollElement.removeEventListener('touchmove', handleTouchMove);
            scrollElement.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return { isRefreshing, pullDistance, scrollRef };
};