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
    const [allowNavigation, setAllowNavigation] = useState(false);
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
    
    // Estado del bloqueo listo

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
        setPendingNavigation(null);
        
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
                        
                        <div className="space-y-4 px-2">
                            <motion.button
                                onClick={handleCancelExit}
                                className="w-full px-4 py-3 bg-500/90 text-white rounded-xl shadow-lg shadow-cyan-500/20 border border-cyan-400/30 backdrop-blur-md font-semibold transition-all duration-200 hover:bg-cyan-400 hover:shadow-cyan-400/30"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Continuar Entrenando
                            </motion.button>

                            <motion.button
                                onClick={handleConfirmExit}
                                className="w-full px-4 py-3  text-gray-300 rounded-xl shadow-lg border border-white/20 backdrop-blur-md font-medium transition-colors duration-200 hover:bg-red-500/30 hover:text-white hover:border-red-400/40"
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