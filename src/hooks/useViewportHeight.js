// /hooks/useViewportHeight.js
import { useEffect } from "react";

export const useViewportHeight = () => {
    useEffect(() => {
        // Almacenar la altura inicial del viewport (la real sin considerar barra de direcciones)
        let initialHeight = window.innerHeight;
        let initialScreen = screen.height;
        
        const setVH = () => {
            const currentHeight = window.innerHeight;
            const vh = currentHeight * 0.01;
            
            // Variables básicas
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            
            // Intentar usar dvh si está disponible, sino usar vh calculado
            const supportsDvh = CSS.supports('height', '100dvh');
            if (supportsDvh) {
                document.documentElement.style.setProperty('--full-vh', '100dvh');
            } else {
                document.documentElement.style.setProperty('--full-vh', `${currentHeight}px`);
            }
            
            // Detectar si estamos en un navegador móvil
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
            
            if (isMobile && !isStandalone) {
                // En móvil sin PWA, manejar barra de direcciones dinámica
                const heightDifference = initialHeight - currentHeight;
                
                // Si la altura cambió significativamente, probablemente sea la barra de direcciones
                if (Math.abs(heightDifference) > 50) {
                    // Usar dvh si está disponible, sino currentHeight
                    if (supportsDvh) {
                        document.documentElement.style.setProperty('--real-vh', '100dvh');
                        document.documentElement.style.setProperty('--viewport-height', '100dvh');
                    } else {
                        document.documentElement.style.setProperty('--real-vh', `${currentHeight}px`);
                        document.documentElement.style.setProperty('--viewport-height', `${currentHeight}px`);
                    }
                } else {
                    // Usar la altura más estable
                    const stableHeight = Math.max(currentHeight, initialHeight);
                    if (supportsDvh) {
                        document.documentElement.style.setProperty('--real-vh', '100dvh');
                        document.documentElement.style.setProperty('--viewport-height', '100dvh');
                    } else {
                        document.documentElement.style.setProperty('--real-vh', `${stableHeight}px`);
                        document.documentElement.style.setProperty('--viewport-height', `${stableHeight}px`);
                    }
                }
                
                // Variable específica para elementos fixed al bottom
                const safeBottomHeight = Math.min(currentHeight, initialHeight);
                if (supportsDvh) {
                    document.documentElement.style.setProperty('--safe-viewport-height', '100dvh');
                } else {
                    document.documentElement.style.setProperty('--safe-viewport-height', `${safeBottomHeight}px`);
                }
                
            } else {
                // En PWA o desktop, usar dvh si está disponible
                if (supportsDvh) {
                    document.documentElement.style.setProperty('--real-vh', '100dvh');
                    document.documentElement.style.setProperty('--viewport-height', '100dvh');
                    document.documentElement.style.setProperty('--safe-viewport-height', '100dvh');
                } else {
                    document.documentElement.style.setProperty('--real-vh', `${currentHeight}px`);
                    document.documentElement.style.setProperty('--viewport-height', `${currentHeight}px`);
                    document.documentElement.style.setProperty('--safe-viewport-height', `${currentHeight}px`);
                }
            }
            
            // Debug info (solo en desarrollo)
            if (process.env.NODE_ENV === 'development') {
                console.log('Viewport update:', {
                    currentHeight,
                    initialHeight,
                    isMobile,
                    isStandalone,
                    userAgent: navigator.userAgent.substring(0, 50)
                });
            }
        };

        // Ejecutar inmediatamente
        setVH();
        
        // Actualizar altura inicial después de un breve delay para obtener la correcta
        setTimeout(() => {
            initialHeight = window.innerHeight;
            setVH();
        }, 100);
        
        // Listeners para cambios
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', () => {
            setTimeout(setVH, 100); // Delay para orientationchange
        });
        
        // Para navegadores móviles, también escuchar scroll que puede afectar la barra
        let scrollTimeout;
        const handleScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(setVH, 150);
        };
        
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            window.addEventListener('scroll', handleScroll, { passive: true });
        }

        return () => {
            window.removeEventListener('resize', setVH);
            window.removeEventListener('orientationchange', setVH);
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, []);
};
