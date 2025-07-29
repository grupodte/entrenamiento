import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import RestTimer from "../../components/RestTimer";
import BloqueDisplay from "../../components/RutinaDetalle/BloqueDisplay";
import { generarIdSerieSimple, generarIdEjercicioEnSerieDeSuperset } from '../../utils/rutinaIds';
import { FaArrowLeft, FaCheck, FaPlay } from "react-icons/fa";
import { motion, AnimatePresence } from 'framer-motion';

let orderedInteractiveElementIds = [];

const RutinaDetalle = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [rutina, setRutina] = useState(null);
    const [loading, setLoading] = useState(true);
    const [elementosCompletados, setElementosCompletados] = useState({});
    const [showRestTimer, setShowRestTimer] = useState(false);
    const [timerDuration, setTimerDuration] = useState(0);
    const [nextExerciseName, setNextExerciseName] = useState("Siguiente ejercicio");
    const [currentTimerOriginId, setCurrentTimerOriginId] = useState(null);
    const [elementoActivoId, setElementoActivoId] = useState(null);
    const elementoRefs = useRef({});

    const searchParams = new URLSearchParams(location.search);
    const tipo = searchParams.get("tipo") || "base";
    const bloqueSeleccionado = searchParams.get("bloque");

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
            const selectQuery = `id, nombre, descripcion, bloques (id, orden, subbloques (id, orden, nombre, tipo, num_series_superset, pausa_entre_series_superset, subbloques_ejercicios (id, orden_en_subbloque, ejercicio: ejercicios ( nombre ), series: series_subejercicio (id, nro_set, reps, pausa))))`;
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
                        subbloques: b.subbloques?.map(sb => ({
                            ...sb,
                            subbloques_ejercicios: sb.subbloques_ejercicios?.sort((a, b) => a.orden_en_subbloque - b.orden_en_subbloque) || []
                        })) || []
                    })) || []
                };
                setRutina(processedData);
                orderedInteractiveElementIds = buildOrderedIdsInternal(processedData);
            }
            setLoading(false);
        };
        fetchRutina();
    }, [id, tipo, bloqueSeleccionado]);

    useEffect(() => {
        if (elementoActivoId && elementoRefs.current[elementoActivoId]) {
            setTimeout(() => {
                elementoRefs.current[elementoActivoId].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [elementoActivoId]);

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

    const obtenerSiguienteElementoInfo = useCallback((currentElementId) => {
        const currentIndex = orderedInteractiveElementIds.findIndex(id => id === currentElementId);
        if (currentIndex !== -1 && currentIndex < orderedInteractiveElementIds.length - 1) {
            const nextId = orderedInteractiveElementIds[currentIndex + 1];
            return { id: nextId, nombre: getElementNameById(nextId) };
        }
        return null;
    }, [getElementNameById]);

    const handleRestTimerFinish = useCallback(() => {
        setShowRestTimer(false);
        const siguienteElemento = obtenerSiguienteElementoInfo(currentTimerOriginId);
        if (siguienteElemento && siguienteElemento.id) {
            setElementoActivoId(siguienteElemento.id);
        } else {
            setElementoActivoId(null);
        }
        setCurrentTimerOriginId(null);
    }, [currentTimerOriginId, obtenerSiguienteElementoInfo]);

    const activarTemporizadorPausa = useCallback((duracion, originId) => {
        if (duracion > 0) {
            const siguienteDelQuePausa = obtenerSiguienteElementoInfo(originId);
            const nombreSiguiente = siguienteDelQuePausa ? siguienteDelQuePausa.nombre : "¡Rutina Completada!";

            setTimerDuration(duracion);
            setNextExerciseName(nombreSiguiente);
            setCurrentTimerOriginId(originId);
            setShowRestTimer(true);
        }
    }, [obtenerSiguienteElementoInfo]);

    const toggleElementoCompletado = useCallback((elementoId, detalles) => {
        setElementosCompletados(prev => {
            const nState = { ...prev, [elementoId]: !prev[elementoId] };
            const acabaDeCompletarse = nState[elementoId];

            if (acabaDeCompletarse) {
                let pausaDuracion = 0;
                if (detalles.tipoElemento === 'simple' && detalles.pausa) {
                    pausaDuracion = detalles.pausa;
                } else if (detalles.tipoElemento === 'superset_ejercicio') {
                    const sb = rutina?.bloques.flatMap(b => b.subbloques).find(s => s.id.toString() === detalles.subbloqueId.toString());
                    if (sb?.subbloques_ejercicios.every(sbe_c => nState[generarIdEjercicioEnSerieDeSuperset(detalles.subbloqueId, sbe_c.id, detalles.numSerieSupersetActual)])) {
                        if (sb.pausa_entre_series_superset && detalles.numSerieSupersetActual < sb.num_series_superset) {
                            pausaDuracion = sb.pausa_entre_series_superset;
                        }
                    }
                }

                if (pausaDuracion > 0 && !showRestTimer) {
                    activarTemporizadorPausa(pausaDuracion, elementoId);
                } else {
                    const siguienteElemento = obtenerSiguienteElementoInfo(elementoId);
                    if (siguienteElemento && siguienteElemento.id) {
                        setElementoActivoId(siguienteElemento.id);
                    } else {
                        setElementoActivoId(null);
                    }
                }
            } else {
                setElementoActivoId(elementoId);
            }
            return nState;
        });
    }, [rutina, activarTemporizadorPausa, showRestTimer, obtenerSiguienteElementoInfo]);

    const handleComenzarSiguiente = () => {
        const primerNoCompletado = orderedInteractiveElementIds.find(id => !elementosCompletados[id]);
        if (primerNoCompletado) {
            setElementoActivoId(primerNoCompletado);
        } else if (orderedInteractiveElementIds.length > 0) {
            setElementoActivoId(orderedInteractiveElementIds[0]);
        }
    };

    const finalizarEntrenamiento = async () => {
        // Lógica para guardar en Supabase
        navigate('/dashboard'); // Redirigir
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-200 px-4 text-center">Cargando tu rutina...</div>;
    if (!rutina) return <div className="p-6 text-white text-center">No se encontró la rutina.</div>;

    const todosCompletados = orderedInteractiveElementIds.length > 0 && orderedInteractiveElementIds.every(id => elementosCompletados[id]);

    const displayProps = { elementosCompletados, elementoActivoId, toggleElementoCompletado, elementoRefs };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
            <header className="sticky top-0 bg-gray-900/80 backdrop-blur-lg z-20 p-4 flex items-center gap-4 border-b border-gray-800">
                <Link to="/dashboard" className="p-2 rounded-full hover:bg-gray-700">
                    <FaArrowLeft />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-white">{rutina.nombre}</h1>
                    <p className="text-sm text-gray-400">Entrenamiento en curso</p>
                </div>
            </header>

            <main className="p-4 pb-32 space-y-6">
                {rutina.bloques?.map(bloque => (
                    <BloqueDisplay key={bloque.id} bloque={bloque} {...displayProps} />
                ))}

                {todosCompletados && (
                     <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-6 bg-gray-800 rounded-2xl">
                        <h2 className="text-2xl font-bold text-green-400">¡Entrenamiento completado!</h2>
                        <p className="text-gray-300 mt-2">¡Gran trabajo! Has finalizado todos los ejercicios.</p>
                        <button 
                            onClick={finalizarEntrenamiento}
                            className="mt-6 w-full bg-green-500 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-105"
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

            {!todosCompletados && (
                <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe-bottom bg-gray-900/80 backdrop-blur-lg border-t border-gray-800 z-20">
                    <button 
                        onClick={handleComenzarSiguiente}
                        className="w-full flex items-center justify-center gap-3 bg-cyan-400 text-gray-900 font-bold py-4 px-5 rounded-full shadow-lg hover:bg-cyan-300 transition-all duration-300 transform hover:scale-105"
                    >
                        {elementoActivoId ? <><FaPlay/> Siguiente Ejercicio</> : <><FaPlay/> Comenzar Entrenamiento</>}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RutinaDetalle;
