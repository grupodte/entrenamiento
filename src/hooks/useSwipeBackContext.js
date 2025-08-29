// ✅ useSwipeBackContext.js - Sistema contextual para manejo de swipe back
import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook avanzado para manejar swipe back contextualmente
 * Permite diferentes comportamientos según el estado de la app
 * 
 * @param {Object} options - Configuración del comportamiento
 * @param {boolean} options.isDrawerOpen - Si hay un drawer abierto
 * @param {boolean} options.isWidgetOpen - Si el SwipeWidget está abierto  
 * @param {Function} options.onDrawerClose - Callback para cerrar drawer
 * @param {Function} options.onWidgetClose - Callback para cerrar widget
 * @param {boolean} options.preventGlobalSwipeBack - Prevenir swipe back global
 * @param {number} options.swipeThreshold - Umbral mínimo para activar swipe
 */
export const useSwipeBackContext = ({
  isDrawerOpen = false,
  isWidgetOpen = false,
  onDrawerClose,
  onWidgetClose,
  preventGlobalSwipeBack = true,
  swipeThreshold = 50
}) => {
  const startPosRef = useRef({ x: 0, y: 0 });
  const isTrackingRef = useRef(false);
  const contextRef = useRef('normal'); // 'normal', 'drawer', 'widget'

  // Determinar el contexto actual
  const determineContext = useCallback(() => {
    if (isWidgetOpen) return 'widget';
    if (isDrawerOpen) return 'drawer';
    return 'normal';
  }, [isDrawerOpen, isWidgetOpen]);

  // Manejar inicio de toque
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
    isTrackingRef.current = true;
    contextRef.current = determineContext();

    // Solo prevenir si estamos en contexto de drawer/widget
    const shouldPrevent = contextRef.current !== 'normal' && preventGlobalSwipeBack;
    
    if (shouldPrevent && touch.clientX < 50) { // Solo en borde izquierdo
      e.preventDefault();
      document.body.style.overscrollBehaviorX = 'none';
    }
  }, [determineContext, preventGlobalSwipeBack]);

  // Manejar movimiento
  const handleTouchMove = useCallback((e) => {
    if (!isTrackingRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startPosRef.current.x;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(touch.clientY - startPosRef.current.y);

    // Solo prevenir si es swipe horizontal y estamos en contexto apropiado
    if (absDeltaX > absDeltaY && contextRef.current !== 'normal') {
      e.preventDefault();
    }
  }, []);

  // Manejar fin de toque
  const handleTouchEnd = useCallback((e) => {
    if (!isTrackingRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startPosRef.current.x;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(touch.clientY - startPosRef.current.y);

    // Resetear tracking
    isTrackingRef.current = false;
    document.body.style.overscrollBehaviorX = 'auto';

    // Solo procesar swipes horizontales que superen el threshold
    if (absDeltaX > absDeltaY && absDeltaX > swipeThreshold) {
      const context = contextRef.current;
      
      // Swipe hacia la derecha (positivo) desde borde izquierdo
      if (deltaX > 0 && startPosRef.current.x < 50) {
        switch (context) {
          case 'widget':
            // Desde widget, cerrar widget
            onWidgetClose?.();
            break;
          case 'drawer':
            // Desde drawer, cerrar drawer
            onDrawerClose?.();
            break;
          case 'normal':
            // En contexto normal, permitir navegación natural del browser
            // No hacemos nada aquí, dejamos que el browser maneje
            break;
        }
      }
    }
  }, [onDrawerClose, onWidgetClose, swipeThreshold]);

  // Efecto simplificado para agregar/remover listeners solo cuando sea necesario
  useEffect(() => {
    // Solo agregar listeners si hay drawers o widgets abiertos
    if (!isDrawerOpen && !isWidgetOpen) return;

    const options = { passive: false };
    
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, options);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.overscrollBehaviorX = 'auto';
    };
  }, [isDrawerOpen, isWidgetOpen, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Efecto para establecer CSS cuando hay drawers/widgets abiertos
  useEffect(() => {
    if (isDrawerOpen || isWidgetOpen) {
      // Prevenir swipe back más agresivamente cuando hay modales abiertos
      document.body.style.overscrollBehaviorX = 'none';
      document.documentElement.style.overscrollBehaviorX = 'none';
    } else {
      // Restaurar comportamiento normal
      document.body.style.overscrollBehaviorX = 'auto';
      document.documentElement.style.overscrollBehaviorX = 'auto';
    }

    return () => {
      document.body.style.overscrollBehaviorX = 'auto';
      document.documentElement.style.overscrollBehaviorX = 'auto';
    };
  }, [isDrawerOpen, isWidgetOpen]);

  return {
    currentContext: determineContext(),
    isContextActive: isDrawerOpen || isWidgetOpen
  };
};

export default useSwipeBackContext;
