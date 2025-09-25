import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Usar un pequeño timeout para asegurar que el DOM esté actualizado
    const resetScroll = () => {
      // Hacer scroll al top inmediatamente cuando cambia la ruta
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' // Sin animación para que sea instantáneo
      });

      // También asegurar que el body y html estén en la posición correcta
      if (document.body) {
        document.body.scrollTop = 0;
      }
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      
      // Resetear todos los elementos scrollables comunes
      const scrollableElements = document.querySelectorAll(`
        [data-scrollable], 
        .overflow-y-auto, 
        .overflow-auto, 
        .overflow-scroll,
        main,
        .main-content,
        .content-wrapper,
        [class*="overflow"]
      `);
      
      scrollableElements.forEach(element => {
        if (element.scrollTop !== undefined) {
          element.scrollTop = 0;
        }
        if (element.scrollLeft !== undefined) {
          element.scrollLeft = 0;
        }
      });
      
      // También resetear elementos de framer-motion específicamente
      const motionElements = document.querySelectorAll('[data-framer-motion-drag], .motion-main, main[class*="motion"]');
      motionElements.forEach(element => {
        if (element.scrollTop !== undefined) {
          element.scrollTop = 0;
        }
      });
    };

    // Ejecutar inmediatamente
    resetScroll();
    
    // También ejecutar después de un pequeño delay para asegurar que las animaciones no interfieran
    const timeoutId = setTimeout(resetScroll, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname]); // Se ejecuta cada vez que cambia la ruta
};

export default useScrollToTop;
