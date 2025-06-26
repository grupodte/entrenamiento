// RutinaForm.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import BloqueEditor from '../../components/Rutina/BloqueEditor';

const RutinaForm = ({ rutinaAEditar }) => {
    const navigate = useNavigate();
    const [idRutina, setIdRutina] = useState(null);
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [bloques, setBloques] = useState([]);
    const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);

    const LOCAL_STORAGE_KEY_PREFIX = 'rutinaDraft_';
    const [localStorageKey, setLocalStorageKey] = useState(LOCAL_STORAGE_KEY_PREFIX + 'new');
    const [isHydrated, setIsHydrated] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchEjercicios = async () => {
            const { data, error } = await supabase
                .from('ejercicios')
                .select('id, nombre, grupo_muscular, tipo_ejercicio, video_url');
            if (error) {
                toast.error('Error al cargar catálogo de ejercicios.');
                console.error("Error fetching ejercicios:", error);
            } else {
                setEjerciciosDisponibles(data || []);
            }
        };
        fetchEjercicios();
    }, []);

    useEffect(() => {
        if (rutinaAEditar && ejerciciosDisponibles.length > 0) {
            setIdRutina(rutinaAEditar.id);
            setNombre(rutinaAEditar.nombre || '');
            setTipo(rutinaAEditar.tipo || '');
            setDescripcion(rutinaAEditar.descripcion || '');

            const bloquesEdit = (rutinaAEditar.bloques || []).map(b => ({
                id: b.id || uuidv4(),
                nombre_bloque: b.nombre_bloque || `Bloque ${b.orden + 1}`,
                descripcion_bloque: b.descripcion_bloque || '',
                orden: b.orden,
                sub_bloques: (b.sub_bloques || b.rutina_sub_bloques || []).map(sb => ({
                    id: sb.id || uuidv4(),
                    tipo: sb.tipo || 'SIMPLE',
                    orden: sb.orden,
                    ejercicios: (sb.ejercicios || sb.rutina_ejercicios || []).map(ej => ({
                        id: ej.id || uuidv4(),
                        ejercicio_id: ej.ejercicio_id,
                        orden: ej.orden,
                        series: ej.series,
                        repeticiones: ej.repeticiones,
                        rir: ej.rir,
                        tiempo_descanso_segundos: ej.tiempo_descanso_segundos,
                        notas: ej.notas,
                        ejercicioData: ejerciciosDisponibles.find(e => e.id === ej.ejercicio_id) || ej.ejercicioData || null
                    })).sort((a, b) => a.orden - b.orden)
                })).sort((a, b) => a.orden - b.orden)
            })).sort((a, b) => a.orden - b.orden);
            setBloques(bloquesEdit);
            setLocalStorageKey(LOCAL_STORAGE_KEY_PREFIX + rutinaAEditar.id);
            setIsHydrated(true);
        } else if (!rutinaAEditar) {
            setLocalStorageKey(LOCAL_STORAGE_KEY_PREFIX + 'new');
            const draft = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + 'new');
            if (draft) {
                try {
                    const data = JSON.parse(draft);
                    if (data.nombre) setNombre(data.nombre);
                    if (data.tipo) setTipo(data.tipo);
                    if (data.descripcion) setDescripcion(data.descripcion);
                    if (data.bloques && Array.isArray(data.bloques) && ejerciciosDisponibles.length > 0) {
                        const bloquesConData = data.bloques.map(b => ({
                            ...b,
                            sub_bloques: (b.sub_bloques || []).map(sb => ({
                                ...sb,
                                ejercicios: (sb.ejercicios || []).map(ej => ({
                                    ...ej,
                                    ejercicioData: ejerciciosDisponibles.find(e => e.id === ej.ejercicio_id) || null
                                }))
                            }))
                        }));
                        setBloques(bloquesConData);
                    } else if (data.bloques) {
                        setBloques(data.bloques);
                    }
                } catch (error) {
                    console.error('Error al parsear localStorage para nueva rutina', error);
                    localStorage.removeItem(LOCAL_STORAGE_KEY_PREFIX + 'new');
                }
            }
            setIsHydrated(true);
        }
    }, [rutinaAEditar, ejerciciosDisponibles]);


    useEffect(() => {
        if (!isHydrated || isSubmitting) return;
        const rutinaDraft = { nombre, tipo, descripcion, bloques, idRutina };
        localStorage.setItem(localStorageKey, JSON.stringify(rutinaDraft));
    }, [nombre, tipo, descripcion, bloques, idRutina, localStorageKey, isHydrated, isSubmitting]);

    const handleNombreChange = (e) => setNombre(e.target.value);
    const handleTipoChange = (e) => setTipo(e.target.value);
    const handleDescripcionChange = (e) => setDescripcion(e.target.value);

    const agregarBloqueNuevo = useCallback(() => {
        setBloques(prev => {
            const nuevoOrden = prev.length > 0 ? Math.max(...prev.map(b => b.orden)) + 1 : 0;
            return [
                ...prev,
                {
                    id: uuidv4(),
                    nombre_bloque: `Bloque ${prev.length + 1}`,
                    descripcion_bloque: '',
                    orden: nuevoOrden,
                    sub_bloques: [],
                }
            ];
        });
    }, []);

    const actualizarBloqueExistente = useCallback((bloqueActualizado) => {
        setBloques(prev => prev.map(b => (b.id === bloqueActualizado.id ? bloqueActualizado : b)));
    }, []);

    const eliminarBloqueExistente = useCallback((bloqueId) => {
        setBloques(prev => prev.filter(b => b.id !== bloqueId));
    }, []);

    const handleSubmit = async () => {
        if (!nombre.trim()) {
            toast.error('El nombre de la rutina es obligatorio.');
            return;
        }
        if (bloques.length === 0) {
            toast.error('La rutina debe tener al menos un bloque.');
            return;
        }
        for (const bloque of bloques) {
            if (!bloque.nombre_bloque?.trim()) {
                toast.error(`Todos los bloques deben tener un nombre.`);
                return;
            }
            if (bloque.sub_bloques.length === 0) {
                toast.error(`El bloque "${bloque.nombre_bloque}" debe tener al menos un sub-bloque.`);
                return;
            }
            for (const subBloque of bloque.sub_bloques) {
                if (subBloque.ejercicios.length === 0) {
                    toast.error(`Un sub-bloque en "${bloque.nombre_bloque}" debe tener al menos un ejercicio.`);
                    return;
                }
                for (const ejercicio of subBloque.ejercicios) {
                    if (!ejercicio.ejercicio_id) {
                        toast.error(`Hay un ejercicio sin seleccionar en el bloque "${bloque.nombre_bloque}".`);
                        return;
                    }
                }
            }
        }

        setIsSubmitting(true);
        const loadingToastId = toast.loading(idRutina ? 'Actualizando rutina...' : 'Guardando nueva rutina...');

        try {
            let currentRutinaBaseId = idRutina;

            if (idRutina) {
                const { error: updateError } = await supabase
                    .from('rutinas_base')
                    .update({ nombre, tipo, descripcion })
                    .eq('id', idRutina);
                if (updateError) throw updateError;
            } else {
                const { data: nuevaRutina, error: insertError } = await supabase
                    .from('rutinas_base')
                    .insert([{ nombre, tipo, descripcion }])
                    .select('id')
                    .single();
                if (insertError) throw insertError;
                currentRutinaBaseId = nuevaRutina.id;
                setIdRutina(currentRutinaBaseId);
            }

            // --- Sincronización Completa ---
            // 1. Obtener la estructura actual de la BD para esta rutina
            const { data: estructuraExistenteRaw, error: fetchEstructuraError } = await supabase
                .from('rutinas_base')
                .select(`
                    id,
                    rutina_bloques (
                        id, orden,
                        rutina_sub_bloques (
                            id, orden,
                            rutina_ejercicios (id, orden)
                        )
                    )
                `)
                .eq('id', currentRutinaBaseId)
                .single();

            if (fetchEstructuraError) throw new Error(`Error obteniendo estructura existente: ${fetchEstructuraError.message}`);
            const estructuraExistente = estructuraExistenteRaw || { rutina_bloques: [] }; // Si es una rutina nueva, no habrá estructura

            // IDs de bloques existentes en la BD
            const idsBloquesExistentesDB = (estructuraExistente.rutina_bloques || []).map(b => b.id);
            // IDs de bloques en el estado actual del formulario (solo IDs numéricos, los UUID son nuevos)
            const idsBloquesFormulario = bloques.map(b => typeof b.id === 'number' ? b.id : null).filter(id => id !== null);

            // 2. Eliminar bloques que ya no están en el formulario
            const idsBloquesAEliminar = idsBloquesExistentesDB.filter(idDB => !idsBloquesFormulario.includes(idDB));
            if (idsBloquesAEliminar.length > 0) {
                // Para eliminar bloques, primero sus hijos (ejercicios, luego sub_bloques) si no hay CASCADE DELETE en BD.
                for (const bloqueId of idsBloquesAEliminar) {
                    const bloqueDB = estructuraExistente.rutina_bloques.find(b => b.id === bloqueId);
                    if (bloqueDB && bloqueDB.rutina_sub_bloques) {
                        for (const subBloqueDB of bloqueDB.rutina_sub_bloques) {
                            // Eliminar ejercicios del sub-bloque
                            const { error: deleteEjError } = await supabase.from('rutina_ejercicios').delete().eq('sub_bloque_id', subBloqueDB.id);
                            if (deleteEjError) throw new Error(`Error eliminando ejercicios del sub-bloque ${subBloqueDB.id}: ${deleteEjError.message}`);
                        }
                        // Eliminar sub-bloques del bloque
                        const { error: deleteSbError } = await supabase.from('rutina_sub_bloques').delete().eq('bloque_id', bloqueId);
                        if (deleteSbError) throw new Error(`Error eliminando sub-bloques del bloque ${bloqueId}: ${deleteSbError.message}`);
                    }
                }
                // Finalmente eliminar los bloques principales
                const { error: deleteBlError } = await supabase.from('rutina_bloques').delete().in('id', idsBloquesAEliminar);
                if (deleteBlError) throw new Error(`Error eliminando bloques: ${deleteBlError.message}`);
            }

            // 3. Iterar sobre los bloques del formulario para crear o actualizar
            const nuevosBloquesEstado = [...bloques]; // Copia para actualizar IDs de nuevos elementos

            for (const [idxBloque, bloqueForm] of bloques.entries()) {
                const bloquePayload = {
                    rutina_base_id: currentRutinaBaseId,
                    nombre_bloque: bloqueForm.nombre_bloque,
                    descripcion_bloque: bloqueForm.descripcion_bloque,
                    orden: idxBloque,
                };

                let bloqueIdActual = typeof bloqueForm.id === 'number' ? bloqueForm.id : null;
                const bloqueDBExistente = estructuraExistente.rutina_bloques.find(b => b.id === bloqueIdActual);

                if (bloqueIdActual) { // Actualizar bloque existente
                    const { error } = await supabase.from('rutina_bloques').update(bloquePayload).eq('id', bloqueIdActual);
                    if (error) throw new Error(`Error actualizando bloque ${bloqueForm.nombre_bloque}: ${error.message}`);
                } else { // Insertar nuevo bloque
                    const { data, error } = await supabase.from('rutina_bloques').insert(bloquePayload).select('id').single();
                    if (error) throw new Error(`Error insertando bloque ${bloqueForm.nombre_bloque}: ${error.message}`);
                    bloqueIdActual = data.id;
                    nuevosBloquesEstado[idxBloque].id = bloqueIdActual;
                }

                // Sincronizar sub-bloques para este bloque
                const subBloquesExistentesDB = bloqueDBExistente?.rutina_sub_bloques || [];
                const idsSubBloquesExistentesDB = subBloquesExistentesDB.map(sb => sb.id);
                const idsSubBloquesFormulario = bloqueForm.sub_bloques.map(sb => typeof sb.id === 'number' ? sb.id : null).filter(id => id !== null);

                const idsSubBloquesAEliminar = idsSubBloquesExistentesDB.filter(idDB => !idsSubBloquesFormulario.includes(idDB));
                if (idsSubBloquesAEliminar.length > 0) {
                    for (const subBloqueId of idsSubBloquesAEliminar) {
                        // Eliminar ejercicios del sub-bloque primero
                        const { error: deleteEjError } = await supabase.from('rutina_ejercicios').delete().eq('sub_bloque_id', subBloqueId);
                        if (deleteEjError) throw new Error(`Error eliminando ejercicios del sub-bloque ${subBloqueId} para borrado: ${deleteEjError.message}`);
                    }
                    const { error } = await supabase.from('rutina_sub_bloques').delete().in('id', idsSubBloquesAEliminar);
                    if (error) throw new Error(`Error eliminando sub-bloques: ${error.message}`);
                }

                for (const [idxSubBloque, subBloqueForm] of bloqueForm.sub_bloques.entries()) {
                    const subBloquePayload = {
                        bloque_id: bloqueIdActual,
                        tipo: subBloqueForm.tipo,
                        orden: idxSubBloque,
                    };
                    let subBloqueIdActual = typeof subBloqueForm.id === 'number' ? subBloqueForm.id : null;
                    const subBloqueDBExistente = subBloquesExistentesDB.find(sb => sb.id === subBloqueIdActual);

                    if (subBloqueIdActual) { // Actualizar sub-bloque
                        const { error } = await supabase.from('rutina_sub_bloques').update(subBloquePayload).eq('id', subBloqueIdActual);
                        if (error) throw new Error(`Error actualizando sub-bloque: ${error.message}`);
                    } else { // Insertar nuevo sub-bloque
                        const { data, error } = await supabase.from('rutina_sub_bloques').insert(subBloquePayload).select('id').single();
                        if (error) throw new Error(`Error insertando sub-bloque: ${error.message}`);
                        subBloqueIdActual = data.id;
                        nuevosBloquesEstado[idxBloque].sub_bloques[idxSubBloque].id = subBloqueIdActual;
                    }

                    // Sincronizar ejercicios para este sub-bloque
                    const ejerciciosExistentesDB = subBloqueDBExistente?.rutina_ejercicios || [];
                    const idsEjerciciosExistentesDB = ejerciciosExistentesDB.map(ej => ej.id);
                    const idsEjerciciosFormulario = subBloqueForm.ejercicios.map(ej => typeof ej.id === 'number' ? ej.id : null).filter(id => id !== null);

                    const idsEjerciciosAEliminar = idsEjerciciosExistentesDB.filter(idDB => !idsEjerciciosFormulario.includes(idDB));
                    if (idsEjerciciosAEliminar.length > 0) {
                        const { error } = await supabase.from('rutina_ejercicios').delete().in('id', idsEjerciciosAEliminar);
                        if (error) throw new Error(`Error eliminando ejercicios: ${error.message}`);
                    }

                    for (const [idxEjercicio, ejercicioForm] of subBloqueForm.ejercicios.entries()) {
                        const ejercicioPayload = {
                            sub_bloque_id: subBloqueIdActual,
                            ejercicio_id: ejercicioForm.ejercicio_id,
                            orden: idxEjercicio,
                            series: typeof ejercicioForm.series === 'string' ? ejercicioForm.series : JSON.stringify(ejercicioForm.series),
                            repeticiones: ejercicioForm.repeticiones,
                            rir: ejercicioForm.rir,
                            tiempo_descanso_segundos: ejercicioForm.tiempo_descanso_segundos,
                            notas: ejercicioForm.notas,
                        };
                        let ejercicioIdActual = typeof ejercicioForm.id === 'number' ? ejercicioForm.id : null;

                        if (ejercicioIdActual) { // Actualizar
                            const { error } = await supabase.from('rutina_ejercicios').update(ejercicioPayload).eq('id', ejercicioIdActual);
                            if (error) throw new Error(`Error actualizando ejercicio ${ejercicioForm.ejercicioData?.nombre || ejercicioForm.ejercicio_id}: ${error.message}`);
                        } else { // Insertar
                            const { data, error } = await supabase.from('rutina_ejercicios').insert(ejercicioPayload).select('id').single();
                            if (error) throw new Error(`Error insertando ejercicio ${ejercicioForm.ejercicioData?.nombre || ejercicioForm.ejercicio_id}: ${error.message}`);
                            // Actualizar ID en la copia del estado para consistencia si se necesitara
                            nuevosBloquesEstado[idxBloque].sub_bloques[idxSubBloque].ejercicios[idxEjercicio].id = data.id;
                        }
                    }
                }
            }
            setBloques(nuevosBloquesEstado); // Actualizar estado con los nuevos IDs persistidos

            toast.dismiss(loadingToastId);
            toast.success(`✅ Rutina ${idRutina ? 'actualizada' : 'guardada'} correctamente!`);

            localStorage.removeItem(localStorageKey);
            if (!idRutina) {
                //setIdRutina(currentRutinaBaseId); // Ya se hizo
                setLocalStorageKey(LOCAL_STORAGE_KEY_PREFIX + currentRutinaBaseId); // Actualizar key para el nuevo ID
                navigate(`/admin/rutinas/editar/${currentRutinaBaseId}`, { replace: true });
            } else {
                // Para edición, se podría forzar una recarga de datos si la estructura de datos es compleja
                // y el estado local podría no ser 100% fiel a la BD tras la edición.
                // Por ahora, confiamos en que el estado local se actualizó bien con los nuevos IDs.
            }

        } catch (error) {
            toast.dismiss(loadingToastId);
            console.error("Error guardando rutina:", error);
            toast.error(`❌ Error al guardar: ${error.message || 'Ocurrió un error desconocido.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isHydrated && rutinaAEditar) {
        return <div className="flex justify-center items-center h-64"><span className="text-white">Cargando datos de la rutina...</span></div>;
    }

    return (
        <div className="flex flex-col md:flex-row h-full gap-4 w-full">
            <aside className="w-full md:w-[300px] p-4 space-y-4 overflow-y-auto bg-white/5 border-b md:border-b-0 md:border-r border-white/10">
                <div className="flex flex-col gap-3">
                    <input value={nombre} onChange={handleNombreChange} placeholder="Nombre de la Rutina" className="input-primary" />
                    <input value={tipo} onChange={handleTipoChange} placeholder="Tipo (Ej: Hipertrofia, Fuerza)" className="input-primary" />
                    <textarea value={descripcion} onChange={handleDescripcionChange} placeholder="Descripción breve" rows={3} className="input-primary resize-none" />

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !isHydrated || bloques.length === 0}
                        className="btn-success w-full disabled:opacity-50"
                    >
                        {isSubmitting ? (idRutina ? 'Actualizando...' : 'Guardando...') : (idRutina ? 'Guardar Cambios' : 'Crear Rutina')}
                    </button>
                    <button
                        onClick={agregarBloqueNuevo}
                        disabled={isSubmitting || !isHydrated}
                        className="btn-secondary w-full disabled:opacity-50"
                    >
                        + Agregar Bloque
                    </button>
                    {idRutina && (
                        <button
                            onClick={() => navigate(`/admin/rutinas/ver/${idRutina}`)}
                            className="btn-info-outline w-full mt-2"
                            disabled={isSubmitting}
                        >
                            Ver Rutina
                        </button>
                    )}
                </div>
            </aside>
            <section className="flex-1 pr-2 space-y-4 px-4 md:px-0 pb-16 md:pb-4">
                {bloques.map((bloque, index) => (
                    <BloqueEditor
                        key={bloque.id || index}
                        bloque={bloque}
                        onChange={actualizarBloqueExistente}
                        onRemove={() => eliminarBloqueExistente(bloque.id)}
                        ejerciciosDisponibles={ejerciciosDisponibles}
                        isRutinaSubmitting={isSubmitting}
                    />
                ))}
                {bloques.length === 0 && isHydrated && (
                    <div className="text-center py-10 text-white/50">
                        <p>No hay bloques en esta rutina.</p>
                        <p>Comienza por agregar un nuevo bloque.</p>
                    </div>
                )}
            </section>
            <style jsx global>{`
                .input-primary {
                    @apply rounded-lg bg-white/10 backdrop-blur px-3 py-2 text-white placeholder-white/50 text-sm w-full focus:ring-2 focus:ring-skyblue outline-none;
                }
                .btn-success {
                    @apply bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition;
                }
                .btn-secondary {
                    @apply bg-skyblue hover:bg-skyblue/80 text-white font-semibold rounded-lg px-4 py-2 text-sm transition;
                }
                .btn-info-outline {
                    @apply border border-skyblue text-skyblue hover:bg-skyblue/20 font-semibold px-4 py-2 rounded-lg text-sm transition;
                }
            `}</style>
        </div>
    );
};

export default RutinaForm;