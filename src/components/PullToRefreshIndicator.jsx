import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const PULL_THRESHOLD = 80;

const PullToRefreshIndicator = ({ isRefreshing, pullDistance }) => {
    const clamped = Math.min(pullDistance, PULL_THRESHOLD + 40);
    const opacity = Math.min(clamped / (PULL_THRESHOLD / 2), 1);
    const showSpinner = clamped > 20;

    const spinnerRef = useRef();
    const containerRef = useRef();

    // Animación de entrada
    useEffect(() => {
        if (clamped > 0 && containerRef.current) {
            gsap.to(containerRef.current, {
                scale: 1,
                opacity,
                duration: 0.3,
                ease: 'power2.out',
            });
        }
    }, [clamped, opacity]);

    // Animación de rotación custom
    useEffect(() => {
        if (isRefreshing && spinnerRef.current) {
            const tl = gsap.timeline({ repeat: -1 });
            tl.to(spinnerRef.current, {
                rotation: '+=360',
                duration: 1.2,
                ease: 'power2.inOut',
            });

            return () => tl.kill(); // Limpieza
        }
    }, [isRefreshing]);

    return (
        <div
            ref={containerRef}
            className="w-full flex justify-center items-end overflow-hidden"
            style={{
                height: `${clamped}px`,
                transform: 'scale(0.95)',
                opacity,
            }}
        >
            {isRefreshing ? (
                <div
                    ref={spinnerRef}
                    className="mb-2 w-6 h-6 border-[3px] border-l-transparent border-white rounded-full shadow-md"
                />
            ) : (
                showSpinner && (
                    <div className="mb-2 w-5 h-5 border-[3px] border-white/40 border-b-transparent rounded-full" />
                )
            )}
        </div>
    );
};

export default PullToRefreshIndicator;
