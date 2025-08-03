import { useEffect } from 'react';
import Lenis from 'lenis';

const useSmoothScroll = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2, // Velocidad de la animación de scroll
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Curva de aceleración
      smoothTouch: true, // Scroll suave en dispositivos táctiles
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy(); // Limpia la instancia al desmontar el componente
    };
  }, []);
};

export default useSmoothScroll;
