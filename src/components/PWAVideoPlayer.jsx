import React, { useState, useRef, useEffect, useCallback } from 'react';
import MuxPlayer from '@mux/mux-player-react';

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

  // Manejar visibilidad de la página/app
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isCurrentlyVisible = !document.hidden;
      setIsVisible(isCurrentlyVisible);
      
      if (playerRef.current && isPWA) {
        if (isCurrentlyVisible) {
          // La PWA volvió a estar visible - forzar reinicialización si es necesario
          console.log('PWA Video: App visible - checking player state');
          setTimeout(() => {
            try {
              if (playerRef.current && typeof playerRef.current.play === 'function') {
                // Solo intentar reproducir si había interacción previa
                if (hasUserInteracted) {
                  playerRef.current.load?.();
                }
              }
            } catch (error) {
              console.warn('PWA Video: Error al restaurar video:', error);
              handleVideoError(error);
            }
          }, 100);
        } else {
          // La PWA se ocultó - pausar video
          console.log('PWA Video: App hidden - pausing video');
          try {
            playerRef.current?.pause?.();
          } catch (error) {
            console.warn('PWA Video: Error al pausar:', error);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // También escuchar eventos específicos de PWA
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
    };
  }, [isPWA, hasUserInteracted]);

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
          PWA Mode {retryCount > 0 && `(Retry: ${retryCount})`}
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

      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId}
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