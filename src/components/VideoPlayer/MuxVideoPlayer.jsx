import React, { useRef, useCallback } from 'react';
import MuxPlayer from "@mux/mux-player-react";

/**
 * Reproductor de video simplificado usando @mux/mux-player-react
 * - Funciona con URLs firmadas de Mux (signed URLs)
 * - Incluye cast, fullscreen y controles nativos
 * - Compatible con el sistema de seguridad existente
 */
const MuxVideoPlayer = ({ 
  src, 
  title = "Video",
  onProgressUpdate,
  onVideoComplete,
  onVideoError,
  className = "",
  autoplay = false,
  muted = false
}) => {
  const playerRef = useRef(null);

  // Determinar si tenemos una URL firmada o un playback ID
  const isSignedUrl = src && (src.includes('http') || src.includes('.m3u8'));
  
  // Si es una URL firmada, extraer el playback ID para metadata
  const getPlaybackIdFromUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:stream\.mux\.com\/)([^\/.\?]+)/);
    return match ? match[1] : null;
  };

  const playbackId = isSignedUrl ? getPlaybackIdFromUrl(src) : src;

  // Manejadores de eventos del reproductor
  const handleTimeUpdate = useCallback((e) => {
    const currentTime = e.target.currentTime;
    const duration = e.target.duration;
    
    if (onProgressUpdate && duration > 0) {
      onProgressUpdate({
        currentTime,
        duration,
        percentComplete: (currentTime / duration) * 100
      });
    }
  }, [onProgressUpdate]);

  const handleEnded = useCallback(() => {
    if (onVideoComplete) {
      onVideoComplete();
    }
  }, [onVideoComplete]);

  const handleError = useCallback((e) => {
    console.error('Video Error:', e);
    if (onVideoError) {
      onVideoError(e);
    }
  }, [onVideoError]);

  // Si no hay src, mostrar mensaje de error
  if (!src) {
    return (
      <div className={`bg-black rounded-lg flex items-center justify-center p-8 ${className}`}>
        <div className="text-center text-white">
          <div className="text-2xl mb-2">⚠️</div>
          <p>No se pudo cargar el video</p>
          <p className="text-sm text-gray-400 mt-1">URL de video inválida</p>
        </div>
      </div>
    );
  }

  // Debug solo en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('[MuxPlayer] Using:', { isSignedUrl, src, playbackId });
  }

  return (
    <div className={`mux-video-player ${className}`}>
      <MuxPlayer
        ref={playerRef}
        // Usar URL firmada directamente si la tenemos, sino usar playbackId
        {...(isSignedUrl ? { src } : { playbackId })}
        title={title}
        autoPlay={autoplay ? "muted" : false}
        muted={muted}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          aspectRatio: '16/9'
        }}
        // Configuraciones adicionales
        primaryColor="#ef4444"
        accentColor="#ef4444"
        // Habilitar funcionalidades
        nohotkeys={false}
        // Metadatos para Cast y otras funciones
        metadata={{
          video_id: playbackId || 'unknown',
          video_title: title,
          viewer_user_id: "user-id"
        }}
      />
    </div>
  );
};

export default MuxVideoPlayer;
