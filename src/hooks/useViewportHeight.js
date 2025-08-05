// src/hooks/useViewportHeight.js
import { useEffect } from "react";

export const useViewportHeight = () => {
    useEffect(() => {
        const setViewportHeight = () => {
            const vh = window.visualViewport
                ? window.visualViewport.height * 0.01
                : window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setViewportHeight();
        window.visualViewport?.addEventListener('resize', setViewportHeight);
        window.addEventListener('resize', setViewportHeight);

        return () => {
            window.visualViewport?.removeEventListener('resize', setViewportHeight);
            window.removeEventListener('resize', setViewportHeight);
        };
    }, []);
};
