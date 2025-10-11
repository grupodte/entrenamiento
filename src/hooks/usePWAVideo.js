import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para manejar videos en PWAs móviles
 * Detecta el entorno PWA y maneja estados específicos como visibilidad,
 * reconexiones y optimizaciones de rendimiento
 */
const usePWAVideo = (videoRef, options = {}) => {
  const {
    enableAutoRetry = true,
    maxRetries = 3,
    retryDelay = 1000,
    enableVisibilityHandling = true,
    enablePWAOptimizations = true
  } = options;

  // Estados principales
  const [isPWA, setIsPWA] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [networkState, setNetworkState] = useState('online');
  const [videoState, setVideoState] = useState('idle'); // idle, loading, ready, error

  // Detectar entorno PWA y móvil
  useEffect(() => {
    const detectEnvironment = () => {
      // Detectar PWA
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone ||
                          document.referrer.includes('android-app://') ||
                          window.matchMedia('(display-mode: fullscreen)').matches ||
                          window.matchMedia('(display-mode: minimal-ui)').matches;
      
      setIsPWA(isStandalone);
      
      // Detectar móvil
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                            window.matchMedia('(max-width: 768px)').matches ||
                            window.matchMedia('(pointer: coarse)').matches;
      
      setIsMobile(isMobileDevice);
      
      console.log('PWA Hook: Environment detected', { 
        isPWA: isStandalone, 
        isMobile: isMobileDevice 
      });
    };

    detectEnvironment();
    
    // Re-detectar en cambios de ventana o orientación
    const handleResize = () => detectEnvironment();
    const handleOrientationChange = () => {
      setTimeout(detectEnvironment, 100); // Delay para orientación
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Manejar estado de red
  useEffect(() => {
    const handleOnline = () => {
      setNetworkState('online');
      console.log('PWA Hook: Network online');
    };
    
    const handleOffline = () => {
      setNetworkState('offline');
      console.log('PWA Hook: Network offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Estado inicial
    setNetworkState(navigator.onLine ? 'online' : 'offline');
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Manejar visibilidad de la página/app
  useEffect(() => {
    if (!enableVisibilityHandling || !isPWA) return;
    
    const handleVisibilityChange = () => {
      const isCurrentlyVisible = !document.hidden;
      setIsVisible(isCurrentlyVisible);
      
      console.log('PWA Hook: Visibility changed', { isCurrentlyVisible });
      
      if (videoRef?.current) {
        if (isCurrentlyVisible) {
          // App volvió a estar visible
          handleAppVisible();
        } else {
          // App se ocultó
          handleAppHidden();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);
    
    // Eventos específicos de PWA
    window.addEventListener('pageshow', handleVisibilityChange);
    window.addEventListener('pagehide', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
      window.removeEventListener('pageshow', handleVisibilityChange);
      window.removeEventListener('pagehide', handleVisibilityChange);
    };
  }, [isPWA, enableVisibilityHandling]);

  // Manejar cuando la app vuelve a estar visible
  const handleAppVisible = useCallback(() => {
    if (!videoRef?.current) return;
    
    console.log('PWA Hook: App visible - checking video state');
    
    // Esperar un poco para que la app se estabilice
    setTimeout(() => {
      try {
        const video = videoRef.current;
        
        // Si hay un error o el video no está cargado, intentar recargar
        if (video.error || video.readyState === 0) {
          console.log('PWA Hook: Video needs reload');
          setVideoState('loading');
          video.load();
        }
        
        // Si había interacción previa y el video estaba reproduciendo, continuar
        if (hasUserInteracted && video.paused && videoState === 'ready') {
          console.log('PWA Hook: Attempting to resume playback');
          video.play().catch(error => {
            console.warn('PWA Hook: Could not resume playback:', error);
          });
        }
      } catch (error) {
        console.error('PWA Hook: Error handling app visible:', error);
        handleVideoError(error);
      }
    }, 100);
  }, [hasUserInteracted, videoState]);

  // Manejar cuando la app se oculta
  const handleAppHidden = useCallback(() => {
    if (!videoRef?.current) return;
    
    console.log('PWA Hook: App hidden - pausing video');
    
    try {
      // Pausar el video para ahorrar recursos
      if (!videoRef.current.paused) {
        videoRef.current.pause();
      }
    } catch (error) {
      console.warn('PWA Hook: Error pausing video:', error);
    }
  }, []);

  // Registrar interacción del usuario
  const registerUserInteraction = useCallback(() => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      console.log('PWA Hook: User interaction registered');
    }
  }, [hasUserInteracted]);

  // Manejar errores de video con reintentos
  const handleVideoError = useCallback((error) => {
    console.error('PWA Hook: Video error', error);
    setVideoState('error');
    
    if (enableAutoRetry && retryCount < maxRetries && isPWA) {
      const delay = retryDelay * (retryCount + 1); // Delay incremental
      console.log(`PWA Hook: Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      
      setTimeout(() => {
        if (videoRef?.current) {
          setRetryCount(prev => prev + 1);
          setVideoState('loading');
          videoRef.current.load();
        }
      }, delay);
    }
  }, [enableAutoRetry, retryCount, maxRetries, retryDelay, isPWA]);

  // Manejar cuando el video se carga exitosamente
  const handleVideoLoaded = useCallback(() => {
    console.log('PWA Hook: Video loaded successfully');
    setVideoState('ready');
    setRetryCount(0); // Reset retry counter
  }, []);

  // Manejar inicio de carga
  const handleVideoLoadStart = useCallback(() => {
    console.log('PWA Hook: Video load start');
    setVideoState('loading');
  }, []);

  // Configuraciones optimizadas para PWA
  const getPWAVideoConfig = useCallback(() => {
    if (!enablePWAOptimizations || !isPWA) {
      return {};
    }

    return {
      // Configuraciones de precarga más conservadoras
      preload: hasUserInteracted ? 'metadata' : 'none',
      
      // Atributos importantes para PWAs móviles
      playsInline: true,
      'webkit-playsinline': 'true',
      'x5-video-player-type': 'h5',
      'x5-video-player-fullscreen': 'false',
      
      // Configuraciones de red
      crossOrigin: 'anonymous',
      controlsList: 'nodownload',
      
      // Solo autoplay si hay interacción previa
      autoPlay: false, // Siempre falso, manejar manualmente
      
      // Callbacks mejorados
      onLoadStart: handleVideoLoadStart,
      onCanPlay: handleVideoLoaded,
      onError: handleVideoError,
      onPlay: registerUserInteraction,
      onClick: registerUserInteraction,
    };
  }, [
    enablePWAOptimizations,
    isPWA,
    hasUserInteracted,
    handleVideoLoadStart,
    handleVideoLoaded,
    handleVideoError,
    registerUserInteraction
  ]);

  // Función para reinicializar el video manualmente
  const reinitializeVideo = useCallback(() => {
    if (videoRef?.current) {
      console.log('PWA Hook: Manually reinitializing video');
      setVideoState('loading');
      setRetryCount(0);
      videoRef.current.load();
    }
  }, []);

  // Función para reproducir video con manejo de PWA
  const playVideo = useCallback(async () => {
    if (!videoRef?.current) return false;
    
    registerUserInteraction();
    
    try {
      await videoRef.current.play();
      return true;
    } catch (error) {
      console.warn('PWA Hook: Play failed:', error);
      
      // En PWAs, a veces necesitamos recargar el video
      if (isPWA && error.name === 'NotAllowedError') {
        console.log('PWA Hook: Attempting video reload before play');
        videoRef.current.load();
        
        // Intentar de nuevo después de un breve delay
        setTimeout(async () => {
          try {
            await videoRef.current.play();
          } catch (retryError) {
            console.error('PWA Hook: Retry play failed:', retryError);
            handleVideoError(retryError);
          }
        }, 500);
      }
      
      return false;
    }
  }, [registerUserInteraction, isPWA, handleVideoError]);

  return {
    // Estados
    isPWA,
    isMobile,
    isVisible,
    hasUserInteracted,
    networkState,
    videoState,
    retryCount,
    
    // Funciones
    registerUserInteraction,
    handleVideoError,
    handleVideoLoaded,
    handleVideoLoadStart,
    reinitializeVideo,
    playVideo,
    getPWAVideoConfig,
    
    // Utilidades
    isOnline: networkState === 'online',
    shouldOptimizeForPWA: isPWA && isMobile,
    canAutoPlay: hasUserInteracted && isVisible,
    
    // Debug info
    debugInfo: {
      isPWA,
      isMobile,
      isVisible,
      hasUserInteracted,
      networkState,
      videoState,
      retryCount,
      userAgent: navigator.userAgent,
      displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
    }
  };
};

export default usePWAVideo;