// src/pages/Alumno/RutinaDetalle.jsx

import { useEffect, useState } from 'react';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { FaPause, FaPlay, FaArrowLeft, FaCheck, FaStopwatch, FaTrophy, FaSave } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import RestTimer from '../../components/RestTimer';
import EjercicioItem from '../../components/EjercicioItem';



// --- CRONÓMETRO GENERAL (MODIFICADO PARA RECIBIR ESTADO) ---
const Chronometer = ({ time, isRunning, onToggle }) => {
    const formatTime = (s) => {
        const h = `0${Math.floor(s / 3600)}`.slice(-2);
        const m = `0${Math.floor((s % 3600) / 60)}`.slice(-2);
        const sec = `0${s % 60}`.slice(-2);
        return `${h}:${m}:${sec}`;
    };

    return (
        <motion.div initial={{ y: -100 }} animate={{ y: 0 }} className="sticky top-0 z-30 bg-gray-900 text-white shadow-lg">
            <div className="max-w-4xl mx-auto flex justify-between items-center px-6 py-3">
                <span className="text-sm font-semibold uppercase tracking-wider">Tiempo Total</span>
                <span className="text-3xl font-mono font-bold">{formatTime(time)}</span>
                <button onClick={onToggle} className="p-3 rounded-full text-white bg-white/20 hover:bg-white/30" aria-label={isRunning ? 'Pausar' : 'Reanudar'}>
                    {isRunning ? <FaPause /> : <FaPlay />}
                </button>
            </div>
        </motion.div>
    );
};




// --- MODAL DE FINALIZACIÓN ---
const WorkoutCompleteModal = ({ onSave, isSaving }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
        <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full"
        >
            <FaTrophy className="text-5xl text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">¡Entrenamiento Finalizado!</h2>
            <p className="text-b mb-6">Guarda los resultados para registrar tu progreso.</p>
            <div className="flex flex-col gap-3">
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:bg-green-400"
                >
                    <FaSave />
                    {isSaving ? 'Guardando...' : 'Guardar Resultados'}
                </button>
            </div>
        </motion.div>
    </motion.div>
);

