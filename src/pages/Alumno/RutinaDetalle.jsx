import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import useRutinaLogic from "../../hooks/useRutinaLogic";
import RutinaHeader from "../../components/RutinaDetalle/RutinaHeader";
import RutinaContent from "../../components/RutinaDetalle/RutinaContent";
import RutinaTimersDisplay from "../../components/RutinaDetalle/RutinaTimersDisplay";

const RutinaDetalle = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

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

    if (loading || !rutina) {
        return (
            <div className="bg-gray-900 text-white font-sans min-h-screen">
                <RutinaHeader rutinaNombre="Cargando rutina..." workoutTime={0} formatWorkoutTime={formatWorkoutTime} />
                <main className="p-4">
                    {/* Aquí puedes poner un esqueleto de carga si lo deseas */}
                </main>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 text-white font-sans min-h-screen">
            <RutinaHeader
                rutinaNombre={rutina.nombre}
                workoutTime={workoutTime}
                formatWorkoutTime={formatWorkoutTime}
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
                // handleRestTimerFinish={handleRestTimerFinish} // This is now handled internally by useRutinaLogic
                isResting={isResting}
                timeLeft={restTimeLeft}
                exerciseName={restExerciseName}
                skipRest={skipRest}
                formatTime={formatRestTime}
            />
        </div>
    );
};

export default RutinaDetalle;