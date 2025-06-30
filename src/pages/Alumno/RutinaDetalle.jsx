// src/pages/Alumno/RutinaDetalle.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import RestTimer from "../../components/RestTimer";
import BloqueDisplay from "../../components/RutinaDetalle/BloqueDisplay";
import { generarIdSerieSimple, generarIdEjercicioEnSerieDeSuperset } from '../../utils/rutinaIds';


let orderedInteractiveElementIds = [];

const RutinaDetalle = () => {
    const { id } = useParams();
    const location = useLocation();
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
            const selectQuery = `
                id, nombre, descripcion,
                bloques (id, orden,
                  subbloques (id, orden, nombre, tipo, pausa_entre_series_superset, num_series_superset,
                    subbloques_ejercicios (id, orden_en_subbloque,
                      ejercicio: ejercicios (id, nombre, video_url),
                      series: series_subejercicio (id, nro_set, reps, peso, pausa)
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
                            let num_s_ss = sb.num_series_superset;
                            if (sb.tipo === "superset" && !num_s_ss) {
                                num_s_ss = sb.subbloques_ejercicios?.[0]?.series?.reduce((max, s) => Math.max(max, s.nro_set), 0) || 1;
                            }
                            return {
                                ...sb, num_series_superset: num_s_ss || 1,
                                subbloques_ejercicios: sb.subbloques_ejercicios?.sort((a, b) => a.orden_en_subbloque - b.orden_en_subbloque) || []
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
        const parts = elementId.split('-'); // simple-subId-sbeId-setN  OR  superset-subId-sbeId-setN
        const type = parts[0];
        const subId = parts[1];
        const sbeId = parts[2];
        const setNumStr = parts[parts.length - 1];
        const setNum = parseInt(setNumStr.replace('set', ''), 10);

        for (const bloque of rutina.bloques) {
            for (const subbloque of bloque.subbloques) {
                if (subbloque.id.toString() === subId) {
                    for (const sbe_iter of subbloque.subbloques_ejercicios) {
                        if (sbe_iter.id.toString() === sbeId) {
                            if (type === 'simple') return `${sbe_iter.ejercicio.nombre} - S${setNum}`;
                            if (type === 'superset') return `${sbe_iter.ejercicio.nombre} (Superset S${setNum})`;
                        }
                    }
                    // Fallback para IDs de pausa de superset (que pueden no tener sbeId en el formato esperado por esta func)
                    if (type === 'superset' && elementId.includes('-serie') && elementId.endsWith('-pausa')) {
                        const serieNumPart = elementId.split('-').find(part => part.startsWith('serie'));
                        return `Pausa del Superset ${subbloque.nombre || ''} ${serieNumPart || ''}`;
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
    }, [getElementNameById]); // getElementNameById ya depende de rutina

    const handleRestTimerFinish = useCallback(() => {
        setShowRestTimer(false);
        const siguienteElemento = obtenerSiguienteElementoInfo(currentTimerOriginId);
        if (siguienteElemento && siguienteElemento.id) {
            setElementoActivoId(siguienteElemento.id);
            setNextExerciseName(siguienteElemento.nombre);
        } else {
            setElementoActivoId(null);
            setNextExerciseName("¡Rutina Completada!");
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
                setElementoActivoId(elementoId);
                let pausaDuracion = 0;

                if (detalles.tipoElemento === 'simple' && detalles.pausa) {
                    pausaDuracion = detalles.pausa;
                } else if (detalles.tipoElemento === 'superset_ejercicio') {
                    const sb = rutina?.bloques.flatMap(b => b.subbloques).find(s => s.id.toString() === detalles.subbloqueId.toString());
                    if (sb?.subbloques_ejercicios.every(sbe_c => nState[generarIdEjercicioEnSerieDeSuperset(detalles.subbloqueId, sbe_c.id, detalles.numSerieSupersetActual)])) {
                        if (detalles.pausaSuperset && detalles.numSerieSupersetActual < detalles.totalSeriesSuperset) {
                            pausaDuracion = detalles.pausaSuperset;
                        }
                    }
                }

                if (pausaDuracion > 0 && !showRestTimer) {
                    activarTemporizadorPausa(pausaDuracion, elementoId); // originId es el elemento que se completó
                } else if (pausaDuracion === 0 || pausaDuracion === undefined) {
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

    const handleComenzarEntrenamiento = () => {
        if (elementoActivoId && elementoRefs.current[elementoActivoId] && !elementosCompletados[elementoActivoId]) {
            elementoRefs.current[elementoActivoId].scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            const primerNoCompletado = orderedInteractiveElementIds.find(id => !elementosCompletados[id]);
            if (primerNoCompletado) {
                setElementoActivoId(primerNoCompletado);
            } else if (orderedInteractiveElementIds.length > 0) {
                setElementoActivoId(orderedInteractiveElementIds[0]);
            }
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-200 px-4 text-center">Cargando tu rutina...</div>;
    if (!rutina) return <div className="p-6 text-white text-center">No se encontró la rutina.</div>;

    const displayProps = {
        elementosCompletados,
        elementoActivoId,
        toggleElementoCompletado,
        activarTemporizadorPausa,
        showRestTimer,
        elementoRefs,
        // Pasar rutina para que los componentes hijos puedan acceder si es estrictamente necesario (ej. para nombres en pausa manual si no se centraliza)
        // rutina: rutina, // Descomentar si es necesario y los componentes lo usan.
        // O, mejor, funciones específicas que ya tienen acceso a 'rutina' a través de su closure/scope
        // como getElementNameById (si fuera necesario para un botón de pausa manual en un hijo)
    };

    return (
        <div className="px-2 sm:px-4 md:px-6 max-w-2xl mx-auto text-white pb-[calc(8rem+env(safe-area-inset-bottom))] space-y-5 sm:space-y-6">
            <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 text-sky-300">{rutina.nombre}</h1>
                <p className="text-xs sm:text-sm text-white/70">{rutina.descripcion}</p>
                <div className="mt-3 flex gap-2">
                    <button
                        onClick={handleComenzarEntrenamiento}
                        className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors text-sm sm:text-base"
                    >
                        {elementoActivoId && !elementosCompletados[elementoActivoId] ? "Ir al Actual" : "Guiar Entrenamiento"}
                    </button>
                </div>
                <Link to="/dashboard/rutinas" className="text-indigo-400 hover:text-indigo-300 text-sm block mt-4">&larr; Volver a mis rutinas</Link>
            </div>

            {showRestTimer && <RestTimer key={(currentTimerOriginId || "timer") + "-" + timerDuration} duration={timerDuration} exerciseName={nextExerciseName} onFinish={handleRestTimerFinish} />}

            <div className="space-y-5 sm:space-y-6">
                {rutina.bloques?.map(bloque => (
                    <BloqueDisplay
                        key={bloque.id}
                        bloque={bloque}
                        {...displayProps}
                    />
                ))}
            </div>
        </div>
    );
};

export default RutinaDetalle;
