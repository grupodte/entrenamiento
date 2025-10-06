import { useCallback, useRef } from 'react';

/**
 * Hook universal para mejorar la respuesta táctil en todos los elementos
 * Soluciona problemas generales de touch en dispositivos móviles
 */
export const useUniversalTouch = (onClick, options = {}) => {
  const {
    disabled = false,
    preventDoubleClick = true,
    doubleClickDelay = 300,
    scaleOnTouch = true,
    scaleValue = 0.95,
    hapticFeedback = true,
    minTouchSize = true // Asegurar área mínima de 44px
  } = options;

  const elementRef = useRef(null);
  const lastTouchTime = useRef(0);
  const isProcessing = useRef(false);
  const originalTransform = useRef('');

  // Detectar si es dispositivo táctil
  const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  // Feedback háptico suave (si está disponible)
  const triggerHapticFeedback = useCallback(() => {
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(10); // Vibración muy suave
    }
  }, [hapticFeedback]);

  // Manejar inicio de touch
  const handleTouchStart = useCallback((e) => {
    if (disabled || isProcessing.current) return;
    
    const element = elementRef.current;
    if (!element) return;

    // Guardar transform original
    const computedStyle = window.getComputedStyle(element);
    originalTransform.current = computedStyle.transform;

    // Aplicar feedback visual inmediato
    if (scaleOnTouch) {
      const currentTransform = originalTransform.current !== 'none' 
        ? originalTransform.current 
        : '';
      element.style.transform = `${currentTransform} scale(${scaleValue})`;
      element.style.transition = 'transform 0.1s ease-out';
    }

    // Feedback háptico
    triggerHapticFeedback();

    // Prevenir comportamientos no deseados
    e.stopPropagation();
  }, [disabled, scaleOnTouch, scaleValue, triggerHapticFeedback]);

  // Manejar fin de touch
  const handleTouchEnd = useCallback((e) => {
    if (disabled) return;

    const element = elementRef.current;
    if (!element) return;

    // Restaurar estado visual
    if (scaleOnTouch) {
      element.style.transform = originalTransform.current !== 'none' 
        ? originalTransform.current 
        : '';
    }

    // Verificar doble click
    const now = Date.now();
    if (preventDoubleClick && (now - lastTouchTime.current) < doubleClickDelay) {
      e.preventDefault();
      return;
    }
    
    lastTouchTime.current = now;
    isProcessing.current = true;

    // Ejecutar callback después de un pequeño delay para mejor UX
    setTimeout(() => {
      if (onClick && typeof onClick === 'function') {
        onClick(e);
      }
      isProcessing.current = false;
    }, 50);

    e.preventDefault();
    e.stopPropagation();
  }, [disabled, scaleOnTouch, preventDoubleClick, doubleClickDelay, onClick]);

  // Manejar cancelación de touch
  const handleTouchCancel = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    // Restaurar estado visual
    if (scaleOnTouch) {
      element.style.transform = originalTransform.current !== 'none' 
        ? originalTransform.current 
        : '';
    }
    
    isProcessing.current = false;
  }, [scaleOnTouch]);

  // Manejar click para dispositivos no táctiles
  const handleClick = useCallback((e) => {
    if (disabled || isProcessing.current) return;
    
    // Solo procesar si NO es dispositivo táctil
    if (!isTouchDevice()) {
      const now = Date.now();
      if (preventDoubleClick && (now - lastTouchTime.current) < doubleClickDelay) {
        e.preventDefault();
        return;
      }
      
      lastTouchTime.current = now;
      if (onClick && typeof onClick === 'function') {
        onClick(e);
      }
    }
  }, [disabled, preventDoubleClick, doubleClickDelay, onClick]);

  // Estilos base mejorados
  const baseStyles = {
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    // Asegurar área mínima táctil de 44px (recomendación WCAG)
    ...(minTouchSize && {
      minHeight: '44px',
      minWidth: '44px',
    })
  };

  return {
    ref: elementRef,
    onTouchStart: isTouchDevice() ? handleTouchStart : undefined,
    onTouchEnd: isTouchDevice() ? handleTouchEnd : undefined,
    onTouchCancel: isTouchDevice() ? handleTouchCancel : undefined,
    onClick: handleClick,
    style: baseStyles
  };
};

/**
 * Hook específico para botones críticos (navegación, acciones principales)
 */
export const useCriticalTouch = (onClick) => {
  return useUniversalTouch(onClick, {
    preventDoubleClick: true,
    doubleClickDelay: 150,
    scaleOnTouch: true,
    scaleValue: 0.92,
    hapticFeedback: true,
    minTouchSize: true
  });
};

/**
 * Hook para botones pequeños (+/-, controles)
 */
export const useSmallButtonTouch = (onClick) => {
  return useUniversalTouch(onClick, {
    preventDoubleClick: true,
    doubleClickDelay: 200,
    scaleOnTouch: true,
    scaleValue: 0.88,
    hapticFeedback: true,
    minTouchSize: true
  });
};

/**
 * Hook para elementos de navegación
 */
export const useNavTouch = (onClick) => {
  return useUniversalTouch(onClick, {
    preventDoubleClick: true,
    doubleClickDelay: 250,
    scaleOnTouch: true,
    scaleValue: 0.95,
    hapticFeedback: false,
    minTouchSize: true
  });
};

export default useUniversalTouch;
