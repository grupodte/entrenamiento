import React from 'react';
import { AnimatePresence } from 'framer-motion';
import RestTimer from "../RestTimer";
import RestTimerNew from "../RestTimerNew";

const RutinaTimersDisplay = ({
    showRestTimer,
    timerDuration,
    nextExerciseName,
    currentTimerOriginId,
    isResting,
    timeLeft,
    exerciseName,
    skipRest,
    formatTime,
    originalDuration
}) => {
    // Solo mostrar un timer a la vez
    // Si isResting es true, usar RestTimerNew
    // Si no, pero showRestTimer es true, usar RestTimer
    
    return (
        <>
            <AnimatePresence>
                {!isResting && showRestTimer && (
                    <RestTimer
                        key={currentTimerOriginId}
                        duration={timerDuration}
                        exerciseName={nextExerciseName}
                        onFinish={() => {}}
                    />
                )}
            </AnimatePresence>

            <RestTimerNew
                isResting={isResting}
                timeLeft={timeLeft}
                exerciseName={exerciseName}
                onSkip={skipRest}
                formatTime={formatTime}
                originalDuration={originalDuration}
            />
        </>
    );
};

export default RutinaTimersDisplay;
