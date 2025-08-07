let accessToken = null;

export async function getAccessToken() {
  if (accessToken) {
    return accessToken;
  }

  try {
    const response = await fetch('/api/spotify-auth');
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Serverless function error:', response.status, errorText);
      throw new Error(`Serverless function returned ${response.status}`);
    }
    const data = await response.json();
    accessToken = data.access_token;
    // Set a timeout to clear the token before it expires
    setTimeout(() => { accessToken = null; }, (data.expires_in - 60) * 1000);
    return accessToken;
  } catch (error) {
    console.error('Error fetching Spotify access token:', error);
    return null;
  }
}

export async function getNowPlaying() {
  const token = await getAccessToken();
  if (!token) {
    return null;
  }

  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 204 || response.status > 400) {
    return null;
  }

  const song = await response.json();
  return song;
}
