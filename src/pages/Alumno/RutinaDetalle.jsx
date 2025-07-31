import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import RestTimer from "../../components/RestTimer";
import BloqueDisplay from "../../components/RutinaDetalle/BloqueDisplay";
import BrandedLoader from "../../components/BrandedLoader";
import { generarIdSerieSimple, generarIdEjercicioEnSerieDeSuperset } from '../../utils/rutinaIds';
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
    const [rutina, setRutina] = useState(null);
    const [loading, setLoading] = useState(true);
    const [elementosCompletados, setElementosCompletados] = useState({});
    const [showRestTimer, setShowRestTimer] = useState(false);
    const [timerDuration, setTimerDuration] = useState(0);
    const [nextExerciseName, setNextExerciseName] = useState("Siguiente ejercicio");
    const [currentTimerOriginId, setCurrentTimerOriginId] = useState(null);
    const [elementoActivoId, setElementoActivoId] = useState(null);
    const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);
    const [notificationPermission, setNotificationPermission] = useState('default');
    const elementoRefs = useRef({});
    const timerActiveRef = useRef(false);
    const audioRef = useRef(null);
    const audioUnlocked = useRef(false);
    const { width, height } = useWindowSize();

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio('/sounds/levelup.mp3');
            audioRef.current.load();
        }

        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }

        const interval = setInterval(() => {
            setTiempoTranscurrido(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const requestNotificationPermission = () => {
        if (!('Notification' in window)) {
            toast.error('Este navegador no soporta notificaciones.');
            return;
        }
        Notification.requestPermission().then(permission => {
            setNotificationPermission(permission);
            if (permission === 'granted') {
                toast.success('¡Notificaciones activadas!');
            } else {
                toast.error('No podremos notificarte cuando termine el descanso.');
            }
        });
    };

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

    const activarTemporizadorPausa = useCallback((duracion, originId) => {
        if (duracion > 0 && !timerActiveRef.current) {
            const siguienteDelQuePausa = obtenerSiguienteElementoInfo(originId);
            const nombreSiguiente = siguienteDelQuePausa ? siguienteDelQuePausa.nombre : "¡Rutina Completada!";

            if (notificationPermission === 'granted' && navigator.serviceWorker.controller) {
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
    }, [obtenerSiguienteElementoInfo, notificationPermission]);

    const handleRestTimerFinish = useCallback(() => {
        // La notificación la maneja el Service Worker.
        // La app solo se encarga de la parte visual.
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

    // ... (el resto de funciones como fetchRutina, etc., se mantienen igual)

    if (loading) return <BrandedLoader />;
    if (!rutina) return <div className="p-6 text-white text-center">No se encontró la rutina.</div>;

    const todosCompletados = orderedInteractiveElementIds.length > 0 && orderedInteractiveElementIds.every(id => elementosCompletados[id]);
    const totalSeriesCompletadas = Object.values(elementosCompletados).filter(Boolean).length;

    const displayProps = { elementosCompletados, elementoActivoId, toggleElementoCompletado, elementoRefs };

    return (
        <div className="bg-gray-900 text-white font-sans min-h-screen">
            {todosCompletados && <Confetti width={width} height={height} recycle={false} />}
            <header className="sticky top-0 bg-gray-900/80 backdrop-blur-lg z-20 p-3 flex items-center justify-between gap-4 border-b border-gray-800">
                {/* ... (código del header sin cambios) */}
            </header>

            <main className="p-4 space-y-4 pb-20">
                {notificationPermission === 'default' && (
                    <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 p-3 rounded-lg mb-4 flex items-center justify-between gap-4">
                        <p className="text-sm">Activa las notificaciones para que te avisemos cuando termine el descanso.</p>
                        <button onClick={requestNotificationPermission} className="bg-yellow-500 text-black font-bold py-1 px-3 rounded-md text-sm">Activar</button>
                    </div>
                )}

                {rutina.bloques?.map(bloque => (
                    <BloqueDisplay key={bloque.id} bloque={bloque} {...displayProps} />
                ))}

                {/* ... (código de la tarjeta de entrenamiento completado sin cambios) */}
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