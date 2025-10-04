import React, { useState, useCallback, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import { useBackNavigation } from '../../context/BackNavigationContext';
import { useWorkout } from '../../context/WorkoutContext';
// usePrompt removido - lógica simplificada
import useRutinaLogic from "../../hooks/useRutinaLogic";
import useRutinaProgress from "../../hooks/useRutinaProgress";
import useIOSBackSwipeBlock from "../../hooks/useSimpleSwipeBackPrevention"; // Enhanced iOS swipe prevention
import RutinaHeader from "../../components/RutinaDetalle/RutinaHeader";
import RutinaContent from "../../components/RutinaDetalle/RutinaContent";
import RutinaTimersDisplay from "../../components/RutinaDetalle/RutinaTimersDisplay";
import EntrenamientoCompletado from "../../components/RutinaDetalle/EntrenamientoCompletado"; // <-- 1. IMPORTAR
import Drawer from "../../components/Drawer";
import VideoPanel from "../../components/VideoPanel"; // Importar VideoPanel
import { motion } from 'framer-motion'; // <-- 2. IMPORTAR MOTION
import { shouldEnableIOSSwipeBlock, getFeatureSettings } from '../../config/features';

const RutinaDetalle = () => {
    // ... (hooks iniciales sin cambios)
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showExitModal, setShowExitModal] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);
    const [allowNavigation, setAllowNavigation] = useState(false);
    const { state } = location;
    
    // Usar contexto de BackNavigation
    const { registerBackHandler } = useBackNavigation();
    
    // Usar contexto de Workout
    const { startWorkout, endWorkout, updateWorkoutTime } = useWorkout();
    
    const tipo = state?.tipo || "base";
    const searchParams = new URLSearchParams(location.search);
    const bloqueSeleccionado = searchParams.get("bloque");

    const {
        rutina,
        loading,
        elementosCompletados,
        lastSessionData,
        elementoActivoId,
        workoutTime,
        isResting,
        restTimeLeft,
        restOriginalDuration,
        restExerciseName,
        todosCompletados,
        toggleElementoCompletado,
        handleFinalizarYGuardar,
        skipRest,
        formatWorkoutTime,
        elementoRefs,
        showVideoPanel,
        videoUrlToShow,
        openVideoPanel,
        closeVideoPanel,
    } = useRutinaLogic(id, tipo, bloqueSeleccionado, user);

    const {
        progressGlobal,
        progressPorSubBloque,
        seriesCompletadas,
    } = useRutinaProgress(rutina, elementosCompletados);

    const isReady = !loading && !!rutina;
    
    // iOS swipe gesture prevention for full-screen workout experience
    const shouldBlockSwipes = shouldEnableIOSSwipeBlock(location.pathname);
    const iosSwipeSettings = getFeatureSettings('IOS_SWIPE_BLOCK');
    
    const swipeBlockStatus = useIOSBackSwipeBlock({
        enabled: shouldBlockSwipes && isReady, // Only enable when workout is loaded
        edgeThreshold: iosSwipeSettings.edgeThreshold || 0.1,
        debugLog: iosSwipeSettings.debugLog || false
    });
    
    // Log iOS swipe block status in development
    useEffect(() => {
        if (iosSwipeSettings.debugLog && swipeBlockStatus.isActive) {
            console.log('[RutinaDetalle] iOS swipe blocking active', {
                route: location.pathname,
                isIOSDetected: swipeBlockStatus.isIOSDetected,
                stats: swipeBlockStatus.stats
            });
        }
    }, [swipeBlockStatus, location.pathname, iosSwipeSettings.debugLog]);
    
    // Estado del bloqueo listo

    // Manejadores de modal de salida
    const handleBackButtonClick = useCallback(() => {
        setShowExitModal(true);
    }, []);

    const handleFinalizarAndNavigate = async () => {
        await handleFinalizarYGuardar();
        navigate('/dashboard');
    };


    // Lógica de bloqueo de navegación simplificada (sin usePrompt)
    
    // Registrar el handler de back navigation
    useEffect(() => {
        registerBackHandler(handleBackButtonClick);
        return () => registerBackHandler(null); // Cleanup
    }, [registerBackHandler, handleBackButtonClick]);

    const handleConfirmExit = () => {
        setShowExitModal(false);
        setPendingNavigation(null);
        
        // Desactivar contexto de workout antes de salir
        endWorkout();
        
        // Navegar al dashboard
        setTimeout(() => {
            navigate('/dashboard', { replace: true });
        }, 100);
    };

    const handleCancelExit = () => {
        setShowExitModal(false);
        // Limpiar navegación pendiente (cancelar navegación)
        setPendingNavigation(null);
    };

    // Effect para activar el contexto de workout cuando se carga la rutina
    useEffect(() => {
        if (rutina && !loading) {
            console.log('RutinaDetalle: Activando workout context', { rutina: !!rutina, loading });
            startWorkout(null, handleBackButtonClick);
        }
        return () => {
            // Limpiar al desmontar el componente
            console.log('RutinaDetalle: Limpiando workout context');
            endWorkout();
        };
    }, [rutina, loading, startWorkout, endWorkout, handleBackButtonClick]);

    // Effect para actualizar el tiempo del workout en el contexto
    useEffect(() => {
        if (workoutTime > 0) {
            console.log('RutinaDetalle: Actualizando tiempo en contexto', { workoutTime });
            updateWorkoutTime(workoutTime);
        }
    }, [workoutTime, updateWorkoutTime]);


    return (
        <>
            <div className={`flex flex-col overflow-hidden transition-all duration-300 ${
                loading ? 'blur-[20px] pointer-events-none' : 'blur-0'
            }`}>
                <div className="flex-1 overflow-y-auto">
                    {/* Contenido principal */}
                    {rutina && (
                        <div className="flex flex-col items-center">
                            <RutinaContent
                                // 4. PROPS SIMPLIFICADAS
                                rutinaBloques={rutina.bloques}
                                elementosCompletados={elementosCompletados}
                                elementoActivoId={elementoActivoId}
                                toggleElementoCompletado={toggleElementoCompletado}
                                elementoRefs={elementoRefs}
                                lastSessionData={lastSessionData}
                                progressPorSubBloque={progressPorSubBloque}
                                openVideoPanel={openVideoPanel}
                            />
                        </div>
                    )}

                    {rutina && (
                        <RutinaTimersDisplay
                            isResting={isResting}
                            restTimeLeft={restTimeLeft}
                            restOriginalDuration={restOriginalDuration}
                            restExerciseName={restExerciseName}
                            skipRest={skipRest}
                        />
                    )}
                </div>

                {/* Componentes que deben estar fuera del scroll */}
                {/* 5. MODAL DE COMPLETADO */}
                {rutina && (
                    <EntrenamientoCompletado
                        isOpen={todosCompletados}
                        workoutTime={workoutTime}
                        seriesCompletadas={seriesCompletadas}
                        handleFinalizarYGuardar={handleFinalizarAndNavigate}
                        formatWorkoutTime={formatWorkoutTime}
                    />
                )}

                {/* Modales y paneles */}
                <Drawer isOpen={showExitModal} onClose={handleCancelExit} height="max-h-[60vh]">
                    <div className="p-6">
                        <div className="text-center mb-6">
                       
                            <h3 className="text-[35px] text-[#545454] mb-2  leading-none">
                                ¿Salir del entrenamiento?
                            </h3>
                            <p className="text-[#828282]  text-[16px] leading-none">
                                {pendingNavigation 
                                    ? "Estás intentando navegar fuera del entrenamiento. Si continúas, perderás el progreso de esta sesión."
                                    : "Si sales ahora, perderás el progreso de esta sesión."
                                }
                            </p>
                        </div>
                        
                        <div className="space-y-4 " >
                            <motion.button
                                onClick={handleCancelExit}
                                className="w-full px-4 py-3  rounded-[10px] bg-[#FF0000]  "
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Continuar Entrenando
                            </motion.button>

                            <motion.button
                                onClick={handleConfirmExit}
                                className="w-full px-4 py-3 rounded-[10px]  bg-[#FF0000]/50"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Salir sin Guardar
                            </motion.button>
                        </div>

                    </div>
                </Drawer>

                <VideoPanel
                    isOpen={showVideoPanel}
                    onClose={closeVideoPanel}
                    videoUrl={videoUrlToShow}
                />
            </div>

        </>
    );
};

export default RutinaDetalle;