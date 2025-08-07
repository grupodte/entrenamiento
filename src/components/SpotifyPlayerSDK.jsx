// SpotifyPlayerSDK.jsx
import { useEffect, useState } from 'react';
import { useSpotify } from '../context/SpotifyContext';

const SpotifyPlayerSDK = () => {
    const { accessToken, setDeviceId, setIsReady } = useSpotify();
    const [player, setPlayer] = useState(null);

    useEffect(() => {
        if (!accessToken || window.Spotify) return;

        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const newPlayer = new window.Spotify.Player({
                name: 'FitApp Player',
                getOAuthToken: cb => cb(accessToken),
                volume: 0.5
            });

            setPlayer(newPlayer);

            newPlayer.addListener('ready', ({ device_id }) => {
                console.log('Spotify Web Playback SDK Ready with Device ID', device_id);
                setDeviceId(device_id);
                setIsReady(true);
            });

            newPlayer.addListener('not_ready', ({ device_id }) => {
                console.warn('Device ID has gone offline', device_id);
            });

            newPlayer.connect();
        };
    }, [accessToken]);

    return null;
};

export default SpotifyPlayerSDK;