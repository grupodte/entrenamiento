-- ============================================
-- FUNCIÓN RPC PARA OBTENER PROGRESO DE PESO
-- ============================================

DROP FUNCTION IF EXISTS get_weight_progress(UUID);

CREATE OR REPLACE FUNCTION get_weight_progress(
    alumno_uuid UUID
)
RETURNS JSON AS $$
DECLARE
    peso_inicial DECIMAL(5,2);
    peso_actual DECIMAL(5,2);
    fecha_inicial DATE;
    fecha_actual DATE;
    diferencia DECIMAL(5,2);
    total_registros INTEGER;
    peso_perfil DECIMAL(5,2);
    resultado JSON;
BEGIN
    -- Obtener peso inicial del perfil del usuario
    SELECT peso INTO peso_perfil
    FROM perfiles
    WHERE id = alumno_uuid;
    
    -- Contar total de registros de seguimiento
    SELECT COUNT(*) INTO total_registros
    FROM registros_peso
    WHERE alumno_id = alumno_uuid;
    
    -- El peso inicial siempre es el del perfil
    peso_inicial := peso_perfil;
    fecha_inicial := NULL; -- No tenemos fecha específica del perfil
    
    -- Si no hay registros de seguimiento, el peso actual es el del perfil
    IF total_registros = 0 THEN
        peso_actual := peso_perfil;
        fecha_actual := NULL;
    ELSE
        -- Obtener peso actual (último registro de seguimiento)
        SELECT peso_kg, fecha_registro INTO peso_actual, fecha_actual
        FROM registros_peso
        WHERE alumno_id = alumno_uuid
        ORDER BY fecha_registro DESC, created_at DESC
        LIMIT 1;
    END IF;
    
    -- Si no tenemos peso inicial del perfil, devolver estructura vacía
    IF peso_inicial IS NULL THEN
        RETURN json_build_object(
            'peso_inicial', null,
            'peso_actual', null,
            'diferencia', null,
            'fecha_inicial', null,
            'fecha_actual', null,
            'total_registros', total_registros,
            'progreso_texto', 'Sin peso registrado en perfil'
        );
    END IF;
    
    -- Calcular diferencia
    diferencia := peso_actual - peso_inicial;
    
    -- Construir resultado
    resultado := json_build_object(
        'peso_inicial', peso_inicial,
        'peso_actual', peso_actual,
        'diferencia', diferencia,
        'fecha_inicial', fecha_inicial,
        'fecha_actual', fecha_actual,
        'total_registros', total_registros,
        'progreso_texto', 
            CASE 
                WHEN diferencia > 0 THEN '+' || diferencia::TEXT || ' kg'
                WHEN diferencia < 0 THEN diferencia::TEXT || ' kg'
                ELSE 'Sin cambios'
            END
    );
    
    RETURN resultado;
END;
$$ LANGUAGE plpgsql;
