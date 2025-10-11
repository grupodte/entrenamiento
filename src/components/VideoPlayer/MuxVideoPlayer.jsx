import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import './MuxVideoPlayer.css';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize, 
  Minimize,
  SkipForward,
  SkipBack,
  Settings,
  RotateCcw,
  AlertCircle,
  Cast
} from 'lucide-react';

/**
 * VideoPlayer optimizado específicamente para Mux HLS streaming
 * - Soporte nativo para HLS con hls.js
 * - Controles personalizados
 * - Manejo inteligente de errores
 * - Optimizado para videos seguros con JWT
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
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);
  const hlsRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [error, setError] = useState(null);
  const [hlsError, setHlsError] = useState(null);
  const [isCasting, setIsCasting] = useState(false);
  const [castAvailable, setCastAvailable] = useState(false);
  const castRef = useRef(null);
  
  // Control visibility timeout
  const controlsTimeoutRef = useRef(null);
  const hideControlsDelay = 3000;

  // Initialize Google Cast SDK
  useEffect(() => {
    let scriptLoaded = false;
    
    const initializeCast = () => {
      console.log('🎭 Initializing Google Cast SDK...');
      
      window['__onGCastApiAvailable'] = (isAvailable) => {
        console.log('🎭 Google Cast API available:', isAvailable);
        
        if (isAvailable && window.cast?.framework) {
          try {
            const context = cast.framework.CastContext.getInstance();
            
            context.setOptions({
              receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
              autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
            });
            
            console.log('🎭 Cast context configured');

            // Listener para cambios de estado del cast
            context.addEventListener(
              cast.framework.CastContextEventType.CAST_STATE_CHANGED,
              (event) => {
                const castState = event.castState;
                console.log('🎭 Cast state changed:', castState);
                
                setIsCasting(castState === cast.framework.CastState.CONNECTED);
                setCastAvailable(castState !== cast.framework.CastState.NO_DEVICES_AVAILABLE);
              }
            );

            // Verificar estado inicial
            const initialState = context.getCastState();
            console.log('🎭 Initial cast state:', initialState);
            
            setCastAvailable(initialState !== cast.framework.CastState.NO_DEVICES_AVAILABLE);
            setIsCasting(initialState === cast.framework.CastState.CONNECTED);
          } catch (error) {
            console.error('🎭 Error setting up Cast context:', error);
          }
        } else {
          console.warn('🎭 Cast framework not available');
        }
      };
    };

    // Cargar Google Cast SDK si no está ya cargado
    if (!window.chrome?.cast && !scriptLoaded) {
      console.log('🎭 Loading Google Cast SDK...');
      
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      
      script.onload = () => {
        console.log('🎭 Cast SDK script loaded');
        scriptLoaded = true;
        // Dar tiempo al SDK para inicializarse
        setTimeout(initializeCast, 100);
      };
      
      script.onerror = () => {
        console.error('🎭 Failed to load Cast SDK script');
      };
      
      document.head.appendChild(script);
    } else if (window.chrome?.cast) {
      console.log('🎭 Cast SDK already available');
      initializeCast();
    } else {
      console.log('🎭 Cast not supported or already loading');
    }
  }, []);

  // Initialize HLS player
  useEffect(() => {
    if (!src || !videoRef.current) return;

    const video = videoRef.current;
    setLoading(true);
    setError(null);
    setHlsError(null);

    // Cleanup previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if browser supports HLS natively (Safari, iOS)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('🎥 Using native HLS support');
      video.src = src;
      setLoading(false);
      return;
    }

    // Use hls.js for other browsers
    if (Hls.isSupported()) {
      console.log('🎥 Initializing hls.js for Mux playback');
      
      const hls = new Hls({
        debug: process.env.NODE_ENV === 'development',
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 300,
        maxMaxBufferLength: 600,
        // Optimized for Mux
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 4,
        levelLoadingTimeOut: 10000,
        fragLoadingTimeOut: 20000,
      });
      
      hlsRef.current = hls;
      
      hls.loadSource(src);
      hls.attachMedia(video);
      
      // Event listeners
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log('✅ Mux manifest parsed successfully', {
          levels: data.levels.length,
          duration: data.levels[0]?.details?.totalduration
        });
        setLoading(false);
      });
      
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        console.log(`📊 Quality switched to: ${data.level}`);
      });
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('❌ HLS Error:', data);
        setHlsError(data);
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('🔄 Network error, attempting recovery...');
              hls.startLoad();
              break;
              
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('🔄 Media error, attempting recovery...');
              hls.recoverMediaError();
              break;
              
            default:
              console.error('💀 Fatal error, destroying player');
              setError({
                type: 'fatal',
                message: 'Error crítico de reproducción',
                details: data.reason || 'Error desconocido'
              });
              hls.destroy();
              hlsRef.current = null;
              break;
          }
        }
      });
      
    } else {
      console.error('❌ HLS not supported in this browser');
      setError({
        type: 'compatibility',
        message: 'Tu navegador no soporta reproducción HLS',
        details: 'Prueba con Chrome, Firefox, Safari o Edge actualizado'
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  // Video event handlers
  const handleLoadedData = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setLoading(false);
      
      if (autoplay) {
        videoRef.current.play().catch(console.error);
      }
    }
  }, [autoplay]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      
      setCurrentTime(current);
      
      // Update buffered progress
      if (videoRef.current.buffered.length > 0) {
        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        setBuffered((bufferedEnd / dur) * 100);
      }
      
      // Progress callback
      if (onProgressUpdate && dur > 0) {
        onProgressUpdate({
          currentTime: current,
          duration: dur,
          percentComplete: (current / dur) * 100
        });
      }
    }
  }, [onProgressUpdate]);

  const handleVideoError = useCallback((e) => {
    const videoError = e.target.error;
    console.error('🎥 Video Error:', videoError);
    
    setError({
      type: 'video',
      message: getVideoErrorMessage(videoError.code),
      details: videoError.message
    });
    
    if (onVideoError) {
      onVideoError(videoError);
    }
  }, [onVideoError]);

  // Control handlers
  const togglePlay = useCallback(async () => {
    if (videoRef.current) {
      try {
        if (isPlaying) {
          await videoRef.current.pause();
        } else {
          await videoRef.current.play();
        }
      } catch (err) {
        console.error('Play/pause error:', err);
      }
    }
  }, [isPlaying]);

  const handleSeek = useCallback((e) => {
    if (videoRef.current && progressBarRef.current && duration > 0) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const seekTime = pos * duration;
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  }, [duration]);

  const skipTime = useCallback((seconds) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [currentTime, duration]);

  const handleVolumeChange = useCallback((newVolume) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      if (isMuted) {
        const newVolume = volume === 0 ? 0.5 : volume;
        videoRef.current.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted, volume]);

  const changePlaybackRate = useCallback((rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSettings(false);
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        // Entrar en pantalla completa
        const element = containerRef.current;
        if (element) {
          if (element.requestFullscreen) {
            await element.requestFullscreen();
          } else if (element.webkitRequestFullscreen) {
            await element.webkitRequestFullscreen();
          } else if (element.mozRequestFullScreen) {
            await element.mozRequestFullScreen();
          } else if (element.msRequestFullscreen) {
            await element.msRequestFullscreen();
          } else {
            console.warn('Fullscreen API not supported');
          }
        }
      } else {
        // Salir de pantalla completa
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  }, []);

  const retryPlayback = useCallback(() => {
    setError(null);
    setHlsError(null);
    setLoading(true);
    
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, []);

  // Cast functions
  const handleCastToggle = useCallback(() => {
    console.log('🎭 Cast toggle clicked. Current state:', { isCasting, castAvailable });
    
    if (!window.cast?.framework) {
      console.warn('🎭 Google Cast SDK not loaded');
      alert('Google Cast no está disponible. Asegúrate de estar usando Chrome.');
      return;
    }

    try {
      const context = cast.framework.CastContext.getInstance();
      console.log('🎭 Cast context obtained:', context);
      
      if (isCasting) {
        // Desconectar del Cast
        console.log('🎭 Disconnecting from Cast...');
        context.endCurrentSession(true);
      } else {
        // Iniciar Cast
        console.log('🎭 Starting Cast session...', { src, title });
        
        if (!src) {
          console.error('🎭 No video source available for casting');
          return;
        }
        
        const castSession = context.getCurrentSession();
        if (castSession) {
          console.log('🎭 Using existing Cast session');
          loadMediaToCast(castSession);
        } else {
          console.log('🎭 Requesting new Cast session...');
          context.requestSession().then(() => {
            console.log('🎭 Cast session established');
            const newSession = context.getCurrentSession();
            if (newSession) {
              loadMediaToCast(newSession);
            }
          }).catch(err => {
            console.error('🎭 Error starting cast session:', err);
            if (err.code === 'cancel') {
              console.log('🎭 User cancelled Cast session');
            } else {
              alert('No se pudo conectar con el dispositivo Cast. Verifica que esté encendido.');
            }
          });
        }
      }
    } catch (error) {
      console.error('🎭 Error in handleCastToggle:', error);
    }
  }, [isCasting, src, title, currentTime]);

  const loadMediaToCast = useCallback((session) => {
    console.log('🎭 Loading media to Cast device...', { src, title, currentTime });
    
    try {
      const mediaInfo = new chrome.cast.media.MediaInfo(src, 'application/x-mpegURL');
      mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.title = title || 'Video de curso';
      mediaInfo.metadata.subtitle = 'Streaming desde tu curso';
      
      // Si hay una imagen thumbnail disponible, agregarla
      // mediaInfo.metadata.images = [new chrome.cast.Image('thumbnail-url')];
      
      const request = new chrome.cast.media.LoadRequest(mediaInfo);
      request.currentTime = Math.max(0, currentTime); // Continuar desde donde se quedó
      request.autoplay = isPlaying;
      
      console.log('🎭 Media info created:', mediaInfo);
      console.log('🎭 Load request:', request);
      
      session.loadMedia(request).then(() => {
        console.log('✅ Media loaded to Cast device successfully');
        
        // Pausar el video local cuando inicie el casting
        if (videoRef.current && isPlaying) {
          console.log('🎭 Pausing local video');
          videoRef.current.pause();
        }
      }).catch(err => {
        console.error('❌ Error loading media to Cast:', err);
        alert('Error al enviar el video al Cast. El video podría no ser compatible.');
      });
    } catch (error) {
      console.error('🎭 Error in loadMediaToCast:', error);
    }
  }, [src, title, currentTime, isPlaying]);

  // Show/hide controls
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, hideControlsDelay);
  }, [isPlaying]);

  // Utility functions
  const formatTime = useCallback((timeInSeconds) => {
    if (!timeInSeconds || timeInSeconds === Infinity) return '0:00';
    
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const getVideoErrorMessage = (code) => {
    switch (code) {
      case 1: return 'Error de red. Verifica tu conexión.';
      case 2: return 'Error de decodificación del video.';
      case 3: return 'El archivo de video está corrupto.';
      case 4: return 'Video no soportado o token expirado.';
      default: return 'Error desconocido de reproducción.';
    }
  };

  // Event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
      if (onVideoComplete) onVideoComplete();
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('error', handleVideoError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('error', handleVideoError);
    };
  }, [handleLoadedData, handleTimeUpdate, handleVideoError, onVideoComplete]);

  // Fullscreen handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenNow = !!(document.fullscreenElement || 
                                 document.webkitFullscreenElement || 
                                 document.mozFullScreenElement || 
                                 document.msFullscreenElement);
      console.log('📺 Fullscreen state changed:', isFullscreenNow);
      setIsFullscreen(isFullscreenNow);
    };

    // Añadir todos los event listeners para compatibilidad
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        preload="metadata"
        playsInline
        crossOrigin="anonymous"
      />

      {/* Loading Spinner */}
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-white text-sm">Cargando video seguro...</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center max-w-md p-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">{error.message}</h3>
            <p className="text-gray-300 text-sm mb-4">{error.details}</p>
            
            {hlsError && (
              <div className="text-xs text-gray-400 mb-4 p-2 bg-black/50 rounded">
                <strong>Detalle técnico:</strong> {hlsError.reason}
              </div>
            )}
            
            <button
              onClick={retryPlayback}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4 inline mr-2" />
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Center Play Button */}
      <AnimatePresence>
        {!isPlaying && !loading && !error && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
            onClick={togglePlay}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-6 hover:bg-white/20 transition-colors">
              <Play className="w-12 h-12 text-white ml-1" fill="currentColor" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls */}
      <AnimatePresence>
        {showControls && !loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none"
          >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 pointer-events-auto">
              <div className="flex items-center justify-between text-white">
                <h3 className="font-medium truncate">{title}</h3>
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full right-0 mt-2 bg-gray-900 rounded-lg shadow-xl border border-gray-700 min-w-32 z-10"
                      >
                        <div className="p-2">
                          <div className="text-xs text-gray-400 mb-2 px-2">Velocidad</div>
                          {playbackRates.map((rate) => (
                            <button
                              key={rate}
                              onClick={() => changePlaybackRate(rate)}
                              className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-700 transition-colors ${
                                playbackRate === rate ? 'text-red-400' : 'text-white'
                              }`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
              {/* Progress Bar Container */}
              <div className="px-3 pb-1">
                <div className="relative group">
                  <div
                    ref={progressBarRef}
                    className="w-full h-0.5 bg-white/20 rounded-full cursor-pointer group-hover:h-1 transition-all duration-200"
                    onClick={handleSeek}
                  >
                    {/* Buffered Progress */}
                    <div
                      className="absolute h-full bg-white/30 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(buffered, 100)}%` }}
                    />
                    
                    {/* Current Progress */}
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full relative shadow-sm transition-all duration-200"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    >
                      {/* Progress Handle */}
                      <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-red-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 border border-white/70" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Buttons Container */}
              <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pt-1 pb-2 backdrop-blur-sm">
                <div className="flex items-center justify-between text-white">
                  {/* Left Controls */}
                  <div className="flex items-center gap-0.5 sm:gap-2">
                    {/* Skip Back */}
                    <button
                      onClick={() => skipTime(-10)}
                      className="group p-1.5 sm:p-2 hover:bg-white/15 rounded-lg transition-all duration-200"
                      title="-10s"
                    >
                      <SkipBack className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:text-red-400 transition-colors" />
                    </button>

                    {/* Play/Pause */}
                    <button
                      onClick={togglePlay}
                      className="group p-2 sm:p-2.5 hover:bg-white/15 rounded-full transition-all duration-200 mx-1"
                    >
                      {isPlaying ? 
                        <Pause className="w-4 h-4 sm:w-5 sm:h-5 group-hover:text-red-400 transition-colors" fill="currentColor" /> : 
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5 group-hover:text-red-400 transition-colors" fill="currentColor" />
                      }
                    </button>

                    {/* Skip Forward */}
                    <button
                      onClick={() => skipTime(10)}
                      className="group p-1.5 sm:p-2 hover:bg-white/15 rounded-lg transition-all duration-200"
                      title="+10s"
                    >
                      <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:text-red-400 transition-colors" />
                    </button>

                    {/* Volume Control */}
                    <button
                      onClick={toggleMute}
                      className="p-1.5 sm:p-2 hover:bg-white/15 rounded-lg transition-all duration-200 ml-1 sm:ml-2"
                    >
                      {isMuted || volume === 0 ? 
                        <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" /> : 
                        <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      }
                    </button>
                    
                    {/* Volume Slider - Hidden on mobile */}
                    <div className="hidden sm:flex items-center ml-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-16 h-0.5 bg-white/20 rounded-full appearance-none cursor-pointer slider-custom"
                        style={{
                          background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`
                        }}
                      />
                    </div>

                    {/* Time Display - Compact */}
                    <div className="flex items-center ml-2 sm:ml-4">
                      <div className="text-xs font-mono text-white/90">
                        <span className="text-red-400">{formatTime(currentTime)}</span>
                        <span className="text-white/50 mx-0.5">/</span>
                        <span className="text-white/70">{formatTime(duration)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {/* Playback Speed - Compact */}
                    <div className="hidden sm:flex items-center mr-1">
                      <span className="text-xs font-mono text-white/70">
                        {playbackRate}x
                      </span>
                    </div>
                    
                    {/* Cast Button - Mostrar siempre para debugging */}
                    {(castAvailable || true) && (
                      <button
                        onClick={handleCastToggle}
                        className={`group p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                          isCasting 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'hover:bg-white/15 text-white'
                        }`}
                        title={isCasting ? 'Cast OFF' : 'Cast ON'}
                      >
                        <Cast className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {isCasting && (
                          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                        )}
                      </button>
                    )}
                    
                    {/* Fullscreen */}
                    <button
                      onClick={toggleFullscreen}
                      className="group p-1.5 sm:p-2 hover:bg-white/15 rounded-lg transition-all duration-200"
                      title={isFullscreen ? 'Exit' : 'Full'}
                    >
                      {isFullscreen ? 
                        <Minimize className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:text-red-400 transition-colors" /> : 
                        <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:text-red-400 transition-colors" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mux Branding */}
      <div className="absolute top-2 right-2 opacity-30 text-xs text-white bg-black/50 px-2 py-1 rounded">
        🔒 Mux
      </div>

      {/* Cast Status Indicator */}
      {isCasting && (
        <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2">
          <Cast className="w-4 h-4" />
          Reproduciendo en TV
        </div>
      )}
    </div>
  );
};

export default MuxVideoPlayer;