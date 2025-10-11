const Mux = require('@mux/mux-node');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

// Initialize Mux with signing key
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// Initialize Supabase client with service role for server-side operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leccionId, userId, cursoId } = req.body;

    // Validate required parameters
    if (!leccionId || !userId || !cursoId) {
      return res.status(400).json({ 
        error: 'Missing required parameters: leccionId, userId, cursoId' 
      });
    }

    // 1. Verify user access to the course
    const { data: userProfile } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', userId)
      .single();

    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Admin users have automatic access
    const isAdmin = userProfile.rol === 'admin';
    
    if (!isAdmin) {
      // Check if user has access to the course
      const { data: courseAccess } = await supabase
        .from('acceso_cursos')
        .select('*')
        .eq('usuario_id', userId)
        .eq('curso_id', cursoId)
        .eq('activo', true)
        .single();

      if (!courseAccess) {
        return res.status(403).json({ 
          error: 'User does not have access to this course' 
        });
      }
    }

    // 2. Get the lesson and verify it belongs to the course
    const { data: lesson } = await supabase
      .from('lecciones')
      .select(`
        *,
        modulos_curso!inner(curso_id)
      `)
      .eq('id', leccionId)
      .single();

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Verify lesson belongs to the requested course
    if (lesson.modulos_curso.curso_id !== cursoId) {
      return res.status(403).json({ 
        error: 'Lesson does not belong to the requested course' 
      });
    }

    // 3. Extract Mux playback ID from video_url
    const videoUrl = lesson.video_url;
    if (!videoUrl) {
      return res.status(404).json({ error: 'No video URL found for this lesson' });
    }

    // Extract playback ID from Mux URL
    // Expected formats:
    // https://stream.mux.com/{PLAYBACK_ID}.m3u8
    // https://stream.mux.com/{PLAYBACK_ID}
    let playbackId;
    const muxUrlPattern = /https?:\/\/stream\.mux\.com\/([a-zA-Z0-9]+)/;
    const match = videoUrl.match(muxUrlPattern);
    
    if (match) {
      playbackId = match[1].replace('.m3u8', ''); // Remove .m3u8 if present
    } else {
      // If it's already just a playback ID
      playbackId = videoUrl;
    }

    if (!playbackId) {
      return res.status(400).json({ error: 'Invalid Mux video URL format' });
    }

    // 4. Generate signed URL with Mux JWT
    
    // Create JWT payload for Mux signed URL
    const payload = {
      sub: playbackId,
      aud: 'v', // video
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      kid: process.env.MUX_SIGNING_KEY_ID,
    };

    // Sign the JWT with the Mux signing key
    const decodedKey = Buffer.from(process.env.MUX_SIGNING_KEY_SECRET, 'base64').toString('utf8');
    const token = jwt.sign(payload, decodedKey, { algorithm: 'RS256' });

    // Construct the signed URL
    const finalSignedUrl = `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;

    // 5. Log access for analytics (optional)
    try {
      await supabase
        .from('video_access_logs')
        .insert({
          usuario_id: userId,
          leccion_id: leccionId,
          curso_id: cursoId,
          playback_id: playbackId,
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          user_agent: req.headers['user-agent'],
          accessed_at: new Date().toISOString()
        })
        .select()
        .single();
    } catch (logError) {
      // Si falla el logging, no interrumpir el flujo principal
      console.warn('Failed to log video access (table may not exist):', logError.message);
    }

    // Return the signed URL
    res.status(200).json({
      signedUrl: finalSignedUrl,
      playbackId,
      expiresIn: 24 * 60 * 60, // seconds
      leccionTitulo: lesson.titulo
    });

  } catch (error) {
    console.error('Error generating Mux signed URL:', {
      error: error.message,
      stack: error.stack,
      leccionId: req.body?.leccionId,
      userId: req.body?.userId,
      cursoId: req.body?.cursoId,
      timestamp: new Date().toISOString()
    });
    
    // Don't expose internal errors to client
    res.status(500).json({ 
      error: 'Failed to generate signed video URL',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        type: error.constructor.name,
        timestamp: new Date().toISOString()
      } : undefined
    });
  }
};