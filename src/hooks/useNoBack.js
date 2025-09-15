import { useEffect } from 'react';

/**
 * Hook simple para "anclar" el historial y prevenir navegación hacia atrás
 * Versión minimalista basada en el patrón estándar
 * 
 * @param {boolean} enabled - Si está activo o no
 * @param {function} onBackAttempt - Callback cuando se intenta volver (opcional)
 */
const useNoBack = (enabled = true, onBackAttempt = null) => {
  useEffect(() => {
    if (!enabled) return;

    // Crear punto "ancla" en el historial
    const push = () => window.history.pushState(null, "", window.location.href);
    push();

    const onPop = (event) => {
      // El usuario intentó volver: re-inyectamos el estado
      push();
      
      // Callback personalizado si se proporciona
      if (onBackAttempt) {
        onBackAttempt(event);
      }
      
      // Log para debug
      console.log('[useNoBack] Navigation attempt blocked');
    };

    window.addEventListener("popstate", onPop);
    
    return () => {
      window.removeEventListener("popstate", onPop);
    };
  }, [enabled, onBackAttempt]);
};

export default useNoBack;
