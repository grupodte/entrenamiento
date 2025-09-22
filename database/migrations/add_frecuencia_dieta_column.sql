-- Migración: Agregar columna frecuencia_dieta
-- Fecha: 2024-12-22
-- Descripción: Agrega la columna frecuencia_dieta para el onboarding simplificado

-- Agregar la columna frecuencia_dieta
ALTER TABLE public.perfiles 
ADD COLUMN IF NOT EXISTS frecuencia_dieta varchar(50);

-- Agregar comentario para documentación
COMMENT ON COLUMN public.perfiles.frecuencia_dieta IS 'Frecuencia de seguimiento nutricional del usuario (en desarrollo)';

-- Agregar constraint para valores válidos (preparado para futuras opciones)
DO $$
BEGIN
    -- Intentar agregar el constraint solo si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_frecuencia_dieta_valid' 
        AND table_name = 'perfiles'
    ) THEN
        ALTER TABLE public.perfiles
        ADD CONSTRAINT check_frecuencia_dieta_valid 
        CHECK (
            frecuencia_dieta IS NULL OR 
            frecuencia_dieta IN (
                'seguimiento_diario', 
                'seguimiento_semanal', 
                'seguimiento_mensual',
                'sin_seguimiento'
            )
        );
    END IF;
END $$;

-- Crear índice para optimización (opcional)
CREATE INDEX IF NOT EXISTS idx_perfiles_frecuencia_dieta 
ON public.perfiles(frecuencia_dieta) 
WHERE frecuencia_dieta IS NOT NULL;

-- Mensaje de confirmación
SELECT 'Columna frecuencia_dieta agregada exitosamente' AS mensaje;
