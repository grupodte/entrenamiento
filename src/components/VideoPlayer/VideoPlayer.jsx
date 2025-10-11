import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Download,
  RotateCcw
} from 'lucide-react';

// Utility functions to detect video types
const getVideoType = (url) => {
  if (!url) return 'unknown';
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  } else if (url.includes('vimeo.com')) {
    return 'vimeo';
  } else if (url.includes('.m3u8') || url.includes('stream.mux.com')) {
    return 'hls'; // HLS streaming (Mux, etc.)
  } else if (url.match(/\.(mp4|webm|ogg|mov)$/i)) {
    return 'direct';
  } else if (url.includes('blob:') || url.includes('data:')) {
    return 'direct';
  }
  return 'direct'; // Default to trying direct video
};

const getYouTubeEmbedUrl = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0&modestbranding=1&iv_load_policy=3`;
  }
  return url;
};

const getVimeoEmbedUrl = (url) => {
  const regExp = /vimeo.com\/(\d+)/;
  const match = url.match(regExp);
  if (match) {
    return `https://player.vimeo.com/video/${match[1]}`;
  }
  return url;
};

const VideoPlayer = ({ 
  src, 
  poster, 
  title,
  onProgressUpdate,
  onVideoComplete,
  allowDownload = false,
  showNotes = true,
  className = ""
}) => {
  const videoType = getVideoType(src);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressBarRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [videoError, setVideoError] = useState(null);
  const [hlsInstance, setHlsInstance] = useState(null);
  
  // Control visibility timeout
  const controlsTimeoutRef = useRef(null);
  const hideControlsDelay = 3000;

  // Handle play/pause
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPlaying]);

  // Handle volume change
  const handleVolumeChange = useCallback((newVolume) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted, volume]);

  // Handle seeking
  const handleSeek = useCallback((e) => {
    if (videoRef.current && progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const seekTime = pos * duration;
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  }, [duration]);

  // Skip forward/backward
  const skipForward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime += 10;
    }
  }, []);

  const skipBackward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime -= 10;
    }
  }, []);

  // Handle playback rate change
  const changePlaybackRate = useCallback((rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSettings(false);
    }
  }, []);

  // Handle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.() ||
      containerRef.current?.webkitRequestFullscreen?.() ||
      containerRef.current?.msRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() ||
      document.webkitExitFullscreen?.() ||
      document.msExitFullscreen?.();
    }
  }, []);

  // Format time display
  const formatTime = useCallback((timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

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

  // Video event handlers
  const handleLoadedData = () => {
    console.log('Video loaded successfully:', src);
    setLoading(false);
    setVideoError(null);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoError = (e) => {
    console.error('Video error:', e.target.error);
    console.error('Video src:', src);
    setLoading(false);
    setVideoError(e.target.error || { code: 0, message: 'Error desconocido al cargar el video' });
  };

  const handleLoadStart = () => {
    console.log('Starting to load video:', src);
    setLoading(true);
    setVideoError(null);
  };

  const handleCanPlay = () => {
    console.log('Video can start playing:', src);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);
      
      // Update buffered progress
      if (videoRef.current.buffered.length > 0) {
        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
        setBuffered((bufferedEnd / duration) * 100);
      }
      
      // Call progress callback
      if (onProgressUpdate) {
        onProgressUpdate({
          currentTime: current,
          duration: duration,
          percentComplete: (current / duration) * 100
        });
      }
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowControls(true);
    if (onVideoComplete) {
      onVideoComplete();
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!containerRef.current?.contains(document.activeElement)) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [togglePlay, skipBackward, skipForward, handleVolumeChange, volume, toggleFullscreen, toggleMute]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // HLS setup for Mux videos
  useEffect(() => {
    if (videoType === 'hls' && videoRef.current && src) {
      const video = videoRef.current;
      
      // Check if the browser supports HLS natively (Safari, iOS Safari)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        console.log('Using native HLS support');
        video.src = src;
        return;
      }
      
      // For other browsers, we'll try to load the video directly
      // Most modern browsers can handle HLS to some extent
      console.log('Attempting direct HLS playback');
      video.src = src;
      
      // If that doesn't work, we would need hls.js library
      // but for now, let's see if the browser can handle it
    }
    
    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
        setHlsInstance(null);
      }
    };
  }, [src, videoType, hlsInstance]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Render different video players based on video type
  const renderVideoContent = () => {
    if (videoType === 'youtube') {
      return (
        <iframe
          src={getYouTubeEmbedUrl(src)}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
        />
      );
    }
    
    if (videoType === 'vimeo') {
      return (
        <iframe
          src={getVimeoEmbedUrl(src)}
          className="w-full h-full"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={title}
        />
      );
    }
    
    // HLS video (Mux, etc.) or Direct video (MP4, WebM, etc.)
    return (
      <video
        ref={videoRef}
        src={videoType === 'hls' ? undefined : src} // For HLS, src is set in useEffect
        poster={poster}
        className="w-full h-full object-contain"
        onLoadedData={handleLoadedData}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnd}
        onPlay={handlePlay}
        onPause={handlePause}
        onClick={togglePlay}
        onError={handleVideoError}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        preload="metadata"
        crossOrigin="anonymous"
        controlsList="nodownload"
        playsInline // Important for mobile HLS playback
      />
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseMove={videoType === 'direct' || videoType === 'hls' ? showControlsTemporarily : undefined}
      onMouseLeave={videoType === 'direct' || videoType === 'hls' ? () => isPlaying && setShowControls(false) : undefined}
      onContextMenu={(e) => e.preventDefault()}
      tabIndex={0}
    >
      {/* Video Content */}
      {renderVideoContent()}

      {/* Loading Spinner - para videos directos y HLS */}
      {loading && !videoError && (videoType === 'direct' || videoType === 'hls') && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      {/* Video Error Display - para videos directos y HLS */}
      {videoError && (videoType === 'direct' || videoType === 'hls') && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-6">
          <div className="text-center max-w-md">
            <div className="bg-red-500/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Error al cargar el video</h3>
            <p className="text-gray-300 text-sm mb-4">
              {videoError.code === 1 && "Error de red. Verifica tu conexión a internet."}
              {videoError.code === 2 && "Error de decodificación. El formato del video no es compatible."}
              {videoError.code === 3 && "Error de formato. El video está corrupto o no es válido."}
              {videoError.code === 4 && "Video no soportado. Contacta al administrador."}
              {videoError.code === 0 && "Error desconocido al cargar el video."}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setVideoError(null);
                  setLoading(true);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors block mx-auto"
              >
                Reintentar
              </button>
              <p className="text-xs text-gray-400">
                Tip: Si el video es de YouTube o Vimeo, asegúrate de usar la URL correcta del navegador.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Info para embeds de YouTube/Vimeo */}
      {(videoType === 'youtube' || videoType === 'vimeo') && (
        <div className="absolute top-4 left-4 bg-black/50 rounded-lg px-3 py-1 text-white text-sm">
          <span className="capitalize">{videoType}</span> Video
        </div>
      )}

      {/* Center Play Button - para videos directos y HLS */}
      <AnimatePresence>
        {!isPlaying && !loading && (videoType === 'direct' || videoType === 'hls') && (
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

      {/* Controls Overlay - para videos directos y HLS */}
      <AnimatePresence>
        {showControls && !loading && (videoType === 'direct' || videoType === 'hls') && (
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
                <div className="flex items-center gap-2">
                  {allowDownload && (
                    <button className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                    
                    {/* Settings Menu */}
                    <AnimatePresence>
                      {showSettings && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full right-0 mt-2 bg-gray-900 rounded-lg shadow-xl border border-gray-700 min-w-32"
                        >
                          <div className="p-2">
                            <div className="text-xs text-gray-400 mb-2 px-2">Velocidad</div>
                            {playbackRates.map((rate) => (
                              <button
                                key={rate}
                                onClick={() => changePlaybackRate(rate)}
                                className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-700 transition-colors ${
                                  playbackRate === rate ? 'text-purple-400' : 'text-white'
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
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
              {/* Progress Bar */}
              <div className="mb-4">
                <div
                  ref={progressBarRef}
                  className="w-full h-1 bg-white/30 rounded-full cursor-pointer hover:h-2 transition-all"
                  onClick={handleSeek}
                >
                  {/* Buffered Progress */}
                  <div
                    className="absolute h-full bg-white/50 rounded-full"
                    style={{ width: `${buffered}%` }}
                  />
                  {/* Current Progress */}
                  <div
                    className="h-full bg-purple-500 rounded-full relative"
                    style={{ width: `${progressPercentage}%` }}
                  >
                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-purple-500 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  {/* Skip Back */}
                  <button
                    onClick={skipBackward}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Retroceder 10s"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>

                  {/* Play/Pause */}
                  <button
                    onClick={togglePlay}
                    className="p-3 hover:bg-white/20 rounded-full transition-colors"
                  >
                    {isPlaying ? 
                      <Pause className="w-6 h-6" fill="currentColor" /> : 
                      <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                    }
                  </button>

                  {/* Skip Forward */}
                  <button
                    onClick={skipForward}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Avanzar 10s"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>

                  {/* Volume Control */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      {isMuted || volume === 0 ? 
                        <VolumeX className="w-5 h-5" /> : 
                        <Volume2 className="w-5 h-5" />
                      }
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-20 h-1 bg-white/30 rounded-full appearance-none slider"
                    />
                  </div>

                  {/* Time Display */}
                  <div className="text-sm font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Playback Rate */}
                  <span className="text-sm font-mono">
                    {playbackRate}x
                  </span>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    {isFullscreen ? 
                      <Minimize className="w-5 h-5" /> : 
                      <Maximize className="w-5 h-5" />
                    }
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Hint */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded px-2 py-1 text-xs text-white pointer-events-none">
        Espacio: Play/Pausa | ← →: Saltar | ↑ ↓: Volumen | F: Pantalla completa
      </div>
    </div>
  );
};

export default VideoPlayer;
