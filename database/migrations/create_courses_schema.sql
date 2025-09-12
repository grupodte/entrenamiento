-- ============================================
-- ESQUEMA DE BASE DE DATOS PARA SISTEMA DE CURSOS
-- ============================================

-- Enum para categorías de cursos
CREATE TYPE curso_categoria AS ENUM ('transformacion', 'cardio', 'fuerza', 'bienestar', 'nutricion', 'movilidad');

-- Enum para niveles de dificultad
CREATE TYPE curso_nivel AS ENUM ('principiante', 'intermedio', 'avanzado', 'todos');

-- Enum para estados de curso
CREATE TYPE curso_estado AS ENUM ('borrador', 'publicado', 'archivado', 'mantenimiento');

-- Enum para tipos de acceso
CREATE TYPE tipo_acceso AS ENUM ('comprado', 'regalo', 'prueba', 'admin');

-- ============================================
-- TABLA PRINCIPAL DE CURSOS
-- ============================================
CREATE TABLE cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    descripcion_larga TEXT,
    instructor VARCHAR(100) NOT NULL DEFAULT 'Michele Ris',
    categoria curso_categoria NOT NULL,
    nivel curso_nivel NOT NULL,
    precio DECIMAL(10,2),
    precio_original DECIMAL(10,2),
    duracion_estimada VARCHAR(50), -- ej: "12 semanas", "6 horas"
    imagen_portada TEXT, -- URL de la imagen
    video_preview TEXT, -- URL del video preview
    estado curso_estado DEFAULT 'borrador',
    orden_visualizacion INTEGER DEFAULT 0, -- para ordenar en el catálogo
    tags TEXT[], -- array de tags para búsqueda
    requisitos TEXT[], -- array de requisitos previos
    objetivos TEXT[], -- array de objetivos del curso
    incluye TEXT[], -- array de lo que incluye el curso
    popular BOOLEAN DEFAULT false,
    nuevo BOOLEAN DEFAULT false,
    total_estudiantes INTEGER DEFAULT 0,
    rating_promedio DECIMAL(3,2) DEFAULT 0.0,
    total_ratings INTEGER DEFAULT 0,
    creado_por UUID REFERENCES auth.users(id),
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_publicacion TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT precio_valido CHECK (precio >= 0),
    CONSTRAINT precio_original_valido CHECK (precio_original >= 0),
    CONSTRAINT rating_valido CHECK (rating_promedio >= 0 AND rating_promedio <= 5)
);

-- ============================================
-- MÓDULOS DE CURSOS
-- ============================================
CREATE TABLE modulos_curso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    orden INTEGER NOT NULL, -- orden dentro del curso
    duracion_estimada VARCHAR(50), -- ej: "2 horas 30 min"
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint para orden único por curso
    UNIQUE(curso_id, orden)
);

-- ============================================
-- LECCIONES DE CURSOS
-- ============================================
CREATE TABLE lecciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modulo_id UUID NOT NULL REFERENCES modulos_curso(id) ON DELETE CASCADE,
    curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    contenido TEXT, -- texto explicativo de la lección
    video_url TEXT, -- URL del video
    duracion_segundos INTEGER, -- duración en segundos del video
    orden INTEGER NOT NULL, -- orden dentro del módulo
    es_preview BOOLEAN DEFAULT false, -- si está disponible como preview gratuito
    transcripcion TEXT, -- transcripción del video para búsqueda
    recursos_adicionales JSONB, -- enlaces, PDFs, etc.
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT duracion_valida CHECK (duracion_segundos >= 0),
    UNIQUE(modulo_id, orden)
);

