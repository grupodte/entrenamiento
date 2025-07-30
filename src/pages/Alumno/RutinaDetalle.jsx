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
    const timerActiveRef = useRef(false);

    const verificarSupersetCompletado = useCallback((subbloqueId, numSerieSuperset, estadoActual, elementoActual) => {
        const sb = rutina?.bloques.flatMap(b => b.subbloques).find(s => s.id.toString() === subbloqueId.toString());
        if (!sb) return false;
        const estadoTemporal = { ...estadoActual, [elementoActual]: true };
        return sb.subbloques_ejercicios.every(sbe_c => {
            const elementoId = generarIdEjercicioEnSerieDeSuperset(subbloqueId, sbe_c.id, numSerieSuperset);
            return estadoTemporal[elementoId];
        });
    }, [rutina]);

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
            const selectQuery = `
            id, nombre, descripcion,
            bloques (id, orden,
                subbloques (id, orden, nombre, tipo,
                    subbloques_ejercicios (id, 
                        ejercicio: ejercicios ( nombre ),
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
        timerActiveRef.current = false;
        const siguienteElemento = obtenerSiguienteElementoInfo(currentTimerOriginId);
        if (siguienteElemento && siguienteElemento.id) {
            setElementoActivoId(siguienteElemento.id);
        } else {
            setElementoActivoId(null);
        }
        setCurrentTimerOriginId(null);
    }, [currentTimerOriginId, obtenerSiguienteElementoInfo]);

    const activarTemporizadorPausa = useCallback((duracion, originId) => {
        if (duracion > 0 && !timerActiveRef.current) {
            const siguienteDelQuePausa = obtenerSiguienteElementoInfo(originId);
            const nombreSiguiente = siguienteDelQuePausa ? siguienteDelQuePausa.nombre : "¡Rutina Completada!";

            console.log('Activando timer:', duracion, 'segundos, siguiente:', nombreSiguiente);
            timerActiveRef.current = true;
            setTimerDuration(duracion);
            setNextExerciseName(nombreSiguiente);
            setCurrentTimerOriginId(originId);
            setShowRestTimer(true);
        } else if (duracion > 0 && timerActiveRef.current) {
            console.log('Timer ya activo, ignorando nueva activación');
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
                    console.log('=== PROCESANDO SUPERSET ===');
                    console.log('Elemento actual:', elementoId);
                    console.log('Detalles:', detalles);
                    console.log('Estado anterior:', prev);

                    const todosCompletados = verificarSupersetCompletado(
                        detalles.subbloqueId,
                        detalles.numSerieSupersetActual,
                        prev,
                        elementoId
                    );

                    if (todosCompletados) {
                        const sb = rutina?.bloques.flatMap(b => b.subbloques).find(s => s.id.toString() === detalles.subbloqueId.toString());
                        const primeraSerieDelPrimerEjercicio = sb.subbloques_ejercicios[0]?.series?.[0];
                        let pausaFinal = primeraSerieDelPrimerEjercicio?.pausa ?? 30; // valor por defecto 30s si no hay configurado

                        console.log('Primera serie del primer ejercicio:', primeraSerieDelPrimerEjercicio);
                        console.log('Serie actual:', detalles.numSerieSupersetActual, 'de', sb.num_series_superset);
                        console.log('Pausa final decidida:', pausaFinal);

                        if (pausaFinal > 0) {
                            pausaDuracion = pausaFinal;
                            console.log('✅ Superset completado, pausa activada:', pausaDuracion, 'segundos');
                        } else {
                            console.log('❌ No hay pausa configurada para activar');
                        }
                    } else {
                        console.log('❌ No todos los ejercicios del superset están completados');
                    }
                }

                if (pausaDuracion > 0) {
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
    }, [rutina, activarTemporizadorPausa, obtenerSiguienteElementoInfo, verificarSupersetCompletado]);

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

            <main className="space-y-6">
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

            
        </div>
    );
};

export default RutinaDetalle;