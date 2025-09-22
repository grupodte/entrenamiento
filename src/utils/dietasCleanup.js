import { supabase } from '../lib/supabaseClient';

/**
 * Limpia todas las asignaciones de dietas de un alumno específico
 * @param {string} alumnoId - ID del alumno
 * @returns {Promise<void>}
 */
export const limpiarDietasAlumno = async (alumnoId) => {
    try {
        console.log('Limpiando dietas para alumno:', alumnoId);
        
        // Desactivar todas las asignaciones de dietas del alumno
        const { error } = await supabase
            .from('asignaciones_dietas_alumnos')
            .update({ activo: false })
            .eq('alumno_id', alumnoId)
            .eq('activo', true);

        if (error) {
            console.error('Error al limpiar dietas del alumno:', error);
            throw error;
        }
        
        console.log('Dietas limpiadas exitosamente para el alumno:', alumnoId);
    } catch (error) {
        console.error('Error en limpiarDietasAlumno:', error);
        throw error;
    }
};

/**
 * Limpia todas las asignaciones de dietas relacionadas a un grupo específico
 * @param {string} grupoId - ID del grupo
 * @returns {Promise<void>}
 */
export const limpiarDietasGrupo = async (grupoId) => {
    try {
        console.log('Limpiando dietas para grupo:', grupoId);
        
        // 1. Obtener todas las dietas asignadas al grupo
        const { data: dietasGrupo, error: fetchError } = await supabase
            .from('asignaciones_dietas_grupos')
            .select('dieta_id')
            .eq('grupo_id', grupoId)
            .eq('activo', true);

        if (fetchError) {
            console.error('Error al obtener dietas del grupo:', fetchError);
            throw fetchError;
        }

        if (!dietasGrupo || dietasGrupo.length === 0) {
            console.log('No hay dietas asignadas al grupo:', grupoId);
            return;
        }

        // 2. Obtener todos los miembros activos del grupo
        const { data: miembrosGrupo, error: miembrosError } = await supabase
            .from('asignaciones_grupos_alumnos')
            .select('alumno_id')
            .eq('grupo_id', grupoId)
            .eq('activo', true);

        if (miembrosError) {
            console.error('Error al obtener miembros del grupo:', miembrosError);
            throw miembrosError;
        }

        // 3. Obtener nombre del grupo para filtrar las asignaciones
        const { data: grupoData, error: grupoError } = await supabase
            .from('grupos_alumnos')
            .select('nombre')
            .eq('id', grupoId)
            .single();

        if (grupoError) {
            console.warn('Error al obtener nombre del grupo:', grupoError);
        }

        const grupoNombre = grupoData?.nombre || 'Grupo sin nombre';

        // 4. Para cada dieta del grupo, limpiar asignaciones individuales que vinieron del grupo
        if (miembrosGrupo && miembrosGrupo.length > 0) {
            const dietaIds = dietasGrupo.map(d => d.dieta_id);
            const alumnoIds = miembrosGrupo.map(m => m.alumno_id);

            const { error: limpiezaError } = await supabase
                .from('asignaciones_dietas_alumnos')
                .update({ activo: false })
                .in('dieta_id', dietaIds)
                .in('alumno_id', alumnoIds)
                .ilike('observaciones', `%${grupoNombre}%`);

            if (limpiezaError) {
                console.error('Error al limpiar asignaciones individuales:', limpiezaError);
                throw limpiezaError;
            }
        }

        // 5. Desactivar las asignaciones de dietas del grupo
        const { error: grupoLimpiezaError } = await supabase
            .from('asignaciones_dietas_grupos')
            .update({ activo: false })
            .eq('grupo_id', grupoId);

        if (grupoLimpiezaError) {
            console.error('Error al limpiar dietas del grupo:', grupoLimpiezaError);
            throw grupoLimpiezaError;
        }
        
        console.log('Dietas limpiadas exitosamente para el grupo:', grupoId);
    } catch (error) {
        console.error('Error en limpiarDietasGrupo:', error);
        throw error;
    }
};

/**
 * Limpia asignaciones de dietas individuales que fueron asignadas vía grupo específico
 * @param {string} alumnoId - ID del alumno
 * @param {string} grupoId - ID del grupo
 * @returns {Promise<void>}
 */
export const limpiarDietasAlumnoDelGrupo = async (alumnoId, grupoId) => {
    try {
        console.log('Limpiando dietas del alumno por grupo:', { alumnoId, grupoId });
        
        // 1. Obtener nombre del grupo
        const { data: grupoData, error: grupoError } = await supabase
            .from('grupos_alumnos')
            .select('nombre')
            .eq('id', grupoId)
            .single();

        if (grupoError) {
            console.warn('Error al obtener nombre del grupo:', grupoError);
        }

        const grupoNombre = grupoData?.nombre || 'Grupo sin nombre';

        // 2. Desactivar asignaciones de dietas que vinieron de este grupo específico
        const { error } = await supabase
            .from('asignaciones_dietas_alumnos')
            .update({ activo: false })
            .eq('alumno_id', alumnoId)
            .ilike('observaciones', `%${grupoNombre}%`)
            .eq('activo', true);

        if (error) {
            console.error('Error al limpiar dietas del alumno por grupo:', error);
            throw error;
        }
        
        console.log('Dietas del alumno limpiadas exitosamente por grupo:', { alumnoId, grupoId });
    } catch (error) {
        console.error('Error en limpiarDietasAlumnoDelGrupo:', error);
        throw error;
    }
};
