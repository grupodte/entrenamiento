import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar la plataforma y adaptar la UI
 * Implementa las mejores prácticas del documento de arquitectura PWA
 */

const usePlatformAdaptation = () => {
  const [platform, setPlatform] = useState({
    os: 'unknown',
    isIOS: false,
    isAndroid: false,
    isMobile: false,
    isStandalone: false,
    isInstalled: false
  });

  useEffect(() => {
    const detectPlatform = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || window.navigator.standalone 
        || document.referrer.includes('android-app://');

      let os = 'unknown';
      let isIOS = false;
      let isAndroid = false;
      let isMobile = false;

      // Detectar iOS
      if (/iPad|iPhone|iPod/.test(userAgent)) {
        os = 'ios';
        isIOS = true;
        isMobile = true;
      }
      // Detectar Android
      else if (/Android/.test(userAgent)) {
        os = 'android';
        isAndroid = true;
        isMobile = true;
      }
      // Detectar móvil genérico
      else if (/Mobi|Android/i.test(userAgent)) {
        isMobile = true;
      }

      setPlatform({
        os,
        isIOS,
        isAndroid,
        isMobile,
        isStandalone,
        isInstalled: isStandalone
      });
    };

    detectPlatform();

    // Escuchar cambios en display-mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => detectPlatform();
    
    mediaQuery.addEventListener('change', handleDisplayModeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  // Obtener estilos específicos de la plataforma
  const getPlatformStyles = () => {
    const baseStyles = {
      transition: 'all 0.2s ease-in-out'
    };

    if (platform.isIOS) {
      return {
        ...baseStyles,
        // Estilos iOS
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      };
    }

    if (platform.isAndroid) {
      return {
        ...baseStyles,
        // Estilos Android (Material Design)
        fontFamily: 'Roboto, "Noto Sans", sans-serif',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      };
    }

    return baseStyles;
  };

  // Obtener configuración de navegación específica
  const getNavigationConfig = () => {
    if (platform.isIOS) {
      return {
        type: 'tabbar', // Navegación inferior en iOS
        position: 'bottom',
        style: 'ios',
        showBackButton: true,
        backButtonStyle: 'chevron',
        titleAlignment: 'center'
      };
    }

    if (platform.isAndroid) {
      return {
        type: 'drawer', // Navigation Drawer común en Android
        position: 'left',
        style: 'material',
        showBackButton: true,
        backButtonStyle: 'arrow',
        titleAlignment: 'left',
        showFAB: true // Floating Action Button
      };
    }

    // Desktop fallback
    return {
      type: 'sidebar',
      position: 'left',
      style: 'desktop',
      titleAlignment: 'left'
    };
  };

  // Obtener clases CSS específicas de la plataforma
  const getPlatformClasses = (component = 'default') => {
    const baseClasses = {
      button: 'px-4 py-2 rounded-lg font-medium transition-colors duration-200',
      card: 'rounded-lg p-4 shadow-sm',
      input: 'px-3 py-2 rounded-lg border transition-colors duration-200',
      modal: 'rounded-lg p-6 shadow-xl'
    };

    const iosClasses = {
      button: `${baseClasses.button} bg-blue-500 text-white hover:bg-blue-600 active:scale-95`,
      card: `${baseClasses.card} bg-white/80 backdrop-blur-md border-0`,
      input: `${baseClasses.input} bg-gray-100 border-gray-200 focus:bg-white focus:border-blue-500`,
      modal: `${baseClasses.modal} bg-white/95 backdrop-blur-xl border-0`
    };

    const androidClasses = {
      button: `${baseClasses.button} bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg`,
      card: `${baseClasses.card} bg-white shadow-md border border-gray-200`,
      input: `${baseClasses.input} bg-white border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500`,
      modal: `${baseClasses.modal} bg-white shadow-2xl border border-gray-200`
    };

    if (platform.isIOS) {
      return iosClasses[component] || baseClasses[component] || '';
    }

    if (platform.isAndroid) {
      return androidClasses[component] || baseClasses[component] || '';
    }

    return baseClasses[component] || '';
  };

  // Obtener configuración de gestos específica
  const getGestureConfig = () => {
    if (platform.isIOS) {
      return {
        swipeBackEnabled: true, // iOS tiene swipe back nativo
        swipeBackThreshold: 50,
        hapticFeedback: true,
        bounceScrolling: true
      };
    }

    if (platform.isAndroid) {
      return {
        swipeBackEnabled: false, // Android usa botón back
        rippleEffect: true,
        overScrollEffect: 'glow',
        hapticFeedback: true
      };
    }

    return {
      swipeBackEnabled: false,
      hapticFeedback: false
    };
  };

  // Obtener configuraciones de animación
  const getAnimationConfig = () => {
    if (platform.isIOS) {
      return {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // iOS easing
        reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      };
    }

    if (platform.isAndroid) {
      return {
        duration: 250,
        easing: 'cubic-bezier(0.4, 0.0, 0.6, 1)', // Material Design easing
        reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      };
    }

    return {
      duration: 200,
      easing: 'ease-out',
      reduceMotion: false
    };
  };

  return {
    platform,
    getPlatformStyles,
    getNavigationConfig,
    getPlatformClasses,
    getGestureConfig,
    getAnimationConfig,
    // Utilidades de conveniencia
    isIOS: platform.isIOS,
    isAndroid: platform.isAndroid,
    isMobile: platform.isMobile,
    isStandalone: platform.isStandalone,
    isInstalled: platform.isInstalled
  };
};

export default usePlatformAdaptation;
