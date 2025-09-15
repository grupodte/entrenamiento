import { useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Hook para bloquear navegación usando la estrategia de "anclaje" del historial
 * Intercepta cualquier intento de navegación (botón atrás, gestos, etc.)
 * 
 * @param {boolean} when - Cuándo activar el bloqueo
 * @param {function} blocker - Función que maneja el intento de navegación
 */
function useBlocker(when, blocker) {
  const location = useLocation();
  const navigate = useNavigate();
  const blockerRef = useRef(blocker);
  const pendingLocationRef = useRef(null);

  // Actualizar la referencia del blocker
  useEffect(() => {
    blockerRef.current = blocker;
  }, [blocker]);

  useEffect(() => {
    if (!when) return;

    // Crear punto "ancla" en el historial
    const push = () => window.history.pushState(null, "", window.location.href);
    push();

    const handlePopState = (event) => {
      // Re-inyectar el estado para "anclar" la posición
      push();
      
      // Simular la transición que React Router esperaba
      const mockTransition = {
        location: pendingLocationRef.current || { pathname: '/dashboard' },
        action: 'POP',
        proceed: () => {
          // Permitir navegación desactivando temporalmente el bloqueo
          window.removeEventListener('popstate', handlePopState);
          if (pendingLocationRef.current) {
            navigate(pendingLocationRef.current.pathname, { replace: true });
          } else {
            window.history.back();
          }
        },
        reset: () => {
          // No hacer nada - mantener en la página actual
          pendingLocationRef.current = null;
        }
      };

      // Llamar al blocker personalizado
      if (blockerRef.current) {
        blockerRef.current(mockTransition);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [when, location, navigate]);
}

/**
 * Hook simplificado para mostrar confirmación antes de salir
 * 
 * @param {boolean} when - Cuándo activar el bloqueo
 * @param {function} onBlock - Callback cuando se intenta navegar
 */
export function usePrompt(when, onBlock) {
  const blocker = useCallback(
    (transition) => {
      // Llamar al callback personalizado con los métodos de control
      if (onBlock) {
        onBlock(transition);
      }
    },
    [onBlock]
  );

  useBlocker(when, blocker);
}

export default useBlocker;
