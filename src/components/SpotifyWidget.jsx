import React, { useEffect, useState } from 'react';
import {
  Music, Play, Pause, SkipBack, SkipForward,
  Loader2, User, Wifi
} from 'lucide-react';
import { useSpotify } from '../context/SpotifyContext';

const SpotifyWidget = ({ className = '' }) => {
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
    fetchCurrentTrack,
    loginLoading,
  } = useSpotify();

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isPlaying && currentTrack?.duration_ms) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const durationSec = currentTrack.duration_ms / 1000;
          const nextProgress = prev + (100 / durationSec);
          return nextProgress >= 100 ? 0 : nextProgress;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPlaying, currentTrack]);

  const formatDuration = (ms) => {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    isPlaying ? pause() : play();
  };

  const handleLogin = async () => {
    try {
      await login();
    } catch (err) {
      console.error('Error de login:', err);
    }
  };

  return (
    <div className={`rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-white/10 p-6 backdrop-blur-xl ${className}`}>
      {!isAuthenticated ? (
        <div className="flex flex-col justify-center items-center py-8">
          <Music className="w-12 h-12 text-green-400 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Conecta tu Spotify</h3>
          <p className="text-sm text-gray-300 text-center mb-4">Disfrutá tu música favorita mientras entrenás</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg max-w-full">
              <p className="text-xs text-red-300 text-center break-words">❌ {error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loginLoading}
            className="relative z-50 pointer-events-auto px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-full transition-colors flex items-center gap-2 shadow-lg active:scale-95"
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
      ) : loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
          <span className="ml-3 text-white">Cargando música...</span>
        </div>
      ) : currentTrack ? (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <img
              src={currentTrack.album?.images?.[0]?.url || "/placeholder.svg"}
              alt="cover"
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold truncate">{currentTrack.name}</h4>
              <p className="text-sm text-gray-300 truncate">
                {currentTrack.artists?.map((a) => a.name).join(', ')}
              </p>
            </div>
          </div>

          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
            <div
              className="h-2 bg-green-400 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mb-4">
            <span>{formatDuration(progress * currentTrack.duration_ms / 100)}</span>
            <span>{formatDuration(currentTrack.duration_ms)}</span>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button onClick={previous} className="p-2 bg-white/10 rounded-full">
              <SkipBack className="w-5 h-5 text-white" />
            </button>
            <button onClick={handlePlayPause} className="p-3 bg-green-500 rounded-full">
              {isPlaying ? (
                <Pause className="w-6 h-6 text-black" />
              ) : (
                <Play className="w-6 h-6 text-black ml-1" />
              )}
            </button>
            <button onClick={next} className="p-2 bg-white/10 rounded-full">
              <SkipForward className="w-5 h-5 text-white" />
            </button>
          </div>

          {user && (
            <div className="flex justify-center items-center gap-2 mt-4 text-sm text-gray-400">
              <User className="w-4 h-4" />
              {user.display_name}
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
};

export default SpotifyWidget;
