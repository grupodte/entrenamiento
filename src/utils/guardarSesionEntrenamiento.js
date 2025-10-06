import { supabase } from '../lib/supabaseClient';
import { EXECUTION_TYPES } from '../constants/executionTypes';

export async function guardarSesionEntrenamiento({ rutinaId, tiempoTranscurrido, elementosCompletados, rutinaDetalle, alumnoId }) {
    console.log('🔄 Iniciando guardado de sesión:', {
        rutinaId,
        tiempoTranscurrido,
        alumnoId,
        elementosCompletadosCount: Object.keys(elementosCompletados).length,
        elementosCompletados: Object.entries(elementosCompletados).slice(0, 3) // Solo primeros 3 para no saturar
    });
    
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
                    
                    // Intentar obtener datos del DOM si no los tenemos en completedData
                    let actualCarga = 0;
                    let actualReps = 0;
                    let actualDuracion = 0;
                    let tipoEjecucion = EXECUTION_TYPES.STANDARD;
                    
                    // Si tenemos datos en formato objeto, usarlos
                    if (typeof completedData === 'object' && completedData.actualCarga !== undefined) {
                        actualCarga = completedData.actualCarga || 0;
                        actualReps = completedData.actualReps || 0;
                        actualDuracion = completedData.actualDuracion || 0;
                        tipoEjecucion = completedData.tipoEjecucion || EXECUTION_TYPES.STANDARD;
                    } else {
                        // Intentar obtener del DOM como fallback
                        try {
                            // Buscar el elemento en el DOM
                            const elementInDOM = document.querySelector(`[data-serie-id="${elementoId}"]`) || 
                                                document.querySelector(`[id*="${elementoId}"]`);
                            
                            if (elementInDOM) {
                                // Buscar inputs dentro del elemento
                                const cargaInput = elementInDOM.querySelector('input[type="text"]') || 
                                                 elementInDOM.querySelector('input[placeholder*="kg"]') ||
                                                 elementInDOM.querySelector('input[placeholder*="Peso"]');
                                const repsInput = elementInDOM.querySelector('input[type="number"]') ||
                                                elementInDOM.querySelector('input[placeholder*="reps"]') ||
                                                elementInDOM.querySelector('input[placeholder*="Reps"]');
                                
                                if (cargaInput) {
                                    actualCarga = parseFloat(cargaInput.value) || 0;
                                }
                                if (repsInput) {
                                    actualReps = parseInt(repsInput.value) || 0;
                                }
                            }
                            
                            // Si no encontramos en DOM, usar datos de la serie original como fallback
                            if (actualCarga === 0 && serieEncontrada?.carga) {
                                actualCarga = parseFloat(serieEncontrada.carga) || 0;
                            }
                            if (actualReps === 0 && serieEncontrada?.reps) {
                                actualReps = parseInt(serieEncontrada.reps) || 0;
                            }
                            
                            tipoEjecucion = serieEncontrada?.tipo_ejecucion || EXECUTION_TYPES.STANDARD;
                            
                        } catch (domError) {
                            console.warn('Error accessing DOM for exercise data:', domError);
                            // Usar datos por defecto de la serie
                            actualCarga = parseFloat(serieEncontrada?.carga || 0);
                            actualReps = parseInt(serieEncontrada?.reps || 0);
                            tipoEjecucion = serieEncontrada?.tipo_ejecucion || EXECUTION_TYPES.STANDARD;
                        }
                    }
                    
                    
                    // Preparar datos base
                    const serieData = {
                        sesion_id: sesionId,
                        ejercicio_id: ejercicioEncontrado.id,
                        nro_set: nroSet,
                        carga_realizada: actualCarga,
                        tipo_ejecucion: tipoEjecucion,
                    };
                    
                    // Agregar datos específicos según tipo de ejecución
                    if (tipoEjecucion === EXECUTION_TYPES.STANDARD) {
                        serieData.reps_realizadas = actualReps;
                    } else if (tipoEjecucion === EXECUTION_TYPES.TIEMPO) {
                        serieData.duracion_realizada_segundos = actualDuracion;
                    } else if (tipoEjecucion === EXECUTION_TYPES.FALLO) {
                        serieData.reps_realizadas = actualReps;
                    }
                    
                    seriesParaInsertar.push(serieData);
                }
            }
        }

        console.log('📊 Series para insertar:', {
            cantidad: seriesParaInsertar.length,
            datos: seriesParaInsertar
        });

        // 3. Insertar en sesiones_series (batch insert para eficiencia)
        if (seriesParaInsertar.length > 0) {
            console.log('💾 Insertando', seriesParaInsertar.length, 'series...');
            const { data: insertedSeries, error: seriesError } = await supabase
                .from('sesiones_series')
                .insert(seriesParaInsertar)
                .select();

            if (seriesError) {
                console.error('❌ Error al guardar las series de la sesión:', seriesError);
                throw seriesError;
            } else {
                console.log('✅ Series guardadas exitosamente:', insertedSeries);
            }
        } else {
            console.log('⚠️ No hay series para insertar');
        }

        console.log('Sesión de entrenamiento guardada exitosamente:', sesionId);
        return { success: true, sesionId };

    } catch (error) {
        console.error('Fallo en guardarSesionEntrenamiento:', error.message);
        return { success: false, error: error.message };
    }
}
