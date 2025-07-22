// RutinaForm.jsx
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuthUser } from '../../hooks/useAuthUser'; // Importar el hook aquí arriba
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import BloqueEditor from '../../components/Rutina/BloqueEditor';
import { guardarEstructuraRutina } from '../../utils/guardarEstructuraRutina'; // Importar la nueva función
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const createDefaultSetsConfig = (numSets, reps = '', carga = '') => {
    return Array(numSets).fill(null).map(() => ({ reps, carga })); // reps y carga deben ser strings aquí
};

// Nuevas props añadidas: esModoPersonalizar, alumnoIdParaPersonalizar, asignacionIdParaPersonalizar, idRutinaOriginal, tipoEntidadOriginal
const RutinaForm = ({

    
    modo = "crear",
    rutinaInicial = null,
    onGuardar,
    esModoPersonalizar = false,
    alumnoIdParaPersonalizar = null,
    asignacionIdParaPersonalizar = null,
    idRutinaOriginal = null, // ID de la rutina_base si esModoPersonalizar es true
    tipoEntidadOriginal = 'base' // 'base' o 'personalizada', si modo="editar" y !esModoPersonalizar
}) => {
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState(''); // Tipo de la rutina (ej. "Fuerza", "Hipertrofia")
    const [descripcion, setDescripcion] = useState('');
    const [bloques, setBloques] = useState([]);
    const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);
    const [bloqueAnimadoId, setBloqueAnimadoId] = useState(null);
    const [bloqueEliminadoId, setBloqueEliminadoId] = useState(null);

    // Llamar a useAuthUser dentro del cuerpo del componente
    const { perfil: perfilEntrenador, isLoading: isLoadingAuthUserHook, error: errorAuthUserHook } = useAuthUser();

    useEffect(() => {
        if (modo === "editar" && rutinaInicial) {
            setNombre(rutinaInicial.nombre || '');
            setTipo(rutinaInicial.tipo || '');
            setDescripcion(rutinaInicial.descripcion || '');

            // Transformación mejorada para preservar la estructura de datos del frontend
            // y asegurar la consistencia con lo que esperan los componentes editores.
            const bloquesTransformados = rutinaInicial.bloques?.map(bloqueOriginal => {
                return {
                    ...bloqueOriginal, // id, semana_inicio, semana_fin, orden, etc.
                    id: bloqueOriginal.id || uuidv4(), // Asegurar ID para el estado local si no viene
                    subbloques: bloqueOriginal.subbloques?.map(subBloqueOriginal => {
                        const esSuperset = subBloqueOriginal.tipo === 'superset';

                        // Reconstruir shared_config si es superset, basado en los datos de la primera serie del primer ejercicio,
                        // o usar el shared_config que ya venga en subBloqueOriginal si existe y es más fiable.
                        // La estructura actual de rutinaInicial.series ya está anidada.
                        let numSetsInferido = 0;
                        let sharedRestInferido = '';

                        if (esSuperset && subBloqueOriginal.ejercicios && subBloqueOriginal.ejercicios.length > 0) {
                            const primerEjercicioSeries = subBloqueOriginal.ejercicios[0].series;
                            if (primerEjercicioSeries && primerEjercicioSeries.length > 0) {
                                numSetsInferido = primerEjercicioSeries.length;
                                sharedRestInferido = primerEjercicioSeries[0].pausa || ''; // En superset, la pausa de la primera serie es la compartida
                            }
                        }

                        const sharedConfigFinal = esSuperset
                            ? (subBloqueOriginal.shared_config || { num_sets: numSetsInferido || 1, shared_rest: sharedRestInferido || '' })
                            : undefined;

                        return {
                            ...subBloqueOriginal, // id, tipo, nombre, orden, etc.
                            shared_config: sharedConfigFinal,
                            ejercicios: subBloqueOriginal.ejercicios?.map(ejercicioOriginal => {
                                // La `rutinaInicial` ya debería venir con `ejercicio.series` poblado desde el SELECT de Supabase.
                                // `ejercicio.series` es un array de objetos: {reps, carga_sugerida, pausa, nro_set, etc.}
                                if (esSuperset) {
                                    // Para supersets, el frontend (SubbloqueEditor, SupersetSharedConfigEditor)
                                    // maneja `shared_config` a nivel de subbloque.
                                    // `EjercicioChip` o `EjercicioEditor` dentro de un superset podría necesitar `sets_config`
                                    // que es una versión simplificada de `series` (solo reps y carga).
                                    return {
                                        ...ejercicioOriginal, // id, ejercicio_id, orden, etc.
                                        // `ejercicio.ejercicio` (nombre del ejercicio) ya está en ejercicioOriginal.
                                        // Mapear `ejercicioOriginal.series` a `sets_config` para el estado del formulario
                                        sets_config: ejercicioOriginal.series?.map(s => ({
                                            reps: s.reps || '',
                                            carga: s.carga_sugerida || '',
                                            // nro_set y pausa no son parte de sets_config, se gestionan por shared_config
                                        })) || createDefaultSetsConfig(sharedConfigFinal?.num_sets || 0)
                                    };
                                } else { // Tipo 'simple'
                                    // Para ejercicios simples, el frontend (EjercicioEditor) espera `ejercicio.series`
                                    // con la estructura completa (reps, carga, pausa).
                                    // Aseguramos que los campos que usa SeriesInput (reps, carga, pausa) estén presentes.
                                    return {
                                        ...ejercicioOriginal,
                                        series: ejercicioOriginal.series?.map(s => ({
                                            id: s.id || uuidv4(), // id de la serie si existe, o nuevo para el estado
                                            reps: s.reps || '',
                                            carga: s.carga_sugerida || '', // Asumimos que en 'simple', la carga es carga_sugerida
                                            pausa: s.pausa || '',
                                            // nro_set se puede mantener si es útil para la UI, aunque se recalcula al guardar.
                                        })) || [{ id: uuidv4(), reps: '', carga: '', pausa: '' }] // Al menos una serie vacía
                                    };
                                }
                            }) || [],
                        };
                    }) || [],
                };
            }) || [];

            setBloques(bloquesTransformados);
        } else {
            // Modo crear o no hay rutinaInicial
            setNombre('');
            setTipo('');
            setDescripcion('');
            setBloques([]);
        }
    }, [modo, rutinaInicial]);


    // Eliminados los useEffect relacionados con localStorage

    useEffect(() => {
        const fetchEjercicios = async () => {
            const { data, error } = await supabase
                .from('ejercicios')
                .select('id, nombre, grupo_muscular');
            if (!error) setEjerciciosDisponibles(data);
            else toast.error('Error al cargar ejercicios.');
        };
        fetchEjercicios();
    }, []);

    // Helper to deep copy a block (with new IDs for block, subblocks, exercises, and series)
    const deepCopyBloque = (bloqueADuplicar) => {
        return {
            ...bloqueADuplicar,
            id: uuidv4(),
            subbloques: (bloqueADuplicar.subbloques || []).map(sb => ({
                ...sb,
                id: uuidv4(),
                ejercicios: (sb.ejercicios || []).map(ej => ({
                    ...ej,
                    id: uuidv4(),
                    series: ej.series?.map(s => ({ ...s })) || [],
                    sets_config: ej.sets_config?.map(s => ({ ...s })) || [],
                })),
            })),
        };
    };

    // Helper to recalculate weeks for all blocks
    const recalcularSemanas = (bloquesArr) => {
        const semanasPorBloque = 4;
        return bloquesArr.map((b, i) => ({
            ...b,
            semana_inicio: i * semanasPorBloque + 1,
            semana_fin: (i + 1) * semanasPorBloque,
        }));
    };

    const onDragEnd = (event) => {
        const { active, over } = event;
        if (active?.id && over?.id && active.id !== over.id) {
            const oldIndex = bloques.findIndex(b => b.id === active.id);
            const newIndex = bloques.findIndex(b => b.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                const nuevosBloques = arrayMove(bloques, oldIndex, newIndex);
                setBloques(recalcularSemanas(nuevosBloques));
            }
        }
    };

    const agregarBloque = () => {
        const nuevoBloque = {
            id: uuidv4(),
            semana_inicio: 1, // recalculado luego
            semana_fin: 4,
            subbloques: [],
        };
        const nuevosBloques = [...bloques, nuevoBloque];
        setBloques(recalcularSemanas(nuevosBloques));
        setBloqueAnimadoId(nuevoBloque.id);
    };

    const actualizarBloque = (bloqueActualizado) => {
        setBloques(prev => prev.map(b => (b.id === bloqueActualizado.id ? bloqueActualizado : b)));
    };

    const eliminarBloque = (bloqueId) => {
        setBloqueEliminadoId(bloqueId);
        setTimeout(() => {
            const nuevosBloques = bloques.filter(b => b.id !== bloqueId);
            setBloques(recalcularSemanas(nuevosBloques));
            setBloqueEliminadoId(null);
        }, 350); // debe coincidir con la duración de la animación exit
    };

    const duplicarBloque = (bloqueADuplicar) => {
        const nuevoBloque = deepCopyBloque(bloqueADuplicar);
        const nuevosBloques = [...bloques, nuevoBloque];
        setBloques(recalcularSemanas(nuevosBloques));
        setBloqueAnimadoId(nuevoBloque.id);
    };

    // Helper function to insert bloques, subbloques, ejercicios, and series
    // _guardarComponentesAnidados ha sido movido a src/utils/guardarEstructuraRutina.js
    // Ya no es necesario aquí.

    // La importación de useAuthUser ya está en el top-level.
    // La llamada al hook debe estar dentro del cuerpo del componente.

    const validarRutina = () => {
        if (!nombre.trim()) {
            toast.error('El nombre de la rutina es obligatorio.');
            return false;
        }
        if (bloques.length === 0) {
            toast.error('La rutina debe tener al menos un bloque.');
            return false;
        }

        for (const bloque of bloques) {
            if (bloque.subbloques.length === 0) {
                toast.error(`El bloque de semana ${bloque.semana_inicio}-${bloque.semana_fin} debe tener al menos un sub-bloque.`);
                return false;
            }
            for (const subbloque of bloque.subbloques) {
                if (subbloque.ejercicios.length === 0) {
                    toast.error(`El sub-bloque "${subbloque.nombre || 'Sin nombre'}" en el bloque de semana ${bloque.semana_inicio}-${bloque.semana_fin} debe tener al menos un ejercicio.`);
                    return false;
                }
                for (const ejercicio of subbloque.ejercicios) {
                    const esSuperset = subbloque.tipo === 'superset';
                    const seriesOConfig = esSuperset ? ejercicio.sets_config : ejercicio.series;
                    if (!seriesOConfig || seriesOConfig.length === 0) {
                        // En superset, si sets_config está vacío, createDefaultSetsConfig lo llenará en guardarEstructuraRutina,
                        // pero num_sets en shared_config debe ser > 0.
                        if (esSuperset) {
                            if (!subbloque.shared_config || !parseInt(subbloque.shared_config.num_sets, 10) > 0) {
                                toast.error(`El ejercicio "${ejercicio.ejercicio?.nombre || 'Desconocido'}" en un superset no tiene número de sets definido en la configuración compartida.`);
                                return false;
                            }
                        } else {
                            toast.error(`El ejercicio "${ejercicio.ejercicio?.nombre || 'Desconocido'}" debe tener al menos una serie.`);
                            return false;
                        }
                    }
                    // Validación de reps/carga podría ir aquí si es estrictamente necesario antes de guardar,
                    // pero `guardarEstructuraRutina` ya los maneja como string vacío si no están.
                    // Por ejemplo, para series simples:
                    if (!esSuperset && seriesOConfig) {
                        for (const [idx, serie] of seriesOConfig.entries()) {
                            if (!serie.reps && !serie.carga_sugerida && !serie.carga) { // Si reps y carga están vacíos
                                // toast.warn(`La serie ${idx + 1} del ejercicio "${ejercicio.ejercicio?.nombre || 'Desconocido'}" tiene repeticiones y carga vacías.`);
                                // No lo hacemos un error bloqueante por ahora, pero se podría.
                            }
                        }
                    }
                    // Para supersets, similar validación en sets_config
                    if (esSuperset && seriesOConfig) {
                        for (const [idx, setConfig] of seriesOConfig.entries()) {
                            if (!setConfig.reps && !setConfig.carga) {
                                // toast.warn(`El set ${idx + 1} (config) del ejercicio "${ejercicio.ejercicio?.nombre || 'Desconocido'}" en superset tiene repeticiones y carga vacías.`);
                            }
                        }
                    }
                }
            }
        }
        return true;
    };

    // handleSubmit unificado
    const handleSubmit = async () => {
        if (!validarRutina()) {
            return;
        }

        if (esModoPersonalizar) {
            // Lógica para "Personalizar y Guardar"
            if (!alumnoIdParaPersonalizar || !asignacionIdParaPersonalizar || !idRutinaOriginal) {
                toast.error("Faltan datos para personalizar la rutina (alumno, asignación o rutina original).");
                return;
            }
            if (!perfilEntrenador?.id) {
                toast.error("No se pudo identificar al entrenador para personalizar.");
                return;
            }

            toast.loading('Personalizando y guardando rutina...');
            try {
                // 1. Crear la nueva rutina personalizada (cabecera)
                const { data: nuevaRutinaPData, error: errorRutinaP } = await supabase
                    .from('rutinas_personalizadas')
                    .insert({
                        nombre: nombre, // Nombre del formulario
                        descripcion: descripcion, // Descripción del formulario
                        tipo: tipo, // Tipo del formulario
                        entrenador_id: perfilEntrenador.id,
                        alumno_id: alumnoIdParaPersonalizar,
                        rutina_base_id: idRutinaOriginal, // Referencia a la base
                        es_activa: true,
                        // fecha_inicio: podría tomarse de la asignación original o ser nueva
                    })
                    .select()
                    .single();

                if (errorRutinaP) throw errorRutinaP;
                const nuevaRutinaPersonalizadaId = nuevaRutinaPData.id;

                // 2. Guardar la estructura (bloques modificados) para la nueva rutina personalizada
                await guardarEstructuraRutina({
                    rutinaId: nuevaRutinaPersonalizadaId,
                    bloques: bloques, // Bloques del estado actual del formulario
                    tipoRutina: 'personalizada'
                });

                // 3. Actualizar la asignación original para que apunte a la nueva rutina personalizada
                const { error: errorAsignacion } = await supabase
                    .from('asignaciones')
                    .update({
                        rutina_personalizada_id: nuevaRutinaPersonalizadaId,
                        rutina_base_id: null // Anular la referencia a la rutina base
                    })
                    .eq('id', asignacionIdParaPersonalizar);

                if (errorAsignacion) throw errorAsignacion;

                toast.dismiss();
                toast.success('✅ Rutina personalizada y guardada correctamente.');
                if (onGuardar) {
                    // Pasar el ID de la nueva rutina personalizada para la navegación
                    onGuardar({ id: nuevaRutinaPersonalizadaId, esPersonalizada: true, alumnoId: alumnoIdParaPersonalizar });
                }

            } catch (error) {
                toast.dismiss();
                console.error("Error al personalizar y guardar rutina:", error.message, error);
                toast.error(`❌ Error: ${error.message}`);
            }

        } else if (modo === 'editar') {
            // Lógica para actualizar una rutina existente (base o personalizada)
            if (!rutinaInicial?.id) {
                toast.error('Falta el ID de la rutina para actualizar.');
                return;
            }
            toast.loading('Actualizando rutina...');
            try {
                const rutinaId = rutinaInicial.id;
                const tablaActualizar = tipoEntidadOriginal === 'base' ? 'rutinas_base' : 'rutinas_personalizadas';
                const campoJoinBloques = tipoEntidadOriginal === 'base' ? 'rutina_base_id' : 'rutina_personalizada_id';

                // 1. Actualizar cabecera de la rutina (base o personalizada)
                const updateData = { nombre, tipo, descripcion };
                // Si es personalizada, podríamos querer actualizar también alumno_id o entrenador_id si fuera editable aquí
                // if (tipoEntidadOriginal === 'personalizada') {
                //     updateData.alumno_id = ...; 
                // }
                const { error: errorUpdateCabecera } = await supabase
                    .from(tablaActualizar)
                    .update(updateData)
                    .eq('id', rutinaId);

                if (errorUpdateCabecera) throw errorUpdateCabecera;

                // 2. Eliminar bloques y estructura anidada antigua
                // Esta parte es delicada y debe asegurar que solo se borren los componentes de ESTA rutina.
                // La forma actual de borrar en cascada desde bloques es correcta si las FK están bien.
                const { data: bloquesExistentes, error: errorBloquesExistentes } = await supabase
                    .from('bloques')
                    .select('id, subbloques (id, subbloques_ejercicios (id))') // No necesitamos series_subejercicio aquí
                    .eq(campoJoinBloques, rutinaId);

                if (errorBloquesExistentes) throw errorBloquesExistentes;

                for (const bloqueExistente of bloquesExistentes) {
                    for (const subBloqueExistente of bloqueExistente.subbloques) {
                        // Borrar series_subejercicio primero
                        await supabase.from('series_subejercicio').delete().in('subbloque_ejercicio_id', subBloqueExistente.subbloques_ejercicios.map(sbe => sbe.id));
                        // Borrar subbloques_ejercicios
                        await supabase.from('subbloques_ejercicios').delete().eq('subbloque_id', subBloqueExistente.id);
                    }
                    // Borrar subbloques
                    await supabase.from('subbloques').delete().eq('bloque_id', bloqueExistente.id);
                }
                // Borrar bloques
                await supabase.from('bloques').delete().eq(campoJoinBloques, rutinaId);


                // 3. Insertar nuevos componentes anidados
                await guardarEstructuraRutina({
                    rutinaId: rutinaId,
                    bloques: bloques, // Bloques del estado actual del formulario
                    tipoRutina: tipoEntidadOriginal // 'base' o 'personalizada'
                });

                toast.dismiss();
                toast.success('✅ Rutina actualizada correctamente');
                if (onGuardar) {
                    onGuardar({ id: rutinaId, esPersonalizada: tipoEntidadOriginal === 'personalizada' });
                }

            } catch (error) {
                toast.dismiss();
                console.error("Error al actualizar rutina:", error.message, error);
                toast.error(`❌ Error al actualizar: ${error.message}`);
            }

        } else if (modo === 'crear') {
            // Lógica para crear una NUEVA rutina_base (no personalizada directamente desde aquí)
            toast.loading('Guardando nueva rutina base...');
            try {
                const { data: rutinaBase, error: errorRutina } = await supabase
                    .from('rutinas_base')
                    .insert([{ nombre, tipo, descripcion }])
                    .select()
                    .single();

                if (errorRutina) throw errorRutina;
                const rutinaBaseId = rutinaBase.id;

                await guardarEstructuraRutina({
                    rutinaId: rutinaBaseId,
                    bloques: bloques,
                    tipoRutina: 'base'
                });

                toast.dismiss();
                toast.success(`✅ Nueva rutina base guardada.`);

                // Reset form
                setNombre('');
                setTipo('');
                setDescripcion('');
                setBloques([]);

                if (onGuardar) {
                    onGuardar({ id: rutinaBaseId, esPersonalizada: false });
                }
            } catch (error) {
                toast.dismiss();
                console.error("Error al guardar nueva rutina base:", error.message, error);
                toast.error(`❌ Error al guardar: ${error.message}`);
            }
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-full gap-4">
            
            <aside className="w-full md:w-[300px] p-4 border-b md:border-b-0 md:border-r border-white/10">
                <div className="flex md:fixed md:w-[280px] flex-col gap-4">

                    {/* Inputs con etiquetas */}
                    <div className="space-y-1">
                        <label className="text-[10px] md-text-[12px] text-white/70 font-medium">Nombre</label>
                        <input
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            placeholder="Ej. Rutina Hipertrofia A"
                            className="rounded-lg bg-white/10 backdrop-blur px-3 py-2 text-white placeholder-white/50 text-sm w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className=" text-[10px] md-text-[12px] text-white/70 font-medium">Tipo</label>
                        <input
                            value={tipo}
                            onChange={e => setTipo(e.target.value)}
                            placeholder="Ej. Fuerza, Cardio, etc."
                            className="rounded-lg bg-white/10 backdrop-blur px-3 py-2 text-white placeholder-white/50 text-sm w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className=" text-[10px] md-text-[12px]  text-white/70 font-medium">Descripción</label>
                        <textarea
                            value={descripcion}
                            onChange={e => setDescripcion(e.target.value)}
                            placeholder="Describe brevemente la rutina"
                            rows={3}
                            className="rounded-lg bg-white/10 backdrop-blur px-3 py-2 text-white placeholder-white/50 text-sm resize-none w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        />
                    </div>

                    {/* Botones de acción */}
                    <div className="pt-2 flex flex-col gap-2">
                        {bloques.length > 0 && (
                            <button
                                onClick={handleSubmit}
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
                            >
                                {modo === 'crear' ? 'Guardar Rutina' : 'Actualizar Rutina'}
                            </button>
                        )}
                        <button
                            onClick={agregarBloque}
                            className="bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-lg text-sm transition"
                        >
                            + Agregar mes
                        </button>
                    </div>
                </div>
            </aside>



            
            <section className="flex-1 space-y-4 ">
                <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={bloques.map(b => b.id)} strategy={verticalListSortingStrategy}>
                        <AnimatePresence initial={false}>
                            {Array.isArray(bloques) && bloques.map((bloque, idx) => {
                                const isAnimado = bloque.id === bloqueAnimadoId;
                                const isEliminando = bloque.id === bloqueEliminadoId;
                                return (
                                    <motion.div
                                        key={bloque.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9, x: 40 }}
                                        transition={{ duration: 0.35 }}
                                        onAnimationComplete={() => {
                                            if (isAnimado) setBloqueAnimadoId(null);
                                        }}
                                        layout
                                    >
                                        <BloqueEditor
                                            bloque={bloque}
                                            onChange={actualizarBloque}
                                            onRemove={() => eliminarBloque(bloque.id)}
                                            onDuplicate={() => duplicarBloque(bloque)}
                                            ejerciciosDisponibles={ejerciciosDisponibles}
                                            dragHandleProps={{
                                                // These will be spread on the drag handle in BloqueEditor
                                                id: bloque.id,
                                            }}
                                        />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </SortableContext>
                </DndContext>
            </section>

        </div>
    );
};

export default RutinaForm;