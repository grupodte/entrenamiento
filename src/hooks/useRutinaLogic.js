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
        originalDuration: restOriginalDuration,
        startRest,
        finishRest,
        skipRest,
        formatTime: formatRestTime
    } = useRestTimer();

    const [rutina, setRutina] = useState(null);
    const [loading, setLoading] = useState(true);
    const [elementosCompletados, setElementosCompletados] = useState(() => {
        try {
            const savedProgress = localStorage.getItem(`workout-progress-${id}`);
            return savedProgress ? JSON.parse(savedProgress) : {};
        } catch (error) {
            console.error("Error loading progress from localStorage", error);
            return {};
        }
    });
    const [lastSessionData, setLastSessionData] = useState({});
    const [showRestTimer, setShowRestTimer] = useState(false); // Old timer system
    const [timerDuration, setTimerDuration] = useState(0); // Old timer system

    useEffect(() => {
        try {
            localStorage.setItem(`workout-progress-${id}`, JSON.stringify(elementosCompletados));
        } catch (error) {
            console.error("Error saving progress to localStorage", error);
        }
    }, [elementosCompletados, id]);
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
        
        let subId, sbeId;
        
        // Manejar IDs con UUIDs
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
        
        // Si no coincide con los patrones de UUID, intentar parseo simple
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

    // Función para obtener la información del siguiente elemento
    const obtenerSiguienteElementoInfo = useCallback((currentElementId) => {
        let tipo, subbloqueId, nroSet;
        
        // Manejar IDs con UUIDs
        if (currentElementId.startsWith('superset-')) {
            const match = currentElementId.match(/^superset-([^-]+-[^-]+-[^-]+-[^-]+-[^-]+)-([^-]+-[^-]+-[^-]+-[^-]+-[^-]+)-set(\d+)$/);
            if (match) {
                tipo = 'superset';
                subbloqueId = match[1];
                nroSet = match[3];
            }
        } else if (currentElementId.startsWith('simple-')) {
            const match = currentElementId.match(/^simple-([^-]+-[^-]+-[^-]+-[^-]+-[^-]+-[^-]+)-([^-]+-[^-]+-[^-]+-[^-]+-[^-]+)-set(\d+)$/);
            if (match) {
                tipo = 'simple';
                subbloqueId = match[1];
                nroSet = match[3];
            }
        }
        
        // Si no coincide con los patrones de UUID, intentar parseo simple
        if (!tipo) {
            const parts = currentElementId.split('-');
            tipo = parts[0];
            subbloqueId = parts[1];
            nroSet = parts[3]?.replace('set', '');
        }
        
        if (tipo === 'superset') {
            // Para superset, buscar el primer ejercicio del siguiente set o el siguiente subbloque
            const subbloque = rutina?.bloques.flatMap(b => b.subbloques).find(s => s.id.toString() === subbloqueId);
            if (subbloque) {
                // Verificar si hay más sets en este superset
                const numSets = subbloque.num_series_superset || 1;
                const currentSetNum = parseInt(nroSet);
                
                if (currentSetNum < numSets) {
                    // Siguiente set del mismo superset
                    const nextSetNum = currentSetNum + 1;
                    const primerEjercicio = subbloque.subbloques_ejercicios[0];
                    if (primerEjercicio) {
                        const nextId = generarIdEjercicioEnSerieDeSuperset(subbloqueId, primerEjercicio.id, nextSetNum);
                        return { id: nextId, nombre: primerEjercicio.ejercicio.nombre };
                    }
                }
            }
        }
        
        // Comportamiento por defecto: siguiente elemento en la lista ordenada
        const currentIndex = orderedInteractiveElementIds.findIndex(id => id === currentElementId);
        if (currentIndex !== -1 && currentIndex < orderedInteractiveElementIds.length - 1) {
            const nextId = orderedInteractiveElementIds[currentIndex + 1];
            return { id: nextId, nombre: getElementNameById(nextId) };
        }
        return null;
    }, [getElementNameById, rutina]);

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

    const getSerieDataFromElementoId = useCallback((elementoId) => {
        if (!rutina || !elementoId) return null;
        
        let tipo, subbloqueId, sbeId, nroSet;
        
        // Manejar IDs con UUIDs
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
        
        // Si no coincide con los patrones de UUID, intentar parseo simple
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

        // For both simple and superset, we find the corresponding set number
        const serie = sbe.series.find(s => s.nro_set.toString() === nroSet);
        return serie || null;

    }, [rutina]);

    // Función para activar el temporizador de pausa usando el nuevo hook
    const activarTemporizadorPausa = useCallback((duracion, originId) => {
        console.log('🔔 activarTemporizadorPausa llamada:', { duracion, originId, isResting });
        
        if (duracion > 0 && !isResting) {
            const siguienteDelQuePausa = obtenerSiguienteElementoInfo(originId);
            const nombreSiguiente = siguienteDelQuePausa ? siguienteDelQuePausa.nombre : "¡Rutina Completada!";
            
            console.log('🚀 Iniciando timer:', { duracion, nombreSiguiente });
            
            // Usar el nuevo hook para iniciar el descanso
            startRest(duracion, nombreSiguiente);
            
            // Establecer valores para el timer antiguo
            setTimerDuration(duracion);
            setNextExerciseName(nombreSiguiente);
            setShowRestTimer(true); // <-- MOSTRAR UI TIMER

            // Mantener compatibilidad con el sistema actual para la UI
            setCurrentTimerOriginId(originId);
        } else {
            console.log('⛔ Timer NO iniciado:', { 
                razon: duracion <= 0 ? 'duracion es 0 o negativa' : 'ya hay un descanso en progreso' 
            });
        }
    }, [obtenerSiguienteElementoInfo, isResting, startRest]);

    // Effect para manejar cuando el rest timer del hook termina
    useEffect(() => {
        console.log('🕛 Effect timer:', { isResting, currentTimerOriginId, showRestTimer });
        
        if (!isResting && currentTimerOriginId) {
            console.log('⏰ Timer terminó, ocultando UI');
            setShowRestTimer(false); // <-- OCULTAR UI TIMER
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

            if (!yaCompletado) {
                // Obtener información del elemento
                let tipo, subbloqueId, sbeId, nroSet;
                
                // Manejar IDs con UUIDs
                if (elementoId.startsWith('superset-')) {
                    // Formato: superset-{uuid}-{uuid}-set{n}
                    const match = elementoId.match(/^superset-([^-]+-[^-]+-[^-]+-[^-]+-[^-]+)-([^-]+-[^-]+-[^-]+-[^-]+-[^-]+)-set(\d+)$/);
                    if (match) {
                        tipo = 'superset';
                        subbloqueId = match[1];
                        sbeId = match[2];
                        nroSet = match[3];
                    }
                } else if (elementoId.startsWith('simple-')) {
                    // Formato: simple-{uuid}-{uuid}-set{n}
                    const match = elementoId.match(/^simple-([^-]+-[^-]+-[^-]+-[^-]+-[^-]+)-([^-]+-[^-]+-[^-]+-[^-]+-[^-]+)-set(\d+)$/);
                    if (match) {
                        tipo = 'simple';
                        subbloqueId = match[1];
                        sbeId = match[2];
                        nroSet = match[3];
                    }
                }
                
                // Si no coincide con los patrones de UUID, intentar parseo simple
                if (!tipo) {
                    const parts = elementoId.split('-');
                    tipo = parts[0];
                    subbloqueId = parts[1];
                    sbeId = parts[2];
                    nroSet = parts[3]?.replace('set', '');
                }
                
                console.log('🔍 DEBUG: Procesando elemento completado', {
                    elementoId,
                    tipo,
                    subbloqueId,
                    sbeId,
                    nroSet
                });
                
                let debeActivarTimer = false;
                let pausaDuracion = 0;
                
                if (tipo === 'superset') {
                    // Para superset, verificar si se completaron todos los ejercicios de esta ronda
                    const supersetCompletado = verificarSupersetCompletado(subbloqueId, nroSet, nuevos, elementoId);
                    console.log('🔷 Superset completado?', supersetCompletado);
                    
                    if (supersetCompletado) {
                        // Buscar la pausa más alta entre todos los ejercicios del superset
                        const subbloque = rutina?.bloques.flatMap(b => b.subbloques).find(s => s.id.toString() === subbloqueId);
                        if (subbloque) {
                            subbloque.subbloques_ejercicios.forEach(sbe => {
                                const serie = sbe.series?.find(s => s.nro_set.toString() === nroSet);
                                console.log('📊 Serie encontrada:', { 
                                    ejercicio: sbe.ejercicio?.nombre, 
                                    pausa: serie?.pausa,
                                    serie
                                });
                                if (serie?.pausa > pausaDuracion) {
                                    pausaDuracion = serie.pausa;
                                }
                            });
                        }
                        debeActivarTimer = pausaDuracion > 0;
                    }
                } else {
                    // Para ejercicio simple, activar timer inmediatamente si tiene pausa
                    const serieData = getSerieDataFromElementoId(elementoId);
                    console.log('🔵 Serie data para ejercicio simple:', serieData);
                    pausaDuracion = serieData?.pausa ?? 0;
                    debeActivarTimer = pausaDuracion > 0;
                }

                // Verificar si es el último elemento
                const indexActual = orderedInteractiveElementIds.indexOf(elementoId);
                const esUltimoElemento = indexActual === orderedInteractiveElementIds.length - 1;
                
                console.log('✨ Resumen final:', {
                    debeActivarTimer,
                    pausaDuracion,
                    esUltimoElemento,
                    indexActual,
                    totalElementos: orderedInteractiveElementIds.length
                });
                
                // No activar timer si es el último ejercicio
                if (debeActivarTimer && !esUltimoElemento) {
                    console.log('✅ ACTIVANDO TIMER con duración:', pausaDuracion);
                    activarTemporizadorPausa(pausaDuracion, elementoId);
                } else if (esUltimoElemento) {
                    console.log('🏁 Último ejercicio - no se activa timer');
                    setElementoActivoId(null);
                } else {
                    console.log('❌ No hay pausa configurada');
                    const siguienteId = orderedInteractiveElementIds[indexActual + 1];

                    if (siguienteId) {
                        setElementoActivoId(siguienteId);
                        const ref = elementoRefs.current[siguienteId];
                        if (ref?.scrollIntoView) {
                            ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
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
        
        return () => {
            finishWorkout();
        };
    }, [activarTemporizadorPausa]);

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
                localStorage.removeItem(`workout-progress-${id}`);
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
        restOriginalDuration,
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