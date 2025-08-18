import { supabase } from '../lib/supabaseClient'; // Asegúrate de que la ruta a tu cliente Supabase sea correcta

// Función auxiliar para crear configuración de series por defecto para supersets
// Deberás definir esta función o importarla si ya existe en otro lugar.
const createDefaultSetsConfig = (numSets) => {
    if (numSets <= 0) return [];
    return Array.from({ length: numSets }, (_, i) => ({
        nro_set: i + 1,
        reps: '', // Puedes poner valores por defecto si lo deseas
        carga: '',
        pausa: '', // La pausa compartida se aplicará después
    }));
};

export async function guardarEstructuraRutina({ rutinaId, bloques, tipoRutina = 'base' }) {
    if (!rutinaId || !bloques || !Array.isArray(bloques)) {
        console.error('guardarEstructuraRutina: Faltan parámetros requeridos o son inválidos.', { rutinaId, bloques });
        throw new Error('Faltan parámetros requeridos o son inválidos para guardar la estructura de la rutina.');
    }

    if (tipoRutina !== 'base' && tipoRutina !== 'personalizada') {
        console.error('guardarEstructuraRutina: tipoRutina inválido.', { tipoRutina });
        throw new Error('El tipo de rutina especificado es inválido.');
    }

    for (const [iBloque, bloque] of bloques.entries()) {
        // Validación básica del bloque
        if (!bloque || typeof bloque.semana_inicio === 'undefined' || typeof bloque.semana_fin === 'undefined' || !Array.isArray(bloque.subbloques)) {
            console.warn(`Saltando bloque inválido en índice ${iBloque}:`, bloque);
            continue; // Saltar este bloque y continuar con el siguiente
        }

        const { data: bloqueData, error: errorBloque } = await supabase
            .from('bloques')
            .insert([{
                [`rutina_${tipoRutina}_id`]: rutinaId,
                semana_inicio: bloque.semana_inicio,
                semana_fin: bloque.semana_fin,
                orden: iBloque,
            }])
            .select()
            .single();

        if (errorBloque) {
            console.error('Error al insertar bloque:', errorBloque);
            throw errorBloque;
        }
        const bloqueId = bloqueData.id;

        for (const [iSub, subbloque] of bloque.subbloques.entries()) {
            // Validación básica del subbloque
            if (!subbloque || !subbloque.tipo || !Array.isArray(subbloque.ejercicios)) {
                console.warn(`Saltando subbloque inválido en bloque ${bloqueId}, índice ${iSub}:`, subbloque);
                continue;
            }

            const { data: subData, error: errorSub } = await supabase
                .from('subbloques')
                .insert([{
                    bloque_id: bloqueId,
                    tipo: subbloque.tipo,
                    nombre: subbloque.nombre || '', // Asegurar que nombre no sea undefined
                    orden: iSub
                }])
                .select()
                .single();

            if (errorSub) {
                console.error('Error al insertar subbloque:', errorSub);
                throw errorSub;
            }
            const subbloqueId = subData.id;

            const esSuperset = subbloque.tipo === 'superset';
            const sharedRest = esSuperset ? (subbloque.shared_config?.shared_rest || '') : '';
            const numSets = esSuperset ? parseInt(subbloque.shared_config?.num_sets || 0, 10) : 0;

            for (const [iEj, ejercicio] of subbloque.ejercicios.entries()) {
                // Validación básica del ejercicio
                if (!ejercicio || !ejercicio.ejercicio_id) {
                    console.warn(`Saltando ejercicio inválido en subbloque ${subbloqueId}, índice ${iEj}:`, ejercicio);
                    continue;
                }

                const { data: ejData, error: errorEj } = await supabase
                    .from('subbloques_ejercicios')
                    .insert([{
                        subbloque_id: subbloqueId,
                        ejercicio_id: ejercicio.ejercicio_id, // Este es el ID del catálogo de ejercicios
                        orden: iEj
                    }])
                    .select()
                    .single();

                if (errorEj) {
                    console.error('Error al insertar subbloque_ejercicio:', errorEj);
                    throw errorEj;
                }
                const subEjId = ejData.id; // ID de la tabla subbloques_ejercicios (la relación)

                let seriesParaGuardar = [];
                if (esSuperset) {
                    // Si es superset, usamos sets_config si existe, o creamos defaults.
                    // sets_config debería ser un array de objetos {reps, carga}, sin pausa individual.
                    seriesParaGuardar = ejercicio.sets_config && ejercicio.sets_config.length > 0
                        ? ejercicio.sets_config
                        : createDefaultSetsConfig(numSets);
                } else {
                    // Si es simple, usamos el array de series directamente.
                    // series debería ser un array de objetos {reps, carga, pausa}.
                    seriesParaGuardar = ejercicio.series || [];
                }

                if (!Array.isArray(seriesParaGuardar)) {
                    console.warn(`Series para guardar no es un array para ejercicio ${ejercicio.ejercicio_id} en subbloque ${subbloqueId}. Saltando series.`);
                    continue;
                }

                for (let iSet = 0; iSet < seriesParaGuardar.length; iSet++) {
                    const set = seriesParaGuardar[iSet];
                    // Validación básica de la serie/set
                    if (typeof set.reps === 'undefined' && typeof set.carga_sugerida === 'undefined' && typeof set.carga === 'undefined') {
                        console.warn(`Saltando set inválido en ejercicio ${subEjId}, índice ${iSet}:`, set);
                        continue;
                    }

                    const reps = parseInt(set.reps, 10);
                    const carga = parseInt(typeof set.carga !== 'undefined' ? set.carga : set.carga_sugerida, 10);
                    const pausa = parseInt(esSuperset ? sharedRest : set.pausa, 10);

                    const { error: errorSerie } = await supabase
                        .from('series_subejercicio')
                        .insert([{
                            subbloque_ejercicio_id: subEjId,
                            nro_set: iSet + 1,
                            reps: isNaN(reps) ? null : reps,
                            carga_sugerida: isNaN(carga) ? null : carga,
                            pausa: isNaN(pausa) ? null : pausa,
                        }]);

                    if (errorSerie) {
                        console.error('Error al insertar serie_subejercicio:', errorSerie);
                        throw errorSerie;
                    }
                }
            }
        }
    }
    console.log(`Estructura de rutina (${tipoRutina}) guardada exitosamente para rutina ID: ${rutinaId}`);
}
