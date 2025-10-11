import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import './MuxVideoPlayer.css';
import './MuxVideoPlayer-mobile.css';
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
  const [showMobileHint, setShowMobileHint] = useState(false);
  const castRef = useRef(null);
  const mobileHintTimeoutRef = useRef(null);
  
  // Control visibility timeout
  const controlsTimeoutRef = useRef(null);
  const hideControlsDelay = 3000;
  
  // Detect mobile device (moved up to be available for other functions)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  // Show controls temporarily function
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // En móviles, mantener controles más tiempo
    const delay = isMobile ? 5000 : hideControlsDelay;
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSettings) {
        setShowControls(false);
      }
    }, delay);
  }, [isPlaying, showSettings, isMobile, hideControlsDelay]);
  
  // Show mobile hint temporarily for first-time mobile users
  const showMobileHintTemporarily = useCallback(() => {
    if (!isMobile) return;
    
    setShowMobileHint(true);
    
    if (mobileHintTimeoutRef.current) {
      clearTimeout(mobileHintTimeoutRef.current);
    }
    
    mobileHintTimeoutRef.current = setTimeout(() => {
      setShowMobileHint(false);
    }, 3000);
  }, [isMobile]);

  // Initialize Google Cast SDK (only for Chrome)
  useEffect(() => {
    // Solo inicializar Cast en Chrome (desktop y móvil)
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    if (!isChrome) {
      console.log('🎭 Google Cast only works in Chrome browser');
      setCastAvailable(false);
      return;
    }
    
    let scriptLoaded = false;
    let castInitialized = false;
    
    const initializeCast = () => {
      if (castInitialized) return;
      
      console.log('🎭 Initializing Google Cast SDK...');
      
      // Verificar que el API esté disponible
      if (!window.chrome?.cast || !window.cast?.framework) {
        console.warn('🎭 Cast API not fully loaded yet, retrying...');
        setTimeout(initializeCast, 500);
        return;
      }
      
      try {
        castInitialized = true;
        const context = cast.framework.CastContext.getInstance();
        
        // Configuración más específica
        context.setOptions({
          receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
          resumeSavedSession: true,
          language: 'es',
          androidReceiverCompatible: true
        });
        
        console.log('🎭 Cast context configured successfully');

        // Listener para cambios de estado del cast
        const stateChangeHandler = (event) => {
          const castState = event.castState;
          console.log('🎭 Cast state changed to:', castState);
          
          switch (castState) {
            case cast.framework.CastState.CONNECTED:
              setIsCasting(true);
              setCastAvailable(true);
              break;
            case cast.framework.CastState.NOT_CONNECTED:
              setIsCasting(false);
              setCastAvailable(true);
              break;
            case cast.framework.CastState.NO_DEVICES_AVAILABLE:
              setIsCasting(false);
              setCastAvailable(false);
              break;
            default:
              setIsCasting(false);
              setCastAvailable(false);
          }
        };
        
        context.addEventListener(
          cast.framework.CastContextEventType.CAST_STATE_CHANGED,
          stateChangeHandler
        );

        // Verificar estado inicial con retry
        const checkInitialState = () => {
          try {
            const initialState = context.getCastState();
            console.log('🎭 Initial cast state:', initialState);
            
            stateChangeHandler({ castState: initialState });
          } catch (err) {
            console.warn('🎭 Error getting initial cast state, retrying...', err);
            setTimeout(checkInitialState, 1000);
          }
        };
        
        checkInitialState();
        
      } catch (error) {
        console.error('🎭 Error setting up Cast context:', error);
        castInitialized = false;
      }
    };

    // Definir el callback global antes de cargar el script
    window['__onGCastApiAvailable'] = (isAvailable) => {
      console.log('🎭 Google Cast API callback - available:', isAvailable);
      
      if (isAvailable) {
        // Esperar un poco más para que el framework se inicialice completamente
        setTimeout(initializeCast, 1000);
      } else {
        console.warn('🎭 Cast API not available');
        setCastAvailable(false);
      }
    };

    // Cargar Google Cast SDK si no está ya cargado
    if (!window.chrome?.cast && !scriptLoaded) {
      console.log('🎭 Loading Google Cast SDK script...');
      
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      script.async = true;
      
      script.onload = () => {
        console.log('🎭 Cast SDK script loaded successfully');
        scriptLoaded = true;
      };
      
      script.onerror = (error) => {
        console.error('🎭 Failed to load Cast SDK script:', error);
        setCastAvailable(false);
      };
      
      document.head.appendChild(script);
    } else if (window.chrome?.cast && window.cast?.framework) {
      console.log('🎭 Cast SDK already available, initializing...');
      setTimeout(initializeCast, 100);
    } else {
      console.log('🎭 Cast partially loaded, waiting...');
      setTimeout(initializeCast, 1000);
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
      console.log('🍥 Using native HLS support', { isMobile, isIOS, isAndroid });
      video.src = src;
      
      // Para iOS, asegurar que el video esté listo
      if (isIOS) {
        video.addEventListener('loadedmetadata', () => {
          console.log('🍥 iOS video metadata loaded');
          setLoading(false);
        }, { once: true });
      } else {
        setLoading(false);
      }
      return;
    }

    // Use hls.js for other browsers
    if (Hls.isSupported()) {
      console.log('🍥 Initializing hls.js for Mux playback', { isMobile, isIOS, isAndroid });
      
      // Configuración optimizada para móviles
      const hlsConfig = {
        debug: process.env.NODE_ENV === 'development',
        enableWorker: !isMobile, // Deshabilitar worker en móviles para mayor compatibilidad
        lowLatencyMode: false,
        backBufferLength: isMobile ? 30 : 90, // Buffer menor en móviles
        maxBufferLength: isMobile ? 60 : 300,
        maxMaxBufferLength: isMobile ? 120 : 600,
        // Timeouts más conservadores para móviles
        manifestLoadingTimeOut: isMobile ? 20000 : 10000, // 20s para móviles
        manifestLoadingMaxRetry: isMobile ? 4 : 6,
        levelLoadingTimeOut: isMobile ? 20000 : 10000, // 20s para móviles
        levelLoadingMaxRetry: isMobile ? 4 : 3,
        fragLoadingTimeOut: isMobile ? 40000 : 20000, // 40s para móviles
        fragLoadingMaxRetry: isMobile ? 6 : 4,
        // Configuración específica para móviles
        startLevel: isMobile ? 0 : -1, // Empezar con calidad baja en móviles
        testBandwidth: !isMobile,
        progressive: isMobile, // Habilitar descarga progresiva en móviles
        liveSyncDurationCount: isMobile ? 2 : 3,
        liveMaxLatencyDurationCount: isMobile ? 4 : 5,
        // Configuración avanzada para recuperación de errores
        xhrSetup: (xhr, url) => {
          xhr.timeout = isMobile ? 45000 : 30000; // Timeout más largo para móviles
          if (isMobile) {
            xhr.withCredentials = false;
          }
        }
      };
      
      console.log('🍥 HLS Config:', hlsConfig);
      const hls = new Hls(hlsConfig);
      
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
              console.log('🔄 Network error, attempting recovery...', data.details);
              // Intentar recargar con reintentos graduales
              setTimeout(() => {
                if (hlsRef.current) {
                  hls.startLoad();
                }
              }, isMobile ? 2000 : 1000);
              break;
              
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('🔄 Media error, attempting recovery...', data.details);
              // Intentar recuperar con más tiempo en móviles
              setTimeout(() => {
                if (hlsRef.current) {
                  hls.recoverMediaError();
                }
              }, isMobile ? 3000 : 1500);
              break;
              
            default:
              console.error('💀 Fatal error, destroying player', data);
              setError({
                type: 'fatal',
                message: isMobile 
                  ? 'Error de conexión. Verifica tu red e intenta de nuevo.' 
                  : 'Error crítico de reproducción',
                details: data.reason || data.details || 'Error desconocido'
              });
              
              // En móviles, intentar una recuperación final
              if (isMobile) {
                setTimeout(() => {
                  console.log('🔄 Final recovery attempt on mobile...');
                  setError(null);
                  setLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }, 5000);
              } else {
                hls.destroy();
                hlsRef.current = null;
              }
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
      const video = videoRef.current;
      setDuration(video.duration);
      setLoading(false);
      
      console.log('📱 Video loaded data:', {
        duration: video.duration,
        readyState: video.readyState,
        networkState: video.networkState,
        isMobile,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });
      
      // En móviles, no hacer autoplay
      if (autoplay && !isMobile) {
        video.play().catch(err => {
          console.warn('📱 Autoplay failed:', err);
        });
      }
    }
  }, [autoplay, isMobile]);

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
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    try {
      if (isPlaying) {
        console.log('📱 Pausing video...');
        await video.pause();
      } else {
        console.log('📱 Attempting to play video...', {
          readyState: video.readyState,
          networkState: video.networkState,
          src: video.src ? 'present' : 'missing'
        });
        
        // Para móviles, intentar cargar primero si no está listo
        if (video.readyState < 2) {
          console.log('📱 Video not ready, loading...');
          video.load();
          await new Promise(resolve => {
            const handleCanPlay = () => {
              video.removeEventListener('canplay', handleCanPlay);
              resolve();
            };
            video.addEventListener('canplay', handleCanPlay);
          });
        }
        
        // Intentar reproducir
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          console.log('📱 Video playing successfully');
        }
      }
    } catch (err) {
      console.error('📱 Play/pause error:', err);
      
      // Manejar errores específicos de móviles
      if (err.name === 'NotAllowedError') {
        console.warn('📱 Autoplay prevented by browser. User interaction required.');
        // En móviles, mostrar hint visual en lugar de alert
        if (isMobile) {
          showMobileHintTemporarily();
        } else {
          alert('Toca el botón de reproducción para iniciar el video.');
        }
      } else if (err.name === 'AbortError') {
        console.warn('📱 Play request was interrupted');
      } else if (err.name === 'NotSupportedError') {
        console.error('📱 Video format not supported');
        alert('Formato de video no soportado en este dispositivo.');
      } else {
        console.error('📱 Unknown playback error:', err.message);
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
    
    if (!src) {
      console.error('🎭 No video source available for casting');
      alert('No hay video disponible para enviar al Cast.');
      return;
    }
    
    try {
      // Verificar que session esté activa
      if (!session || session.getSessionState() !== cast.framework.SessionState.SESSION_STARTED) {
        console.error('🎭 Cast session not active');
        return;
      }
      
      // Crear MediaInfo con más configuraciones
      const mediaInfo = new chrome.cast.media.MediaInfo(src, 'application/x-mpegURL');
      
      // Configurar metadata
      mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.title = title || 'Video de curso';
      mediaInfo.metadata.subtitle = 'Streaming desde DD Fitness';
      
      // Configuración de streaming
      mediaInfo.streamType = chrome.cast.media.StreamType.BUFFERED;
      mediaInfo.duration = duration || null;
      
      // Configuración de tracks (para HLS adaptativo)
      mediaInfo.customData = {
        hls: true,
        adaptive: true
      };
      
      // Si hay una imagen thumbnail disponible
      if (window.location.origin) {
        try {
          mediaInfo.metadata.images = [
            new chrome.cast.Image(`${window.location.origin}/icons/icon-192x192.png`)
          ];
        } catch (e) {
          console.log('🎭 Could not set cast image:', e);
        }
      }
      
      // Crear LoadRequest con más configuraciones
      const request = new chrome.cast.media.LoadRequest(mediaInfo);
      request.currentTime = Math.max(0, Math.floor(currentTime)); // Asegurar que sea entero
      request.autoplay = true; // Siempre autoplay en cast
      
      // Configuración adicional
      request.playbackRate = playbackRate;
      request.activeTrackIds = [];
      
      console.log('🎭 Media info created:', {
        src: mediaInfo.contentId,
        contentType: mediaInfo.contentType,
        duration: mediaInfo.duration,
        currentTime: request.currentTime,
        metadata: mediaInfo.metadata
      });
      
      // Enviar al Cast con mejor manejo de promesa
      session.loadMedia(request)
        .then(() => {
          console.log('✅ Media loaded to Cast device successfully');
          
          // Pausar el video local cuando inicie el casting
          if (videoRef.current && isPlaying) {
            console.log('🎭 Pausing local video for cast');
            videoRef.current.pause();
          }
          
          // Agregar listener para eventos del media en cast
          const castMedia = session.getMediaSession();
          if (castMedia) {
            const mediaUpdateHandler = (isAlive) => {
              if (isAlive) {
                console.log('🎭 Cast media update - still alive');
              } else {
                console.log('🎭 Cast media ended');
              }
            };
            
            castMedia.addUpdateListener(mediaUpdateHandler);
          }
          
        })
        .catch(err => {
          console.error('❌ Error loading media to Cast:', {
            code: err.code,
            description: err.description,
            details: err.details
          });
          
          // Mensajes de error más específicos
          let errorMessage = 'Error al enviar el video al Cast.';
          if (err.code === 'LOAD_FAILED') {
            errorMessage = 'El dispositivo Cast no puede reproducir este formato de video.';
          } else if (err.code === 'INVALID_PARAMETER') {
            errorMessage = 'Parámetros de video inválidos para Cast.';
          } else if (err.code === 'LOAD_CANCELLED') {
            errorMessage = 'Carga cancelada por el usuario.';
          }
          
          alert(errorMessage);
        });
        
    } catch (error) {
      console.error('🎭 Error in loadMediaToCast:', error);
      alert('Error técnico al configurar el Cast. Intenta de nuevo.');
    }
  }, [src, title, currentTime, isPlaying, duration, playbackRate]);


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

    const handlePlay = () => {
      console.log('📱 Video started playing');
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      console.log('📱 Video paused');
      setIsPlaying(false);
    };
    
    const handleEnded = () => {
      console.log('📱 Video ended');
      setIsPlaying(false);
      setShowControls(true);
      if (onVideoComplete) onVideoComplete();
    };

    // Eventos específicos para móviles
    const handleCanPlay = () => {
      console.log('📱 Video can play - ready for interaction');
      setLoading(false);
    };
    
    const handleWaiting = () => {
      console.log('📱 Video waiting for data...');
      setLoading(true);
    };
    
    const handleCanPlayThrough = () => {
      console.log('📱 Video can play through without stopping');
      setLoading(false);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('error', handleVideoError);
    
    // Eventos adicionales para móviles
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplaythrough', handleCanPlayThrough);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('error', handleVideoError);
      
      // Limpiar eventos adicionales para móviles
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
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
      if (mobileHintTimeoutRef.current) {
        clearTimeout(mobileHintTimeoutRef.current);
      }
    };
  }, []);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div
      ref={containerRef}
      className={`mux-video-player relative bg-black rounded-lg overflow-hidden group ${className} ${isMobile ? 'mobile' : ''} ${isFullscreen ? 'fullscreen-mobile' : ''}`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onTouchStart={() => isMobile && showControlsTemporarily()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onTouchStart={(e) => {
          // En iOS, el primer toque puede ser necesario para activar el video
          if (videoRef.current && videoRef.current.paused && isMobile) {
            e.preventDefault();
            console.log('📱 iOS touch start - preparing video for play');
            videoRef.current.load(); // Pre-cargar
          }
        }}
        preload="metadata"
        playsInline
        webkit-playsinline="true"
        crossOrigin="anonymous"
        controls={false}
        muted={muted}
        style={{
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'manipulation'
        }}
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
            <div className="center-play-button bg-white/10 backdrop-blur-sm rounded-full p-6 hover:bg-white/20 transition-colors">
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
                <h3 className="video-title font-medium truncate">{title}</h3>
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
                    {(castAvailable || process.env.NODE_ENV === 'development') && (
                      <button
                        onClick={handleCastToggle}
                        className={`group p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                          isCasting 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : castAvailable 
                              ? 'hover:bg-white/15 text-white'
                              : 'hover:bg-red-500/20 text-red-400'
                        }`}
                        title={
                          isCasting ? 'Desconectar Cast' : 
                          castAvailable ? 'Conectar a Cast' : 
                          'Cast no disponible (solo Chrome)'
                        }
                      >
                        <Cast className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    )}
                    
                    {/* Debug Cast Button - Solo en desarrollo */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="relative">
                        <button
                          onClick={() => {
                            console.log('🎭 CAST DEBUG INFO:');
                            console.log('- castAvailable:', castAvailable);
                            console.log('- isCasting:', isCasting);
                            console.log('- Chrome Cast API:', !!window.chrome?.cast);
                            console.log('- Cast Framework:', !!window.cast?.framework);
                            console.log('- Browser:', navigator.userAgent);
                            if (window.cast?.framework) {
                              try {
                                const context = cast.framework.CastContext.getInstance();
                                console.log('- Cast State:', context.getCastState());
                                console.log('- Session:', context.getCurrentSession());
                              } catch (e) {
                                console.error('- Error getting cast info:', e);
                              }
                            }
                          }}
                          className="p-1.5 sm:p-2 hover:bg-yellow-500/20 rounded-lg transition-all duration-200 text-yellow-400"
                          title="Debug Cast Info"
                        >
                          <span className="text-xs font-mono">DEBUG</span>
                        </button>
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                      </div>
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
      
      {/* Mobile Touch Hint */}
      <AnimatePresence>
        {showMobileHint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 backdrop-blur-sm border border-white/20"
          >
            <div className="w-6 h-6 border-2 border-white/60 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
            </div>
            Toca para reproducir el video
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MuxVideoPlayer;