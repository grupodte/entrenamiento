import React, { useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import useRutinaLogic from "../../hooks/useRutinaLogic";
import RutinaHeader from "../../components/RutinaDetalle/RutinaHeader";
import RutinaContent from "../../components/RutinaDetalle/RutinaContent";
import RutinaTimersDisplay from "../../components/RutinaDetalle/RutinaTimersDisplay";
import  Drawer  from "../../components/Drawer";

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

    if (loading || !rutina) {
        return (
            <div className=" text-white font-sans">
                <RutinaHeader workoutTime={0} formatWorkoutTime={formatWorkoutTime} />
            </div>
        );
    }

    return (
        <div className="pt-[50px] text-white font-sans ">
            <RutinaHeader
                rutinaNombre={rutina.nombre}
                workoutTime={workoutTime}
                formatWorkoutTime={formatWorkoutTime}
                onBackClick={handleBackButtonClick}
            />

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
    );
};

export default RutinaDetalle;
