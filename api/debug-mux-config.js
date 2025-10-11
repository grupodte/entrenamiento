export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Solo permitir en desarrollo o con autenticación específica
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    return res.status(403).json({ error: 'Debug endpoint not available in production' });
  }

  try {
    const config = {
      mux_token_id_exists: !!process.env.MUX_TOKEN_ID,
      mux_token_secret_exists: !!process.env.MUX_TOKEN_SECRET,
      mux_signing_key_id_exists: !!process.env.MUX_SIGNING_KEY_ID,
      mux_signing_key_secret_exists: !!process.env.MUX_SIGNING_KEY_SECRET,
      supabase_url_exists: !!process.env.VITE_SUPABASE_URL,
      supabase_service_role_exists: !!process.env.SUPABASE_SERVICE_ROLE,
      node_env: process.env.NODE_ENV,
      // Mostrar solo los primeros caracteres para verificar sin exponer las keys
      mux_token_id_preview: process.env.MUX_TOKEN_ID ? `${process.env.MUX_TOKEN_ID.slice(0, 8)}...` : null,
      mux_signing_key_id_preview: process.env.MUX_SIGNING_KEY_ID ? `${process.env.MUX_SIGNING_KEY_ID.slice(0, 8)}...` : null,
    };

    res.status(200).json({
      status: 'ok',
      config,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to get debug info',
      details: error.message 
    });
  }
}