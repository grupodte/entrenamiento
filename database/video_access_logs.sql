-- Tabla para logs de acceso a videos (analytics opcional)
CREATE TABLE IF NOT EXISTS video_access_logs (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leccion_id BIGINT NOT NULL REFERENCES lecciones(id) ON DELETE CASCADE,
  curso_id BIGINT NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  playback_id TEXT NOT NULL, -- ID de Mux playback
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS video_access_logs_usuario_id_idx ON video_access_logs(usuario_id);
CREATE INDEX IF NOT EXISTS video_access_logs_leccion_id_idx ON video_access_logs(leccion_id);
CREATE INDEX IF NOT EXISTS video_access_logs_curso_id_idx ON video_access_logs(curso_id);
CREATE INDEX IF NOT EXISTS video_access_logs_accessed_at_idx ON video_access_logs(accessed_at);

-- RLS (Row Level Security)
ALTER TABLE video_access_logs ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver sus propios logs
CREATE POLICY "Users can view their own video access logs" ON video_access_logs
  FOR SELECT USING (auth.uid() = usuario_id);

-- Política para que los administradores puedan ver todos los logs
CREATE POLICY "Admins can view all video access logs" ON video_access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM perfiles 
      WHERE perfiles.id = auth.uid() 
      AND perfiles.rol = 'admin'
    )
  );

-- Los inserts se manejan desde el servidor con service role, no necesitan política RLS

-- Comentarios para documentación
COMMENT ON TABLE video_access_logs IS 'Registro de accesos a videos para analytics y seguridad';
COMMENT ON COLUMN video_access_logs.playback_id IS 'ID de reproducción de Mux para el video';
COMMENT ON COLUMN video_access_logs.ip_address IS 'Dirección IP desde donde se accedió al video';
COMMENT ON COLUMN video_access_logs.user_agent IS 'User agent del navegador';
COMMENT ON COLUMN video_access_logs.accessed_at IS 'Momento exacto de acceso al video';