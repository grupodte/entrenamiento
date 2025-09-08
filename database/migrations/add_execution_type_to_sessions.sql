-- Agregar columnas a la tabla sesiones_series para tipos de ejecución
ALTER TABLE sesiones_series 
ADD COLUMN tipo_ejecucion execution_type DEFAULT 'standard',
ADD COLUMN duracion_realizada_segundos INTEGER;

-- Comentarios para documentar
COMMENT ON COLUMN sesiones_series.tipo_ejecucion IS 'Tipo de ejecución realizada: standard, tiempo, fallo';
COMMENT ON COLUMN sesiones_series.duracion_realizada_segundos IS 'Duración realizada en segundos para tipo "tiempo"';

-- Crear índice para mejor performance
CREATE INDEX idx_sesiones_series_tipo_ejecucion ON sesiones_series(tipo_ejecucion);
