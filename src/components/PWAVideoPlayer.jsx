import React, { useState, useRef, useEffect, useCallback } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import MuxPlayerWrapper from './MuxPlayerWrapper';

/**
 * Componente de video especializado para PWAs móviles
 * Maneja los problemas específicos de reproducción en PWAs instaladas
 */
const PWAVideoPlayer = ({
  playbackId,
  metadata,
  className = '',
  autoPlay = false,
  muted = false,
  controls = true,
  poster,
  style = {},
  onError,
  onLoadStart,
  onCanPlay,
  ...props
}) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  
  // Estados específicos para PWA
  const [isVisible, setIsVisible] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isPWA, setIsPWA] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [lastTimeUpdate, setLastTimeUpdate] = useState(0);
  const [videoFrozen, setVideoFrozen] = useState(false);
  const [forceReload, setForceReload] = useState(0);

  // Detectar si está ejecutándose como PWA
  useEffect(() => {
    const detectPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone ||
                          document.referrer.includes('android-app://');
      setIsPWA(isStandalone);
    };

    detectPWA();
    
    // Escuchar cambios en el display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => detectPWA();
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback para navegadores más antiguos
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Detectar video congelado y manejar visibilidad PWA
  useEffect(() => {
    if (!isPWA) return;
    
    let frozenCheckInterval;
    
    const checkIfVideoFrozen = () => {
      if (playerRef.current) {
        try {
          const currentTime = playerRef.current.currentTime || 0;
          const isPlaying = !playerRef.current.paused;
          
          // Si el video debería estar reproduciéndose pero el tiempo no avanza
          if (isPlaying && currentTime === lastTimeUpdate && currentTime > 0) {
            console.warn('PWA Video: Video parece estar congelado');
            setVideoFrozen(true);
            
            // Forzar recarga inmediata
            setTimeout(() => {
              console.log('PWA Video: Forzando recarga por video congelado');
              forceVideoReload();
            }, 1000);
          } else {
            setVideoFrozen(false);
            setLastTimeUpdate(currentTime);
          }
        } catch (error) {
          console.warn('PWA Video: Error checking frozen state:', error);
        }
      }
    };
    
    // Verificar cada 3 segundos si el video está congelado
    if (playerReady && isVisible) {
      frozenCheckInterval = setInterval(checkIfVideoFrozen, 3000);
    }
    
    return () => {
      if (frozenCheckInterval) {
        clearInterval(frozenCheckInterval);
      }
    };
  }, [isPWA, playerReady, isVisible, lastTimeUpdate]);
  
  // Manejar eventos específicos de PWA
  useEffect(() => {
    if (!isPWA) return;
    
    const handlePageShow = (event) => {
      console.log('PWA Video: pageshow event', { persisted: event.persisted });
      
      // Si la página fue restaurada desde cache (persisted: true)
      // necesitamos forzar recarga del video
      if (event.persisted) {
        console.log('PWA Video: Página restaurada desde cache - forzando recarga');
        setTimeout(() => {
          forceVideoReload();
        }, 500);
      }
      
      setIsVisible(true);
    };
    
    const handlePageHide = () => {
      console.log('PWA Video: pagehide event');
      setIsVisible(false);
      
      // Pausar video al ocultar
      if (playerRef.current && !playerRef.current.paused) {
        try {
          playerRef.current.pause();
        } catch (error) {
          console.warn('PWA Video: Error pausing on pagehide:', error);
        }
      }
    };
    
    const handleVisibilityChange = () => {
      const isCurrentlyVisible = !document.hidden;
      setIsVisible(isCurrentlyVisible);
      
      if (isCurrentlyVisible) {
        console.log('PWA Video: App visible - checking if reload needed');
        
        setTimeout(() => {
          if (playerRef.current) {
            // Verificar si el video necesita recarga
            const needsReload = playerRef.current.readyState === 0 || 
                              playerRef.current.error || 
                              videoFrozen;
                              
            if (needsReload) {
              console.log('PWA Video: Video needs reload on visibility change');
              forceVideoReload();
            }
          }
        }, 200);
      }
    };
    
    // Eventos específicos de PWA
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);
    
    // Eventos estándar de visibilidad
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
    };
  }, [isPWA, videoFrozen]);

  // Manejar interacción del usuario
  const handleUserInteraction = useCallback(() => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      console.log('PWA Video: Primera interacción registrada');
    }
  }, [hasUserInteracted]);

  // Manejar errores específicos de PWA
  const handleVideoError = useCallback((error) => {
    console.error('PWA Video Error:', error);
    
    if (isPWA && retryCount < 3) {
      console.log(`PWA Video: Reintentando... (${retryCount + 1}/3)`);
      setRetryCount(prev => prev + 1);
      
      // Reintentar después de un breve delay
      setTimeout(() => {
        try {
          if (playerRef.current) {
            setPlayerReady(false);
            playerRef.current.load?.();
          }
        } catch (retryError) {
          console.error('PWA Video: Error al reintentar:', retryError);
        }
      }, 1000 * (retryCount + 1)); // Delay incremental
    }
    
    onError?.(error);
  }, [isPWA, retryCount, onError]);

  // Manejar cuando el player está listo
  const handlePlayerReady = useCallback(() => {
    console.log('PWA Video: Player ready');
    setPlayerReady(true);
    setRetryCount(0); // Resetear contador de reintentos
    onCanPlay?.();
  }, [onCanPlay]);

  // Manejar inicio de carga
  const handleLoadStart = useCallback(() => {
    console.log('PWA Video: Load start');
    setPlayerReady(false);
    onLoadStart?.();
  }, [onLoadStart]);
  
  // Función para forzar recarga completa del video
  const forceVideoReload = useCallback(() => {
    console.log('PWA Video: Forzando recarga completa del video');
    
    setPlayerReady(false);
    setVideoFrozen(false);
    setRetryCount(0);
    
    // Incrementar forceReload para forzar re-render del componente
    setForceReload(prev => prev + 1);
    
    // Si tenemos referencia al player, intentar recargar
    if (playerRef.current) {
      try {
        // Pausar primero
        playerRef.current.pause();
        
        // Limpiar source
        playerRef.current.removeAttribute('src');
        playerRef.current.load();
        
        // Después de un breve delay, recargar
        setTimeout(() => {
          try {
            if (playerRef.current) {
              playerRef.current.load();
            }
          } catch (reloadError) {
            console.warn('PWA Video: Error en segundo intento de recarga:', reloadError);
          }
        }, 100);
        
      } catch (error) {
        console.warn('PWA Video: Error durante recarga forzada:', error);
      }
    }
  }, []);

  // Props específicas para PWA móvil
  const pwaProps = {
    // Forzar atributos importantes para móviles
    playsInline: true,
    preload: isPWA ? 'none' : 'metadata', // En PWA, cargar bajo demanda
    crossOrigin: 'anonymous',
    
    // Configuraciones específicas de Mux para PWA
    streamType: 'on-demand',
    
    // Configuraciones de buffering más conservadoras para PWAs
    startTime: 0,
    
    // Callbacks mejorados
    onLoadStart: handleLoadStart,
    onCanPlay: handlePlayerReady,
    onError: handleVideoError,
    
    // Mejorar la carga inicial
    onPlay: () => {
      handleUserInteraction();
      props.onPlay?.();
    },
    
    // Manejar cuando el usuario hace click
    onClick: (e) => {
      handleUserInteraction();
      props.onClick?.(e);
    },
    
    // Configuraciones adicionales para PWA
    ...(isPWA && {
      // Configuraciones específicas de Mux para PWAs
      envKey: process.env.REACT_APP_MUX_ENV_KEY,
      debug: process.env.NODE_ENV === 'development',
      
      // Prevenir problemas de cache
      disableCookies: true,
      
      // Configuraciones de red más agresivas
      customDomains: ['stream.mux.com'],
    })
  };

  // Estilos específicos para PWA
  const pwaStyles = {
    ...style,
    // Asegurar que el video sea responsive en PWAs
    width: '100%',
    height: 'auto',
    maxWidth: '100%',
    
    // Mejorar la renderización en PWAs móviles
    ...(isPWA && {
      // Optimizaciones para PWA
      objectFit: 'contain',
      backgroundColor: '#000000',
    })
  };

  // Clases específicas para PWA
  const pwaClasses = [
    'w-full aspect-video rounded-lg shadow-lg',
    isPWA ? 'pwa-video-player' : '',
    !playerReady && isPWA ? 'pwa-video-loading' : '',
    className
  ].filter(Boolean).join(' ');

  // Metadatos mejorados para PWA
  const enhancedMetadata = {
    video_id: metadata?.video_id || 'unknown',
    video_title: metadata?.video_title || 'Video',
    viewer_user_id: metadata?.viewer_user_id || 'anonymous',
    page_type: 'pwa',
    app_name: 'DD Entrenamiento',
    app_version: '1.0.0',
    platform: isPWA ? 'pwa' : 'web',
    ...metadata
  };

  return (
    <div 
      ref={containerRef}
      className="relative"
      onTouchStart={handleUserInteraction}
      onMouseDown={handleUserInteraction}
    >
      {/* Indicador PWA (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && isPWA && (
        <div className="absolute top-2 right-2 z-10 bg-green-600 text-white text-xs px-2 py-1 rounded">
          PWA Mode {retryCount > 0 && `(Retry: ${retryCount})`} {videoFrozen && '- FROZEN'}
        </div>
      )}
      
      {/* Botón de recarga manual cuando el video está congelado */}
      {isPWA && (videoFrozen || (!playerReady && retryCount > 1)) && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg z-20">
          <div className="text-white text-center p-4">
            <div className="bg-red-500/20 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold mb-2">
              {videoFrozen ? 'Video Congelado' : 'Problema de Carga'}
            </h3>
            <p className="text-xs text-gray-300 mb-4">
              {videoFrozen 
                ? 'El video se ha congelado. Toca para recargar.' 
                : 'Error al cargar el video. Intenta recargar.'}
            </p>
            <button
              onClick={forceVideoReload}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              🔄 Recargar Video
            </button>
          </div>
        </div>
      )}

      {/* Overlay de carga para PWA */}
      {isPWA && !playerReady && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Cargando video...</p>
          </div>
        </div>
      )}

      <MuxPlayerWrapper
        ref={playerRef}
        playbackId={playbackId}
        forceReloadKey={forceReload}
        onPlayerReady={handlePlayerReady}
        onPlayerError={handleVideoError}
        metadata={enhancedMetadata}
        className={pwaClasses}
        autoPlay={autoPlay && hasUserInteracted} // Solo autoplay tras interacción
        muted={muted}
        controls={controls}
        poster={poster}
        style={pwaStyles}
        {...pwaProps}
        {...props}
      />

      {/* Estilos CSS específicos para PWA */}
      <style jsx>{`
        .pwa-video-player {
          /* Optimizaciones específicas para PWA */
          -webkit-transform: translate3d(0,0,0);
          transform: translate3d(0,0,0);
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        
        .pwa-video-loading {
          opacity: 0.7;
        }
        
        /* Mejorar el rendimiento en dispositivos móviles */
        @media (max-width: 768px) {
          .pwa-video-player {
            will-change: transform;
          }
        }
        
        /* Específico para PWAs instaladas */
        @media (display-mode: standalone) {
          .pwa-video-player {
            /* Configuraciones específicas cuando la app está instalada */
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>
    </div>
  );
};

export default PWAVideoPlayer;