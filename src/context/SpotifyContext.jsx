// SpotifyContext.jsx FINAL COMPLETO
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SpotifyContext = createContext();

const SPOTIFY_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
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
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [user, setUser] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [device, setDevice] = useState(null);
  const [playlists, setPlaylists] = useState([]);

  // Generar URL de autenticación
  const getAuthUrl = () => {
    const params = new URLSearchParams({
      client_id: SPOTIFY_CONFIG.CLIENT_ID,
      response_type: 'code',
      redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI,
      scope: SPOTIFY_CONFIG.SCOPES,
      show_dialog: 'true'
    });
    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  };

  const login = () => {
    if (!SPOTIFY_CONFIG.CLIENT_ID) {
      setError('Falta VITE_SPOTIFY_CLIENT_ID en .env');
      return;
    }
    setError(null);
    window.location.href = getAuthUrl();
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    setUser(null);
    setCurrentTrack(null);
    setIsPlaying(false);
    setDevice(null);
    setPlaylists([]);
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
  };

  const exchangeCodeForTokens = async (code) => {
    try {
      setLoading(true);
      const res = await fetch('/api/spotify-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: SPOTIFY_CONFIG.REDIRECT_URI })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error en login');

      const { access_token, refresh_token, expires_in } = data;
      setAccessToken(access_token);
      setRefreshToken(refresh_token);
      setIsAuthenticated(true);

      localStorage.setItem('spotify_access_token', access_token);
      localStorage.setItem('spotify_refresh_token', refresh_token);
      localStorage.setItem('spotify_token_expiry', Date.now() + expires_in * 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshAccessToken = async () => {
    try {
      const res = await fetch('/api/spotify-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al refrescar token');

      setAccessToken(data.access_token);
      localStorage.setItem('spotify_access_token', data.access_token);
      localStorage.setItem('spotify_token_expiry', Date.now() + data.expires_in * 1000);

      if (data.refresh_token && data.refresh_token !== refreshToken) {
        setRefreshToken(data.refresh_token);
        localStorage.setItem('spotify_refresh_token', data.refresh_token);
      }
    } catch (err) {
      logout();
    }
  };

  const spotifyRequest = async (endpoint, options = {}) => {
    let token = accessToken;
    const expiry = localStorage.getItem('spotify_token_expiry');
    if (expiry && Date.now() > parseInt(expiry)) {
      token = await refreshAccessToken();
      if (!token) return null;
    }

    const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (res.status === 204) return {}; // No Content
    if (!res.ok) return null;
    return await res.json();
  };

  const fetchUser = async () => {
    const data = await spotifyRequest('/me');
    if (data) setUser(data);
    return data;
  };

  const fetchCurrentTrack = async () => {
    const data = await spotifyRequest('/me/player/currently-playing');
    if (data?.item) {
      setCurrentTrack(data.item);
      setIsPlaying(data.is_playing);
      setDevice(data.device);
    }
  };

  const fetchPlaylists = async () => {
    const data = await spotifyRequest('/me/playlists?limit=20');
    if (data?.items) setPlaylists(data.items);
  };

  const play = async (contextUri = null, uris = null) => {
    const body = {};
    if (contextUri) body.context_uri = contextUri;
    if (uris) body.uris = uris;
    await spotifyRequest('/me/player/play', {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    setIsPlaying(true);
    fetchCurrentTrack();
  };

  const pause = async () => {
    await spotifyRequest('/me/player/pause', { method: 'PUT' });
    setIsPlaying(false);
  };

  const next = async () => {
    await spotifyRequest('/me/player/next', { method: 'POST' });
    fetchCurrentTrack();
  };

  const previous = async () => {
    await spotifyRequest('/me/player/previous', { method: 'POST' });
    fetchCurrentTrack();
  };

  const setVolume = async (volume) => {
    await spotifyRequest(`/me/player/volume?volume_percent=${volume}`, { method: 'PUT' });
  };

  const search = async (q, type = 'track') => {
    return await spotifyRequest(`/search?q=${encodeURIComponent(q)}&type=${type}&limit=10`);
  };

  // Inicializar tokens
  useEffect(() => {
    const at = localStorage.getItem('spotify_access_token');
    const rt = localStorage.getItem('spotify_refresh_token');
    const expiry = localStorage.getItem('spotify_token_expiry');
    if (at && rt) {
      setAccessToken(at);
      setRefreshToken(rt);
      if (Date.now() < parseInt(expiry)) setIsAuthenticated(true);
      else refreshAccessToken();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchUser();
      fetchCurrentTrack();
      fetchPlaylists();
    }
  }, [isAuthenticated, accessToken]);

  return (
    <SpotifyContext.Provider
      value={{
        // Estado
        accessToken, refreshToken, isAuthenticated, loading, error,
        user, currentTrack, isPlaying, device, playlists,

        // Auth
        login, logout, exchangeCodeForTokens,

        // Datos
        fetchUser, fetchCurrentTrack, fetchPlaylists, search,

        // Reproducción
        play, pause, next, previous, setVolume
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
};

export const useSpotify = () => useContext(SpotifyContext);
