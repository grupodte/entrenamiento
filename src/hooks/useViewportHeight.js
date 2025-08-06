// /hooks/useViewportHeight.js
import { useEffect } from "react";

export const useViewportHeight = () => {
    useEffect(() => {
        let timeout;
        let lastVH = 0;

        const setViewportHeight = () => {
            let vh;

            // Navegadores modernos: usar 100dvh (si está soportado)
            const supportsDVH = CSS.supports("height: 100dvh");
            if (supportsDVH) {
                vh = window.innerHeight; // fallback, pero 100dvh ya asegura el alto real
            } else if (window.visualViewport) {
                // Compatibilidad iOS / Safari
                vh = window.visualViewport.height;

                // FIX para PWAs fullscreen en iOS
                const isIOS = /iP(ad|hone|od)/.test(window.navigator.userAgent);
                if (isIOS && window.navigator.standalone) {
                    vh = window.innerHeight;
                }
            } else {
                vh = window.innerHeight;
            }

            // Evitar repintar si el cambio es mínimo (<10px)
            if (Math.abs(vh - lastVH) > 10) {
                lastVH = vh;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            }
        };

        // Primer cálculo rápido y estable
        setViewportHeight();

        // Debounce para eventos resize
        const handleResize = () => {
            clearTimeout(timeout);
            timeout = setTimeout(setViewportHeight, 150);
        };

        window.visualViewport?.addEventListener('resize', handleResize);
        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(timeout);
            window.visualViewport?.removeEventListener('resize', handleResize);
            window.removeEventListener('resize', handleResize);
        };
    }, []);
};
