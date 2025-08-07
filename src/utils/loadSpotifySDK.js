export const loadSpotifySDK = () => {
  return new Promise((resolve) => {
    const existingScript = document.getElementById('spotify-sdk');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'spotify-sdk';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.onload = resolve;
      document.body.appendChild(script);
    } else {
      resolve();
    }
  });
};