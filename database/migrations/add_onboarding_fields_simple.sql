-- Migración SIMPLE: Agregar campos de onboarding a tabla perfiles
-- Esta versión NO migra datos existentes, solo agrega las nuevas columnas
-- Usar si la migración compleja da problemas

-- Paso 1: Agregar nuevas columnas (usando peso y altura existentes)
ALTER TABLE public.perfiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS objetivo_onboarding text,
  ADD COLUMN IF NOT EXISTS experiencia_onboarding text,
  ADD COLUMN IF NOT EXISTS grasa_pct numeric(5,2),
  ADD COLUMN IF NOT EXISTS cintura_cm int,
  ADD COLUMN IF NOT EXISTS preferencia_inicio text;

-- Paso 2: Agregar comentarios
COMMENT ON COLUMN public.perfiles.onboarding_completed IS 'Indica si el usuario ha completado el proceso de onboarding inicial';
COMMENT ON COLUMN public.perfiles.objetivo_onboarding IS 'Objetivo del usuario: perder_peso, ganar_musculo, mantenimiento, rendimiento';
COMMENT ON COLUMN public.perfiles.experiencia_onboarding IS 'Nivel de experiencia: principiante, intermedio, avanzado';
COMMENT ON COLUMN public.perfiles.altura_cm IS 'Altura del usuario en centímetros';
COMMENT ON COLUMN public.perfiles.peso_kg IS 'Peso del usuario en kilogramos (con decimales)';
COMMENT ON COLUMN public.perfiles.grasa_pct IS 'Porcentaje de grasa corporal estimado';
COMMENT ON COLUMN public.perfiles.cintura_cm IS 'Circunferencia de cintura en centímetros';
COMMENT ON COLUMN public.perfiles.preferencia_inicio IS 'Preferencia del usuario al finalizar onboarding: rutina, cursos, explorar';

-- Paso 3: Agregar constraints básicos para validación (solo para nuevas columnas)
ALTER TABLE public.perfiles
  ADD CONSTRAINT check_grasa_valid CHECK (grasa_pct IS NULL OR (grasa_pct >= 1 AND grasa_pct <= 50)),
  ADD CONSTRAINT check_cintura_valid CHECK (cintura_cm IS NULL OR (cintura_cm >= 50 AND cintura_cm <= 200)),
  ADD CONSTRAINT check_objetivo_onboarding_valid CHECK (objetivo_onboarding IS NULL OR objetivo_onboarding IN ('perder_peso', 'ganar_musculo', 'mantenimiento', 'rendimiento')),
  ADD CONSTRAINT check_experiencia_onboarding_valid CHECK (experiencia_onboarding IS NULL OR experiencia_onboarding IN ('principiante', 'intermedio', 'avanzado')),
  ADD CONSTRAINT check_preferencia_valid CHECK (preferencia_inicio IS NULL OR preferencia_inicio IN ('rutina', 'cursos', 'explorar'));

-- Nota: No agregamos constraints para peso y altura porque ya existen

-- Crear índice para optimizar consultas de onboarding
CREATE INDEX IF NOT EXISTS idx_perfiles_onboarding_completed ON public.perfiles(onboarding_completed);

-- Mensaje de confirmación
SELECT 'Migración SIMPLE completada: Campos de onboarding agregados (usando objetivo_onboarding y experiencia_onboarding)' AS mensaje;
