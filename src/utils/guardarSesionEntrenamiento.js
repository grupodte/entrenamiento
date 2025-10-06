import { supabase } from '../lib/supabaseClient';
import { EXECUTION_TYPES } from '../constants/executionTypes';

export async function guardarSesionEntrenamiento({ rutinaId, tiempoTranscurrido, elementosCompletados, rutinaDetalle, alumnoId }) {
    try {
        // 1. Insertar en sesiones_entrenamiento
        const insertObject = {
            created_at: new Date().toISOString(),
            duracion_segundos: tiempoTranscurrido,
            alumno_id: alumnoId,
        };

        if (rutinaDetalle.tipo === 'personalizada') {
            insertObject.rutina_personalizada_id = rutinaId;
        } else {
            insertObject.rutina_base_id = rutinaId;
        }

        const { data: sesionData, error: sesionError } = await supabase
            .from('sesiones_entrenamiento')
            .insert([
                insertObject
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
                let subbloqueId, sbeId, nroSet;

                if (tipo === 'simple') {
                    subbloqueId = parts[1];
                    sbeId = parts[2];
                    nroSet = parseInt(parts[3], 10);
                } else if (tipo === 'superset') {
                    subbloqueId = `${parts[1]}-${parts[2]}-${parts[3]}-${parts[4]}-${parts[5]}`;
                    sbeId = `${parts[6]}-${parts[7]}-${parts[8]}-${parts[9]}-${parts[10]}`;
                    nroSet = parseInt(parts[11].replace('set', ''), 10);
                } else {
                    console.warn('Unknown element type in elementoId:', elementoId);
                    continue; // Skip this element
                }

                console.log(`Attempting to find: subbloqueId=${subbloqueId}, sbeId=${sbeId}, nroSet=${nroSet}`);

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

                console.log('Found ejercicioEncontrado:', ejercicioEncontrado);
                console.log('Found serieEncontrada:', serieEncontrada);

                const completedData = elementosCompletados[elementoId];
                if (ejercicioEncontrado && completedData) {
                    // Manejar ambos formatos: nuevo (objeto) y anterior (boolean)
                    const completedDetails = typeof completedData === 'object' 
                        ? completedData 
                        : { completed: true }; // Formato anterior
                    
                    console.log('Processing elementoId:', elementoId);
                    console.log('Ejercicio encontrado:', ejercicioEncontrado);
                    console.log('Completed details:', completedDetails);
                    
                    // Solo procesar si tenemos datos de serie o es formato boolean
                    if (completedDetails.completed || completedDetails === true || typeof completedData === 'boolean') {
                        // Preparar datos base
                        const serieData = {
                            sesion_id: sesionId,
                            ejercicio_id: ejercicioEncontrado.id,
                            nro_set: nroSet,
                            carga_realizada: completedDetails.actualCarga || 0,
                            tipo_ejecucion: completedDetails.tipoEjecucion || EXECUTION_TYPES.STANDARD,
                        };
                        
                        // Agregar datos específicos según tipo de ejecución
                        const tipoEjecucion = completedDetails.tipoEjecucion || EXECUTION_TYPES.STANDARD;
                        
                        if (tipoEjecucion === EXECUTION_TYPES.STANDARD) {
                            serieData.reps_realizadas = completedDetails.actualReps || 0;
                        } else if (tipoEjecucion === EXECUTION_TYPES.TIEMPO) {
                            serieData.duracion_realizada_segundos = completedDetails.actualDuracion || 0;
                        } else if (tipoEjecucion === EXECUTION_TYPES.FALLO) {
                            serieData.reps_realizadas = completedDetails.actualReps || 0; // Reps alcanzadas al fallo
                        }
                        
                        seriesParaInsertar.push(serieData);
                    }
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
