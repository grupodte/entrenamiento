import { useEffect } from 'react';

/**
 * Hook para prevenir swipe back navigation en móviles
 * Especialmente útil para PWAs y aplicaciones web en móviles
 * Conservador: permite SwipeWidget y solo bloquea navegación obvia del navegador
 */
const usePreventSwipeBack = () => {
  useEffect(() => {
    // Principalmente confiamos en CSS para prevenir swipe back
    // Este hook es solo para logging o casos muy específicos
    
    const handlePopState = (e) => {
      // Log para debugging - puedes eliminarlo en producción
      console.log('Navigation event detected');
      // Aquí podrías agregar lógica adicional si es necesario
    };

    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
};

export default usePreventSwipeBack;
