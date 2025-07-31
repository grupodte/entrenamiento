import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import { supabase } from "../../lib/supabaseClient";
import RestTimer from "../../components/RestTimer";
import BloqueDisplay from "../../components/RutinaDetalle/BloqueDisplay";
import BrandedLoader from "../../components/BrandedLoader";
import { generarIdSerieSimple, generarIdEjercicioEnSerieDeSuperset } from '../../utils/rutinaIds';
import { guardarSesionEntrenamiento } from '../../utils/guardarSesionEntrenamiento';
import { FaArrowLeft, FaBell, FaStopwatch } from "react-icons/fa";
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize';
import toast from "react-hot-toast";

let orderedInteractiveElementIds = [];

const RutinaDetalle = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [rutina, setRutina] = useState(null);
    const [loading, setLoading] = useState(true);
    const [elementosCompletados, setElementosCompletados] = useState({});
    const [showRestTimer, setShowRestTimer] = useState(false);
    const [timerDuration, setTimerDuration] = useState(0);
    const [nextExerciseName, setNextExerciseName] = useState("Siguiente ejercicio");
    const [currentTimerOriginId, setCurrentTimerOriginId] = useState(null);
    const [elementoActivoId, setElementoActivoId] = useState(null);
    const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);
    const elementoRefs = useRef({});
    const timerActiveRef = useRef(false);
    const audioRef = useRef(null);
    const audioUnlocked = useRef(false);
    const { width, height } = useWindowSize();

    // Función para obtener el nombre de un elemento por su ID
    const getElementNameById = useCallback((elementId) => {
        if (!rutina || !elementId) return "Ejercicio";
        const parts = elementId.split('-');
        const subId = parts[1];
        const sbeId = parts[2];

        for (const bloque of rutina.bloques) {
            for (const subbloque of bloque.subbloques) {
                if (subbloque.id.toString() === subId) {
                    for (const sbe_iter of subbloque.subbloques_ejercicios) {
                        if (sbe_iter.id.toString() === sbeId) {
                            return sbe_iter.ejercicio.nombre;
                        }
                    }
                }
            }
        }
        return "Siguiente Ejercicio";
    }, [rutina]);

    // Función para obtener la información del siguiente elemento
    const obtenerSiguienteElementoInfo = useCallback((currentElementId) => {
        const currentIndex = orderedInteractiveElementIds.findIndex(id => id === currentElementId);
        if (currentIndex !== -1 && currentIndex < orderedInteractiveElementIds.length - 1) {
            const nextId = orderedInteractiveElementIds[currentIndex + 1];
            return { id: nextId, nombre: getElementNameById(nextId) };
        }
        return null;
    }, [getElementNameById]);

    // Función para verificar si un superset está completado
    const verificarSupersetCompletado = useCallback((subbloqueId, numSerieSuperset, estadoActual, elementoActual) => {
        const sb = rutina?.bloques.flatMap(b => b.subbloques).find(s => s.id.toString() === subbloqueId.toString());
        if (!sb) return false;
        const estadoTemporal = { ...estadoActual, [elementoActual]: true };
        return sb.subbloques_ejercicios.every(sbe_c => {
            const elementoId = generarIdEjercicioEnSerieDeSuperset(subbloqueId, sbe_c.id, numSerieSuperset);
            return estadoTemporal[elementoId];
        });
    }, [rutina]);

    // Función para activar el temporizador de pausa
    const activarTemporizadorPausa = useCallback((duracion, originId) => {
        if (duracion > 0 && !timerActiveRef.current) {
            const siguienteDelQuePausa = obtenerSiguienteElementoInfo(originId);
            const nombreSiguiente = siguienteDelQuePausa ? siguienteDelQuePausa.nombre : "¡Rutina Completada!";

            if (navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'START_TIMER',
                    duration: duracion,
                    exerciseName: nombreSiguiente
                });
            }

            timerActiveRef.current = true;
            setTimerDuration(duracion);
            setNextExerciseName(nombreSiguiente);
            setCurrentTimerOriginId(originId);
            setShowRestTimer(true);
        }
    }, [obtenerSiguienteElementoInfo]);

    // Función que se ejecuta cuando el temporizador de descanso termina
    const handleRestTimerFinish = useCallback(() => {
        setShowRestTimer(false);
        timerActiveRef.current = false;
        const siguienteElemento = obtenerSiguienteElementoInfo(currentTimerOriginId);
        if (siguienteElemento && siguienteElemento.id) {
            setElementoActivoId(siguienteElemento.id);
        } else {
            setElementoActivoId(null);
        }
        setCurrentTimerOriginId(null);
    }, [currentTimerOriginId, obtenerSiguienteElementoInfo]);

    // Función para marcar un elemento como completado
    const toggleElementoCompletado = useCallback((elementoId, detalles) => {
        unlockAudio();
        setElementosCompletados(prev => {
            const nState = { ...prev, [elementoId]: !prev[elementoId] };
            const acabaDeCompletarse = nState[elementoId];

            if (acabaDeCompletarse) {
                playSound();
                if (navigator.vibrate) navigator.vibrate(100);

                let pausaDuracion = 0;
                if (detalles.tipoElemento === 'simple' && detalles.pausa) {
                    pausaDuracion = detalles.pausa;
                } else if (detalles.tipoElemento === 'superset_ejercicio') {
                    const todosCompletados = verificarSupersetCompletado(detalles.subbloqueId, detalles.numSerieSupersetActual, prev, elementoId);
                    if (todosCompletados) {
                        const sb = rutina?.bloques.flatMap(b => b.subbloques).find(s => s.id.toString() === detalles.subbloqueId.toString());
                        pausaDuracion = sb?.subbloques_ejercicios[0]?.series?.[0]?.pausa ?? 30;
                    }
                }

                if (pausaDuracion > 0) {
                    activarTemporizadorPausa(pausaDuracion, elementoId);
                } else {
                    const siguienteElemento = obtenerSiguienteElementoInfo(elementoId);
                    setElementoActivoId(siguienteElemento ? siguienteElemento.id : null);
                }
            } else {
                setElementoActivoId(elementoId);
            }
            return nState;
        });
    }, [rutina, activarTemporizadorPausa, obtenerSiguienteElementoInfo, verificarSupersetCompletado]);

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio('/sounds/levelup.mp3');
            audioRef.current.load();
        }

        const interval = setInterval(() => {
            setTiempoTranscurrido(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const playSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.error("Error al reproducir sonido:", e));
        }
    };

    const unlockAudio = () => {
        if (!audioUnlocked.current && audioRef.current) {
            const promise = audioRef.current.play();
            if (promise !== undefined) {
                promise.then(() => {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                    audioUnlocked.current = true;
                }).catch(() => {});
            }
        }
    };

    const buildOrderedIdsInternal = (currentRutina) => {
        const ids = [];
        currentRutina?.bloques?.forEach(bloque => {
            bloque.subbloques?.forEach(subbloque => {
                if (subbloque.tipo === 'simple') {
                    subbloque.subbloques_ejercicios?.forEach(sbe => {
                        sbe.series?.forEach(serie => {
                            ids.push(generarIdSerieSimple(subbloque.id, sbe.id, serie.nro_set));
                        });
                    });
                } else if (subbloque.tipo === 'superset') {
                    Array.from({ length: subbloque.num_series_superset || 1 }).forEach((_, setIndex) => {
                        const setNumeroSuperset = setIndex + 1;
                        subbloque.subbloques_ejercicios?.forEach(sbe => {
                            ids.push(generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, setNumeroSuperset));
                        });
                    });
                }
            });
        });
        return ids;
    };

    useEffect(() => {
        const fetchRutina = async () => {
            setLoading(true);
            let res;
            const selectQuery = `
            id, nombre, descripcion,
            bloques (id, orden,
                subbloques (id, orden, nombre, tipo,
                    subbloques_ejercicios (id, 
                        ejercicio: ejercicios ( id, nombre ),
                        series: series_subejercicio (id, nro_set, reps, pausa)
                    )
                )
            )
          `;
            if (tipo === "personalizada") res = await supabase.from("rutinas_personalizadas").select(selectQuery).eq("id", id).single();
            else res = await supabase.from("rutinas_base").select(selectQuery).eq("id", id).single();

            if (res.error) {
                console.error("Error al cargar rutina:", res.error); setRutina(null);
            } else {
                let data = res.data;
                if (data?.bloques && bloqueSeleccionado) {
                    data.bloques = data.bloques.filter((b) => String(b.id) === String(bloqueSeleccionado));
                }
                const processedData = {
                    ...data,
                    bloques: data.bloques?.map(b => ({
                        ...b,
                        subbloques: b.subbloques?.map(sb => {
                            let num_s_ss = 1;
                            if (sb.tipo === "superset" && sb.subbloques_ejercicios?.length > 0) {
                                const maxSets = Math.max(...sb.subbloques_ejercicios.map(sbe => sbe.series?.length || 0));
                                num_s_ss = maxSets > 0 ? maxSets : 1;
                            }
                            return {
                                ...sb,
                                num_series_superset: num_s_ss,
                                subbloques_ejercicios: sb.subbloques_ejercicios || []
                            };
                        }) || []
                    })) || []
                };
                setRutina(processedData);
                orderedInteractiveElementIds = buildOrderedIdsInternal(processedData);
            }
            setLoading(false);
        };
        const searchParams = new URLSearchParams(location.search);
        const tipo = searchParams.get("tipo") || "base";
        const bloqueSeleccionado = searchParams.get("bloque");
        fetchRutina();
    }, [id, location.search]);

    useEffect(() => {
        if (elementoActivoId && elementoRefs.current[elementoActivoId]) {
            setTimeout(() => {
                elementoRefs.current[elementoActivoId].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [elementoActivoId]);

    if (loading) return <BrandedLoader />;
    if (!rutina) return <div className="p-6 text-white text-center">No se encontró la rutina.</div>;

    const todosCompletados = orderedInteractiveElementIds.length > 0 && orderedInteractiveElementIds.every(id => elementosCompletados[id]);
    const totalSeriesCompletadas = Object.values(elementosCompletados).filter(Boolean).length;

    const handleFinalizarYGuardar = async () => {
        try {
            const result = await guardarSesionEntrenamiento({
                rutinaId: rutina.id,
                tiempoTranscurrido,
                elementosCompletados,
                rutinaDetalle: rutina,
                alumnoId: user.id,
            });

            if (result.success) {
                toast.success("¡Sesión guardada exitosamente!");
                navigate('/dashboard');
            } else {
                toast.error("Error al guardar la sesión.");
            }
        } catch (error) {
            console.error("Error al finalizar y guardar:", error);
            toast.error("Error inesperado al guardar la sesión.");
        }
    };

    const displayProps = { elementosCompletados, elementoActivoId, toggleElementoCompletado, elementoRefs };

    return (
        <div className="bg-gray-900 text-white font-sans min-h-screen">
            {todosCompletados && <Confetti width={width} height={height} recycle={false} />}
            <header className=" top-0 bg-gray-900/80 backdrop-blur-lg z-20 p-3 flex items-center justify-between gap-4 border-b border-gray-800">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="p-2 rounded-full hover:bg-gray-700">
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-white">{rutina.nombre}</h1>
                        <p className="text-sm text-gray-400">Entrenamiento en curso</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-cyan-400">
                    <FaStopwatch />
                    <span className="font-mono text-lg">{formatTime(tiempoTranscurrido)}</span>
                </div>
            </header>

            <main className="p-4 space-y-4 pb-20">
                {rutina.bloques?.map(bloque => (
                    <BloqueDisplay key={bloque.id} bloque={bloque} {...displayProps} />
                ))}

                {todosCompletados && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-6 bg-gray-800 rounded-xl shadow-lg mt-6">
                        <h2 className="text-2xl font-bold text-green-400">¡Entrenamiento completado!</h2>
                        <p className="text-gray-300 mt-2 mb-4">¡Gran trabajo! Has finalizado todos los ejercicios.</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-white my-4">
                            <div className="bg-gray-700/50 p-3 rounded-lg">
                                <p className="text-sm text-gray-400">Tiempo Total</p>
                                <p className="text-xl font-bold">{formatTime(tiempoTranscurrido)}</p>
                            </div>
                            <div className="bg-gray-700/50 p-3 rounded-lg">
                                <p className="text-sm text-gray-400">Series Completadas</p>
                                <p className="text-xl font-bold">{totalSeriesCompletadas}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleFinalizarYGuardar}
                            className="mt-4 w-full bg-green-500 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-105 text-lg"
                        >
                            Finalizar y Guardar
                        </button>
                    </motion.div>
                )}
            </main>

            <AnimatePresence>
                {showRestTimer && (
                    <RestTimer
                        key={currentTimerOriginId}
                        duration={timerDuration}
                        exerciseName={nextExerciseName}
                        onFinish={handleRestTimerFinish}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default RutinaDetalle;
