// RutinaForm.jsx
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import BloqueEditor from '../../components/Rutina/BloqueEditor';
import { guardarEstructuraRutina } from '../../utils/guardarEstructuraRutina'; // Importar la nueva función

const createDefaultSetsConfig = (numSets, reps = '', carga = '') => {
    return Array(numSets).fill(null).map(() => ({ reps, carga }));
};

const RutinaForm = ({ modo = "crear", rutinaInicial = null, onGuardar }) => {
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [bloques, setBloques] = useState([]);
    const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);

    useEffect(() => {
        if (modo === "editar" && rutinaInicial) {
            setNombre(rutinaInicial.nombre || '');
            setTipo(rutinaInicial.tipo || '');
            setDescripcion(rutinaInicial.descripcion || '');

            const bloquesConSets = rutinaInicial.bloques?.map(b => ({
                ...b,
                id: b.id || uuidv4(),
                subbloques: b.subbloques.map(s => {
                    const esSuperset = s.tipo === 'superset';

                    const shared_config = esSuperset
                        ? {
                            num_sets: s.ejercicios?.[0]?.series?.length || 1,
                            shared_rest: s.ejercicios?.[0]?.series?.[0]?.pausa || ''
                        }
                        : undefined;

                    const ejercicios = s.ejercicios.map(ej => {
                        if (esSuperset) {
                            return {
                                ...ej,
                                sets_config: ej.series.map(serie => ({
                                    reps: serie.reps,
                                    carga: serie.carga_sugerida
                                }))
                            };
                        } else {
                            return {
                                ...ej,
                                series: ej.series.map(serie => ({
                                    reps: serie.reps,
                                    pausa: serie.pausa,
                                    carga: serie.carga
                                }))
                            };
                        }
                    });

                    return {
                        ...s,
                        ejercicios,
                        shared_config
                    };
                })
            })) || [];

            setBloques(bloquesConSets);
        } else {
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

    const agregarBloque = () => {
        const ultimaSemana = bloques[bloques.length - 1]?.semana_fin || 0;
        const nuevoBloque = {
            id: uuidv4(),
            semana_inicio: ultimaSemana + 1,
            semana_fin: ultimaSemana + 4,
            subbloques: [],
        };
        setBloques(prev => [...prev, nuevoBloque]);
    };

    const actualizarBloque = (bloqueActualizado) => {
        setBloques(prev => prev.map(b => (b.id === bloqueActualizado.id ? bloqueActualizado : b)));
    };

    const eliminarBloque = (bloqueId) => {
        setBloques(prev => prev.filter(b => b.id !== bloqueId));
    };

    const duplicarBloque = (bloqueDuplicado) => {
        setBloques(prev => [...prev, bloqueDuplicado]);
    };

    // Helper function to insert bloques, subbloques, ejercicios, and series
    // _guardarComponentesAnidados ha sido movido a src/utils/guardarEstructuraRutina.js
    // Ya no es necesario aquí.

    const guardarRutina = async () => {
        if (!nombre || bloques.length === 0) {
            toast.error('Faltan datos: nombre o bloques');
            return;
        }

        try {
            toast.loading('Guardando rutina...');
            const { data: rutinaBase, error: errorRutina } = await supabase
                .from('rutinas_base')
                .insert([{ nombre, tipo, descripcion }])
                .select()
                .single();

            if (errorRutina) throw errorRutina;
            const rutinaBaseId = rutinaBase.id;

            // Usar la nueva función refactorizada
            await guardarEstructuraRutina({
                rutinaId: rutinaBaseId,
                bloques: bloques,
                tipoRutina: 'base'
            });

            toast.dismiss(); // Solo un dismiss antes del success
            toast.success(`✅ Rutina guardada correctamente`);

            if (modo === 'crear') { // Reset form only in create mode
                setNombre('');
                setTipo('');
                setDescripcion('');
                setBloques([]);
            }

            if (onGuardar) {
                onGuardar({ id: rutinaBaseId, nombre, tipo, descripcion, bloques });
            }
        } catch (error) {
            toast.dismiss();
            console.error("Error al guardar rutina:", error.message);
            toast.error(`❌ Error al guardar: ${error.message}`);
        }
    };

    const actualizarRutina = async () => {
        if (!rutinaInicial?.id || !nombre || bloques.length === 0) {
            toast.error('Faltan datos: ID de rutina, nombre o bloques');
            return;
        }

        try {
            toast.loading('Actualizando rutina...');
            const rutinaId = rutinaInicial.id;

            // 1. Actualizar rutina_base
            const { error: errorRutina } = await supabase
                .from('rutinas_base')
                .update({ nombre, tipo, descripcion })
                .eq('id', rutinaId);

            if (errorRutina) throw errorRutina;

            // 2. Eliminar bloques, subbloques, subbloques_ejercicios y series antiguas
            const { data: bloquesExistentes, error: errorBloquesExistentes } = await supabase
                .from('bloques')
                .select('id, subbloques (id, subbloques_ejercicios (id, series_subejercicio(id)))')
                .eq('rutina_base_id', rutinaId);

            if (errorBloquesExistentes) throw errorBloquesExistentes;

            for (const bloqueExistente of bloquesExistentes) {
                for (const subBloqueExistente of bloqueExistente.subbloques) {
                    for (const subBloqueEjercicioExistente of subBloqueExistente.subbloques_ejercicios) {
                        // Podríamos necesitar borrar series_subejercicio aquí si no se borran en cascada
                        // o si la lógica de _guardarComponentesAnidados no las sobreescribe correctamente.
                        // Por ahora, la estrategia es borrar y reinsertar.
                        await supabase.from('series_subejercicio').delete().eq('subbloque_ejercicio_id', subBloqueEjercicioExistente.id);
                    }
                    await supabase.from('subbloques_ejercicios').delete().eq('subbloque_id', subBloqueExistente.id);
                }
                await supabase.from('subbloques').delete().eq('bloque_id', bloqueExistente.id);
            }
            await supabase.from('bloques').delete().eq('rutina_base_id', rutinaId);

            // 3. Insertar nuevos componentes anidados usando la función refactorizada
            await guardarEstructuraRutina({
                rutinaId: rutinaId,
                bloques: bloques,
                tipoRutina: 'base'
            });

            toast.dismiss();
            toast.success('✅ Rutina actualizada correctamente');
            if (onGuardar) {
                onGuardar({ id: rutinaId, nombre, tipo, descripcion, bloques });
            }

        } catch (error) {
            toast.dismiss();
            console.error("Error al actualizar rutina:", error.message);
            toast.error(`❌ Error al actualizar: ${error.message}`);
        }
    };

    const handleSubmit = () => {
        if (modo === 'crear') {
            guardarRutina();
        } else if (modo === 'editar') {
            actualizarRutina();
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-full gap-4">
            <aside className="w-full md:w-[280px] p-4 space-y-4 overflow-y-auto bg-white/5 border-b md:border-b-0 md:border-r border-white/10">
                <div className="flex flex-col gap-3">
                    <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre" className="rounded-lg bg-white/10 backdrop-blur px-3 py-2 text-white placeholder-white/50 text-sm w-full" />
                    <input value={tipo} onChange={e => setTipo(e.target.value)} placeholder="Tipo" className="rounded-lg bg-white/10 backdrop-blur px-3 py-2 text-white placeholder-white/50 text-sm w-full" />
                    <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción" rows={3} className="rounded-lg bg-white/10 backdrop-blur px-3 py-2 text-white placeholder-white/50 text-sm resize-none w-full" />
                    {bloques.length > 0 && <button onClick={handleSubmit} className="bg-green-600/30 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">{modo === 'crear' ? 'Guardar Rutina' : 'Actualizar Rutina'}</button>}
                    <button onClick={agregarBloque} className="bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg px-4 py-2 text-sm">Agregar mes</button>
                </div>
            </aside>
            <section className="flex-1 pr-2 space-y-4 px-4 md:px-0">
                {Array.isArray(bloques) && bloques.map(bloque => (
                    <BloqueEditor
                        key={bloque.id}
                        bloque={bloque}
                        onChange={actualizarBloque}
                        onRemove={() => eliminarBloque(bloque.id)}
                        onDuplicate={duplicarBloque}
                        ejerciciosDisponibles={ejerciciosDisponibles}
                    />
                ))}
            </section>

        </div>
    );
};

export default RutinaForm;