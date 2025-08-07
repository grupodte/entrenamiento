import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music, Play, Pause, SkipBack, SkipForward, ExternalLink, Loader2, User, Volume2, VolumeX, Repeat, Shuffle, X, AlertCircle, Wifi
} from 'lucide-react';
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

  // Manejar login
  const handleLogin = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    console.log('🔑 Client ID disponible:', !!clientId);

    if (!clientId) {
      alert('⚠️ VITE_SPOTIFY_CLIENT_ID no está definido. Revisa tu archivo .env y reinicia el servidor.');
      return;
    }

    try {
      setLoginLoading(true);
      await login();
    } catch (error) {
      console.error('❌ Error en login:', error);
      alert(`Error al conectar con Spotify: ${error.message}`);
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePlayPause = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      isPlaying ? await pause() : await play();
    } catch (error) {
      console.error('❌ Error controlando reproducción:', error);
    }
  };

  const ExpandedWidget = () => (
    <div className={`rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-white/10 p-6 backdrop-blur-xl ${className}`}>
      {!isAuthenticated ? (
        <div className="flex flex-col justify-center items-center py-8">
          <Music className="w-12 h-12 text-green-400 mb-4" />

          <h3 className="text-lg font-semibold text-white mb-2">Conecta tu Spotify</h3>
          <p className="text-sm text-gray-300 text-center mb-4">Disfruta de tu música favorita mientras entrenas</p>

          {/* Aviso si falta la variable */}
          {!import.meta.env.VITE_SPOTIFY_CLIENT_ID && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-300 text-center">
                ⚠️ Spotify no está configurado. Revisa tu archivo .env y reinicia el servidor.
              </p>
            </div>
          )}

          {/* Error del contexto */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg max-w-full">
              <p className="text-xs text-red-300 text-center break-words">❌ {error}</p>
            </div>
          )}

          {/* Botón */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={loginLoading || !import.meta.env.VITE_SPOTIFY_CLIENT_ID}
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
              <p className="text-sm text-gray-300 truncate">{currentTrack.artists?.map(a => a.name).join(', ')}</p>
            </div>
          </div>

          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
            <div className="h-2 bg-green-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
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

  return (
    <>
    
      <ExpandedWidget />
    </>
  );
};

export default SpotifyWidget;
