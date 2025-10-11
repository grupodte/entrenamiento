import React, { useState, useRef, useEffect, useCallback } from 'react';
import MuxPlayer from '@mux/mux-player-react';

/**
 * Manager especializado para videos en PWAs que soluciona el problema
 * de desconexión del stream al reabrir la aplicación
 */
const PWAVideoManager = ({
  playbackId,
  metadata,
  className = '',
  autoPlay = false,
  muted = false,
  controls = true,
  poster,
  style = {},
  ...props
}) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const lastKnownTime = useRef(0);
  const streamHealthCheck = useRef(null);
  
  // Estados
  const [isPWA, setIsPWA] = useState(false);
  const [isStreamConnected, setIsStreamConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [forceRemount, setForceRemount] = useState(0);
  const [debugInfo, setDebugInfo] = useState({});

  // Detectar PWA
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone ||
                        document.referrer.includes('android-app://');
    setIsPWA(isStandalone);
    
    if (isStandalone) {
      console.log('PWAVideoManager: PWA detectada, activando monitoreo de stream');
    }
  }, []);

  // Función para verificar salud del stream
  const checkStreamHealth = useCallback(() => {
    if (!playerRef.current || !isPWA) return true;

    try {
      const player = playerRef.current;
      const currentTime = player.currentTime || 0;
      const isPlaying = !player.paused;
      const readyState = player.readyState;
      const networkState = player.networkState;
      
      // Debug info
      setDebugInfo({
        currentTime: currentTime.toFixed(2),
        lastKnownTime: lastKnownTime.current.toFixed(2),
        isPlaying,
        readyState,
        networkState,
        buffered: player.buffered.length > 0 ? player.buffered.end(0).toFixed(2) : 0
      });

      // Si el video está "reproduciéndose" pero el tiempo no avanza
      if (isPlaying && currentTime === lastKnownTime.current && currentTime > 0) {
        console.warn('PWAVideoManager: Stream parece desconectado - tiempo no avanza');
        return false;
      }

      // Si readyState es muy bajo cuando debería estar cargado
      if (isPlaying && readyState < 2) {
        console.warn('PWAVideoManager: ReadyState bajo durante reproducción');
        return false;
      }

      // Si networkState indica problema
      if (networkState === 3) { // NETWORK_NO_SOURCE
        console.warn('PWAVideoManager: Sin fuente de red');
        return false;
      }

      lastKnownTime.current = currentTime;
      return true;
      
    } catch (error) {
      console.error('PWAVideoManager: Error verificando salud del stream:', error);
      return false;
    }
  }, [isPWA]);

  // Función para reconectar el stream
  const reconnectStream = useCallback(async () => {
    if (isReconnecting || !playerRef.current) return;
    
    setIsReconnecting(true);
    reconnectAttempts.current += 1;
    
    console.log(`PWAVideoManager: Intentando reconexión ${reconnectAttempts.current}/3`);

    try {
      const player = playerRef.current;
      const wasPlaying = !player.paused;
      const savedTime = player.currentTime || 0;
      
      // Método 1: Forzar recarga del source
      console.log('PWAVideoManager: Método 1 - Recarga de source');
      
      // Pausar y resetear
      player.pause();
      
      // Limpiar y recargar
      player.load();
      
      // Esperar a que se cargue
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
        
        const onCanPlay = () => {
          clearTimeout(timeout);
          player.removeEventListener('canplay', onCanPlay);
          player.removeEventListener('error', onError);
          resolve();
        };
        
        const onError = (e) => {
          clearTimeout(timeout);
          player.removeEventListener('canplay', onCanPlay);
          player.removeEventListener('error', onError);
          reject(e);
        };
        
        player.addEventListener('canplay', onCanPlay);
        player.addEventListener('error', onError);
      });
      
      // Restaurar posición
      if (savedTime > 0) {
        player.currentTime = savedTime;
      }
      
      // Reanudar reproducción si estaba reproduciendo
      if (wasPlaying) {
        await player.play();
      }
      
      setIsStreamConnected(true);
      reconnectAttempts.current = 0;
      console.log('PWAVideoManager: Reconexión exitosa');
      
    } catch (error) {
      console.error('PWAVideoManager: Error en reconexión:', error);
      
      // Si falló, intentar remount completo
      if (reconnectAttempts.current >= 2) {
        console.log('PWAVideoManager: Forzando remount completo');
        setForceRemount(prev => prev + 1);
        reconnectAttempts.current = 0;
      }
    } finally {
      setIsReconnecting(false);
    }
  }, [isReconnecting]);

  // Monitor continuo del stream en PWAs
  useEffect(() => {
    if (!isPWA) return;
    
    streamHealthCheck.current = setInterval(() => {
      const isHealthy = checkStreamHealth();
      
      if (!isHealthy && isStreamConnected) {
        setIsStreamConnected(false);
        console.log('PWAVideoManager: Stream no saludable detectado');
        
        // Reconectar después de un breve delay
        setTimeout(() => {
          reconnectStream();
        }, 500);
      }
    }, 2000); // Check cada 2 segundos
    
    return () => {
      if (streamHealthCheck.current) {
        clearInterval(streamHealthCheck.current);
      }
    };
  }, [isPWA, checkStreamHealth, reconnectStream, isStreamConnected]);

  // Manejar eventos de PWA (pageshow/pagehide)
  useEffect(() => {
    if (!isPWA) return;
    
    const handlePageShow = (event) => {
      console.log('PWAVideoManager: PageShow', { persisted: event.persisted });
      
      // Si la página fue restaurada desde cache, forzar reconexión
      if (event.persisted) {
        console.log('PWAVideoManager: Página desde cache - forzando reconexión preventiva');
        setTimeout(() => {
          setIsStreamConnected(false);
          reconnectStream();
        }, 300);
      }
    };
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('PWAVideoManager: App visible - verificando stream');
        
        // Verificar inmediatamente la salud del stream
        setTimeout(() => {
          const isHealthy = checkStreamHealth();
          if (!isHealthy) {
            setIsStreamConnected(false);
            reconnectStream();
          }
        }, 500);
      }
    };
    
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPWA, checkStreamHealth, reconnectStream]);

  // Handlers del player
  const handleCanPlay = useCallback(() => {
    console.log('PWAVideoManager: CanPlay - stream conectado');
    setIsStreamConnected(true);
    reconnectAttempts.current = 0;
  }, []);

  const handleError = useCallback((error) => {
    console.error('PWAVideoManager: Player error:', error);
    setIsStreamConnected(false);
    
    // Reconectar automáticamente en PWAs
    if (isPWA && reconnectAttempts.current < 3) {
      setTimeout(reconnectStream, 1000);
    }
  }, [isPWA, reconnectStream]);

  // Función manual de reconexión
  const manualReconnect = useCallback(() => {
    console.log('PWAVideoManager: Reconexión manual solicitada');
    setIsStreamConnected(false);
    reconnectStream();
  }, [reconnectStream]);

  // Estilos y clases
  const defaultClasses = 'w-full aspect-video rounded-lg shadow-lg';
  const combinedClasses = `${defaultClasses} ${className}`.trim();
  
  const playerMetadata = {
    video_id: metadata?.video_id || 'unknown',
    video_title: metadata?.video_title || 'Video',
    viewer_user_id: metadata?.viewer_user_id || 'anonymous',
    pwa_mode: isPWA ? 'standalone' : 'browser',
    stream_health: isStreamConnected ? 'connected' : 'disconnected',
    ...metadata
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Debug info en desarrollo */}
      {process.env.NODE_ENV === 'development' && isPWA && (
        <div className="absolute top-2 right-2 z-20 bg-black/80 text-white text-xs p-2 rounded max-w-xs">
          <div>PWA: {isPWA ? '✓' : '✗'}</div>
          <div>Stream: {isStreamConnected ? '✓' : '✗'}</div>
          <div>Time: {debugInfo.currentTime}s</div>
          <div>Ready: {debugInfo.readyState}</div>
          <div>Attempts: {reconnectAttempts.current}</div>
        </div>
      )}
      
      {/* Overlay de reconexión */}
      {isReconnecting && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 rounded-lg">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-sm">Reconectando video...</p>
          </div>
        </div>
      )}
      
      {/* Botón de reconexión manual */}
      {isPWA && !isStreamConnected && !isReconnecting && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 rounded-lg">
          <div className="text-white text-center p-4">
            <div className="bg-yellow-500/20 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold mb-2">Stream Desconectado</h3>
            <p className="text-xs text-gray-300 mb-4">
              El video se desconectó. Esto puede ocurrir al reabrir la PWA.
            </p>
            <button
              onClick={manualReconnect}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              🔗 Reconectar
            </button>
          </div>
        </div>
      )}

      <MuxPlayer
        key={`pwa-video-${forceRemount}`}
        ref={playerRef}
        playbackId={playbackId}
        metadata={playerMetadata}
        className={combinedClasses}
        autoPlay={autoPlay}
        muted={muted}
        controls={controls}
        poster={poster}
        style={style}
        onCanPlay={handleCanPlay}
        onError={handleError}
        playsInline={true}
        preload={isPWA ? "metadata" : "auto"}
        {...props}
      />
    </div>
  );
};

export default PWAVideoManager;