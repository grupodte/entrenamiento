import { useEffect } from "react";

export const useViewportHeight = () => {
    useEffect(() => {
        let timeout;
        const setViewportHeight = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const vh = window.visualViewport
                    ? window.visualViewport.height * 0.01
                    : window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            }, 50);
        };

        setViewportHeight();
        window.visualViewport?.addEventListener('resize', setViewportHeight);
        window.addEventListener('resize', setViewportHeight);

        return () => {
            clearTimeout(timeout);
            window.visualViewport?.removeEventListener('resize', setViewportHeight);
            window.removeEventListener('resize', setViewportHeight);
        };
    }, []);
};
