import { supabase } from '../lib/supabaseClient'; // Ajusta la ruta según tu estructura
import { guardarEstructuraRutina } from './guardarEstructuraRutina'; // Importamos la función refactorizada
import { EXECUTION_TYPES, normalizarSerie } from '../constants/executionTypes';

/**
 * Clona una rutina base existente a una nueva rutina personalizada para un alumno específico.
 *
 * @param {string} rutinaBaseId El UUID de la rutina base a clonar.
 * @param {string} alumnoId El UUID del alumno al que se le asignará la rutina personalizada.
 * @param {string} entrenadorId El UUID del entrenador que realiza la clonación.
 * @param {object} [opcionesAdicionales] Opciones adicionales para la rutina personalizada.
 * @param {string} [opcionesAdicionales.nuevoNombre] Nombre para la nueva rutina personalizada. Si no se provee, se usa el de la rutina base.
 * @param {string} [opcionesAdicionales.notas] Notas adicionales para la rutina personalizada.
 * @param {Date | string} [opcionesAdicionales.fechaInicio] Fecha de inicio para la rutina personalizada (este campo se usará para la `rutinas_personalizadas.fecha_inicio` pero ya no para crear una asignación).
 * @returns {Promise<string|null>} El ID de la rutina personalizada creada, o null si hubo un error.
 */
