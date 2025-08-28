import React from 'react';
import UnifiedRestTimer from '../UnifiedRestTimer';

const RutinaTimersDisplay = ({
    isResting,
    restTimeLeft,
    restOriginalDuration,
    restExerciseName,
    skipRest,
}) => {
    return (
        <UnifiedRestTimer
            isVisible={isResting}
            timeLeft={restTimeLeft}
            duration={restOriginalDuration}
            exerciseName={restExerciseName}
            onSkip={skipRest}
        />
    );
};

export default RutinaTimersDisplay;