// --- COMPONENTE PRINCIPAL ---
const RutinaDetalle = () => {
    const { id: rutinaId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [rutina, setRutina] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // tipoRutina se leerá de los searchParams dentro de useEffect
    // const [tipoRutina, setTipoRutina] = useState(null); 
    const [time, setTime] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [restInfo, setRestInfo] = useState({ active: false, duration: 0, exerciseName: '' });
    const [isWorkoutComplete, setIsWorkoutComplete] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Efecto para el cronómetro general
    useEffect(() => {
        let interval = null;
        if (isTimerRunning) {
            interval = setInterval(() => setTime(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    // Efecto para cargar los detalles de la rutina
    useEffect(() => {
        const fetchRutinaDetails = async () => {
            setLoading(true);
            setError(null);
            setRutina(null); // Limpiar rutina anterior

            const searchParams = new URLSearchParams(location.search);
            const tipo = searchParams.get('tipo');
            // setTipoRutina(tipo); // Se pasa directamente a handleSaveResults

            const bloquesOrdenados = location.state?.bloquesOrdenados;
            const startTimer = location.state?.startTimer === true;

            if (!tipo || !rutinaId) {
                setError("No se pudo identificar la rutina. Falta el tipo o el ID.");
                setLoading(false);
                return;
            }

            try {
                let rutinaNombre = '';
                let bloquesParaProcesar = [];

                // 1. Obtener nombre de la rutina y sus bloques
                if (tipo === 'base') {
                    const { data: rutinaData, error: rutinaError } = await supabase
                        .from('rutinas_base')
                        .select('id, nombre, bloques (id, nombre, orden)')
                        .eq('id', rutinaId)
                        .single();
                    if (rutinaError) throw rutinaError;
                    if (!rutinaData) throw new Error("Rutina base no encontrada.");
                    rutinaNombre = rutinaData.nombre;
                    bloquesParaProcesar = rutinaData.bloques || [];
                } else if (tipo === 'personalizada') {
                    const { data: rutinaData, error: rutinaError } = await supabase
                        .from('rutinas_personalizadas')
                        .select('id, nombre, bloques (id, nombre, orden)')
                        .eq('id', rutinaId)
                        .single();
                    if (rutinaError) throw rutinaError;
                    if (!rutinaData) throw new Error("Rutina personalizada no encontrada.");
                    rutinaNombre = rutinaData.nombre;
                    bloquesParaProcesar = rutinaData.bloques || [];
                } else {
                    throw new Error("Tipo de rutina no válido.");
                }

                // 2. Determinar el orden de los IDs de los bloques
                let idsDeBloquesOrdenados;
                if (bloquesOrdenados && bloquesOrdenados.length > 0) {
                    idsDeBloquesOrdenados = bloquesOrdenados;
                } else {
                    // Usar el orden original de la BD
                    bloquesParaProcesar.sort((a, b) => a.orden - b.orden);
                    idsDeBloquesOrdenados = bloquesParaProcesar.map(b => b.id);
                }

                // 3. Iterar sobre los IDs de bloques ordenados y obtener sus ejercicios
                const ejerciciosFinales = [];
                for (const bloqueId of idsDeBloquesOrdenados) {
                    // Obtener subbloques del bloque actual
                    const { data: subBloquesData, error: subBloquesError } = await supabase
                        .from('subbloques')
                        .select('id, tipo, orden, subbloques_ejercicios (*, ejercicios(id, nombre, video_url), series_subejercicio(*))')
                        .eq('bloque_id', bloqueId)
                        .order('orden', { ascending: true }); // Ordenar subbloques por su campo 'orden'

                    if (subBloquesError) {
                        console.warn(`Error al cargar subbloques para el bloque ${bloqueId}:`, subBloquesError);
                        continue; // Continuar con el siguiente bloque si hay error
                    }

                    if (subBloquesData) {
                        for (const subBloque of subBloquesData) {
                            // Ordenar ejercicios dentro del subbloque por su campo 'orden' en 'subbloques_ejercicios'
                            const ejerciciosDelSubloque = (subBloque.subbloques_ejercicios || []).sort((a, b) => a.orden - b.orden);

                            for (const sbe of ejerciciosDelSubloque) {
                                if (sbe.ejercicios) { // Asegurarse que el ejercicio existe
                                    // Ordenar series por nro_set
                                    const seriesOrdenadas = (sbe.series_subejercicio || []).sort((a, b) => a.nro_set - b.nro_set);

                                    ejerciciosFinales.push({
                                        // Usamos sbe.id (ID de subbloques_ejercicios) como ID único para el EjercicioItem key,
                                        // ya que un mismo ejercicio puede aparecer múltiples veces.
                                        // El ID del ejercicio real es sbe.ejercicios.id
                                        id: sbe.id, // ID de la instancia del ejercicio en el subbloque
                                        ejercicioOriginalId: sbe.ejercicios.id, // ID real del ejercicio
                                        nombre: sbe.ejercicios.nombre,
                                        video_url: sbe.ejercicios.video_url,
                                        // INFO: Ajustar nombres de campo (reps, descanso, cargaSugerida) según tu tabla series_subejercicio
                                        sets: seriesOrdenadas.map(set => ({
                                            id: set.id, // ID de la serie
                                            // Asumo que 'reps_objetivo' es el campo para las repeticiones
                                            reps: set.reps_objetivo || set.reps, // Priorizar reps_objetivo si existe
                                            // Asumo 'descanso_segundos' para la pausa
                                            descanso: set.descanso_segundos > 0 ? set.descanso_segundos : 60,
                                            completed: false,
                                            // Asumo 'carga_kg_sugerida' para la carga
                                            cargaSugerida: set.carga_kg_sugerida || '',
                                            // Carga realizada se inicializa vacía o con la sugerida si es rutina base (o según tu lógica)
                                            cargaRealizada: '',
                                        }))
                                    });
                                }
                            }
                        }
                    }
                }

                setRutina({ nombre: rutinaNombre, ejercicios: ejerciciosFinales });
                if (startTimer) {
                    setIsTimerRunning(true);
                }

            } catch (err) {
                console.error('❌ Error general cargando rutina:', err);
                setError(err.message || "Ocurrió un error inesperado al cargar la rutina.");
            } finally {
                setLoading(false);
            }
        };

        fetchRutinaDetails();
    }, [rutinaId, location.search, location.state]); // Dependencias actualizadas

    const handleCargaChange = (ejercicioInstanciaId, setId, carga) => {
        if (!rutina) return;
        const updatedEjercicios = rutina.ejercicios.map(ej => {
            // ej.id aquí es el id de subbloques_ejercicios
            if (ej.id === ejercicioInstanciaId) {
                const updatedSets = ej.sets.map(set =>
                    set.id === setId ? { ...set, cargaRealizada: carga } : set
                );
                return { ...ej, sets: updatedSets };
            }
            return ej;
        });
        setRutina(prev => ({ ...prev, ejercicios: updatedEjercicios }));
    };

    const handleSetComplete = async (ejercicioInstanciaId, setId) => {
        if (!rutina) return;
        let completedSetData = null;

        const updatedEjercicios = rutina.ejercicios.map(ej => {
            if (ej.id === ejercicioInstanciaId) {
                const updatedSets = ej.sets.map(set => {
                    if (set.id === setId && !set.completed) {
                        completedSetData = { ...set, completed: true };
                        return completedSetData;
                    }
                    return set;
                });
                return { ...ej, sets: updatedSets };
            }
            return ej;
        });

        if (!completedSetData) return;
        setRutina(prev => ({ ...prev, ejercicios: updatedEjercicios }));

        const allSetsCompleted = updatedEjercicios.every(ej => ej.sets.every(s => s.completed));

        if (allSetsCompleted) {
            setIsTimerRunning(false);
            setRestInfo({ active: false, duration: 0, exerciseName: '' });
            setIsWorkoutComplete(true);
        } else {
            // Lógica para el temporizador de descanso
            const currentExercise = updatedEjercicios.find(e => e.id === ejercicioInstanciaId);
            const currentSetIndex = currentExercise.sets.findIndex(s => s.id === setId);

            let nextExerciseName = "¡Última serie completada!"; // Mensaje por defecto
            const currentGlobalExerciseIndex = updatedEjercicios.findIndex(e => e.id === ejercicioInstanciaId);

            if (currentSetIndex < currentExercise.sets.length - 1) {
                // Hay más series en el mismo ejercicio
                nextExerciseName = currentExercise.nombre;
            } else if (currentGlobalExerciseIndex < updatedEjercicios.length - 1) {
                // Es la última serie de este ejercicio, pero hay más ejercicios
                nextExerciseName = updatedEjercicios[currentGlobalExerciseIndex + 1].nombre;
            }
            // Si es la última serie del último ejercicio, el mensaje por defecto "¡Última serie completada!" se mantiene
            // o se podría cambiar a "¡Entrenamiento finalizado!" si se prefiere antes del modal.

            setRestInfo({ active: true, duration: completedSetData.descanso, exerciseName: nextExerciseName });
        }
    };

    const handleSaveResults = async () => {
        setIsSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.');
            setIsSaving(false);
            return;
        }

        const searchParams = new URLSearchParams(location.search);
        const tipo = searchParams.get('tipo'); // Leer tipo aquí para asegurar que es el actual

        const sesionPayload = {
            alumno_id: user.id,
            duracion_segundos: time
        };

        if (tipo === 'base') {
            sesionPayload.rutina_base_id = rutinaId;
        } else if (tipo === 'personalizada') {
            sesionPayload.rutina_personalizada_id = rutinaId;
        } else {
            console.error("Tipo de rutina desconocido al guardar:", tipo);
            alert("Error: Tipo de rutina no reconocido.");
            setIsSaving(false);
            return;
        }

        const { data: sesionData, error: sesionError } = await supabase
            .from('sesiones_entrenamiento')
            .insert(sesionPayload)
            .select()
            .single();

        if (sesionError) {
            console.error('Error creando la sesión:', sesionError);
            alert('Ocurrió un error al guardar la sesión. Revisa la consola para más detalles.');
            setIsSaving(false);
            return;
        }

        const seriesDataToInsert = [];
        rutina.ejercicios.forEach((ej) => { // ej.id es subbloques_ejercicios.id
            ej.sets.forEach((set, setIndex) => { // set.id es series_subejercicio.id
                if (set.completed) {
                    seriesDataToInsert.push({
                        sesion_id: sesionData.id,
                        ejercicio_id: ej.ejercicioOriginalId, // Usar el ID real del ejercicio
                        subbloque_ejercicio_id: ej.id, // Guardar referencia a subbloques_ejercicios
                        serie_subejercicio_id: set.id, // Guardar referencia a la serie original
                        nro_set: setIndex + 1, // O usar set.nro_set si lo tienes en la data
                        // INFO: Asegúrate que los nombres de campo coincidan con tu tabla `sesiones_series`
                        reps_realizadas: set.reps, // Asumiendo que 'set.reps' tiene las reps realizadas (o el objetivo si no se editan)
                        carga_realizada: set.cargaRealizada || '0',
                        // Podrías añadir más campos como 'descanso_tomado', etc.
                    });
                }
            });
        });

        if (seriesDataToInsert.length > 0) {
            const { error: seriesError } = await supabase
                .from('sesiones_series')
                .insert(seriesDataToInsert);

            if (seriesError) {
                console.error('Error guardando las series:', seriesError);
                // Considera si quieres eliminar la 'sesion_entrenamiento' creada si las series fallan.
                alert('Ocurrió un error al guardar el detalle de las series.');
                setIsSaving(false);
                return;
            }
        }

        alert('¡Resultados guardados con éxito!');
        navigate('/dashboard/rutinas'); // O a donde prefieras
        setIsSaving(false);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Cargando tu entrenamiento...</p></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500"><p>{error}</p></div>;

    return (
        <div className="bg-gray-100 min-h-screen pb-20">
            {isTimerRunning && (
                <Chronometer
                    time={time}
                    isRunning={isTimerRunning}
                    onToggle={() => setIsTimerRunning(!isTimerRunning)}
                />
            )}
            {restInfo.active && (
                <RestTimer duration={restInfo.duration} exerciseName={restInfo.exerciseName} onFinish={() => setRestInfo({ active: false, duration: 0, exerciseName: '' })} />
            )}

            <AnimatePresence>
                {isWorkoutComplete && (
                    <WorkoutCompleteModal
                        onSave={handleSaveResults}
                        isSaving={isSaving}
                    />
                )}
            </AnimatePresence>

            <header className="bg-white p-4 shadow-sm">
                <div className="max-w-4xl mx-auto">
                    <Link to="/dashboard/rutinas" className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                        <FaArrowLeft />
                        Volver a Mis Rutinas
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-6">{rutina?.nombre || 'Rutina'}</h1>
                {rutina?.ejercicios?.length > 0 ? (
                    rutina.ejercicios.map(ej => (
                        <EjercicioItem
                            key={ej.id}
                            ejercicio={ej}
                            onSetComplete={handleSetComplete}
                            onCargaChange={handleCargaChange}
                        />
                    ))
                ) : (
                    <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                        <p className="font-semibold text-gray-700">Esta rutina aún no tiene ejercicios asignados.</p>
                        <p className="text-sm text-gray-500 mt-1">Contacta a tu entrenador para más detalles.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default RutinaDetalle;