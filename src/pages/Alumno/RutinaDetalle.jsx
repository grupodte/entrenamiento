// src/pages/Alumno/RutinaDetalle.jsx

import { useEffect, useState } from 'react';
import { useLocation, useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { FaPause, FaPlay, FaArrowLeft, FaCheck, FaStopwatch, FaTrophy, FaSave } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import RestTimer from '../../components/RestTimer';
import VideoPanel from '../../components/VideoPanel'; // o donde lo pongas


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


// --- ITEM DE EJERCICIO ---
const EjercicioItem = ({ ejercicio, onSetComplete, onCargaChange }) => {
    const [showVideo, setShowVideo] = useState(false);

    return (
        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 sm:p-6 rounded-2xl shadow-md border">
            <h3
                onClick={() => setShowVideo(true)}
                className="text-xl font-bold text-indigo-600 hover:underline cursor-pointer mb-4"
            >
                {ejercicio.nombre}
            </h3>

            <VideoPanel
                open={showVideo}
                onClose={() => setShowVideo(false)}
                videoUrl={ejercicio.video_url}
                nombre={ejercicio.nombre}
            />

            <div className="space-y-3">
                {/* sets */}
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
    const [tipoRutina, setTipoRutina] = useState(null);

    const [time, setTime] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [restInfo, setRestInfo] = useState({ active: false, duration: 0, exerciseName: '' });
    const [videoEjercicio, setVideoEjercicio] = useState(null);


    const [isWorkoutComplete, setIsWorkoutComplete] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let interval = null;
        if (isTimerRunning) {
            interval = setInterval(() => setTime(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    useEffect(() => {
        const fetchRutinaDetails = async () => {
            setLoading(true);
            setError(null);

            const searchParams = new URLSearchParams(location.search);
            const tipo = searchParams.get('tipo');
            setTipoRutina(tipo);

            if (!tipo || !rutinaId) {
                setError("No se pudo identificar la rutina. Falta el tipo o el ID.");
                setLoading(false);
                return;
            }

            try {
                let data = null;
                let fetchError = null;

                if (tipo === 'base') {
                    ({ data, error: fetchError } = await supabase
                        .from('rutinas_base')
                        .select(`
                            nombre,
                            ejercicios_de_rutina:rutinas_base_ejercicios (
                                orden,
                                ejercicios:ejercicios ( id, nombre ),
                                rutinas_base_series ( id, nro_set, reps, pausa, carga_sugerida )
                            )
                        `)
                        .eq('id', rutinaId)
                        .maybeSingle()
                    );
                } else {
                    ({ data, error: fetchError } = await supabase
                        .from('rutinas_personalizadas')
                        .select(`
                            nombre,
                            ejercicios_asignados:rutinas_personalizadas_ejercicios (
                                orden,
                                ejercicios:ejercicios ( id, nombre, video_url ),
                                rutinas_personalizadas_series ( id, nro_set, reps, pausa, carga )
                            )
                        `)
                        .eq('id', rutinaId)
                        .maybeSingle()
                    );
                }

                if (fetchError || !data) {
                    console.error("Error fetching routine:", fetchError);
                    setError(`No se pudieron cargar los detalles de la rutina. Error: ${fetchError?.message || 'Error desconocido'}`);
                    setLoading(false);
                    return;
                }

                // Elegí el alias correcto según el tipo
                const joinKey = tipo === 'base' ? 'ejercicios_de_rutina' : 'ejercicios_asignados';
                const seriesKey = tipo === 'base' ? 'rutinas_base_series' : 'rutinas_personalizadas_series';
                const cargaField = tipo === 'base' ? 'carga_sugerida' : 'carga';

                const ejerciciosData = (data[joinKey] || []).filter(d => d.ejercicios);
                ejerciciosData.sort((a, b) => a.orden - b.orden);

                const ejerciciosConSets = ejerciciosData.map(d => {
                    const setsData = d[seriesKey] || [];
                    setsData.sort((a, b) => a.nro_set - b.nro_set);

                    return {
                        id: d.ejercicios.id,
                        nombre: d.ejercicios.nombre,
                        video_url: d.ejercicios.video_url,

                        sets: setsData.map(set => ({
                            id: set.id,
                            reps: set.reps,
                            descanso: set.pausa > 0 ? set.pausa : 60,
                            completed: false,
                            cargaSugerida: set[cargaField] || '',
                            cargaRealizada: tipo === 'base' ? '' : (set[cargaField] || ''),
                        }))
                    };
                });

                setRutina({ nombre: data.nombre, ejercicios: ejerciciosConSets });
                setIsTimerRunning(location?.state?.startTimer === true);

            } catch (err) {
                console.error('❌ Error general cargando rutina:', err);
                setError(err.message || "Ocurrió un error inesperado al cargar la rutina.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchRutinaDetails();
    }, [rutinaId, location.state]);
    const handleCargaChange = (ejercicioId, setId, carga) => {
        if (!rutina) return;
        const updatedEjercicios = rutina.ejercicios.map(ej => {
            if (ej.id === ejercicioId) {
                const updatedSets = ej.sets.map(set =>
                    set.id === setId ? { ...set, cargaRealizada: carga } : set
                );
                return { ...ej, sets: updatedSets };
            }
            return ej;
        });
        setRutina(prev => ({ ...prev, ejercicios: updatedEjercicios }));
    };

    const handleSetComplete = async (ejercicioId, setId) => {
        if (!rutina) return;
        let completedSet = null;
        const updatedEjercicios = rutina.ejercicios.map(ej => {
            if (ej.id === ejercicioId) {
                const updatedSets = ej.sets.map(set => {
                    if (set.id === setId && !set.completed) {
                        completedSet = { ...set, completed: true };
                        return completedSet;
                    }
                    return set;
                });
                return { ...ej, sets: updatedSets };
            }
            return ej;
        });

        if (!completedSet) return;
        setRutina(prev => ({ ...prev, ejercicios: updatedEjercicios }));

        const allSetsCompleted = updatedEjercicios.every(ej => ej.sets.every(s => s.completed));

        if (allSetsCompleted) {
            setIsTimerRunning(false);
            setRestInfo({ active: false, duration: 0, exerciseName: '' });
            setIsWorkoutComplete(true);
        } else {
            const currentExerciseIndex = rutina.ejercicios.findIndex(e => e.id === ejercicioId);
            const currentExercise = updatedEjercicios[currentExerciseIndex];
            const currentSetIndex = currentExercise.sets.findIndex(s => s.id === setId);

            let nextExerciseName = "¡Entrenamiento finalizado!";
            if (currentSetIndex < currentExercise.sets.length - 1) {
                nextExerciseName = currentExercise.nombre;
            } else if (currentExerciseIndex < updatedEjercicios.length - 1) {
                nextExerciseName = updatedEjercicios[currentExerciseIndex + 1].nombre;
            }
            setRestInfo({ active: true, duration: completedSet.descanso, exerciseName: nextExerciseName });
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

        const { data: sesionData, error: sesionError } = await supabase
            .from('sesiones_entrenamiento')
            .insert({ alumno_id: user.id, rutina_personalizada_id: rutinaId, duracion_segundos: time })
            .select()
            .single();

        if (sesionError) {
            console.error('Error creando la sesión:', sesionError);
            alert('Ocurrió un error al guardar la sesión.');
            setIsSaving(false);
            return;
        }

        const seriesDataToInsert = [];
        rutina.ejercicios.forEach((ej, ejIndex) => {
            ej.sets.forEach((set, setIndex) => {
                if (set.completed) {
                    seriesDataToInsert.push({
                        sesion_id: sesionData.id,
                        ejercicio_id: ej.id,
                        nro_set: setIndex + 1,
                        reps_realizadas: set.reps,
                        carga_realizada: set.cargaRealizada || '0'
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
                alert('Ocurrió un error al guardar el detalle de las series.');
                setIsSaving(false);
                return;
            }
        }

        alert('¡Resultados guardados con éxito!');
        navigate('/dashboard/rutinas');
        setIsSaving(false);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Cargando detalles de la rutina...</p></div>;
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
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-6">
                    {rutina?.nombre || 'Rutina'}
                </h1>

                {rutina?.ejercicios?.length > 0 ? (
                    <>
                        {rutina.ejercicios.map((ej) => (
                            <div key={ej.id}>
                                <h3
                                    onClick={() => setVideoEjercicio(ej)}
                                    className="text-xl font-bold text-indigo-600 hover:underline cursor-pointer"
                                >
                                    {ej.nombre}
                                </h3>
                            </div>
                        ))}

                        <VideoPanel
                            open={!!videoEjercicio}
                            onClose={() => setVideoEjercicio(null)}
                            ejercicio={videoEjercicio}
                            onSetComplete={handleSetComplete}
                            onCargaChange={handleCargaChange}
                        />
                    </>
                ) : (
                    <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                        <p className="font-semibold text-gray-700">
                            Esta rutina aún no tiene ejercicios asignados.
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Contacta a tu entrenador para más detalles.
                        </p>
                    </div>
                )}
            </main>

        </div>
    );
};

export default RutinaDetalle;