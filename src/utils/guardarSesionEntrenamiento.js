import { supabase } from '../lib/supabaseClient';

export async function guardarSesionEntrenamiento({ rutinaId, tiempoTranscurrido, elementosCompletados, rutinaDetalle, alumnoId }) {
    try {
        // 1. Insertar en sesiones_entrenamiento
        const { data: sesionData, error: sesionError } = await supabase
            .from('sesiones_entrenamiento')
            .insert([
                {
                    ...(rutinaDetalle.tipo === 'personalizada' ? { rutina_personalizada_id: rutinaId } : { rutina_base_id: rutinaId }),
                    created_at: new Date().toISOString(),
                    duracion_segundos: tiempoTranscurrido,
                    alumno_id: alumnoId, // Add alumno_id here
                    // Puedes añadir más campos aquí si los tienes en tu tabla sesiones_entrenamiento
                },
            ])
            .select()
            .single();

        if (sesionError) {
            console.error('Error al guardar la sesión de entrenamiento:', sesionError);
            throw sesionError;
        }

        const sesionId = sesionData.id;
        const seriesParaInsertar = [];

        // 2. Procesar elementos completados para insertar en sesiones_series
        for (const elementoId in elementosCompletados) {
            if (elementosCompletados[elementoId]) {
                // Parsear el elementoId para obtener los detalles
                const parts = elementoId.split('-');
                const tipo = parts[0]; // 'simple' o 'superset'
                const subbloqueId = parts[1];
                const sbeId = parts[2]; // subbloques_ejercicios.id
                const nroSet = parseInt(parts[3], 10); // nro_set para simple, o numSerieSuperset para superset

                // Buscar el ejercicio y la serie correspondiente en la estructura de la rutina
                let ejercicioEncontrado = null;
                let serieEncontrada = null;

                rutinaDetalle.bloques.forEach(bloque => {
                    bloque.subbloques.forEach(subbloque => {
                        if (subbloque.id.toString() === subbloqueId) {
                            subbloque.subbloques_ejercicios.forEach(sbe => {
                                if (sbe.id.toString() === sbeId) {
                                    ejercicioEncontrado = sbe.ejercicio; // Esto debería ser el objeto ejercicio con el id
                                    if (tipo === 'simple') {
                                        serieEncontrada = sbe.series.find(s => s.nro_set === nroSet);
                                    } else if (tipo === 'superset') {
                                        // Para superset, la serie es la configuración del set para ese ejercicio
                                        // Asumiendo que sets_config tiene la misma estructura que series
                                        serieEncontrada = sbe.series.find(s => s.nro_set === nroSet);
                                    }
                                }
                            });
                        }
                    });
                });

                if (ejercicioEncontrado && serieEncontrada) {
                    seriesParaInsertar.push({
                        sesion_id: sesionId,
                        ejercicio_id: ejercicioEncontrado.id, // Asegúrate de que ejercicioEncontrado.id sea el ID del ejercicio
                        nro_set: nroSet,
                        reps_realizadas: serieEncontrada.reps, // O el valor real si lo capturas
                        carga_realizada: serieEncontrada.carga_sugerida || serieEncontrada.carga, // O el valor real
                        // Añadir cualquier otro campo relevante de la serie completada
                    });
                }
            }
        }

        // 3. Insertar en sesiones_series (batch insert para eficiencia)
        if (seriesParaInsertar.length > 0) {
            const { error: seriesError } = await supabase
                .from('sesiones_series')
                .insert(seriesParaInsertar);

            if (seriesError) {
                console.error('Error al guardar las series de la sesión:', seriesError);
                throw seriesError;
            }
        }

        console.log('Sesión de entrenamiento guardada exitosamente:', sesionId);
        return { success: true, sesionId };

    } catch (error) {
        console.error('Fallo en guardarSesionEntrenamiento:', error.message);
        return { success: false, error: error.message };
    }
}
