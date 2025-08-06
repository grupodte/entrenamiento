import React from 'react';
import { AnimatePresence } from 'framer-motion';
import RestTimer from "../RestTimer";
import RestTimerNew from "../RestTimerNew";

const RutinaTimersDisplay = ({
    showRestTimer,
    timerDuration,
    nextExerciseName,
    currentTimerOriginId,
    handleRestTimerFinish,
    isResting,
    timeLeft,
    exerciseName,
    skipRest,
    formatTime
}) => {
    return (
        <>
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

            <RestTimerNew
                isResting={isResting}
                timeLeft={timeLeft}
                exerciseName={exerciseName}
                onSkip={skipRest}
                formatTime={formatTime}
            />
        </>
    );
};

export default RutinaTimersDisplay;