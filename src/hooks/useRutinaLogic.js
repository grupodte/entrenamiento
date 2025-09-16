import { useEffect, useState, useCallback, useRef } from "react";
import useWorkoutTimer from "./useWorkoutTimer";
import useRestTimer from "./useRestTimer";
import { supabase } from "../lib/supabaseClient";
import { generarIdSerieSimple, generarIdEjercicioEnSerieDeSuperset } from '../utils/rutinaIds';
import { guardarSesionEntrenamiento } from '../utils/guardarSesionEntrenamiento';
import useWindowSize from 'react-use/lib/useWindowSize';
import toast from "react-hot-toast";

let orderedInteractiveElementIds = [];

const useRutinaLogic = (id, tipo, bloqueSeleccionado, user) => {
    const {
        elapsedTime: workoutTime,
        startWorkout,
        finishWorkout,
    } = useWorkoutTimer();

    const {
        isResting,
        timeLeft: restTimeLeft,
        exerciseName: restExerciseName,
        originalDuration: restOriginalDuration,
        startRest,
        skipRest,
        formatTime: formatRestTime
    } = useRestTimer();

    const [rutina, setRutina] = useState(null);
    const [loading, setLoading] = useState(true);
    const [elementosCompletados, setElementosCompletados] = useState(() => {
        const savedSessionId = localStorage.getItem(`workout-session-${id}`);
        const currentTime = Date.now();
        const sessionTimeout = 12 * 60 * 60 * 1000; // 12 hours

        if (savedSessionId) {
            const sessionTime = parseInt(savedSessionId);
            if (currentTime - sessionTime > sessionTimeout) {
                localStorage.removeItem(`workout-progress-${id}`);
                localStorage.removeItem(`workout-session-${id}`);
                return {};
            }
            try {
                const savedProgress = localStorage.getItem(`workout-progress-${id}`);
                return savedProgress ? JSON.parse(savedProgress) : {};
            } catch (error) {
                console.error("Error loading progress from localStorage", error);
                return {};
            }
        }
        return {};
    });

    const [lastSessionData, setLastSessionData] = useState({});
    const [currentTimerOriginId, setCurrentTimerOriginId] = useState(null);

    useEffect(() => {
        try {
            localStorage.setItem(`workout-progress-${id}`, JSON.stringify(elementosCompletados));
        } catch (error) {
            console.error("Error saving progress to localStorage", error);
        }
    }, [elementosCompletados, id]);

    const [elementoActivoId, setElementoActivoId] = useState(null);
    const elementoRefs = useRef({});
    const { width, height } = useWindowSize();

    const [showVideoPanel, setShowVideoPanel] = useState(false);
    const [videoUrlToShow, setVideoUrlToShow] = useState(null);

    const openVideoPanel = useCallback((url) => {
        setVideoUrlToShow(url);
        setShowVideoPanel(true);
    }, []);

    const closeVideoPanel = useCallback(() => {
        setShowVideoPanel(false);
        setVideoUrlToShow(null);
    }, []);

    const getElementNameById = useCallback((elementId) => {
        if (!rutina || !elementId) return "Ejercicio";

        let subId, sbeId;

        if (elementId.startsWith('superset-')) {
            const match = elementId.match(/^superset-([^-]+-[^-]+-[^-]+-[^-]+-[^-]+)-([^-]+-[^-]+-[^-]+-[^-]+-[^-]+)-set\d+$/);
            if (match) {
                subId = match[1];
                sbeId = match[2];
            }
        } else if (elementId.startsWith('simple-')) {
            const match = elementId.match(/^simple-([^-]+-[^-]+-[^-]+-[^-]+-[^-]+)-([^-]+-[^-]+-[^-]+-[^-]+-[^-]+)-set\d+$/);
            if (match) {
                subId = match[1];
                sbeId = match[2];
            }
        }

        if (!subId) {
            const parts = elementId.split('-');
            subId = parts[1];
            sbeId = parts[2];
        }

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
    }, [getElementNameById, rutina]);

    const getSerieDataFromElementoId = useCallback((elementoId) => {
        if (!rutina || !elementoId) return null;

        let tipo, subbloqueId, sbeId, nroSet;

        if (elementoId.startsWith('superset-')) {
            const match = elementoId.match(/^superset-([^-]+-[^-]+-[^-]+-[^-]+-[^-]+)-([^-]+-[^-]+-[^-]+-[^-]+-[^-]+)-set(\d+)$/);
            if (match) {
                tipo = 'superset';
                subbloqueId = match[1];
                sbeId = match[2];
                nroSet = match[3];
            }
        } else if (elementoId.startsWith('simple-')) {
            const match = elementoId.match(/^simple-([^-]+-[^-]+-[^-]+-[^-]+-[^-]+)-([^-]+-[^-]+-[^-]+-[^-]+-[^-]+)-set(\d+)$/);
            if (match) {
                tipo = 'simple';
                subbloqueId = match[1];
                sbeId = match[2];
                nroSet = match[3];
            }
        }

        if (!tipo) {
            const parts = elementoId.split('-');
            if (parts.length < 4) return null;
            tipo = parts[0];
            subbloqueId = parts[1];
            sbeId = parts[2];
            nroSet = parts[3]?.replace('set', '');
        }

        const subbloque = rutina.bloques
            .flatMap(b => b.subbloques)
            .find(sb => sb.id.toString() === subbloqueId);

        if (!subbloque) return null;

        const sbe = subbloque.subbloques_ejercicios.find(s => s.id.toString() === sbeId);
        if (!sbe) return null;

        const serie = sbe.series.find(s => s.nro_set.toString() === nroSet);
        return serie || null;

    }, [rutina]);

    const activarTemporizadorPausa = useCallback((duracion, originId) => {
        if (duracion > 0 && !isResting) {
            const siguienteElementoInfo = obtenerSiguienteElementoInfo(originId);
            const nombreSiguiente = siguienteElementoInfo ? siguienteElementoInfo.nombre : "¡Rutina Completada!";

            startRest(duracion, nombreSiguiente);
            setCurrentTimerOriginId(originId);
        }
    }, [obtenerSiguienteElementoInfo, isResting, startRest]);

    useEffect(() => {
        if (!isResting && currentTimerOriginId) {
            const siguienteElemento = obtenerSiguienteElementoInfo(currentTimerOriginId);

            if (siguienteElemento && siguienteElemento.id) {
                setElementoActivoId(siguienteElemento.id);
            } else {
                setElementoActivoId(null);
            }
            setCurrentTimerOriginId(null);
        }
    }, [isResting, currentTimerOriginId, obtenerSiguienteElementoInfo]);

    const toggleElementoCompletado = (payload) => {
        if (typeof payload === 'object' && payload.tipoElemento === 'superset_set') {
            const { childIds, pausa } = payload;

            setElementosCompletados(prev => {
                if (!childIds || childIds.length === 0) return prev;

                const isMarkingAsComplete = !prev[childIds[0]];
                const newCompletedState = { ...prev };
                childIds.forEach(id => {
                    newCompletedState[id] = isMarkingAsComplete;
                });

                if (isMarkingAsComplete) {
                    const lastElementIdInSet = childIds[childIds.length - 1];
                    const currentIndex = orderedInteractiveElementIds.indexOf(lastElementIdInSet);
                    const isLastElementOfRoutine = currentIndex === orderedInteractiveElementIds.length - 1;

                    if (pausa > 0 && !isLastElementOfRoutine) {
                        activarTemporizadorPausa(pausa, lastElementIdInSet);
                    } else if (!isLastElementOfRoutine) {
                        const nextElementId = orderedInteractiveElementIds[currentIndex + 1];
                        if (nextElementId) setElementoActivoId(nextElementId);
                    } else {
                        setElementoActivoId(null);
                    }
                }

                return newCompletedState;
            });
            return;
        }

        const elementoId = payload;
        setElementosCompletados((prev) => {
            const isAlreadyCompleted = !!prev[elementoId];
            const newCompletedState = { ...prev, [elementoId]: !isAlreadyCompleted };

            if (!isAlreadyCompleted) {
                let tipo = '';
                if (elementoId.startsWith('simple-')) {
                    tipo = 'simple';
                } else {
                    const parts = elementoId.split('-');
                    tipo = parts[0];
                }

                if (tipo === 'simple') {
                    const serieData = getSerieDataFromElementoId(elementoId);
                    const pauseDuration = serieData?.pausa ?? 0;

                    const currentIndex = orderedInteractiveElementIds.indexOf(elementoId);
                    const isLastElement = currentIndex === orderedInteractiveElementIds.length - 1;

                    if (pauseDuration > 0 && !isLastElement) {
                        activarTemporizadorPausa(pauseDuration, elementoId);
                    } else if (isLastElement) {
                        setElementoActivoId(null);
                    } else {
                        const nextElementId = orderedInteractiveElementIds[currentIndex + 1];
                        if (nextElementId) {
                            setElementoActivoId(nextElementId);
                        }
                    }
                }
            }
            return newCompletedState;
        });
    };

    useEffect(() => {
        startWorkout();
        return () => {
            finishWorkout();
        };
    }, [startWorkout, finishWorkout]);

    const formatWorkoutTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const buildOrderedIdsInternal = (currentRutina) => {
        const ids = [];

        currentRutina?.bloques
            ?.slice()
            ?.sort((a, b) => a.orden - b.orden)
            ?.forEach(bloque => {
                bloque.subbloques
                    ?.slice()
                    ?.sort((a, b) => a.orden - b.orden)
                    ?.forEach(subbloque => {
                        if (subbloque.tipo === 'simple') {
                            subbloque.subbloques_ejercicios
                                ?.slice()
                                ?.forEach(sbe => {
                                    sbe.series
                                        ?.slice()
                                        ?.sort((a, b) => a.nro_set - b.nro_set)
                                        ?.forEach(serie => {
                                            const id = generarIdSerieSimple(subbloque.id, sbe.id, serie.nro_set);
                                            ids.push(id);
                                        });
                                });
                        } else if (subbloque.tipo === 'superset') {
                            const sets = subbloque.num_series_superset || 1;
                            for (let i = 1; i <= sets; i++) {
                                subbloque.subbloques_ejercicios
                                    ?.slice()
                                    ?.forEach(sbe => {
                                        const id = generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, i);
                                        ids.push(id);
                                    });
                            }
                        }
                    });
            });

        return ids;
    };


    useEffect(() => {
        const fetchRutina = async () => {
            setLoading(true);

            try {
                const fromTable = tipo === 'personalizada' ? 'rutinas_personalizadas' : 'rutinas_base';
                const { data: rutinaData, error: rutinaError } = await supabase
                    .from(fromTable)
                    .select('id, nombre, descripcion')
                    .eq('id', id)
                    .single();

                if (rutinaError) throw rutinaError;

                const fkColumn = tipo === 'personalizada' ? 'rutina_personalizada_id' : 'rutina_base_id';
                const { data: bloquesData, error: bloquesError } = await supabase
                    .from('bloques')
                    .select(`
                        id, orden,
                        subbloques (
                            id, orden, nombre, tipo,
                            subbloques_ejercicios (
                                id, 
                                ejercicio:ejercicios (id, nombre, video_url),
                                series:series_subejercicio (id, nro_set, reps, pausa, nota, tipo_ejecucion, duracion_segundos, unidad_tiempo)
                            )
                        )
                    `)
                    .eq(fkColumn, rutinaData.id);

                if (bloquesError) throw bloquesError;

                let data = { ...rutinaData, bloques: bloquesData };

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

                const elementoIdLookup = {};
                processedData.bloques.forEach(bloque => {
                    bloque.subbloques.forEach(subbloque => {
                        if (subbloque.tipo === 'simple') {
                            subbloque.subbloques_ejercicios.forEach(sbe => {
                                sbe.series.forEach(serie => {
                                    const idKey = `${sbe.ejercicio.id}-${serie.nro_set}`;
                                    elementoIdLookup[idKey] = generarIdSerieSimple(subbloque.id, sbe.id, serie.nro_set);
                                });
                            });
                        } else if (subbloque.tipo === 'superset') {
                            Array.from({ length: subbloque.num_series_superset || 1 }).forEach((_, setIndex) => {
                                const setNumeroSuperset = setIndex + 1;
                                subbloque.subbloques_ejercicios.forEach(sbe => {
                                    const idKey = `${sbe.ejercicio.id}-${setNumeroSuperset}`;
                                    elementoIdLookup[idKey] = generarIdEjercicioEnSerieDeSuperset(subbloque.id, sbe.id, setNumeroSuperset);
                                });
                            });
                        }
                    });
                });

                let lastSessionRes;
                if (tipo === "personalizada") {
                    lastSessionRes = await supabase.from('sesiones_entrenamiento')
                        .select('id, sesiones_series(ejercicio_id, nro_set, reps_realizadas, carga_realizada, tipo_ejecucion, duracion_realizada_segundos)')
                        .eq('rutina_personalizada_id', id)
                        .eq('alumno_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(1);
                } else {
                    lastSessionRes = await supabase.from('sesiones_entrenamiento')
                        .select('id, sesiones_series(ejercicio_id, nro_set, reps_realizadas, carga_realizada, tipo_ejecucion, duracion_realizada_segundos)')
                        .eq('rutina_base_id', id)
                        .eq('alumno_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(1);
                }

                if (lastSessionRes.data && lastSessionRes.data.length > 0 && lastSessionRes.data[0].sesiones_series) {
                    const mappedLastSessionData = {};
                    lastSessionRes.data[0].sesiones_series.forEach(serie => {
                        const idKey = `${serie.ejercicio_id}-${serie.nro_set}`;
                        const elementoId = elementoIdLookup[idKey];
                        if (elementoId) {
                            mappedLastSessionData[elementoId] = {
                                reps_realizadas: serie.reps_realizadas,
                                carga_realizada: serie.carga_realizada,
                                tipo_ejecucion: serie.tipo_ejecucion,
                                duracion_realizada_segundos: serie.duracion_realizada_segundos,
                            };
                        }
                    });
                    setLastSessionData(mappedLastSessionData);
                }

            } catch (error) {
                console.error("Error al cargar rutina:", error);
                setRutina(null);
            } finally {
                setLoading(false);
            }
        };

        fetchRutina();
    }, [id, tipo, bloqueSeleccionado, user]);

    useEffect(() => {
        if (!rutina || orderedInteractiveElementIds.length === 0) return;

        const subbloqueCalentamiento = rutina.bloques
            .flatMap(b => b.subbloques)
            .find(sb =>
                sb.tipo?.toLowerCase() === 'calentamiento' ||
                sb.nombre?.toLowerCase().includes('calentamiento')
            );

        if (subbloqueCalentamiento) {
            const idsCalentamiento = [];

            if (subbloqueCalentamiento.tipo === 'simple') {
                subbloqueCalentamiento.subbloques_ejercicios?.forEach(sbe => {
                    sbe.series?.forEach(serie => {
                        idsCalentamiento.push(generarIdSerieSimple(subbloqueCalentamiento.id, sbe.id, serie.nro_set));
                    });
                });
            } else if (subbloqueCalentamiento.tipo === 'superset') {
                Array.from({ length: subbloqueCalentamiento.num_series_superset || 1 }).forEach((_, setIndex) => {
                    const setNumero = setIndex + 1;
                    subbloqueCalentamiento.subbloques_ejercicios?.forEach(sbe => {
                        idsCalentamiento.push(generarIdEjercicioEnSerieDeSuperset(subbloqueCalentamiento.id, sbe.id, setNumero));
                    });
                });
            }

            const primerIdNoCompletado = idsCalentamiento.find(id => !elementosCompletados[id]);

            if (primerIdNoCompletado) {
                setElementoActivoId(primerIdNoCompletado);
                return;
            }
        }

        const primerIdGeneral = orderedInteractiveElementIds.find(id => !elementosCompletados[id]);

        if (primerIdGeneral) {
            setElementoActivoId(primerIdGeneral);
            return;
        }

        setElementoActivoId(null);
    }, [rutina, orderedInteractiveElementIds, elementosCompletados]);



    useEffect(() => {
        if (elementoActivoId && elementoRefs.current[elementoActivoId]) {
            const targetElement = elementoRefs.current[elementoActivoId];
            if (targetElement && typeof targetElement.scrollIntoView === 'function') {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }, [elementoActivoId]);

    const todosCompletados = orderedInteractiveElementIds.length > 0 && orderedInteractiveElementIds.every(id => elementosCompletados[id]);
    const totalSeriesCompletadas = Object.values(elementosCompletados).filter(Boolean).length;

    const handleFinalizarYGuardar = async () => {
        console.log("Elementos Completados al guardar:", elementosCompletados);
        try {
            const result = await guardarSesionEntrenamiento({
                rutinaId: rutina.id,
                tiempoTranscurrido: workoutTime,
                elementosCompletados,
                rutinaDetalle: rutina,
                alumnoId: user.id,
            });

            if (result.success) {
                toast.success("¡Sesión guardada exitosamente!");
                localStorage.removeItem(`workout-progress-${id}`);
                localStorage.removeItem(`workout-timer-${id}`);
                localStorage.removeItem(`workout-session-${id}`);
                setElementosCompletados({});
                setElementoActivoId(null);
            } else {
                toast.error("Error al guardar la sesión.");
            }
        } catch (error) {
            console.error("Error al finalizar y guardar:", error);
            toast.error("Error inesperado al guardar la sesión.");
        }
    };

    return {
        rutina,
        loading,
        elementosCompletados,
        lastSessionData,
        elementoActivoId,
        workoutTime,
        isResting,
        restTimeLeft,
        restExerciseName,
        restOriginalDuration,
        totalSeriesCompletadas,
        todosCompletados,
        width,
        height,
        toggleElementoCompletado,
        handleFinalizarYGuardar,
        skipRest,
        formatRestTime,
        formatWorkoutTime,
        elementoRefs,
        showVideoPanel,
        videoUrlToShow,
        openVideoPanel,
        closeVideoPanel,
    };
};

export default useRutinaLogic;