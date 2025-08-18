// /hooks/useViewportHeight.js
import { useEffect } from "react";

export const useViewportHeight = () => {
    useEffect(() => {
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            // También definir la altura completa
            document.documentElement.style.setProperty('--full-vh', `${window.innerHeight}px`);
        };

        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);

        return () => {
            window.removeEventListener('resize', setVH);
            window.removeEventListener('orientationchange', setVH);
        };
    }, []);
};
