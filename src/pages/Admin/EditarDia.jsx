// src/pages/Admin/EditarDia.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { AnimatedLayout, AnimatedButton, AnimatedList, AnimatedListItem, useFeedback } from '../../components/animations';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, Calendar, Dumbbell } from 'lucide-react';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const EditarDia = () => {
    const { id: alumnoId } = useParams();
    const [searchParams] = useSearchParams();
    const dia = parseInt(searchParams.get('dia'), 10);
    const navigate = useNavigate();
    const { showSuccess, showError } = useFeedback();

    const [ejercicios, setEjercicios] = useState([]);
    const [asignacionOriginal, setAsignacionOriginal] = useState(null);
    const [rutinaPersonalizadaId, setRutinaPersonalizadaId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mostrarSelector, setMostrarSelector] = useState(false);
    const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);

    useEffect(() => {
        const cargarDatos = async () => {
            setLoading(true);

            const { data: asignacion, error } = await supabase
                .from('asignaciones')
                .select('id, rutina_base_id, rutina_personalizada_id')
                .eq('alumno_id', alumnoId)
                .eq('dia_semana', dia)
                .maybeSingle();

            if (error || !asignacion) {
                console.error("Asignación no encontrada", error);
                setLoading(false);
                return;
            }

            setAsignacionOriginal(asignacion);
            setRutinaPersonalizadaId(asignacion.rutina_personalizada_id);

            let ejerciciosFinales = [];

            if (asignacion.rutina_personalizada_id) {
                // Esta parte para rutinas personalizadas ya estaba bien
                const { data: dataPers } = await supabase
                    .from('rutinas_personalizadas_ejercicios')
                    .select(`id, ejercicio_id, ejercicios(nombre), rutinas_personalizadas_series(id, nro_set, reps, pausa, carga)`)
                    .eq('rutina_personalizada_id', asignacion.rutina_personalizada_id)
                    .order('orden', { ascending: true });

                ejerciciosFinales = (dataPers || []).map(ej => ({
                    id: ej.id,
                    ejercicio_id: ej.ejercicio_id,
                    nombre: ej.ejercicios?.nombre || 'Sin nombre',
                    series: ej.rutinas_personalizadas_series || []
                }));

            } else if (asignacion.rutina_base_id) {
                // --- INICIO DE LA CORRECCIÓN ---
                // CAMBIO 1: Pedimos también el 'id' de la tabla de unión.
                const { data: ejerciciosBase } = await supabase
                    .from('rutinas_base_ejercicios')
                    .select('id, orden, ejercicio_id')
                    .eq('rutina_base_id', asignacion.rutina_base_id)
                    .order('orden', { ascending: true });

                if (ejerciciosBase) {
                    ejerciciosFinales = await Promise.all(
                        ejerciciosBase.map(async (ej) => {
                            const { data: info } = await supabase
                                .from('ejercicios')
                                .select('nombre')
                                .eq('id', ej.ejercicio_id)
                                .maybeSingle();

                            // CAMBIO 2: Buscamos las series usando la clave foránea correcta.
                            const { data: seriesBase } = await supabase
                                .from('rutinas_base_series')
                                .select('nro_set, reps, pausa, carga_sugerida')
                                .eq('rutinas_base_ejercicio_id', ej.id); // Se usa el ID del "padre"

                            return {
                                ejercicio_id: ej.ejercicio_id,
                                nombre: info?.nombre || 'Desconocido',
                                series: (seriesBase || []).map((s, i) => ({
                                    id: s.id, // Es buena idea mantener un id para las series si existe
                                    nro_set: i + 1,
                                    reps: s.reps,
                                    pausa: s.pausa,
                                    carga: s.carga_sugerida // Se mapea a 'carga' para consistencia
                                }))
                            };
                        })
                    );
                }
                // --- FIN DE LA CORRECCIÓN ---
            }

            setEjercicios(ejerciciosFinales);
            setLoading(false);
        };

        cargarDatos();
    }, [alumnoId, dia]);

    const actualizarSerie = (indexEjercicio, indexSerie, campo, valor) => {
        setEjercicios(prev => {
            const nuevos = [...prev];
            nuevos[indexEjercicio].series[indexSerie][campo] = valor;
            return nuevos;
        });
    };

    const eliminarSerie = (indexEjercicio, indexSerie) => {
        setEjercicios(prev => {
            const nuevos = [...prev];
            nuevos[indexEjercicio].series.splice(indexSerie, 1);
            return nuevos;
        });
    };

    // Añade esta nueva función
    const agregarSet = (indexEjercicio) => {
        setEjercicios(prev => {
            // Mapeamos el array de ejercicios para crear uno nuevo
            return prev.map((ejercicio, index) => {
                // Si este no es el ejercicio que queremos cambiar, lo devolvemos tal como está
                if (index !== indexEjercicio) {
                    return ejercicio;
                }

                // Si es el ejercicio correcto, creamos una copia de él
                // y le añadimos el nuevo set a una copia de su array de series
                return {
                    ...ejercicio,
                    series: [...ejercicio.series, { reps: '', pausa: '', carga: '' }]
                };
            });
        });
    };


    const agregarEjercicio = (ejercicio) => {
        setEjercicios(prev => [...prev, {
            ejercicio_id: ejercicio.id,
            nombre: ejercicio.nombre,
            series: [{ reps: '', pausa: '', carga: '' }]
        }]);
        setMostrarSelector(false);
    };

    const cargarEjerciciosDisponibles = async () => {
        const { data, error } = await supabase.from('ejercicios').select('id, nombre');
        if (error) {
            showError('❌ Error al cargar ejercicios disponibles');
            return;
        }
        setEjerciciosDisponibles(data);
        setMostrarSelector(true);
    };

    const handleGuardar = async () => {
        let rutinaId = rutinaPersonalizadaId;

        if (!rutinaId && asignacionOriginal?.rutina_base_id) {
            const { data: nuevaRutina, error: errorInsert } = await supabase
                .from('rutinas_personalizadas')
                .insert({ alumno_id: alumnoId, nombre: `Rutina personalizada día ${dia}` })
                .select()
                .single();

            if (errorInsert) {
                alert("Error creando rutina personalizada");
                return;
            }

            rutinaId = nuevaRutina.id;
            setRutinaPersonalizadaId(rutinaId);

            await supabase
                .from('asignaciones')
                .update({ rutina_personalizada_id: rutinaId, rutina_base_id: null })
                .eq('id', asignacionOriginal.id);
        }

        await supabase.from('rutinas_personalizadas_series')
            .delete()
            .in('rutina_personalizada_ejercicio_id', ejercicios.map(e => e.id).filter(Boolean));

        await supabase.from('rutinas_personalizadas_ejercicios')
            .delete()
            .eq('rutina_personalizada_id', rutinaId);

        for (const [orden, ej] of ejercicios.entries()) {
            const { data: insertedEj, error: errEj } = await supabase
                .from('rutinas_personalizadas_ejercicios')
                .insert({ rutina_personalizada_id: rutinaId, ejercicio_id: ej.ejercicio_id, orden, dia_semana: dia })
                .select()
                .single();

            if (errEj) continue;

            const seriesAInsertar = ej.series.map((s, i) => ({
                rutina_personalizada_ejercicio_id: insertedEj.id,
                nro_set: i + 1,
                reps: Number(s.reps),
                pausa: Number(s.pausa),
                carga: s.carga
            }));

            await supabase.from('rutinas_personalizadas_series').insert(seriesAInsertar);
        }

showSuccess("Cambios guardados correctamente ✅");
        navigate(-1);
    };

    if (loading) {
        return (
            <AnimatedLayout className="max-w-4xl mx-auto p-4">
                <div className="text-center mt-10">
                    <motion.div
                        className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <p className="text-white">Cargando rutina...</p>
                </div>
            </AnimatedLayout>
        );
    }

    return (
        <AnimatedLayout className="max-w-4xl mx-auto p-4 pb-safe">
            {/* Encabezado animado */}
            <motion.div 
                className="flex items-center gap-3 mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
            >
                <Calendar className="text-2xl text-blue-500" />
                <h1 className="text-2xl font-bold text-white">
                    Editar rutina del día {diasSemana[dia]}
                </h1>
            </motion.div>

            {/* Lista de ejercicios animada */}
            <AnimatedList className="space-y-4 mb-6" staggerDelay={0.1}>
                {ejercicios.map((ej, indexEj) => (
                    <AnimatedListItem key={indexEj}>
                        <motion.div 
                            className="p-4 bg-white/10 backdrop-blur rounded-xl shadow-md text-white"
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <Dumbbell className="text-blue-400" size={18} />
                                    {ej.nombre}
                                </h3>
                                <AnimatedButton
                                    variant="destructive"
                                    onClick={() => setEjercicios(prev => prev.filter((_, i) => i !== indexEj))}
                                    className="text-sm"
                                >
                                    <Trash2 size={16} />
                                    Eliminar
                                </AnimatedButton>
                            </div>
                            
                            {/* Series */}
                            <div className="space-y-2 mb-4">
                                {ej.series.map((serie, indexSer) => (
                                    <motion.div 
                                        key={indexSer} 
                                        className="flex gap-2 items-center p-2 bg-white/5 rounded-lg"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ delay: indexSer * 0.05 }}
                                    >
                                        <span className="text-sm text-white/70 w-12">Set {indexSer + 1}:</span>
                                        <input
                                            type="number"
                                            className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-white/50"
                                            value={serie.reps}
                                            onChange={e => actualizarSerie(indexEj, indexSer, 'reps', parseInt(e.target.value))}
                                            placeholder="Reps"
                                        />
                                        <input
                                            type="number"
                                            className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-white/50"
                                            value={serie.pausa}
                                            onChange={e => actualizarSerie(indexEj, indexSer, 'pausa', parseInt(e.target.value))}
                                            placeholder="Pausa"
                                        />
                                        <input
                                            type="number"
                                            className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-white/50"
                                            value={serie.carga}
                                            onChange={e => actualizarSerie(indexEj, indexSer, 'carga', parseFloat(e.target.value))}
                                            placeholder="Carga"
                                        />
                                        <AnimatedButton
                                            variant="icon"
                                            onClick={() => eliminarSerie(indexEj, indexSer)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 size={14} />
                                        </AnimatedButton>
                                    </motion.div>
                                ))}
                            </div>

                            <AnimatedButton
                                variant="secondary"
                                onClick={() => agregarSet(indexEj)}
                                className="text-sm w-full"
                            >
                                <Plus size={16} />
                                Agregar set
                            </AnimatedButton>
                        </motion.div>
                    </AnimatedListItem>
                ))}
            </AnimatedList>

            {/* Selector de ejercicios */}
            <AnimatePresence>
                {mostrarSelector && (
                    <motion.div 
                        className="mt-6 p-4 bg-white/10 backdrop-blur rounded-xl shadow-md"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                            <Plus className="text-green-400" />
                            Seleccionar ejercicio
                        </h2>
                        <AnimatedList className="space-y-2" staggerDelay={0.05}>
                            {ejerciciosDisponibles.map(ej => (
                                <AnimatedListItem key={ej.id}>
                                    <motion.div 
                                        className="flex justify-between items-center p-2 bg-white/5 rounded-lg"
                                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                                    >
                                        <span className="text-white">{ej.nombre}</span>
                                        <AnimatedButton
                                            variant="primary"
                                            onClick={() => agregarEjercicio(ej)}
                                            className="text-sm"
                                        >
                                            Agregar
                                        </AnimatedButton>
                                    </motion.div>
                                </AnimatedListItem>
                            ))}
                        </AnimatedList>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Botones de acción */}
            <motion.div 
                className="mt-6 flex gap-4 justify-end"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
            >
                <AnimatedButton
                    variant="secondary"
                    onClick={cargarEjerciciosDisponibles}
                    className="flex items-center gap-2"
                >
                    <Plus size={16} />
                    Agregar ejercicio
                </AnimatedButton>
                
                <AnimatedButton
                    variant="primary"
                    onClick={handleGuardar}
                    className="flex items-center gap-2"
                >
                    <Save size={16} />
                    Guardar cambios
                </AnimatedButton>
            </motion.div>
        </AnimatedLayout>
    );
};

export default EditarDia;