export async function clonarRutinaBaseHaciaPersonalizada(
    rutinaBaseId,
    alumnoId,
    entrenadorId,
    opcionesAdicionales = {}
) {
    if (!rutinaBaseId || !alumnoId || !entrenadorId) {
        console.error('Faltan IDs requeridos para la clonación:', { rutinaBaseId, alumnoId, entrenadorId });
        throw new Error('Los IDs de rutina base, alumno y entrenador son obligatorios.');
    }

    try {
        // PASO DE DIAGNÓSTICO: Intentar obtener solo la rutina base
        const { data: simpleRutinaBase, error: simpleError } = await supabase
            .from('rutinas_base')
            .select('id, nombre, descripcion, tipo') // Solo campos de la tabla principal
            .eq('id', rutinaBaseId)
            .maybeSingle(); // Usar maybeSingle para evitar error si no se encuentra por RLS, etc.

        console.log('[clonarRutina] Intento de carga simple:', { rutinaBaseId, simpleRutinaBase, simpleError: simpleError ? JSON.stringify(simpleError, null, 2) : null });

        if (simpleError && simpleError.code !== 'PGRST116') { // PGRST116 es "Objeto no encontrado", que manejamos después
            console.error('[clonarRutina] Error en carga simple de rutina_base (no PGRST116):', JSON.stringify(simpleError, null, 2));
            throw new Error(`Error primario al buscar rutina base ID: ${rutinaBaseId}. Detalles: ${simpleError.message}`);
        }
        if (!simpleRutinaBase) {
            console.error(`[clonarRutina] Carga simple no encontró rutina base o devolvió null. ID: ${rutinaBaseId}. Posible RLS o ID incorrecto.`);
            throw new Error(`No se pudo encontrar la rutina base (verificación simple) con ID: ${rutinaBaseId}.`);
        }
        // Si la carga simple funcionó, ahora intentamos la carga completa.
        // Esto ayuda a aislar si el problema es con la rutina_base en sí o con sus relaciones/anidamientos.
        console.log('[clonarRutina] Carga simple de rutina base exitosa. Procediendo a carga completa anidada...');

        // 1. Obtener la rutina base completa con su estructura anidada
        const { data: rutinaBase, error: errorCarga } = await supabase
            .from('rutinas_base')
            .select(`
        id,
        nombre,
        descripcion,
        tipo,
        bloques (
          id,
          semana_inicio,
          semana_fin,
          orden,
          subbloques (
            id,
            tipo,
            nombre,
            orden,
            shared_config,
            ejercicios: subbloques_ejercicios (
              id,
              ejercicio_id,
              ejercicio:ejercicios(id, nombre), 
              orden,
              series:series_subejercicio (
                id,
                nro_set,
                reps,
                pausa,
                carga_sugerida,
                tipo_ejecucion,
                duracion_segundos,
                unidad_tiempo,
                nota
              )
            )
          )
        )
      `)
            .eq('id', rutinaBaseId)
            .single();

        if (errorCarga || !rutinaBase) {
            // Loguear el error completo de Supabase si existe
            console.error(`[clonarRutina] Error al cargar la rutina base COMPLETA para clonar. ID: ${rutinaBaseId}`, errorCarga ? JSON.stringify(errorCarga, null, 2) : 'rutinaBase es null/undefined');
            // Usar el nombre de la rutina simple cargada para el mensaje si la rutinaBase completa falla
            const nombreParaError = simpleRutinaBase?.nombre || `ID: ${rutinaBaseId}`;
            throw new Error(`No se pudo cargar la estructura completa de la rutina base "${nombreParaError}". Verifique RLS en tablas anidadas o la estructura del select.`);
        }

        // Si llegamos aquí, rutinaBase (completa) se cargó bien.
        console.log(`[clonarRutina] Carga completa anidada de rutina base "${rutinaBase.nombre}" exitosa.`);

        // 2. Crear la cabecera de la rutina personalizada
        const nombreRutinaPersonalizada = opcionesAdicionales.nuevoNombre || `${rutinaBase.nombre} (Personalizada)`;

        const { data: nuevaRutinaPersonalizada, error: errorCreacionRP } = await supabase
            .from('rutinas_personalizadas')
            .insert([{
                alumno_id: alumnoId,
                nombre: nombreRutinaPersonalizada,
                rutina_base_id: rutinaBase.id, // Guardamos referencia a la original
                entrenador_id: entrenadorId,
                notas: opcionesAdicionales.notas || '',
                fecha_inicio: opcionesAdicionales.fechaInicio || null,
                es_activa: true, // Por defecto es activa
                // Aquí podrías añadir otros campos si la tabla 'rutinas_personalizadas' los tiene
                // y los quieres inicializar (ej. descripción, tipo, etc., copiados de rutinaBase)
                // descripcion: rutinaBase.descripcion, 
                // tipo: rutinaBase.tipo, 
            }])
            .select()
            .single();

        if (errorCreacionRP || !nuevaRutinaPersonalizada) {
            console.error('Error al crear la cabecera de la rutina personalizada:', errorCreacionRP);
            throw new Error('No se pudo crear la rutina personalizada.');
        }

        const nuevaRutinaPersonalizadaId = nuevaRutinaPersonalizada.id;

        // 3. Preparar los bloques para la nueva estructura.
        // La función guardarEstructuraRutina espera una estructura de bloques que contenga
        // subbloques, y estos a su vez ejercicios con sus series/sets_config.
        // La data de rutinaBase.bloques ya debería tener esta estructura anidada gracias al select.
        // Es importante asegurarse que los campos coincidan con lo que espera `guardarEstructuraRutina`.
        // Por ejemplo, si `guardarEstructuraRutina` espera `ejercicio.ejercicio_id` y `ejercicio.series` o `ejercicio.sets_config`.

        // Transformar los datos de `series_subejercicio` para que coincidan con la estructura esperada por `guardarEstructuraRutina`
        // (que espera `ejercicio.series` para simple y `ejercicio.sets_config` para superset).
        const bloquesTransformados = rutinaBase.bloques.map(bloque => ({
            ...bloque, // Mantenemos semana_inicio, semana_fin, orden
            subbloques: bloque.subbloques.map(subbloque => ({
                ...subbloque, // Mantenemos tipo, nombre, orden, shared_config
                ejercicios: subbloque.ejercicios.map(ej => {
                    const esSuperset = subbloque.tipo === 'superset';
                    if (esSuperset) {
                        return {
                            ejercicio_id: ej.ejercicio_id, // ID del catálogo de ejercicios
                            orden: ej.orden,
                            // Para superset, `guardarEstructuraRutina` espera `sets_config`
                            // Cada elemento de `sets_config` debe tener `reps` y `carga`.
                            // `series_subejercicio` ya tiene `reps` y `carga_sugerida` (que mapeamos a `carga`).
                            sets_config: ej.series.map(serie => {
                                const normalized = normalizarSerie(serie);
                                return {
                                    reps: normalized.reps,
                                    carga: normalized.carga_sugerida,
                                    tipo_ejecucion: normalized.tipo_ejecucion,
                                    duracion_segundos: normalized.duracion_segundos,
                                    unidad_tiempo: normalized.unidad_tiempo,
                                    nota: normalized.nota,
                                    // nro_set y pausa no son parte de sets_config, se manejan diferente en superset
                                };
                            }),
                        };
                    } else { // Tipo 'simple'
                        return {
                            ejercicio_id: ej.ejercicio_id,
                            orden: ej.orden,
                            // Para simple, `guardarEstructuraRutina` espera `series`
                            // Cada serie debe tener `reps`, `carga_sugerida` (mapeado a `carga` en guardarEstructuraRutina) y `pausa`.
                            series: ej.series.map(serie => normalizarSerie(serie)),
                        };
                    }
                }),
            })),
        }));


        // 4. Usar guardarEstructuraRutina para duplicar los componentes anidados
        await guardarEstructuraRutina({
            rutinaId: nuevaRutinaPersonalizadaId,
            bloques: bloquesTransformados, // Usamos los bloques de la rutina base original
            tipoRutina: 'personalizada',
        });

        // Paso 5 (creación de asignación) eliminado. La gestión de asignaciones
        // se hará en el componente que llama a esta función (ej. DiaCard.jsx).

        console.log(`Rutina base ${rutinaBaseId} clonada exitosamente a rutina personalizada ${nuevaRutinaPersonalizadaId} para alumno ${alumnoId}`);
        return nuevaRutinaPersonalizadaId;

    } catch (error) {
        console.error('Error durante el proceso de clonación de rutina:', error);
        // Podrías querer limpiar la rutina personalizada si se creó la cabecera pero falló el resto.
        // Esto requeriría más lógica para eliminar `nuevaRutinaPersonalizada` si existe.
        return null;
    }
}
