import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook personalizado para optimizar la respuesta táctil en dispositivos móviles
 * Elimina el delay de 300ms y mejora la respuesta de los elementos interactivos
 * 
 * @param {Function} onTap - Función a ejecutar cuando se detecta un tap
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.preventDoubleClick - Prevenir doble click (default: true)
 * @param {number} options.doubleClickDelay - Delay para prevenir doble click en ms (default: 300)
 * @param {boolean} options.preventDefault - Prevenir evento por defecto (default: true)
 * @param {boolean} options.stopPropagation - Detener propagación del evento (default: false)
 * 
 * @returns {Object} - Objeto con ref y props para el elemento
 */
export const useFastTap = (onTap, options = {}) => {
  const {
    preventDoubleClick = true,
    doubleClickDelay = 300,
    preventDefault = false, // ✅ Cambio: dejar que el navegador maneje eventos nativos
    stopPropagation = false,
    disabled = false
  } = options;

  const elementRef = useRef(null);
  const lastTapRef = useRef(0);
  const isDisabledRef = useRef(false);

  // Función optimizada para manejar el tap
  const handleTap = useCallback((event) => {
    if (disabled || isDisabledRef.current) return;

    const now = Date.now();
    
    // Prevenir doble click si está habilitado
    if (preventDoubleClick && (now - lastTapRef.current) < doubleClickDelay) {
      return;
    }
    
    lastTapRef.current = now;

    if (preventDefault) {
      event.preventDefault();
    }
    
    if (stopPropagation) {
      event.stopPropagation();
    }

    // Temporal disable para prevenir clicks múltiples
    if (preventDoubleClick) {
      isDisabledRef.current = true;
      setTimeout(() => {
        isDisabledRef.current = false;
      }, doubleClickDelay);
    }

    // Ejecutar callback
    if (onTap && typeof onTap === 'function') {
      onTap(event);
    }
  }, [onTap, preventDoubleClick, doubleClickDelay, preventDefault, stopPropagation, disabled]);

  // Props optimizadas para el elemento
  const tapProps = {
    onClick: handleTap,
    onTouchStart: (e) => {
      // Mejorar feedback táctil
      if (elementRef.current) {
        elementRef.current.style.transform = 'scale(0.98)';
      }
    },
    onTouchEnd: (e) => {
      // Restaurar estado visual
      if (elementRef.current) {
        elementRef.current.style.transform = 'scale(1)';
      }
    },
    onTouchCancel: (e) => {
      // Restaurar estado si se cancela el touch
      if (elementRef.current) {
        elementRef.current.style.transform = 'scale(1)';
      }
    },
    style: {
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
      WebkitTouchCallout: 'none',
      WebkitUserSelect: 'none',
      userSelect: 'none',
      cursor: 'pointer',
      transition: 'transform 0.1s ease-out'
    }
  };

  return {
    ref: elementRef,
    ...tapProps
  };
};

/**
 * Hook simplificado para botones críticos
 * Configuración optimizada para máxima respuesta
 */
export const useCriticalButton = (onClick) => {
  return useFastTap(onClick, {
    preventDoubleClick: true,
    doubleClickDelay: 150,
    preventDefault: true,
    stopPropagation: false
  });
};

/**
 * Hook para elementos de navegación
 * Configuración balanceada entre respuesta y usabilidad
 */
export const useNavButton = (onClick) => {
  return useFastTap(onClick, {
    preventDoubleClick: true,
    doubleClickDelay: 200,
    preventDefault: false,
    stopPropagation: false
  });
};

/**
 * Función utilitaria para detectar dispositivos táctiles
 */
export const isTouchDevice = () => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * Función utilitaria para detectar dispositivos móviles
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export default useFastTap;
