import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

const useSmoothScroll = () => {
  const location = useLocation();
  
  useEffect(() => {
    // No aplicar smooth scroll en rutas de admin para evitar conflictos con PWA
    if (location.pathname.startsWith('/admin')) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothTouch: false, // Desactivar en touch para mejor UX en PWA
      infinite: false,
      gestureOrientation: 'vertical',
      normalizeWheel: true,
      wheelMultiplier: 1,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [location.pathname]);
};

export default useSmoothScroll;
