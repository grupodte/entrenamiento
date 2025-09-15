import React, { useState, useCallback, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import { useProgressDock } from '../../context/ProgressDockContext';
import { useBackNavigation } from '../../context/BackNavigationContext';
import { usePrompt } from '../../hooks/useBlocker';
import useRutinaLogic from "../../hooks/useRutinaLogic";
import useRutinaProgress from "../../hooks/useRutinaProgress";
import RutinaHeader from "../../components/RutinaDetalle/RutinaHeader";
import RutinaContent from "../../components/RutinaDetalle/RutinaContent";
import RutinaTimersDisplay from "../../components/RutinaDetalle/RutinaTimersDisplay";
import EntrenamientoCompletado from "../../components/RutinaDetalle/EntrenamientoCompletado"; // <-- 1. IMPORTAR
import ProgressDock from "../../components/RutinaDetalle/ProgressDock";
import Drawer from "../../components/Drawer";
import VideoPanel from "../../components/VideoPanel"; // Importar VideoPanel
import BrandedLoader from "../../components/BrandedLoader"; // Importar BrandedLoader
import { motion } from 'framer-motion'; // <-- 2. IMPORTAR MOTION

const RutinaDetalle = () => {
    // ... (hooks iniciales sin cambios)
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showExitModal, setShowExitModal] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);
    const { state } = location;
    
    // Usar contexto de ProgressDock y BackNavigation
    const { showProgressDock, updateProgressGlobal } = useProgressDock();
    const { registerBackHandler } = useBackNavigation();
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
    
    // Debug: verificar estado del bloqueo (solo cuando cambia isReady)
    useEffect(() => {
        if (isReady) {
            console.log('[RutinaDetalle] Estado bloqueo:', { 
                todosCompletados, 
                shouldBlock: !todosCompletados, 
                isReady 
            });
        }
    }, [isReady, todosCompletados]);

    // Manejadores de modal de salida
    const handleBackButtonClick = useCallback(() => {
        setShowExitModal(true);
    }, []);

    const handleFinalizarAndNavigate = async () => {
        await handleFinalizarYGuardar();
        navigate('/dashboard');
    };

    // Actualizar progreso global en el contexto
    useEffect(() => {
        updateProgressGlobal(progressGlobal);
    }, [progressGlobal, updateProgressGlobal]);

    // Bloquear navegación y mostrar modal de confirmación
    usePrompt(
        !todosCompletados, // Solo bloquear si no está completado el entrenamiento
        useCallback((transition) => {
            console.log('[RutinaDetalle] Navegación interceptada:', transition);
            // Guardar la transición pendiente y mostrar modal
            setPendingNavigation(transition);
            setShowExitModal(true);
        }, [])
    );
    
    // Registrar el handler de back navigation
    useEffect(() => {
        registerBackHandler(handleBackButtonClick);
        return () => registerBackHandler(null); // Cleanup
    }, [registerBackHandler, handleBackButtonClick]);

    const handleConfirmExit = () => {
        setShowExitModal(false);
        
        // Si hay una navegación pendiente, continuar con ella
        if (pendingNavigation) {
            pendingNavigation.proceed();
            setPendingNavigation(null);
        } else {
            // Navegación manual (botón de back)
            navigate('/dashboard');
        }
    };

    const handleCancelExit = () => {
        setShowExitModal(false);
        // Limpiar navegación pendiente (cancelar navegación)
        setPendingNavigation(null);
    };


    return (
        <div className="flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                {isReady ? (
                    <>
                        {/* Contenido principal */}
                        <div className="">
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

                        <RutinaTimersDisplay
                            isResting={isResting}
                            restTimeLeft={restTimeLeft}
                            restOriginalDuration={restOriginalDuration}
                            restExerciseName={restExerciseName}
                            skipRest={skipRest}
                        />

                        {/* 5. MODAL DE COMPLETADO MOVIDO AQUÍ */}
                        <EntrenamientoCompletado
                            isOpen={todosCompletados}
                            workoutTime={workoutTime}
                            seriesCompletadas={seriesCompletadas}
                            handleFinalizarYGuardar={handleFinalizarAndNavigate}
                            formatWorkoutTime={formatWorkoutTime}
                            
                        />
                    </>
                ) : (
                    <BrandedLoader />
                )}

                <Drawer isOpen={showExitModal} onClose={handleCancelExit} height="h-[95vh]">
                    <div className="p-6">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                                ¿Salir del entrenamiento?
                            </h3>
                            <p className="text-gray-400 text-sm">
                                {pendingNavigation 
                                    ? "Estás intentando navegar fuera del entrenamiento. Si continúas, perderás el progreso de esta sesión."
                                    : "Si sales ahora, perderás el progreso de esta sesión."
                                }
                            </p>
                        </div>
                        
                        <div className="space-y-3">
                            <button
                                onClick={handleCancelExit}
                                className="w-full px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
                            >
                                Continuar Entrenando
                            </button>
                            <button
                                onClick={handleConfirmExit}
                                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Salir sin Guardar
                            </button>
                        </div>
                    </div>
                </Drawer>

                <VideoPanel
                    isOpen={showVideoPanel}
                    onClose={closeVideoPanel}
                    videoUrl={videoUrlToShow}
                />

                {/* Dock de progreso flotante */}
                <ProgressDock
                    isVisible={showProgressDock && isReady}
                    rutina={rutina}
                    elementosCompletados={elementosCompletados}
                    progressGlobal={progressGlobal}
                    seriesCompletadas={seriesCompletadas}
                    totalSeries={seriesCompletadas + (rutina ? Object.keys(elementosCompletados).length : 0)}
                    workoutTime={workoutTime}
                    formatWorkoutTime={formatWorkoutTime}
                    progressPorSubBloque={progressPorSubBloque}
                    onElementClick={(elementId) => {
                        // Scroll hacia el elemento específico si existe
                        const element = elementoRefs.current[elementId];
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }}
                />
            </div>
        </div>
    );
};

export default RutinaDetalle;