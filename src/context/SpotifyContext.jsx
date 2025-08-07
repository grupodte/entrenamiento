import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SpotifyContext = createContext();

// Configuración de Spotify
const SPOTIFY_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_SPOTIFY_CLIENT_ID || process.env.REACT_APP_SPOTIFY_CLIENT_ID,
  REDIRECT_URI: `${window.location.origin}/callback/spotify`,
  SCOPES: [
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-recently-played',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
    'streaming',
    'user-read-email',
    'user-read-private'
  ].join(' ')
};

export const SpotifyProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [device, setDevice] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generar URL de autorización
  const getAuthUrl = useCallback(() => {
    if (!SPOTIFY_CONFIG.CLIENT_ID) {
      throw new Error('VITE_SPOTIFY_CLIENT_ID no está configurado en el archivo .env');
    }

    const params = new URLSearchParams({
      client_id: SPOTIFY_CONFIG.CLIENT_ID,
      response_type: 'code',
      redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
      scope: SPOTIFY_CONFIG.SCOPES,
      show_dialog: 'true'
    });

    const url = `https://accounts.spotify.com/authorize?${params.toString()}`;

    // 🔍 DEBUG: Verificar la URL generada
    console.log('🎵 Spotify Auth URL:', url);
    console.log('🔑 Client ID:', SPOTIFY_CONFIG.CLIENT_ID);
    console.log('🔄 Redirect URI:', SPOTIFY_CONFIG.REDIRECT_URI);

    return url;
  }, []);

  // Iniciar sesión
  const login = useCallback(() => {
    console.log('🎵 Iniciando proceso de login...');

    try {
      // Limpiar errores previos
      setError(null);

      // Verificar configuración
      if (!SPOTIFY_CONFIG.CLIENT_ID) {
        const errorMsg = 'VITE_SPOTIFY_CLIENT_ID no está configurado en el archivo .env';
        console.error('❌', errorMsg);
        setError(errorMsg);
        return;
      }

      // Generar URL y redirigir
      const authUrl = getAuthUrl();
      console.log('🔄 Redirigiendo a:', authUrl);

      // Redirigir a Spotify
      window.location.href = authUrl;

    } catch (error) {
      console.error('❌ Error en login:', error);
      setError(error.message);
    }
  }, [getAuthUrl]);

  // Intercambiar código por tokens
  const exchangeCodeForTokens = useCallback(async (code) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Intercambiando código por tokens...');

      const response = await fetch('/api/spotify-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error obteniendo tokens de Spotify');
      }

      const data = await response.json();

      console.log('✅ Tokens obtenidos exitosamente');

      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setIsAuthenticated(true);

      // Guardar tokens en localStorage
      localStorage.setItem('spotify_access_token', data.access_token);
      localStorage.setItem('spotify_refresh_token', data.refresh_token);
      localStorage.setItem('spotify_token_expiry', Date.now() + (data.expires_in * 1000));

      return data.access_token;
    } catch (error) {
      console.error('❌ Error intercambiando código:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refrescar token de acceso
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) return null;

    try {
      console.log('🔄 Refrescando token de acceso...');

      const response = await fetch('/api/spotify-refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error refrescando token');
      }

      const data = await response.json();

      console.log('✅ Token refrescado exitosamente');

      setAccessToken(data.access_token);
      localStorage.setItem('spotify_access_token', data.access_token);
      localStorage.setItem('spotify_token_expiry', Date.now() + (data.expires_in * 1000));

      // Actualizar refresh token si se proporciona uno nuevo
      if (data.refresh_token && data.refresh_token !== refreshToken) {
        setRefreshToken(data.refresh_token);
        localStorage.setItem('spotify_refresh_token', data.refresh_token);
      }

      return data.access_token;
    } catch (error) {
      console.error('❌ Error refrescando token:', error);
      logout();
      return null;
    }
  }, [refreshToken]);

  // Hacer petición a la API de Spotify
  const spotifyRequest = useCallback(async (endpoint, options = {}) => {
    let token = accessToken;

    // Verificar si el token ha expirado
    const tokenExpiry = localStorage.getItem('spotify_token_expiry');
    if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
      token = await refreshAccessToken();
      if (!token) return null;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (response.status === 401) {
        // Token inválido, intentar refrescar
        token = await refreshAccessToken();
        if (!token) return null;

        // Reintentar la petición
        const retryResponse = await fetch(`https://api.spotify.com/v1${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
          },
          ...options
        });

        return retryResponse.ok ? await retryResponse.json() : null;
      }

      if (response.status === 204) {
        return {}; // No content pero exitoso
      }

      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('❌ Error en petición a Spotify:', error);
      return null;
    }
  }, [accessToken, refreshAccessToken]);

  // Obtener información del usuario
  const fetchUser = useCallback(async () => {
    const userData = await spotifyRequest('/me');
    if (userData) {
      setUser(userData);
      console.log('✅ Usuario obtenido:', userData.display_name);
    }
    return userData;
  }, [spotifyRequest]);

  // Obtener reproducción actual
  const fetchCurrentTrack = useCallback(async () => {
    const data = await spotifyRequest('/me/player/currently-playing');
    if (data && data.item) {
      setCurrentTrack(data.item);
      setIsPlaying(data.is_playing);
      setDevice(data.device);
      console.log('🎵 Canción actual:', data.item.name);
    } else {
      // Si no hay reproducción actual, obtener la última canción
      const recentData = await spotifyRequest('/me/player/recently-played?limit=1');
      if (recentData && recentData.items && recentData.items.length > 0) {
        setCurrentTrack(recentData.items[0].track);
        setIsPlaying(false);
        console.log('🎵 Última canción:', recentData.items[0].track.name);
      } else {
        setCurrentTrack(null);
        setIsPlaying(false);
        console.log('🎵 No hay música disponible');
      }
    }
  }, [spotifyRequest]);

  // Obtener playlists del usuario
  const fetchPlaylists = useCallback(async () => {
    const data = await spotifyRequest('/me/playlists?limit=20');
    if (data && data.items) {
      setPlaylists(data.items);
      console.log('📋 Playlists obtenidas:', data.items.length);
    }
    return data?.items || [];
  }, [spotifyRequest]);

  // Controles de reproducción
  const play = useCallback(async (contextUri = null, uris = null) => {
    const body = {};
    if (contextUri) body.context_uri = contextUri;
    if (uris) body.uris = uris;

    const result = await spotifyRequest('/me/player/play', {
      method: 'PUT',
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
    });

    if (result !== null) {
      setIsPlaying(true);
      setTimeout(fetchCurrentTrack, 1000);
    }

    return result;
  }, [spotifyRequest, fetchCurrentTrack]);

  const pause = useCallback(async () => {
    const result = await spotifyRequest('/me/player/pause', {
      method: 'PUT'
    });

    if (result !== null) {
      setIsPlaying(false);
    }

    return result;
  }, [spotifyRequest]);

  const next = useCallback(async () => {
    const result = await spotifyRequest('/me/player/next', {
      method: 'POST'
    });

    if (result !== null) {
      setTimeout(fetchCurrentTrack, 1000);
    }

    return result;
  }, [spotifyRequest, fetchCurrentTrack]);

  const previous = useCallback(async () => {
    const result = await spotifyRequest('/me/player/previous', {
      method: 'POST'
    });

    if (result !== null) {
      setTimeout(fetchCurrentTrack, 1000);
    }

    return result;
  }, [spotifyRequest, fetchCurrentTrack]);

  const setVolume = useCallback(async (volume) => {
    return await spotifyRequest(`/me/player/volume?volume_percent=${volume}`, {
      method: 'PUT'
    });
  }, [spotifyRequest]);

  // Buscar canciones
  const search = useCallback(async (query, type = 'track', limit = 20) => {
    return await spotifyRequest(`/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`);
  }, [spotifyRequest]);

  // Cerrar sesión
  const logout = useCallback(() => {
    console.log('🚪 Cerrando sesión de Spotify');

    setIsAuthenticated(false);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setCurrentTrack(null);
    setIsPlaying(false);
    setDevice(null);
    setPlaylists([]);
    setError(null);

    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
  }, []);

  // Verificar tokens guardados al cargar
  useEffect(() => {
    const savedAccessToken = localStorage.getItem('spotify_access_token');
    const savedRefreshToken = localStorage.getItem('spotify_refresh_token');
    const tokenExpiry = localStorage.getItem('spotify_token_expiry');

    if (savedAccessToken && savedRefreshToken) {
      console.log('🔄 Restaurando sesión de Spotify...');

      setAccessToken(savedAccessToken);
      setRefreshToken(savedRefreshToken);

      // Verificar si el token ha expirado
      if (tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
        setIsAuthenticated(true);
        console.log('✅ Sesión restaurada exitosamente');
      } else {
        console.log('⏰ Token expirado, refrescando...');
        // Token expirado, intentar refrescar
        setRefreshToken(savedRefreshToken);
        refreshAccessToken();
      }
    }
  }, []);

  // Obtener datos iniciales cuando se autentica
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      console.log('🎵 Usuario autenticado, obteniendo datos...');
      fetchUser();
      fetchCurrentTrack();
      fetchPlaylists();
    }
  }, [isAuthenticated, accessToken, fetchUser, fetchCurrentTrack, fetchPlaylists]);

  // Actualizar reproducción actual cada 30 segundos
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchCurrentTrack();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchCurrentTrack]);

  // Log de configuración al inicializar
  useEffect(() => {
    console.log('🎵 Spotify Context inicializado');
    console.log('🔑 Client ID configurado:', !!SPOTIFY_CONFIG.CLIENT_ID);
    console.log('🔄 Redirect URI:', SPOTIFY_CONFIG.REDIRECT_URI);
  }, []);

  const value = {
    // Estado
    isAuthenticated,
    accessToken,
    user,
    currentTrack,
    isPlaying,
    device,
    playlists,
    loading,
    error,

    // Métodos de autenticación
    login,
    logout,
    exchangeCodeForTokens,

    // Métodos de datos
    fetchCurrentTrack,
    fetchPlaylists,
    search,

    // Controles de reproducción
    play,
    pause,
    next,
    previous,
    setVolume,

    // Utilidades
    spotifyRequest
  };

  return (
    <SpotifyContext.Provider value={value}>
      {children}
    </SpotifyContext.Provider>
  );
};

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error('useSpotify debe usarse dentro de SpotifyProvider');
  }
  return context;
};
