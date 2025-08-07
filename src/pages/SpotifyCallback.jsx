import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSpotify } from '../context/SpotifyContext';
import { Loader2, Music, AlertCircle } from 'lucide-react';

const SpotifyCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { exchangeCodeForTokens } = useSpotify();
  const [status, setStatus] = useState('processing'); // processing, success, error

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        console.error('Error de autorización de Spotify:', error);
        setStatus('error');
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
        return;
      }

      if (code) {
        try {
          await exchangeCodeForTokens(code);
          setStatus('success');
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } catch (error) {
          console.error('Error intercambiando código:', error);
          setStatus('error');
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
      } else {
        setStatus('error');
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, exchangeCodeForTokens, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900 flex items-center justify-center p-4">
      <div className="bg-black/50 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center border border-green-500/20">
        {status === 'processing' && (
          <>
            <div className="mb-6">
              <Loader2 className="w-16 h-16 text-green-400 animate-spin mx-auto mb-4" />
              <Music className="w-8 h-8 text-green-400 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Conectando con Spotify
            </h2>
            <p className="text-gray-300">
              Estamos configurando tu conexión con Spotify...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              ¡Conectado exitosamente!
            </h2>
            <p className="text-gray-300">
              Tu cuenta de Spotify ha sido vinculada correctamente.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Error de conexión
            </h2>
            <p className="text-gray-300">
              No se pudo conectar con Spotify. Inténtalo de nuevo más tarde.
            </p>
          </>
        )}

        <div className="mt-6">
          <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-1 bg-green-400 rounded-full animate-pulse" style={{ width: '100%' }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Redirigiendo al dashboard...
          </p>
        </div>
      </div>
    </div>
  );
};

export default SpotifyCallback;
