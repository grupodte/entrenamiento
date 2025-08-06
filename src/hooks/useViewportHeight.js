// /hooks/useViewportHeight.js
import { useEffect } from "react";

export const useViewportHeight = () => {
    useEffect(() => {
        const setViewportHeight = () => {
            let vh = window.innerHeight;

            if (window.visualViewport) {
                vh = window.visualViewport.height;

                // FIX para PWAs fullscreen en iOS - usar altura completa
                const isIOS = /iP(ad|hone|od)/.test(window.navigator.userAgent);
                if (isIOS && window.navigator.standalone) {
                    vh = window.innerHeight; // usar altura completa en PWA
                }
            }

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
