import React from 'react';
import { FaArrowLeft, FaStopwatch } from 'react-icons/fa';

const RutinaHeader = ({
    rutinaNombre = '',
    workoutTime = 0,
    formatWorkoutTime = (t) => t,
    onBackClick = () => { },
}) => {
    return (
        <header className="pt-20 fixed top-0 left-0 w-full p-4 backdrop-blur-sm bg-gray-900/20 z-20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <button
                    onClick={onBackClick}
                    className="p-2 rounded-full hover:bg-gray-800 transition-colors duration-200"
                >
                    <FaArrowLeft className="text-white" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-white">
                        {rutinaNombre}
                    </h1>
                    <p className="text-sm text-gray-400">
                        Entrenamiento en curso
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 text-cyan-400">
                <FaStopwatch />
                <span className="font-mono text-lg">
                    {formatWorkoutTime(workoutTime)}
                </span>
            </div>
        </header>
    );
};

export default RutinaHeader;
