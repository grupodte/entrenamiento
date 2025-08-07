import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Pause, SkipBack, SkipForward, ExternalLink, Loader2, User, Volume2, VolumeX, Repeat, Shuffle, X, AlertCircle, Wifi } from 'lucide-react';
import { useSpotify } from '../context/SpotifyContext';

const SpotifyWidget = ({ className = "" }) => {
  const {
    isAuthenticated,
    currentTrack,
    isPlaying,
    user,
    loading,
    error,
    login,
    play,
    pause,
    next,
    previous,
    fetchCurrentTrack
  } = useSpotify();

  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loginLoading, setLoginLoading] = useState(false);

  // Simular progreso de la canción
  useEffect(() => {
    if (isPlaying && currentTrack) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / (currentTrack.duration_ms / 1000));
          return newProgress >= 100 ? 0 : newProgress;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPlaying, currentTrack]);

  // Formatear duración
  const formatDuration = (ms) => {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Manejar login con debugging mejorado
  const handleLogin = async (e) => {
    // Prevenir propagación del evento
    e.preventDefault();
    e.stopPropagation();

    console.log('🎵 Click detectado en botón Conectar Spotify');

    try {
      setLoginLoading(true);

      // Verificar que tenemos el CLIENT_ID
      const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
      console.log('🔑 Client ID disponible:', !!clientId);
      console.log('🔑 Client ID (primeros 8 chars):', clientId?.substring(0, 8) + '...');

      if (!clientId) {
        throw new Error('VITE_SPOTIFY_CLIENT_ID no está configurado en el archivo .env');
      }

      console.log('🔄 Llamando a función login...');

      // Llamar a la función login
      await login();

      console.log('✅ Login ejecutado');

    } catch (error) {
      console.error('❌ Error en handleLogin:', error);
      alert(`Error al conectar con Spotify: ${error.message}`);
    } finally {
      setLoginLoading(false);
    }
  };

  // Manejar play/pause
  const handlePlayPause = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (isPlaying) {
        await pause();
      } else {
        await play();
      }
    } catch (error) {
      console.error('Error controlando reproducción:', error);
    }
  };

  // Widget expandido para el SwipeWidget
  const ExpandedWidget = () => (
    <div className={`rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-white/10 p-6 backdrop-blur-xl ${className}`}>
      {!isAuthenticated ? (
        <div className="flex flex-col justify-center items-center py-8">
          <div className="relative mb-4">
            <Music className="w-12 h-12 text-green-400" />
            {!import.meta.env.VITE_SPOTIFY_CLIENT_ID && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <h3 className="text-lg font-semibold text-white mb-2">Conecta tu Spotify</h3>
          <p className="text-sm text-gray-300 text-center mb-4">
            Disfruta de tu música favorita mientras entrenas
          </p>

          {/* Mostrar error de configuración */}
          {!import.meta.env.VITE_SPOTIFY_CLIENT_ID && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-300 text-center">
                ⚠️ Spotify no configurado. Revisa tu archivo .env
              </p>
            </div>
          )}

          {/* Mostrar error general */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg max-w-full">
              <p className="text-xs text-red-300 text-center break-words">
                ❌ {error}
              </p>
            </div>
          )}

          {/* Botón de conexión con mejor manejo de eventos */}
          <div className="w-full flex justify-center">
            <button
              type="button"
              onClick={handleLogin}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              disabled={loginLoading || !import.meta.env.VITE_SPOTIFY_CLIENT_ID}
              className="px-6 py-3 bg-green-500 hover:bg-green-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold rounded-full transition-colors flex items-center gap-2 shadow-lg active:scale-95 transform"
              style={{
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" />
                  Conectar Spotify
                </>
              )}
            </button>
          </div>

          {/* Debug info en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-2 bg-gray-800/50 rounded text-xs text-gray-400 font-mono">
              <div>Client ID: {import.meta.env.VITE_SPOTIFY_CLIENT_ID ? '✅ Configurado' : '❌ Faltante'}</div>
              <div>Redirect: {window.location.origin}/callback/spotify</div>
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
          <span className="ml-3 text-white">Cargando música...</span>
        </div>
      ) : currentTrack ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-green-400" />
              <span className="text-sm text-green-300 font-medium">Spotify</span>
              {isPlaying && (
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-4 bg-green-400 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowFullPlayer(true)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Album Art y Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
              {currentTrack.album?.images?.[0] ? (
                <img
                  src={currentTrack.album.images[0].url || "/placeholder.svg"}
                  alt={currentTrack.album.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-6 h-6 text-gray-600" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-semibold text-white truncate mb-1">
                {currentTrack.name}
              </h4>
              <p className="text-sm text-gray-300 truncate">
                {currentTrack.artists?.map(artist => artist.name).join(', ') || 'Artista desconocido'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {currentTrack.album?.name || 'Álbum desconocido'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-2 bg-green-400 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{formatDuration(progress * (currentTrack.duration_ms || 0) / 100)}</span>
              <span>{formatDuration(currentTrack.duration_ms)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={previous}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              disabled={loading}
            >
              <SkipBack className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={handlePlayPause}
              className="p-4 rounded-full bg-green-500 hover:bg-green-400 transition-colors shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-6 h-6 text-black animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 text-black" />
              ) : (
                <Play className="w-6 h-6 text-black ml-1" />
              )}
            </button>

            <button
              onClick={next}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              disabled={loading}
            >
              <SkipForward className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/10">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">
                {user.display_name}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center py-8">
          <Music className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No hay música</h3>
          <p className="text-sm text-gray-400 text-center mb-4">
            No se está reproduciendo música en Spotify
          </p>
          <button
            onClick={fetchCurrentTrack}
            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-full transition-colors"
          >
            Actualizar
          </button>
        </div>
      )}
    </div>
  );

  // Reproductor completo (modal) - mantener igual pero con mejor manejo de eventos
  const FullPlayer = () => (
    <AnimatePresence>
      {showFullPlayer && currentTrack && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/80 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFullPlayer(false)}
          />

          <motion.div
            className="fixed inset-x-4 top-1/2 transform -translate-y-1/2 z-50 max-w-md mx-auto"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="bg-gradient-to-br from-green-900/90 to-black/90 backdrop-blur-xl rounded-3xl p-6 border border-green-500/20">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-300 font-medium">Spotify</span>
                </div>
                <button
                  onClick={() => setShowFullPlayer(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Album Art */}
              <div className="relative mb-6">
                <div className="aspect-square rounded-2xl overflow-hidden bg-gray-800 shadow-2xl">
                  {currentTrack.album?.images?.[0] ? (
                    <img
                      src={currentTrack.album.images[0].url || "/placeholder.svg"}
                      alt={currentTrack.album.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                </div>

                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent via-transparent to-black/20" />
              </div>

              {/* Track Info */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">
                  {currentTrack.name}
                </h2>
                <p className="text-green-300 mb-1">
                  {currentTrack.artists?.map(artist => artist.name).join(', ') || 'Artista desconocido'}
                </p>
                <p className="text-sm text-gray-400">
                  {currentTrack.album?.name || 'Álbum desconocido'}
                </p>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-2 bg-green-400 rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{formatDuration(progress * (currentTrack.duration_ms || 0) / 100)}</span>
                  <span>{formatDuration(currentTrack.duration_ms)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <Shuffle className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={previous}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  disabled={loading}
                >
                  <SkipBack className="w-6 h-6 text-white" />
                </button>

                <button
                  onClick={handlePlayPause}
                  className="p-4 rounded-full bg-green-500 hover:bg-green-400 transition-colors shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-8 h-8 text-black animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-8 h-8 text-black" />
                  ) : (
                    <Play className="w-8 h-8 text-black ml-1" />
                  )}
                </button>

                <button
                  onClick={next}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  disabled={loading}
                >
                  <SkipForward className="w-6 h-6 text-white" />
                </button>

                <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <Repeat className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-white" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-white" />
                  )}
                </button>

                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer slider"
                  />
                </div>

                <span className="text-xs text-gray-400 w-8 text-right">
                  {isMuted ? 0 : volume}
                </span>
              </div>

              {/* User info */}
              {user && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/10">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">
                    Conectado como {user.display_name}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <ExpandedWidget />
      <FullPlayer />
    </>
  );
};

export default SpotifyWidget;
