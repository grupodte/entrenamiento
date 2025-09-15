-- Migración: Agregar campos de onboarding a tabla perfiles
-- Fecha: 2024-01-15
-- Descripción: Añade campos necesarios para el proceso de onboarding de nuevos usuarios

-- Paso 1: Agregar columnas de onboarding a la tabla perfiles (usando peso y altura existentes)
ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS grasa_pct numeric(5,2),
  ADD COLUMN IF NOT EXISTS cintura_cm int;

-- Paso 2: Agregar nuevas columnas de texto (sin constraints aún)
ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS objetivo_nuevo text,
  ADD COLUMN IF NOT EXISTS experiencia_nuevo text,
  ADD COLUMN IF NOT EXISTS preferencia_inicio text;

-- Paso 3: Migrar datos existentes del campo 'objetivo' si existe y es válido
UPDATE public.perfiles 
SET objetivo_nuevo = 
  CASE 
    WHEN objetivo IN ('perder_peso', 'ganar_musculo', 'mantenimiento', 'rendimiento') THEN objetivo
    WHEN objetivo = 'perder peso' THEN 'perder_peso'
    WHEN objetivo = 'ganar musculo' THEN 'ganar_musculo' 
    WHEN objetivo = 'mantener' THEN 'mantenimiento'
    WHEN objetivo = 'performance' THEN 'rendimiento'
    ELSE NULL
  END
WHERE objetivo IS NOT NULL;

-- Paso 4: Migrar datos existentes del campo 'nivel' a experiencia si existe
UPDATE public.perfiles 
SET experiencia_nuevo = 
  CASE 
    WHEN nivel IN ('principiante', 'intermedio', 'avanzado') THEN nivel
    WHEN nivel = 'beginner' THEN 'principiante'
    WHEN nivel = 'intermediate' THEN 'intermedio'
    WHEN nivel = 'advanced' THEN 'avanzado'
    ELSE NULL
  END
WHERE nivel IS NOT NULL;

-- Paso 5: Eliminar columna antigua objetivo si existe
ALTER TABLE public.perfiles DROP COLUMN IF EXISTS objetivo;

-- Paso 6: Renombrar la nueva columna
ALTER TABLE public.perfiles RENAME COLUMN objetivo_nuevo TO objetivo;
ALTER TABLE public.perfiles RENAME COLUMN experiencia_nuevo TO experiencia;

-- Paso 7: Agregar comentarios para documentar los campos (usando campos existentes de peso/altura)
COMMENT ON COLUMN public.perfiles.onboarding_completed IS 'Indica si el usuario ha completado el proceso de onboarding inicial';
COMMENT ON COLUMN public.perfiles.objetivo IS 'Objetivo del usuario: perder_peso, ganar_musculo, mantenimiento, rendimiento';
COMMENT ON COLUMN public.perfiles.experiencia IS 'Nivel de experiencia: principiante, intermedio, avanzado';
COMMENT ON COLUMN public.perfiles.grasa_pct IS 'Porcentaje de grasa corporal estimado';
COMMENT ON COLUMN public.perfiles.cintura_cm IS 'Circunferencia de cintura en centímetros';
COMMENT ON COLUMN public.perfiles.preferencia_inicio IS 'Preferencia del usuario al finalizar onboarding: rutina, cursos, explorar';
-- Nota: peso y altura ya existen en la tabla

-- Paso 8: Agregar constraints básicos para validación (solo para nuevos campos)
ALTER TABLE public.perfiles
  ADD CONSTRAINT check_grasa_valid CHECK (grasa_pct IS NULL OR (grasa_pct >= 1 AND grasa_pct <= 50)),
  ADD CONSTRAINT check_cintura_valid CHECK (cintura_cm IS NULL OR (cintura_cm >= 50 AND cintura_cm <= 200)),
  ADD CONSTRAINT check_objetivo_valid CHECK (objetivo IS NULL OR objetivo IN ('perder_peso', 'ganar_musculo', 'mantenimiento', 'rendimiento')),
  ADD CONSTRAINT check_experiencia_valid CHECK (experiencia IS NULL OR experiencia IN ('principiante', 'intermedio', 'avanzado')),
  ADD CONSTRAINT check_preferencia_valid CHECK (preferencia_inicio IS NULL OR preferencia_inicio IN ('rutina', 'cursos', 'explorar'));

-- Nota: No agregamos constraints para peso y altura porque ya pueden tener sus propias validaciones

-- Crear índice para optimizar consultas de onboarding
CREATE INDEX IF NOT EXISTS idx_perfiles_onboarding_completed ON public.perfiles(onboarding_completed);

-- Mensaje de confirmación
SELECT 'Migración completada: Campos de onboarding agregados a tabla perfiles' AS mensaje;
