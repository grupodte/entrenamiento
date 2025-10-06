import { useCallback, useRef, useEffect } from 'react';

/**
 * Hook para optimizar inputs en dispositivos móviles
 * Previene zoom, mejora UX táctil, maneja teclados virtuales
 */
export const useMobileInput = (options = {}) => {
  const {
    type = 'text',
    preventZoom = true,
    selectAllOnFocus = true,
    blurOnEnter = true,
    numericPattern = false,
    autoComplete = 'off'
  } = options;

  const inputRef = useRef(null);
  const originalViewportRef = useRef(null);

  // Detectar dispositivos móviles
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Prevenir zoom en iOS ajustando font-size temporalmente
  const preventMobileZoom = useCallback(() => {
    if (!preventZoom || !isMobile()) return;
    
    const input = inputRef.current;
    if (!input) return;

    // Asegurar font-size mínimo de 16px para prevenir zoom
    const currentFontSize = window.getComputedStyle(input).fontSize;
    const fontSize = parseFloat(currentFontSize);
    
    if (fontSize < 16) {
      input.style.fontSize = '16px';
    }
  }, [preventZoom]);

  // Manejar focus con selección completa
  const handleFocus = useCallback((e) => {
    preventMobileZoom();
    
    if (selectAllOnFocus) {
      // Usar setTimeout para evitar conflictos con el comportamiento nativo
      setTimeout(() => {
        e.target.select();
      }, 50);
    }

    // Guardar viewport meta original
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      originalViewportRef.current = viewport.getAttribute('content');
    }
  }, [selectAllOnFocus, preventMobileZoom]);

  // Manejar blur
  const handleBlur = useCallback(() => {
    // Restaurar viewport si fue modificado
    if (originalViewportRef.current) {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', originalViewportRef.current);
      }
    }
  }, []);

  // Manejar tecla Enter
  const handleKeyDown = useCallback((e) => {
    if (blurOnEnter && e.key === 'Enter') {
      e.target.blur();
      e.preventDefault();
    }
  }, [blurOnEnter]);

  // Propiedades optimizadas para el input
  const inputProps = {
    ref: inputRef,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    autoComplete,
    style: {
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
      // Asegurar font-size mínimo para prevenir zoom
      fontSize: preventZoom ? 'max(16px, 1rem)' : undefined,
      // Mejorar apariencia en iOS
      WebkitAppearance: 'none',
      appearance: 'none',
      // Prevenir auto-zoom por defecto
      ...(preventZoom && {
        transformOrigin: 'left top',
        WebkitUserSelect: 'text',
        userSelect: 'text'
      })
    },
    // Atributos específicos para tipos numéricos
    ...(type === 'number' && {
      inputMode: 'numeric',
      pattern: numericPattern ? '[0-9]*' : undefined
    }),
    ...(type === 'tel' && {
      inputMode: 'tel'
    }),
    ...(type === 'email' && {
      inputMode: 'email'
    })
  };

  return {
    inputRef,
    inputProps
  };
};

/**
 * Hook específico para inputs numéricos (peso, repeticiones, etc.)
 */
export const useNumericInput = (options = {}) => {
  return useMobileInput({
    type: 'number',
    numericPattern: true,
    selectAllOnFocus: true,
    blurOnEnter: true,
    ...options
  });
};

/**
 * Hook para inputs de texto normal
 */
export const useTextInput = (options = {}) => {
  return useMobileInput({
    type: 'text',
    selectAllOnFocus: false,
    blurOnEnter: true,
    ...options
  });
};

/**
 * Utilidad para obtener el inputMode correcto según el tipo
 */
export const getOptimalInputMode = (type, purpose) => {
  const inputModes = {
    number: 'numeric',
    tel: 'tel',
    email: 'email',
    password: 'text',
    search: 'search',
    url: 'url',
    decimal: 'decimal'
  };

  // Casos específicos por propósito
  if (purpose === 'weight' || purpose === 'reps') {
    return 'numeric';
  }
  
  if (purpose === 'time' || purpose === 'duration') {
    return 'numeric';
  }

  return inputModes[type] || 'text';
};

export default useMobileInput;
