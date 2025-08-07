// ✅ SpotifyWidget.jsx final corregido
import React, { useState, useEffect } from 'react';
import { Music, Wifi, Loader2 } from 'lucide-react';
import { useSpotify } from '../context/SpotifyContext';

const SpotifyWidget = () => {
  const { login, error, loginLoading = false } = useSpotify();
  const [clientId, setClientId] = useState(null);

  useEffect(() => {
    setClientId(import.meta.env.VITE_SPOTIFY_CLIENT_ID);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (!clientId) throw new Error('VITE_SPOTIFY_CLIENT_ID no configurado');
      await login();
    } catch (err) {
      console.error('Error en login Spotify:', err);
    }
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-white/10 p-6 backdrop-blur-xl w-full">
      <div className="flex flex-col justify-center items-center py-4">
        <Music className="w-10 h-10 text-green-400 mb-2" />
        <h3 className="text-lg font-semibold text-white mb-2">Conecta tu Spotify</h3>
        <p className="text-sm text-gray-300 text-center mb-4">
          Disfrutá tu música favorita mientras entrenás
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg max-w-full">
            <p className="text-xs text-red-300 text-center break-words">❌ {error}</p>
          </div>
        )}

        {!clientId && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-300 text-center">
              ⚠️ Spotify no está configurado. Revisa tu archivo .env
            </p>
          </div>
        )}

        <button
          type="button"
          role="button"
          onClick={handleLogin}
          disabled={loginLoading || !clientId}
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
    </div>
  );
};

export default SpotifyWidget;
