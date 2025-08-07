import { useEffect, useState, useCallback, useRef } from "react";
import useWorkoutTimer from "./useWorkoutTimer";
import useRestTimer from "./useRestTimer";
import { supabase } from "../lib/supabaseClient";
import { generarIdSerieSimple, generarIdEjercicioEnSerieDeSuperset } from '../utils/rutinaIds';
import { guardarSesionEntrenamiento } from '../utils/guardarSesionEntrenamiento';
import useWindowSize from 'react-use/lib/useWindowSize';
import toast from "react-hot-toast";

import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
gsap.registerPlugin(ScrollToPlugin);

let orderedInteractiveElementIds = [];

const useRutinaLogic = (id, tipo, bloqueSeleccionado, user) => {
    const {
        elapsedTime: workoutTime,
        startWorkout,
        finishWorkout,
        pauseWorkout,
        resumeWorkout
    } = useWorkoutTimer();

    const {
        isResting,
        timeLeft: restTimeLeft,
        exerciseName: restExerciseName,
        startRest,
        finishRest,
        skipRest,
        formatTime: formatRestTime
    } = useRestTimer();

    const [rutina, setRutina] = useState(null);
    const [loading, setLoading] = useState(true);
    const [elementosCompletados, setElementosCompletados] = useState({});
    const [lastSessionData, setLastSessionData] = useState({});
    const [showRestTimer, setShowRestTimer] = useState(false); // Old timer system
    const [timerDuration, setTimerDuration] = useState(0); // Old timer system
    const [nextExerciseName, setNextExerciseName] = useState("Siguiente ejercicio"); // Old timer system
    const [currentTimerOriginId, setCurrentTimerOriginId] = useState(null);
    const [elementoActivoId, setElementoActivoId] = useState(null);
    const elementoRefs = useRef({});
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

    // Función para activar el temporizador de pausa usando el nuevo hook
    const activarTemporizadorPausa = useCallback((duracion, originId) => {
        if (duracion > 0 && !isResting) {
            const siguienteDelQuePausa = obtenerSiguienteElementoInfo(originId);
            const nombreSiguiente = siguienteDelQuePausa ? siguienteDelQuePausa.nombre : "¡Rutina Completada!";

            // Usar el nuevo hook para iniciar el descanso
            startRest(duracion, nombreSiguiente);

            // Mantener compatibilidad con el sistema actual para la UI
            setCurrentTimerOriginId(originId);
        }
    }, [obtenerSiguienteElementoInfo, isResting, startRest]);

    // Effect para manejar cuando el rest timer del hook termina
    useEffect(() => {
        if (!isResting && currentTimerOriginId) {
            // El descanso terminó, activar el siguiente elemento
            const siguienteElemento = obtenerSiguienteElementoInfo(currentTimerOriginId);
            if (siguienteElemento && siguienteElemento.id) {
                setElementoActivoId(siguienteElemento.id);
            } else {
                setElementoActivoId(null);
            }
            setCurrentTimerOriginId(null);
        }
    }, [isResting, currentTimerOriginId, obtenerSiguienteElementoInfo]);

    // Función para marcar un elemento como completado
    const toggleElementoCompletado = (elementoId) => {
        setElementosCompletados((prev) => {
            const yaCompletado = !!prev[elementoId];
            const nuevos = { ...prev, [elementoId]: !yaCompletado };

            // Si lo marcamos como completado (no si lo desmarcamos)
            if (!yaCompletado) {
                const indexActual = orderedInteractiveElementIds.indexOf(elementoId);
                const siguienteId = orderedInteractiveElementIds[indexActual + 1];

                if (siguienteId) {
                    setElementoActivoId(siguienteId);
                    // Scroll opcional:
                    const ref = elementoRefs.current[siguienteId];
                    if (ref?.scrollIntoView) {
                        ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }

            return nuevos;
        });
    };

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio('/sounds/levelup.mp3');
            audioRef.current.load();
        }

        startWorkout();
        return () => finishWorkout();
    }, []);

    const formatWorkoutTime = (seconds) => {
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
                }).catch(() => { });
            }
        }
    };

    const buildOrderedIdsInternal = (currentRutina) => {
        const ids = [];

        currentRutina?.bloques
            ?.slice()
            ?.sort((a, b) => a.orden - b.orden) // Ordenar bloques por "orden"
            ?.forEach(bloque => {
                bloque.subbloques
                    ?.slice()
                    ?.sort((a, b) => a.orden - b.orden) // Ordenar subbloques por "orden"
                    ?.forEach(subbloque => {
                        if (subbloque.tipo === 'simple') {
                            subbloque.subbloques_ejercicios
                                ?.slice()
                                ?.forEach(sbe => {
                                    sbe.series
                                        ?.slice()
                                        ?.sort((a, b) => a.nro_set - b.nro_set) // Ordenar series por nro_set
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
                // Step 1: Fetch the base routine object
                const fromTable = tipo === 'personalizada' ? 'rutinas_personalizadas' : 'rutinas_base';
                const { data: rutinaData, error: rutinaError } = await supabase
                    .from(fromTable)
                    .select('id, nombre, descripcion')
                    .eq('id', id)
                    .single();

                if (rutinaError) throw rutinaError;

                // Step 2: Fetch the nested structure (bloques, subbloques, etc.)
                const fkColumn = tipo === 'personalizada' ? 'rutina_personalizada_id' : 'rutina_base_id';
                const { data: bloquesData, error: bloquesError } = await supabase
                    .from('bloques')
                    .select(`
                        id, orden,
                        subbloques (
                            id, orden, nombre, tipo,
                            subbloques_ejercicios (
                                id, 
                                ejercicio:ejercicios (id, nombre),
                                series:series_subejercicio (id, nro_set, reps, pausa)
                            )
                        )
                    `)
                    .eq(fkColumn, rutinaData.id);

                if (bloquesError) throw bloquesError;

                // Step 3: Combine the data
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





                // Build a reverse lookup map for elementoId based on ejercicio_id and nro_set
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

                // Fetch last session data
                let lastSessionRes;
                if (tipo === "personalizada") {
                    lastSessionRes = await supabase.from('sesiones_entrenamiento')
                        .select('id, sesiones_series(ejercicio_id, nro_set, reps_realizadas, carga_realizada)')
                        .eq('rutina_personalizada_id', id)
                        .eq('alumno_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(1);
                } else {
                    lastSessionRes = await supabase.from('sesiones_entrenamiento')
                        .select('id, sesiones_series(ejercicio_id, nro_set, reps_realizadas, carga_realizada)')
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

        // Paso 1: Buscar subbloque de calentamiento
        const subbloqueCalentamiento = rutina.bloques
            .flatMap(b => b.subbloques)
            .find(sb =>
                sb.tipo?.toLowerCase() === 'calentamiento' ||
                sb.nombre?.toLowerCase().includes('calentamiento')
            );

        // Si existe calentamiento
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

            // Buscar el primer ID de calentamiento que no esté completado
            const primerIdNoCompletado = idsCalentamiento.find(id => !elementosCompletados[id]);

            if (primerIdNoCompletado) {
                setElementoActivoId(primerIdNoCompletado);
                return;
            }
        }

        // Paso 2: Buscar el primer ID global no completado (fuera del calentamiento)
        const primerIdGeneral = orderedInteractiveElementIds.find(id => !elementosCompletados[id]);

        if (primerIdGeneral) {
            setElementoActivoId(primerIdGeneral);
            return;
        }

        // Paso 3: Todo completado
        setElementoActivoId(null);
    }, [rutina, orderedInteractiveElementIds, elementosCompletados]);



    useEffect(() => {
        if (elementoActivoId && elementoRefs.current[elementoActivoId]) {
            const target = elementoRefs.current[elementoActivoId];
            gsap.to(window, {
                duration: 0.8,
                scrollTo: {
                    y: target,
                    offsetY: window.innerHeight / 2,
                },
                ease: "power2.out",
            });
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
                // navigate('/dashboard'); // Navigation will be handled by the parent component
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
        showRestTimer,
        timerDuration,
        nextExerciseName,
        currentTimerOriginId,
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
    };
};

export default useRutinaLogic;