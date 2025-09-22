-- Migración: Agregar campo meta_cintura
-- Fecha: 2024-12-22
-- Descripción: Agrega campo para objetivo de cintura en el onboarding

-- Agregar la columna meta_cintura
ALTER TABLE public.perfiles 
ADD COLUMN IF NOT EXISTS meta_cintura int;

-- Agregar comentario para documentación
COMMENT ON COLUMN public.perfiles.meta_cintura IS 'Circunferencia de cintura objetivo en centímetros (opcional)';

-- Agregar constraint para valores válidos
DO $$
BEGIN
    -- Constraint para cintura objetivo
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_meta_cintura_valid' 
        AND table_name = 'perfiles'
    ) THEN
        ALTER TABLE public.perfiles
        ADD CONSTRAINT check_meta_cintura_valid 
        CHECK (meta_cintura IS NULL OR (meta_cintura >= 50 AND meta_cintura <= 200));
    END IF;
END $$;

-- Crear índice para optimización (opcional)
CREATE INDEX IF NOT EXISTS idx_perfiles_meta_cintura 
ON public.perfiles(meta_cintura) 
WHERE meta_cintura IS NOT NULL;

-- Mensaje de confirmación
SELECT 'Columna meta_cintura agregada exitosamente' AS mensaje;
