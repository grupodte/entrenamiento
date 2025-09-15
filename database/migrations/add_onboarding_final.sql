-- Migración final: Agregar solo campos faltantes para onboarding
-- Usar con los campos existentes: peso, altura, porcentaje_grasa

-- Paso 1: Agregar solo las columnas que faltan
ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cintura_cm int,
  ADD COLUMN IF NOT EXISTS preferencia_inicio text;

-- Paso 2: Actualizar campo 'nivel' a 'experiencia' si existe
-- Solo si la columna 'experiencia' no existe
DO $$ 
BEGIN
  -- Verificar si la columna 'experiencia' no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'perfiles' AND column_name = 'experiencia'
  ) THEN
    -- Si 'nivel' existe, renombrarla a 'experiencia'
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'perfiles' AND column_name = 'nivel'
    ) THEN
      ALTER TABLE public.perfiles RENAME COLUMN nivel TO experiencia;
    ELSE
      -- Si 'nivel' tampoco existe, crear 'experiencia'
      ALTER TABLE public.perfiles ADD COLUMN experiencia text;
    END IF;
  END IF;
END $$;

-- Paso 3: Normalizar valores existentes en 'objetivo'
UPDATE public.perfiles 
SET objetivo = 
  CASE 
    WHEN objetivo ILIKE '%perder%peso%' OR objetivo ILIKE '%perder_peso%' THEN 'perder_peso'
    WHEN objetivo ILIKE '%ganar%musculo%' OR objetivo ILIKE '%ganar_musculo%' THEN 'ganar_musculo'
    WHEN objetivo ILIKE '%mantener%' OR objetivo ILIKE '%mantenimiento%' THEN 'mantenimiento'
    WHEN objetivo ILIKE '%performance%' OR objetivo ILIKE '%rendimiento%' THEN 'rendimiento'
    WHEN objetivo IN ('perder_peso', 'ganar_musculo', 'mantenimiento', 'rendimiento') THEN objetivo
    ELSE NULL
  END
WHERE objetivo IS NOT NULL;

-- Paso 4: Normalizar valores existentes en 'experiencia'
UPDATE public.perfiles 
SET experiencia = 
  CASE 
    WHEN experiencia ILIKE '%principiante%' OR experiencia ILIKE '%beginner%' OR experiencia ILIKE '%básico%' THEN 'principiante'
    WHEN experiencia ILIKE '%intermedio%' OR experiencia ILIKE '%intermediate%' OR experiencia ILIKE '%medio%' THEN 'intermedio'
    WHEN experiencia ILIKE '%avanzado%' OR experiencia ILIKE '%advanced%' OR experiencia ILIKE '%alto%' THEN 'avanzado'
    WHEN experiencia IN ('principiante', 'intermedio', 'avanzado') THEN experiencia
    ELSE NULL
  END
WHERE experiencia IS NOT NULL;

-- Paso 5: Agregar comentarios
COMMENT ON COLUMN public.perfiles.onboarding_completed IS 'Indica si el usuario ha completado el proceso de onboarding inicial';
COMMENT ON COLUMN public.perfiles.objetivo IS 'Objetivo del usuario: perder_peso, ganar_musculo, mantenimiento, rendimiento';
COMMENT ON COLUMN public.perfiles.experiencia IS 'Nivel de experiencia: principiante, intermedio, avanzado';
COMMENT ON COLUMN public.perfiles.cintura_cm IS 'Circunferencia de cintura en centímetros';
COMMENT ON COLUMN public.perfiles.preferencia_inicio IS 'Preferencia del usuario al finalizar onboarding: rutina, cursos, explorar';

-- Paso 6: Agregar constraints
ALTER TABLE public.perfiles
  ADD CONSTRAINT IF NOT EXISTS check_cintura_valid 
    CHECK (cintura_cm IS NULL OR (cintura_cm >= 50 AND cintura_cm <= 200)),
  ADD CONSTRAINT IF NOT EXISTS check_objetivo_valid 
    CHECK (objetivo IS NULL OR objetivo IN ('perder_peso', 'ganar_musculo', 'mantenimiento', 'rendimiento')),
  ADD CONSTRAINT IF NOT EXISTS check_experiencia_valid 
    CHECK (experiencia IS NULL OR experiencia IN ('principiante', 'intermedio', 'avanzado')),
  ADD CONSTRAINT IF NOT EXISTS check_preferencia_valid 
    CHECK (preferencia_inicio IS NULL OR preferencia_inicio IN ('rutina', 'cursos', 'explorar'));

-- Paso 7: Crear índice
CREATE INDEX IF NOT EXISTS idx_perfiles_onboarding_completed ON public.perfiles(onboarding_completed);

-- Mensaje de confirmación
SELECT 'Migración completada: Onboarding configurado usando campos existentes' AS mensaje;
