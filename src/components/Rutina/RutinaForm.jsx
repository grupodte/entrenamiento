
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuthUser } from '../../hooks/useAuthUser';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import BloqueEditor from './BloqueEditor';
import { guardarEstructuraRutina } from '../../utils/guardarEstructuraRutina';
import { Loader2, PlusCircle, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 🎨 Estilos y gradientes consistentes
const INPUT_CLASS = "w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:ring-2 focus:ring-pink-500 border border-transparent focus:border-pink-400 transition-all outline-none shadow-inner";
const BRAND_GRADIENT = "from-orange-500 via-pink-500 to-red-600";

const createDefaultSetsConfig = (numSets, reps = '', carga = '') => {
    return Array(numSets).fill(null).map(() => ({ reps, carga }));
};

const RutinaForm = ({
    modo = "crear",
    rutinaInicial = null,
    onGuardar,
    esModoPersonalizar = false,
    alumnoIdParaPersonalizar = null,
    asignacionIdParaPersonalizar = null,
    idRutinaOriginal = null,
    tipoEntidadOriginal = 'base'
}) => {
    const [nombre, setNombre] = useState('');
    const [tipo, setTipo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [bloques, setBloques] = useState([]);
    const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const { perfil: perfilEntrenador } = useAuthUser();

    useEffect(() => {
        if (modo === "editar" && rutinaInicial) {
            setNombre(rutinaInicial.nombre || '');
            setTipo(rutinaInicial.tipo || '');
            setDescripcion(rutinaInicial.descripcion || '');
            const bloquesTransformados = rutinaInicial.bloques?.map(bloqueOriginal => ({
                ...bloqueOriginal,
                id: bloqueOriginal.id || uuidv4(),
                subbloques: bloqueOriginal.subbloques?.map(subBloqueOriginal => {
                    const esSuperset = subBloqueOriginal.tipo === 'superset';
                    let numSetsInferido = 0;
                    let sharedRestInferido = '';
                    if (esSuperset && subBloqueOriginal.ejercicios?.length > 0) {
                        const primerEjercicioSeries = subBloqueOriginal.ejercicios[0].series;
                        if (primerEjercicioSeries?.length > 0) {
                            numSetsInferido = primerEjercicioSeries.length;
                            sharedRestInferido = primerEjercicioSeries[0].pausa || '';
                        }
                    }
                    const sharedConfigFinal = esSuperset
                        ? (subBloqueOriginal.shared_config || { num_sets: numSetsInferido || 1, shared_rest: sharedRestInferido || '' })
                        : undefined;
                    return {
                        ...subBloqueOriginal,
                        shared_config: sharedConfigFinal,
                        ejercicios: subBloqueOriginal.ejercicios?.map(ejercicioOriginal => {
                            if (esSuperset) {
                                return {
                                    ...ejercicioOriginal,
                                    sets_config: ejercicioOriginal.series?.map(s => ({ reps: s.reps || '', carga: s.carga_sugerida || '' })) || createDefaultSetsConfig(sharedConfigFinal?.num_sets || 0)
                                };
                            } else {
                                return {
                                    ...ejercicioOriginal,
                                    series: ejercicioOriginal.series?.map(s => ({ id: s.id || uuidv4(), reps: s.reps || '', carga: s.carga_sugerida || '', pausa: s.pausa || '' })) || [{ id: uuidv4(), reps: '', carga: '', pausa: '' }]
                                };
                            }
                        }) || [],
                    };
                }) || [],
            })) || [];
            setBloques(bloquesTransformados);
        } else {
            setNombre('');
            setTipo('');
            setDescripcion('');
            setBloques([]);
        }
    }, [modo, rutinaInicial]);

    useEffect(() => {
        const fetchEjercicios = async () => {
            const { data, error } = await supabase.from('ejercicios').select('id, nombre, grupo_muscular');
            if (!error) setEjerciciosDisponibles(data); else toast.error('Error al cargar ejercicios.');
        };
        fetchEjercicios();
    }, []);

    const agregarBloque = () => {
        const ultimaSemana = bloques[bloques.length - 1]?.semana_fin || 0;
        const nuevoBloque = { id: uuidv4(), semana_inicio: ultimaSemana + 1, semana_fin: ultimaSemana + 4, subbloques: [] };
        setBloques(prev => [...prev, nuevoBloque]);
    };

    const actualizarBloque = (bloqueActualizado) => {
        setBloques(prev => prev.map(b => (b.id === bloqueActualizado.id ? bloqueActualizado : b)));
    };

    const eliminarBloque = (bloqueId) => {
        setBloques(prev => prev.filter(b => b.id !== bloqueId));
    };

    const duplicarBloque = (bloqueADuplicar) => {
        const nuevoBloque = JSON.parse(JSON.stringify(bloqueADuplicar));
        nuevoBloque.id = uuidv4();
        nuevoBloque.subbloques = nuevoBloque.subbloques.map(subbloque => {
            const nuevoSubbloque = { ...subbloque, id: uuidv4() };
            nuevoSubbloque.ejercicios = nuevoSubbloque.ejercicios.map(ejercicio => {
                const nuevoEjercicio = { ...ejercicio, id: uuidv4() };
                if (nuevoEjercicio.series) {
                    nuevoEjercicio.series = nuevoEjercicio.series.map(serie => ({ ...serie, id: uuidv4() }));
                }
                return nuevoEjercicio;
            });
            return nuevoSubbloque;
        });
        const ultimaSemana = bloques[bloques.length - 1]?.semana_fin || 0;
        nuevoBloque.semana_inicio = ultimaSemana + 1;
        nuevoBloque.semana_fin = ultimaSemana + 4;
        setBloques(prev => [...prev, nuevoBloque]);
    };

    const validarRutina = () => {
        const errores = [];
        if (!nombre.trim()) {
            errores.push('El nombre de la sesión es obligatorio.');
        }
        if (bloques.length === 0) {
            errores.push('La sesión debe tener al menos un bloque.');
        }
        for (const bloque of bloques) {
            if (bloque.subbloques.length === 0) {
                errores.push(`El bloque de semana ${bloque.semana_inicio}-${bloque.semana_fin} debe tener al menos un sub-bloque.`);
            }
            for (const subbloque of bloque.subbloques) {
                if (subbloque.ejercicios.length === 0) {
                    errores.push(`El sub-bloque "${subbloque.nombre || 'Sin nombre'}" debe tener al menos un ejercicio.`);
                }
            }
        }
        return errores;
    };

    const handleSubmit = async () => {
        const errores = validarRutina();
        if (errores.length > 0) {
            toast.error(errores.join('\n'));
            return;
        }
        if (isSaving) return;
        setIsSaving(true);

        if (esModoPersonalizar) {
            toast.loading('Personalizando y guardando sesión...');
            try {
                const { data: nuevaRutinaPData, error: errorRutinaP } = await supabase.from('rutinas_personalizadas').insert({ nombre, descripcion, tipo, entrenador_id: perfilEntrenador.id, alumno_id: alumnoIdParaPersonalizar, rutina_base_id: idRutinaOriginal, es_activa: true }).select().single();
                if (errorRutinaP) throw errorRutinaP;
                const nuevaRutinaPersonalizadaId = nuevaRutinaPData.id;
                await guardarEstructuraRutina({ rutinaId: nuevaRutinaPersonalizadaId, bloques, tipoRutina: 'personalizada' });
                const { error: errorAsignacion } = await supabase.from('asignaciones').update({ rutina_personalizada_id: nuevaRutinaPersonalizadaId, rutina_base_id: null }).eq('id', asignacionIdParaPersonalizar);
                if (errorAsignacion) throw errorAsignacion;
                toast.dismiss();
                toast.success('✅ Rutina personalizada y guardada correctamente.');
                if (onGuardar) onGuardar({ id: nuevaRutinaPersonalizadaId, esPersonalizada: true, alumnoId: alumnoIdParaPersonalizar });
            } catch (error) {
                toast.dismiss();
                console.error("Error al personalizar y guardar la sesion:", error.message, error);
                toast.error(`❌ Error: ${error.message}`);
            } finally {
                setIsSaving(false);
            }
        } else if (modo === 'editar') {
            toast.loading('Actualizando rutina...');
            try {
                const rutinaId = rutinaInicial.id;
                const tablaActualizar = tipoEntidadOriginal === 'base' ? 'rutinas_base' : 'rutinas_personalizadas';
                const campoJoinBloques = tipoEntidadOriginal === 'base' ? 'rutina_base_id' : 'rutina_personalizada_id';
                const { error: errorUpdateCabecera } = await supabase.from(tablaActualizar).update({ nombre, tipo, descripcion }).eq('id', rutinaId);
                if (errorUpdateCabecera) throw errorUpdateCabecera;
                const { data: bloquesExistentes, error: errorBloquesExistentes } = await supabase.from('bloques').select('id, subbloques (id, subbloques_ejercicios (id))').eq(campoJoinBloques, rutinaId);
                if (errorBloquesExistentes) throw errorBloquesExistentes;
                for (const bloqueExistente of bloquesExistentes) {
                    for (const subBloqueExistente of bloqueExistente.subbloques) {
                        await supabase.from('series_subejercicio').delete().in('subbloque_ejercicio_id', subBloqueExistente.subbloques_ejercicios.map(sbe => sbe.id));
                        await supabase.from('subbloques_ejercicios').delete().eq('subbloque_id', subBloqueExistente.id);
                    }
                    await supabase.from('subbloques').delete().eq('bloque_id', bloqueExistente.id);
                }
                await supabase.from('bloques').delete().eq(campoJoinBloques, rutinaId);
                await guardarEstructuraRutina({ rutinaId, bloques, tipoRutina: tipoEntidadOriginal });
                toast.dismiss();
                toast.success('✅ Rutina actualizada correctamente');
                if (onGuardar) onGuardar({ id: rutinaId, esPersonalizada: tipoEntidadOriginal === 'personalizada' });
            } catch (error) {
                toast.dismiss();
                console.error("Error al actualizar rutina:", error.message, error);
                toast.error(`❌ Error al actualizar: ${error.message}`);
            } finally {
                setIsSaving(false);
            }
        } else if (modo === 'crear') {
            toast.loading('Guardando nueva rutina base...');
            try {
                const { data: rutinaBase, error: errorRutina } = await supabase.from('rutinas_base').insert([{ nombre, tipo, descripcion }]).select().single();
                if (errorRutina) throw errorRutina;
                const rutinaBaseId = rutinaBase.id;
                await guardarEstructuraRutina({ rutinaId: rutinaBaseId, bloques, tipoRutina: 'base' });
                toast.dismiss();
                toast.success(`Nueva rutina base guardada.`);
                setNombre(''); setTipo(''); setDescripcion(''); setBloques([]);
                if (onGuardar) onGuardar({ id: rutinaBaseId, esPersonalizada: false });
            } catch (error) {
                toast.dismiss();
                console.error("Error al guardar nueva rutina base:", error.message, error);
                toast.error(`❌ Error al guardar: ${error.message}`);
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 shadow-lg border border-white/10">
          
            <div className="flex flex-col lg:flex-row h-full gap-8">
                <aside className="w-full lg:w-80 lg:sticky top-6 self-start space-y-4 bg-white/5 p-5 rounded-2xl border border-white/10">
                    <h3 className="text-lg font-semibold text-white/90 border-b border-white/10 pb-3 mb-4">Configuración General</h3>
                    <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre de la sesión" className={INPUT_CLASS} />
                    <input value={tipo} onChange={e => setTipo(e.target.value)} placeholder="Ej: Hipertrofia, Fuerza" className={INPUT_CLASS} />
                    <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción" rows={4} className={`${INPUT_CLASS} min-h-[100px]`} />
                    <div className="space-y-3 pt-4">
                        <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={agregarBloque} className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl px-4 py-3 transition-colors shadow-md">
                            <PlusCircle size={18} />
                            Agregar Mes
                        </motion.button>
                        {bloques.length > 0 && 
                            <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={isSaving} className={`w-full flex items-center justify-center gap-2 text-white font-bold rounded-xl px-4 py-3 transition-all bg-gradient-to-r ${BRAND_GRADIENT} shadow-[0_8px_20px_rgba(236,72,153,0.3)] disabled:opacity-50 disabled:cursor-not-allowed`}>
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                {isSaving ? 'Guardando...' : (modo === 'crear' ? 'Guardar' : 'Actualizar ')}
                            </motion.button>
                        }
                    </div>
                </aside>
                <section className="flex-1 space-y-6">
                    <AnimatePresence>
                        {bloques.map((bloque, index) => (
                            <motion.div key={bloque.id} layout initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }} transition={{ type: 'spring', stiffness: 200, damping: 25, delay: index * 0.1 }}>
                                <BloqueEditor bloque={bloque} onChange={actualizarBloque} onRemove={() => eliminarBloque(bloque.id)} onDuplicate={duplicarBloque} ejerciciosDisponibles={ejerciciosDisponibles} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {bloques.length === 0 && (
                        <div className="text-center py-16 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center">
                            <p className="text-white/60 font-semibold text-lg">Aún no hay bloques</p>
                            <p className="text-white/40 text-sm mt-1">Comienza haciendo clic en "Agregar Bloque".</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default RutinaForm;
