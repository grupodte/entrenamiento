import React, { useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import useRutinaLogic from "../../hooks/useRutinaLogic";
import useRutinaProgress from "../../hooks/useRutinaProgress";
import RutinaHeader from "../../components/RutinaDetalle/RutinaHeader";
import RutinaContent from "../../components/RutinaDetalle/RutinaContent";
import RutinaTimersDisplay from "../../components/RutinaDetalle/RutinaTimersDisplay";
import EntrenamientoCompletado from "../../components/RutinaDetalle/EntrenamientoCompletado"; // <-- 1. IMPORTAR
import Drawer from "../../components/Drawer";
import VideoPanel from "../../components/VideoPanel"; // Importar VideoPanel
import { motion } from 'framer-motion'; // <-- 2. IMPORTAR MOTION
import GradualBlur from '../../components/GradualBlur'; // Import GradualBlur

/** Skeleton simple para el área de contenido */
const LoadingSkeleton = () => (
    <div className="flex flex-col justify-center items-center space-y-4 p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        <p className="text-gray-400">Cargando rutina...</p>
    </div>
);

const RutinaDetalle = () => {
    // ... (hooks iniciales sin cambios)
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showExitModal, setShowExitModal] = useState(false);
    const { state } = location;
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

    const handleFinalizarAndNavigate = async () => {
        await handleFinalizarYGuardar();
        navigate('/dashboard');
    };

    // Manejadores de modal de salida
    const handleBackButtonClick = useCallback(() => {
        setShowExitModal(true);
    }, []);

    const handleConfirmExit = () => {
        setShowExitModal(false);
        navigate('/dashboard');
    };

    const handleCancelExit = () => {
        setShowExitModal(false);
    };


    return (
        <div className=" dashboard">
            <RutinaHeader
                rutinaNombre={rutina?.nombre ?? "Entrenamiento"}
                workoutTime={isReady ? workoutTime : 0}
                formatWorkoutTime={formatWorkoutTime}
                onBackClick={handleBackButtonClick}
                progressGlobal={progressGlobal}
                todosCompletados={todosCompletados}
            />

        

            <div className="flex-1 overflow-y-auto scrollbar-hide pt-10">
                {isReady ? (
                    <>
              

                        {/* Contenido principal */}
                        <div>
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
                    <div className="pt-24"><LoadingSkeleton /></div>
                )}

                <Drawer isOpen={showExitModal} onClose={handleCancelExit}>
                    <div className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            ¿Salir del entrenamiento?
                        </h3>
                        <p className="text-gray-400 mb-6">
                            Si sales ahora, perderás el progreso de esta sesión.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleConfirmExit}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Salir
                            </button>
                            <button
                                onClick={handleCancelExit}
                                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                </Drawer>

                <VideoPanel
                    isOpen={showVideoPanel}
                    onClose={closeVideoPanel}
                    videoUrl={videoUrlToShow}
                />
            </div>
            <GradualBlur
                target="parent"
                position="bottom"
                height="6rem"
                strength={2}
                divCount={5}
                curve="bezier"
                exponential={true}
                opacity={1}
            />
        </div>
    );
};

export default RutinaDetalle;