-- ============================================
-- ACCESO DE USUARIOS A CURSOS
-- ============================================
CREATE TABLE acceso_cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id),
    curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    tipo_acceso tipo_acceso NOT NULL,
    fecha_inicio TIMESTAMPTZ DEFAULT NOW(),
    fecha_expiracion TIMESTAMPTZ, -- NULL significa acceso permanente
    activo BOOLEAN DEFAULT true,
    metodo_pago VARCHAR(50), -- 'stripe', 'mercadopago', 'regalo', etc.
    transaccion_id VARCHAR(255), -- ID de la transacción de pago
    precio_pagado DECIMAL(10,2), -- precio que pagó (puede diferir del actual)
    notas TEXT, -- notas administrativas
    creado_por UUID REFERENCES auth.users(id), -- quien otorgó el acceso
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    
    -- Un usuario puede tener solo un acceso activo por curso
    UNIQUE(usuario_id, curso_id, activo) DEFERRABLE INITIALLY DEFERRED
);

-- ============================================
-- PROGRESO DE LECCIONES
-- ============================================
CREATE TABLE progreso_lecciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id),
    leccion_id UUID NOT NULL REFERENCES lecciones(id) ON DELETE CASCADE,
    curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    completada BOOLEAN DEFAULT false,
    tiempo_visto_segundos INTEGER DEFAULT 0, -- tiempo total visto
    ultima_posicion_segundos INTEGER DEFAULT 0, -- última posición en el video
    fecha_primera_vista TIMESTAMPTZ,
    fecha_completada TIMESTAMPTZ,
    fecha_ultima_vista TIMESTAMPTZ DEFAULT NOW(),
    
    -- Un usuario tiene un solo progreso por lección
    UNIQUE(usuario_id, leccion_id),
    
    -- Constraints
    CONSTRAINT tiempo_visto_valido CHECK (tiempo_visto_segundos >= 0),
    CONSTRAINT posicion_valida CHECK (ultima_posicion_segundos >= 0)
);

-- ============================================
-- RESEÑAS Y CALIFICACIONES
-- ============================================
CREATE TABLE resenas_cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id),
    curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    titulo VARCHAR(255),
    comentario TEXT,
    verificada BOOLEAN DEFAULT false, -- si se verificó que compró el curso
    visible BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
    
    -- Un usuario puede reseñar un curso solo una vez
    UNIQUE(usuario_id, curso_id)
);

-- ============================================
-- ÍNDICES PARA RENDIMIENTO
-- ============================================

-- Índices para cursos
CREATE INDEX idx_cursos_categoria ON cursos(categoria);
CREATE INDEX idx_cursos_nivel ON cursos(nivel);
CREATE INDEX idx_cursos_estado ON cursos(estado);
CREATE INDEX idx_cursos_popular ON cursos(popular) WHERE popular = true;
CREATE INDEX idx_cursos_nuevo ON cursos(nuevo) WHERE nuevo = true;
CREATE INDEX idx_cursos_orden ON cursos(orden_visualizacion);
CREATE INDEX idx_cursos_rating ON cursos(rating_promedio DESC);
CREATE INDEX idx_cursos_estudiantes ON cursos(total_estudiantes DESC);

-- Índices para módulos
CREATE INDEX idx_modulos_curso ON modulos_curso(curso_id, orden);

-- Índices para lecciones
CREATE INDEX idx_lecciones_modulo ON lecciones(modulo_id, orden);
CREATE INDEX idx_lecciones_curso ON lecciones(curso_id);
CREATE INDEX idx_lecciones_preview ON lecciones(es_preview) WHERE es_preview = true;

-- Índices para acceso
CREATE INDEX idx_acceso_usuario ON acceso_cursos(usuario_id, activo);
CREATE INDEX idx_acceso_curso ON acceso_cursos(curso_id, activo);
CREATE INDEX idx_acceso_tipo ON acceso_cursos(tipo_acceso);
CREATE INDEX idx_acceso_expiracion ON acceso_cursos(fecha_expiracion) WHERE fecha_expiracion IS NOT NULL;

-- Índices para progreso
CREATE INDEX idx_progreso_usuario ON progreso_lecciones(usuario_id);
CREATE INDEX idx_progreso_curso ON progreso_lecciones(curso_id, usuario_id);
CREATE INDEX idx_progreso_completada ON progreso_lecciones(completada, fecha_completada);

