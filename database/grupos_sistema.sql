-- Sistema de Grupos de Alumnos
-- Ejecutar en Supabase SQL Editor

-- 1. Tabla principal de grupos
CREATE TABLE IF NOT EXISTS grupos_alumnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#6366f1', -- Color hexadecimal para el grupo
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_inicio_curso DATE, -- Opcional: cuando inicia el curso para este grupo
    fecha_fin_curso DATE, -- Opcional: cuando termina el curso
    objetivo TEXT, -- Ej: "Bajar de peso", "Ganar masa muscular", etc.
    activo BOOLEAN DEFAULT TRUE,
    creado_por UUID REFERENCES perfiles(id),
    CONSTRAINT unique_grupo_nombre UNIQUE(nombre)
);

-- 2. Tabla de relación alumnos-grupos (muchos a muchos)
CREATE TABLE IF NOT EXISTS asignaciones_grupos_alumnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id UUID NOT NULL REFERENCES grupos_alumnos(id) ON DELETE CASCADE,
    alumno_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_desasignacion TIMESTAMP WITH TIME ZONE,
    activo BOOLEAN DEFAULT TRUE,
    notas TEXT,
    CONSTRAINT unique_alumno_grupo_activo UNIQUE(grupo_id, alumno_id, activo)
);

-- 3. Tabla de asignaciones masivas de rutinas/cursos a grupos
CREATE TABLE IF NOT EXISTS asignaciones_grupos_contenido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id UUID NOT NULL REFERENCES grupos_alumnos(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('rutina', 'curso', 'rutina_completa')),
    rutina_base_id UUID REFERENCES rutinas_base(id), -- Para rutinas individuales
    rutina_de_verdad_id UUID REFERENCES rutinas_de_verdad(id), -- Para rutinas completas
    curso_id UUID REFERENCES cursos(id), -- Para cursos
    fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_inicio DATE, -- Cuándo inicia para este grupo
    fecha_fin DATE, -- Cuándo termina (opcional)
    asignado_por UUID REFERENCES perfiles(id),
    activo BOOLEAN DEFAULT TRUE,
    notas TEXT
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_grupos_alumnos_activo ON grupos_alumnos(activo);
CREATE INDEX IF NOT EXISTS idx_grupos_alumnos_fecha_creacion ON grupos_alumnos(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_asignaciones_grupos_alumnos_grupo ON asignaciones_grupos_alumnos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_grupos_alumnos_alumno ON asignaciones_grupos_alumnos(alumno_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_grupos_alumnos_activo ON asignaciones_grupos_alumnos(activo);
CREATE INDEX IF NOT EXISTS idx_asignaciones_grupos_contenido_grupo ON asignaciones_grupos_contenido(grupo_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_grupos_contenido_tipo ON asignaciones_grupos_contenido(tipo);

-- RLS (Row Level Security) - ajustar según tus políticas existentes
ALTER TABLE grupos_alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones_grupos_alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones_grupos_contenido ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar según tu sistema de auth)
-- Admins pueden hacer todo
CREATE POLICY "Admins pueden ver todos los grupos" ON grupos_alumnos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM perfiles 
            WHERE perfiles.id = auth.uid() 
            AND perfiles.rol = 'admin'
        )
    );

CREATE POLICY "Admins pueden ver todas las asignaciones de grupos" ON asignaciones_grupos_alumnos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM perfiles 
            WHERE perfiles.id = auth.uid() 
            AND perfiles.rol = 'admin'
        )
    );

CREATE POLICY "Admins pueden ver todas las asignaciones de contenido" ON asignaciones_grupos_contenido
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM perfiles 
            WHERE perfiles.id = auth.uid() 
            AND perfiles.rol = 'admin'
        )
    );

-- Los alumnos pueden ver solo los grupos a los que pertenecen
CREATE POLICY "Alumnos pueden ver sus grupos" ON grupos_alumnos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM asignaciones_grupos_alumnos 
            WHERE asignaciones_grupos_alumnos.grupo_id = grupos_alumnos.id
            AND asignaciones_grupos_alumnos.alumno_id = auth.uid()
            AND asignaciones_grupos_alumnos.activo = true
        )
    );
