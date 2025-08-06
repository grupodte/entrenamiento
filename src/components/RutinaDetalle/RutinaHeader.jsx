import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaStopwatch } from 'react-icons/fa';

const RutinaHeader = ({ rutinaNombre, workoutTime, formatWorkoutTime }) => {
    return (
        <header className="top-0 bg-gray-900/80 backdrop-blur-lg z-20 p-3 flex items-center justify-between gap-4 border-b border-gray-800">
            <div className="flex items-center gap-4">
                <Link to="/dashboard" className="p-2 rounded-full hover:bg-gray-700">
                    <FaArrowLeft />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-white">{rutinaNombre}</h1>
                    <p className="text-sm text-gray-400">Entrenamiento en curso</p>
                </div>
            </div>
            <div className="flex items-center gap-2 text-cyan-400">
                <FaStopwatch />
                <span className="font-mono text-lg">{formatWorkoutTime(workoutTime)}</span>
            </div>
        </header>
    );
};

export default RutinaHeader;