-- Índices para reseñas
CREATE INDEX idx_resenas_curso ON resenas_cursos(curso_id, visible);
CREATE INDEX idx_resenas_rating ON resenas_cursos(rating);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar fecha de modificación
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar fechas de modificación
CREATE TRIGGER trigger_cursos_updated 
    BEFORE UPDATE ON cursos 
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trigger_modulos_updated 
    BEFORE UPDATE ON modulos_curso 
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trigger_lecciones_updated 
    BEFORE UPDATE ON lecciones 
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trigger_acceso_updated 
    BEFORE UPDATE ON acceso_cursos 
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trigger_resenas_updated 
    BEFORE UPDATE ON resenas_cursos 
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

-- ============================================
-- FUNCIONES PARA ESTADÍSTICAS
-- ============================================

-- Función para actualizar rating promedio de un curso
CREATE OR REPLACE FUNCTION actualizar_rating_curso(curso_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE cursos 
    SET 
        rating_promedio = (
            SELECT COALESCE(AVG(rating::numeric), 0)
            FROM resenas_cursos 
            WHERE curso_id = curso_uuid AND visible = true
        ),
        total_ratings = (
            SELECT COUNT(*)
            FROM resenas_cursos 
            WHERE curso_id = curso_uuid AND visible = true
        )
    WHERE id = curso_uuid;
END;
$$ language 'plpgsql';

-- Trigger para actualizar rating cuando se inserta/actualiza una reseña
CREATE OR REPLACE FUNCTION trigger_actualizar_rating()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM actualizar_rating_curso(COALESCE(NEW.curso_id, OLD.curso_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_resenas_rating 
    AFTER INSERT OR UPDATE OR DELETE ON resenas_cursos 
    FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_rating();

-- Función para actualizar contador de estudiantes
CREATE OR REPLACE FUNCTION actualizar_contador_estudiantes(curso_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE cursos 
    SET total_estudiantes = (
        SELECT COUNT(DISTINCT usuario_id)
        FROM acceso_cursos 
        WHERE curso_id = curso_uuid AND activo = true
    )
    WHERE id = curso_uuid;
END;
$$ language 'plpgsql';

-- Trigger para actualizar contador de estudiantes
CREATE OR REPLACE FUNCTION trigger_actualizar_estudiantes()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM actualizar_contador_estudiantes(COALESCE(NEW.curso_id, OLD.curso_id));
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_acceso_estudiantes 
    AFTER INSERT OR UPDATE OR DELETE ON acceso_cursos 
    FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_estudiantes();

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulos_curso ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE acceso_cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE progreso_lecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE resenas_cursos ENABLE ROW LEVEL SECURITY;

-- Políticas para cursos
CREATE POLICY "Cursos públicos visibles para todos" ON cursos
    FOR SELECT USING (estado = 'publicado');

CREATE POLICY "Solo admin puede gestionar cursos" ON cursos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM perfiles 
            WHERE perfiles.user_id = auth.uid() 
            AND perfiles.rol = 'admin'
        )
    );

-- Políticas para módulos
CREATE POLICY "Módulos visibles según curso" ON modulos_curso
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cursos 
            WHERE cursos.id = modulos_curso.curso_id 
            AND cursos.estado = 'publicado'
        )
    );

CREATE POLICY "Solo admin puede gestionar módulos" ON modulos_curso
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM perfiles 
            WHERE perfiles.user_id = auth.uid() 
            AND perfiles.rol = 'admin'
        )
    );

-- Políticas para lecciones
CREATE POLICY "Lecciones visibles según acceso" ON lecciones
    FOR SELECT USING (
        -- Preview gratuito O usuario tiene acceso al curso
        es_preview = true OR
        EXISTS (
            SELECT 1 FROM acceso_cursos 
            WHERE acceso_cursos.usuario_id = auth.uid() 
            AND acceso_cursos.curso_id = lecciones.curso_id 
            AND acceso_cursos.activo = true
            AND (acceso_cursos.fecha_expiracion IS NULL OR acceso_cursos.fecha_expiracion > NOW())
        )
    );

