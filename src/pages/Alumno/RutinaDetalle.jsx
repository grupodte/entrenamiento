import React, { useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import useRutinaLogic from "../../hooks/useRutinaLogic";
import RutinaHeader from "../../components/RutinaDetalle/RutinaHeader";
import RutinaContent from "../../components/RutinaDetalle/RutinaContent";
import RutinaTimersDisplay from "../../components/RutinaDetalle/RutinaTimersDisplay";
import Drawer from "../../components/Drawer";

/** Skeleton simple para el área de contenido */
const LoadingSkeleton = () => (
    <div className="pt-24 px-4">
        <div className="max-w-[430px] mx-auto space-y-3">
            {[...Array(3)].map((_, i) => (
                <div
                    key={i}
                    className="h-[270px] w-[380px] max-w-full rounded-2xl bg-gray-800/40 border border-white/10 mx-auto
                     animate-pulse"
                />
            ))}
        </div>
    </div>
);

const RutinaDetalle = () => {
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
    } = useRutinaLogic(id, tipo, bloqueSeleccionado, user);

    const isReady = !loading && !!rutina;

    const handleFinalizarAndNavigate = async () => {
        await handleFinalizarYGuardar();
        navigate('/dashboard');
    };

    const handleBackButtonClick = useCallback(() => {
        if (!todosCompletados) {
            setShowExitModal(true);
        } else {
            navigate('/dashboard');
        }
    }, [todosCompletados, navigate]);

    const handleConfirmExit = () => {
        setShowExitModal(false);
        navigate('/dashboard');
    };

    const handleCancelExit = () => {
        setShowExitModal(false);
    };

    return (
        <div className="m-0">
            {/* Header siempre visible, incluso mientras carga */}
            <RutinaHeader
                rutinaNombre={rutina?.nombre ?? "Entrenamiento"}
                workoutTime={isReady ? workoutTime : 0}
                formatWorkoutTime={formatWorkoutTime}
                onBackClick={handleBackButtonClick}
            />

            <div className="content-wrapper pt-24">
                {/* Contenido: si está listo, mostramos; si no, Skeleton */}
                {isReady ? (
                    <>
                        <RutinaContent
                            rutinaBloques={rutina.bloques}
                            elementosCompletados={elementosCompletados}
                            elementoActivoId={elementoActivoId}
                            toggleElementoCompletado={toggleElementoCompletado}
                            elementoRefs={elementoRefs}
                            lastSessionData={lastSessionData}
                            todosCompletados={todosCompletados}
                            workoutTime={workoutTime}
                            totalSeriesCompletadas={totalSeriesCompletadas}
                            handleFinalizarYGuardar={handleFinalizarAndNavigate}
                            width={width}
                            height={height}
                            formatWorkoutTime={formatWorkoutTime}
                        />

                        <RutinaTimersDisplay
                            showRestTimer={showRestTimer}
                            timerDuration={timerDuration}
                            nextExerciseName={nextExerciseName}
                            currentTimerOriginId={currentTimerOriginId}
                            isResting={isResting}
                            timeLeft={restTimeLeft}
                            exerciseName={restExerciseName}
                            skipRest={skipRest}
                            formatTime={formatRestTime}
                        />
                    </>
                ) : (
                    <LoadingSkeleton />
                )}

                <Drawer isOpen={showExitModal} onClose={handleCancelExit}>
                    <div className="p-4 text-center">
                        <h2 className="text-xl font-bold text-white mb-4">¿Salir del Entrenamiento?</h2>
                        <p className="text-gray-300 mb-6">
                            Si sales ahora, el progreso de tu entrenamiento actual se perderá.
                            ¿Estás seguro de que quieres salir?
                        </p>
                        <div className="flex justify-around gap-4">
                            <button
                                onClick={handleConfirmExit}
                                className="flex-1 bg-red-600/20 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                            >
                                Confirmar Salida
                            </button>
                            <button
                                onClick={handleCancelExit}
                                className="flex-1 bg-gray-700/50 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </Drawer>
            </div>
        </div>
    );
};

export default RutinaDetalle;
