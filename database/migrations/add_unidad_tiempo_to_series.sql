-- Migración: Agregar columna unidad_tiempo a la tabla series_subejercicio
-- Fecha: 2025-01-12
-- Descripción: Permite especificar si el tiempo de ejercicios por tiempo está en minutos o segundos

-- Agregar columna unidad_tiempo
ALTER TABLE series_subejercicio 
ADD COLUMN unidad_tiempo VARCHAR(10) DEFAULT 'minutes';

-- Agregar comentario a la columna
COMMENT ON COLUMN series_subejercicio.unidad_tiempo IS 'Unidad de tiempo para ejercicios por tiempo: minutes o seconds';

-- Crear índice para mejorar consultas (opcional)
CREATE INDEX idx_series_subejercicio_unidad_tiempo ON series_subejercicio(unidad_tiempo);

-- Actualizar registros existentes para que tengan unidad_tiempo por defecto
UPDATE series_subejercicio 
SET unidad_tiempo = 'minutes' 
WHERE tipo_ejecucion = 'tiempo' AND unidad_tiempo IS NULL;
