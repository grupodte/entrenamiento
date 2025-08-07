import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Pause, SkipBack, SkipForward, ExternalLink, Loader2, User, Volume2, VolumeX, Repeat, Shuffle, X } from 'lucide-react';
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

  // Manejar play/pause
  const handlePlayPause = async () => {
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

  // Widget compacto
  const CompactWidget = () => (
    <div className={`rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-white/10 p-4 h-32 backdrop-blur-xl ${className}`}>
      {!isAuthenticated ? (
        <div className="h-full flex flex-col justify-center items-center">
          <Music className="w-6 h-6 text-green-400 mb-2" />
          <button
            onClick={login}
            className="text-xs text-green-300 hover:text-green-200 transition-colors font-medium px-3 py-1 rounded-full bg-green-500/20 hover:bg-green-500/30"
          >
            Conectar Spotify
          </button>
          {error && (
            <p className="text-xs text-red-300 mt-1 text-center">{error}</p>
          )}
        </div>
      ) : loading ? (
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
        </div>
      ) : currentTrack ? (
        <div className="h-full flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-300">Spotify</span>
            {isPlaying && (
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-3 bg-green-400 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0">
            <h4 className="text-sm font-semibold text-white truncate mb-1">
              {currentTrack.name}
            </h4>
            <p className="text-xs text-gray-300 truncate">
              {currentTrack.artists?.map(artist => artist.name).join(', ') || 'Artista desconocido'}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={previous}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                disabled={loading}
              >
                <SkipBack className="w-3 h-3 text-white" />
              </button>
              <button
                onClick={handlePlayPause}
                className="p-1.5 rounded-full bg-green-500 hover:bg-green-400 transition-colors"
                disabled={loading}
              >
                {isPlaying ? (
                  <Pause className="w-3 h-3 text-black" />
                ) : (
                  <Play className="w-3 h-3 text-black ml-0.5" />
                )}
              </button>
              <button
                onClick={next}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                disabled={loading}
              >
                <SkipForward className="w-3 h-3 text-white" />
              </button>
            </div>

            <button
              onClick={() => setShowFullPlayer(true)}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ExternalLink className="w-3 h-3 text-white" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden mt-2">
            <div
              className="h-1 bg-green-400 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col justify-center items-center">
          <Music className="w-6 h-6 text-gray-400 mb-2" />
          <p className="text-xs text-gray-400 text-center mb-2">
            No hay música reproduciéndose
          </p>
          <button
            onClick={fetchCurrentTrack}
            className="text-xs text-green-300 hover:text-green-200 transition-colors px-2 py-1 rounded bg-green-500/20 hover:bg-green-500/30"
          >
            Actualizar
          </button>
        </div>
      )}
    </div>
  );

  // Reproductor completo
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

                {/* Vinyl effect */}
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
      <CompactWidget />
      <FullPlayer />
    </>
  );
};

export default SpotifyWidget;
