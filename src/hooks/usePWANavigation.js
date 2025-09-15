import { useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Hook especializado para manejar navegación en PWA
 * Previene navegación accidental pero permite navegación programática
 */
const usePWANavigation = ({
  preventBrowserBack = true,
  allowHistoryAPI = true,
  onNavigationAttempt = null,
  enableLogging = false
} = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const historyLengthRef = useRef(window.history.length);
  const isNavigatingRef = useRef(false);
  const preventionActiveRef = useRef(false);

  const log = useCallback((message, ...args) => {
    if (enableLogging) {
      console.log(`[PWANavigation] ${message}`, ...args);
    }
  }, [enableLogging]);

  // Manejar cambios de historial
  const handlePopState = useCallback((event) => {
    if (!preventBrowserBack || isNavigatingRef.current) {
      log('Navigation allowed', event.state);
      return;
    }

    if (onNavigationAttempt) {
      const shouldAllow = onNavigationAttempt(event, location);
      if (shouldAllow) {
        log('Navigation allowed by callback');
        return;
      }
    }

    // Prevenir navegación hacia atrás no autorizada
    log('Preventing unauthorized back navigation');
    event.preventDefault();
    
    // Restaurar el estado del historial
    window.history.pushState(null, '', window.location.href);
    
    // Notificar al usuario si es necesario
    if (window.navigator.vibrate) {
      window.navigator.vibrate(100);
    }
    
  }, [preventBrowserBack, onNavigationAttempt, location, log]);

  // Navegación programática segura
  const safeNavigate = useCallback((to, options = {}) => {
    isNavigatingRef.current = true;
    log('Safe navigation to:', to);
    
    try {
      navigate(to, options);
    } catch (error) {
      log('Navigation error:', error);
    } finally {
      // Reset flag después de un delay
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 100);
    }
  }, [navigate, log]);

  // Activar/desactivar prevención
  const setPreventionActive = useCallback((active) => {
    preventionActiveRef.current = active;
    log('Prevention active:', active);
  }, [log]);

  // Detectar si estamos en PWA
  const isPWA = useCallback(() => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true ||
           document.referrer.includes('android-app://');
  }, []);

  // Configurar prevención de navegación
  useEffect(() => {
    if (!preventBrowserBack || !isPWA()) {
      log('PWA navigation prevention not needed');
      return;
    }

    // Agregar estado inicial al historial
    if (!window.history.state) {
      window.history.replaceState({ pwa: true, path: location.pathname }, '', window.location.href);
    }

    // Event listener para popstate
    window.addEventListener('popstate', handlePopState, { passive: false });
    
    // Prevenir gestos de navegación del teclado
    const handleKeyDown = (event) => {
      if ((event.altKey && event.key === 'ArrowLeft') || 
          (event.key === 'Backspace' && !event.target.closest('input, textarea, [contenteditable]'))) {
        if (preventionActiveRef.current) {
          event.preventDefault();
          log('Prevented keyboard back navigation');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    log('PWA navigation control initialized');

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('keydown', handleKeyDown);
      log('PWA navigation control cleaned up');
    };
  }, [preventBrowserBack, handlePopState, location.pathname, isPWA, log]);

  // Actualizar referencia de longitud del historial
  useEffect(() => {
    historyLengthRef.current = window.history.length;
  }, [location]);

  return {
    safeNavigate,
    setPreventionActive,
    isPWA: isPWA(),
    historyLength: historyLengthRef.current,
    isNavigating: isNavigatingRef.current,
    preventionActive: preventionActiveRef.current
  };
};

export default usePWANavigation;
