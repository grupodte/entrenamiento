-- Crear enum para tipos de ejecución
CREATE TYPE execution_type AS ENUM ('standard', 'tiempo', 'fallo');

-- Agregar columnas a la tabla series_subejercicio
ALTER TABLE series_subejercicio 
ADD COLUMN tipo_ejecucion execution_type DEFAULT 'standard' NOT NULL,
ADD COLUMN duracion_segundos INTEGER;

-- Comentarios para documentar
COMMENT ON COLUMN series_subejercicio.tipo_ejecucion IS 'Tipo de ejecución: standard (reps+peso+pausa), tiempo (duración en segundos), fallo (al fallo sin reps fijas)';
COMMENT ON COLUMN series_subejercicio.duracion_segundos IS 'Duración en segundos para tipo de ejecución "tiempo"';

-- Crear índice para mejor performance en consultas por tipo
CREATE INDEX idx_series_subejercicio_tipo_ejecucion ON series_subejercicio(tipo_ejecucion);