CREATE POLICY "Solo admin puede gestionar lecciones" ON lecciones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM perfiles 
            WHERE perfiles.user_id = auth.uid() 
            AND perfiles.rol = 'admin'
        )
    );

-- Políticas para acceso a cursos
CREATE POLICY "Usuario ve solo su acceso" ON acceso_cursos
    FOR SELECT USING (usuario_id = auth.uid());

CREATE POLICY "Solo admin puede gestionar accesos" ON acceso_cursos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM perfiles 
            WHERE perfiles.user_id = auth.uid() 
            AND perfiles.rol = 'admin'
        )
    );

-- Políticas para progreso
CREATE POLICY "Usuario ve solo su progreso" ON progreso_lecciones
    FOR ALL USING (usuario_id = auth.uid());

-- Políticas para reseñas
CREATE POLICY "Reseñas visibles públicamente" ON resenas_cursos
    FOR SELECT USING (visible = true);

CREATE POLICY "Usuario gestiona sus reseñas" ON resenas_cursos
    FOR ALL USING (usuario_id = auth.uid());

CREATE POLICY "Admin puede gestionar todas las reseñas" ON resenas_cursos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM perfiles 
            WHERE perfiles.user_id = auth.uid() 
            AND perfiles.rol = 'admin'
        )
    );

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista completa de cursos con estadísticas
CREATE VIEW vista_cursos_completa AS
SELECT 
    c.*,
    COUNT(DISTINCT mc.id) as total_modulos,
    COUNT(DISTINCT l.id) as total_lecciones,
    COALESCE(SUM(l.duracion_segundos), 0) as duracion_total_segundos,
    COUNT(DISTINCT l.id) FILTER (WHERE l.es_preview = true) as lecciones_preview
FROM cursos c
LEFT JOIN modulos_curso mc ON c.id = mc.curso_id
LEFT JOIN lecciones l ON c.id = l.curso_id
GROUP BY c.id;

-- Vista de progreso de usuario por curso
CREATE VIEW vista_progreso_usuario AS
SELECT 
    ac.usuario_id,
    ac.curso_id,
    c.titulo as curso_titulo,
    COUNT(DISTINCT l.id) as total_lecciones,
    COUNT(DISTINCT pl.leccion_id) FILTER (WHERE pl.completada = true) as lecciones_completadas,
    COALESCE(
        ROUND(
            (COUNT(DISTINCT pl.leccion_id) FILTER (WHERE pl.completada = true)::numeric / 
             NULLIF(COUNT(DISTINCT l.id), 0)) * 100, 
            2
        ), 
        0
    ) as porcentaje_completado,
    MAX(pl.fecha_ultima_vista) as ultima_actividad
FROM acceso_cursos ac
JOIN cursos c ON ac.curso_id = c.id
LEFT JOIN lecciones l ON c.id = l.curso_id
LEFT JOIN progreso_lecciones pl ON l.id = pl.leccion_id AND pl.usuario_id = ac.usuario_id
WHERE ac.activo = true
GROUP BY ac.usuario_id, ac.curso_id, c.titulo;

-- ============================================
-- COMENTARIOS FINALES
-- ============================================
COMMENT ON TABLE cursos IS 'Tabla principal que almacena información de cursos';
COMMENT ON TABLE modulos_curso IS 'Módulos que organizan las lecciones de un curso';
COMMENT ON TABLE lecciones IS 'Lecciones individuales con videos y contenido';
COMMENT ON TABLE acceso_cursos IS 'Control de acceso de usuarios a cursos';
COMMENT ON TABLE progreso_lecciones IS 'Seguimiento del progreso individual por lección';
COMMENT ON TABLE resenas_cursos IS 'Reseñas y calificaciones de usuarios';
