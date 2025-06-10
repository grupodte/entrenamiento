// src/pages/Alumno/RutinaDetalle.jsx

import { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { FaPause, FaPlay, FaArrowLeft, FaCheck, FaStopwatch } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// --- CRONÓMETRO GENERAL ---
const Chronometer = () => {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(true);

    useEffect(() => {
        let interval = null;
        if (isRunning) {
            interval = setInterval(() => setTime(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

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
                <button onClick={() => setIsRunning(!isRunning)} className="p-3 rounded-full text-white bg-white/20 hover:bg-white/30" aria-label={isRunning ? 'Pausar' : 'Reanudar'}>
                    {isRunning ? <FaPause /> : <FaPlay />}
                </button>
            </div>
        </motion.div>
    );
};

// --- TEMPORIZADOR DE DESCANSO ---
const RestTimer = ({ duration, exerciseName, onFinish }) => {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        if (timeLeft <= 0) {
            onFinish();
            return;
        }
        const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [timeLeft, onFinish]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 200 }}
                animate={{ y: 0 }}
                exit={{ y: 200 }}
                transition={{ type: 'spring', stiffness: 50 }}
                className="fixed bottom-0 left-0 right-0 z-[999] bg-black text-white p-4 shadow-2xl"
            >
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FaStopwatch className="text-3xl" />
                        <div>
                            <p className="font-bold text-lg">¡A descansar!</p>
                            <p className="text-sm text-white/80">Siguiente: {exerciseName}</p>
                        </div>
                    </div>
                    <span className="text-5xl font-mono font-bold">{timeLeft}s</span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

// --- ITEM DE EJERCICIO (CON DISEÑO RESPONSIVE INTEGRADO) ---
const EjercicioItem = ({ ejercicio, onSetComplete, onCargaChange }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-4 sm:p-6 rounded-2xl shadow-md border"
    >
        <h3 className="text-xl font-bold text-gray-800 mb-4">{ejercicio.nombre}</h3>
        <div className="space-y-3">
            {ejercicio.sets.map((set, index) => (
                <div
                    key={set.id}
                    className={`flex flex-wrap items-center justify-between gap-x-2 gap-y-2 p-1 rounded-lg transition-colors duration-300 ${set.completed ? 'bg-green-50 text-gray-400' : 'bg-gray-50'}`}
                >
                    {/* GRUPO 1: Información (no se encoge) */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <span className={`font-bold text-lg ${set.completed ? 'line-through' : 'text-indigo-600'}`}>
                            Set {index + 1}
                        </span>
                        <p className="font-semibold text-gray-800">{set.reps} reps</p>
                    </div>

                    {/* GRUPO 2: Acciones (crece para ocupar espacio y se alinea a la derecha) */}
                    <div className="flex items-center gap-2 flex-grow justify-end">
                        <input
                            type="text"
                            placeholder={set.cargaSugerida ? `Sug: ${set.cargaSugerida}` : 'Carga'}
                            value={set.cargaRealizada || ''}
                            onChange={(e) => onCargaChange(ejercicio.id, set.id, e.target.value)}
                            disabled={set.completed}
                            className="input text-sm w-full max-w-[75px]"
                        />
                        <button
                            onClick={() => onSetComplete(ejercicio.id, set.id)}
                            disabled={set.completed}
                            className={`p-3 rounded-full transition-all duration-300 ${set.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500 hover:bg-green-200'}`}
                        >
                            <FaCheck />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </motion.div>
);

// --- COMPONENTE PRINCIPAL (LÓGICA FINAL INTEGRADA) ---
const RutinaDetalle = () => {
    const { id } = useParams();
    const location = useLocation();
    const [rutina, setRutina] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showTimer, setShowTimer] = useState(false);
    const [restInfo, setRestInfo] = useState({ active: false, duration: 0, exerciseName: '' });
    const [tipoRutina, setTipoRutina] = useState(null);

    useEffect(() => {
        if (location.state?.startTimer) setShowTimer(true);

        const fetchRutinaDetails = async () => {
            setLoading(true);
            setError(null);

            const searchParams = new URLSearchParams(location.search);
            const tipo = searchParams.get('tipo');
            setTipoRutina(tipo);

            if (!tipo || !id) {
                setError("No se pudo identificar la rutina. Falta el tipo o el ID.");
                setLoading(false);
                return;
            }

            const isBase = tipo === 'base';
            const table = isBase ? 'rutinas_base' : 'rutinas_personalizadas';
            const joinTable = isBase ? 'rutinas_base_ejercicios' : 'rutinas_personalizadas_ejercicios';
            const seriesTable = isBase ? 'rutinas_base_series' : 'rutinas_personalizadas_series';
            const cargaField = isBase ? 'carga_sugerida' : 'carga';

            const { data, error: fetchError } = await supabase
                .from(table)
                .select(`
                    nombre,
                    ${joinTable} (
                        orden,
                        ejercicios ( id, nombre ),
                        ${seriesTable} ( id, nro_set, reps, pausa, ${cargaField} )
                    )
                `)
                .eq('id', id)
                .single();

            if (fetchError || !data) {
                console.error("Error fetching routine:", fetchError);
                setError("No se pudieron cargar los detalles de la rutina.");
                setLoading(false);
                return;
            }

            const ejerciciosData = (data[joinTable] || []).filter(d => d.ejercicios);
            ejerciciosData.sort((a, b) => a.orden - b.orden);

            const ejerciciosConSets = ejerciciosData.map(d => {
                const setsData = d[seriesTable] || [];
                setsData.sort((a, b) => a.nro_set - b.nro_set);

                return {
                    id: d.ejercicios.id,
                    nombre: d.ejercicios.nombre,
                    sets: setsData.map(set => ({
                        id: set.id,
                        reps: set.reps,
                        descanso: set.pausa > 0 ? set.pausa : 60,
                        completed: false,
                        cargaSugerida: set[cargaField] || '',
                        cargaRealizada: isBase ? '' : (set[cargaField] || ''),
                    }))
                };
            });

            setRutina({ nombre: data.nombre, ejercicios: ejerciciosConSets });
            setLoading(false);
        };

        fetchRutinaDetails();
    }, [id, location]);

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
        rutina.ejercicios.forEach(ej => {
            if (ej.id === ejercicioId) {
                ej.sets.forEach(set => {
                    if (set.id === setId) {
                        completedSet = set;
                    }
                });
            }
        });

        if (!completedSet || completedSet.completed) return;

        if (tipoRutina === 'personalizada') {
            const { error: updateError } = await supabase
                .from('rutinas_personalizadas_series')
                .update({ carga: completedSet.cargaRealizada })
                .eq('id', setId);

            if (updateError) {
                alert('Error al guardar la carga. Inténtalo de nuevo.');
                console.error('Error updating carga:', updateError);
                return;
            }
        }

        const updatedEjercicios = rutina.ejercicios.map(ej => {
            if (ej.id === ejercicioId) {
                const updatedSets = ej.sets.map(set =>
                    set.id === setId ? { ...set, completed: true } : set
                );
                return { ...ej, sets: updatedSets };
            }
            return ej;
        });

        setRutina(prev => ({ ...prev, ejercicios: updatedEjercicios }));

        const currentExerciseIndex = rutina.ejercicios.findIndex(e => e.id === ejercicioId);
        const currentExercise = rutina.ejercicios[currentExerciseIndex];
        const currentSetIndex = currentExercise.sets.findIndex(s => s.id === setId);

        let nextExerciseName = "¡Entrenamiento finalizado!";
        if (currentSetIndex < currentExercise.sets.length - 1) {
            nextExerciseName = currentExercise.nombre;
        } else if (currentExerciseIndex < rutina.ejercicios.length - 1) {
            nextExerciseName = rutina.ejercicios[currentExerciseIndex + 1].nombre;
        }

        setRestInfo({
            active: true,
            duration: completedSet.descanso,
            exerciseName: nextExerciseName
        });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Cargando detalles de la rutina...</p></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500"><p>{error}</p></div>;

    return (
        <div className="bg-gray-100 min-h-screen pb-20">
            {showTimer && <Chronometer />}
            {restInfo.active && (
                <RestTimer
                    duration={restInfo.duration}
                    exerciseName={restInfo.exerciseName}
                    onFinish={() => setRestInfo({ active: false, duration: 0, exerciseName: '' })}
                />
            )}

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