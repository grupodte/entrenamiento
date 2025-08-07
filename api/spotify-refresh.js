export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received request for /api/spotify-refresh');
    console.log('Request body:', req.body);

    const { refresh_token } = req.body;

    if (!refresh_token) {
      console.error('Missing required parameter: refresh_token');
      return res.status(400).json({
        error: 'Missing required parameter: refresh_token'
      });
    }

    console.log(`Received refresh_token: ${refresh_token}`);

    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error('SERVER ERROR: SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is not set in the environment variables.');
      return res.status(500).json({
        error: 'Spotify credentials not configured'
      });
    }

    console.log('Spotify environment variables seem to be loaded for spotify-refresh.');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Spotify refresh token error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Failed to refresh token',
        details: errorText
      });
    }

    const data = await response.json();

    res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
      // El refresh_token puede o no ser devuelto
      refresh_token: data.refresh_token || refresh_token
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
