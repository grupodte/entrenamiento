// context/SpotifyContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const SpotifyContext = createContext();

export const useSpotify = () => useContext(SpotifyContext);

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;

const SpotifyProvider = ({ children }) => {
  const navigate = useNavigate();

  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [expiresIn, setExpiresIn] = useState(null);
  const [user, setUser] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [player, setPlayer] = useState(null);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // 💡 Lanzar login de Spotify
  const login = () => {
    const scope = [
      'user-read-private',
      'user-read-email',
      'user-read-playback-state',
      'user-modify-playback-state',
      'streaming',
      'user-read-currently-playing'
    ].join(' ');

    const authURL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=${encodeURIComponent(scope)}`;

    window.location.href = authURL;
  };

  // 🔁 Intercambio de código por tokens
  const exchangeCodeForTokens = async (code) => {
    setLoading(true);
    try {
      const res = await fetch('/api/spotify-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Fallo en el intercambio');

      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setExpiresIn(data.expires_in);
      setIsAuthenticated(true);
      fetchUser(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Renovar token con refresh_token
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) return;

    try {
      const res = await fetch('/api/spotify-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Fallo al refrescar');

      setAccessToken(data.access_token);
      setExpiresIn(data.expires_in);
    } catch (err) {
      setError(err.message);
      logout();
    }
  }, [refreshToken]);

  // ⏲️ Refrescar token antes de expirar
  useEffect(() => {
    if (!expiresIn) return;
    const timeout = setTimeout(refreshAccessToken, (expiresIn - 60) * 1000);
    return () => clearTimeout(timeout);
  }, [expiresIn, refreshAccessToken]);

  // 👤 Obtener perfil
  const fetchUser = async (token = accessToken) => {
    if (!token) return;
    try {
      const res = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUser(data);
    } catch (err) {
      console.error('Error obteniendo perfil:', err);
    }
  };

  // 🎵 Obtener canción actual
  const fetchCurrentTrack = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 204) {
        setCurrentTrack(null);
        return;
      }
      const data = await res.json();
      setCurrentTrack(data.item);
      setIsPlaying(data.is_playing);
    } catch (err) {
      console.error('Error obteniendo canción:', err);
    }
  };

  // ▶️ Funciones de control
  const play = async () => {
    if (!accessToken || !deviceId) return;
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setIsPlaying(true);
    fetchCurrentTrack();
  };

  const pause = async () => {
    if (!accessToken || !deviceId) return;
    await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setIsPlaying(false);
  };

  const next = async () => {
    if (!accessToken || !deviceId) return;
    await fetch(`https://api.spotify.com/v1/me/player/next?device_id=${deviceId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    fetchCurrentTrack();
  };

  const previous = async () => {
    if (!accessToken || !deviceId) return;
    await fetch(`https://api.spotify.com/v1/me/player/previous?device_id=${deviceId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    fetchCurrentTrack();
  };

  // 🔌 Cargar SDK y conectar
  useEffect(() => {
    if (!accessToken || window.Spotify || player) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const newPlayer = new window.Spotify.Player({
        name: 'FitApp Player',
        getOAuthToken: cb => cb(accessToken),
        volume: 0.5,
      });

      setPlayer(newPlayer);

      newPlayer.addListener('ready', ({ device_id }) => {
        console.log('✅ Player Ready, deviceId:', device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      newPlayer.addListener('not_ready', ({ device_id }) => {
        console.warn('⚠️ Player not ready', device_id);
      });

      newPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Initialization error:', message);
      });

      newPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Auth error:', message);
        setError(message);
        logout();
      });

      newPlayer.connect();
    };
  }, [accessToken, player]);

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setExpiresIn(null);
    setUser(null);
    setCurrentTrack(null);
    setIsAuthenticated(false);
    setPlayer(null);
    setDeviceId(null);
    navigate('/dashboard');
  };

  return (
    <SpotifyContext.Provider
      value={{
        accessToken,
        isAuthenticated,
        user,
        currentTrack,
        isPlaying,
        loading,
        error,
        isReady,
        login,
        exchangeCodeForTokens,
        play,
        pause,
        next,
        previous,
        fetchCurrentTrack,
        logout
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
};

export default SpotifyProvider;
