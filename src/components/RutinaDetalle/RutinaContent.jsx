import React from 'react';
import BloqueDisplay from "./BloqueDisplay";
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';

const RutinaContent = ({
    rutinaBloques,
    elementosCompletados,
    elementoActivoId,
    toggleElementoCompletado,
    elementoRefs,
    lastSessionData,
    todosCompletados,
    workoutTime,
    totalSeriesCompletadas,
    handleFinalizarYGuardar,
    width,
    height,
    formatWorkoutTime
}) => {
    const displayProps = { elementosCompletados, elementoActivoId, toggleElementoCompletado, elementoRefs, lastSessionData };

    return (
        <main className="p-4 space-y-4 pb-20">
            {todosCompletados && <Confetti width={width} height={height} recycle={false} />} {/* Moved here for better encapsulation */}
            {rutinaBloques?.map(bloque => (
                <BloqueDisplay key={bloque.id} bloque={bloque} {...displayProps} />
            ))}

            {todosCompletados && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-6 bg-gray-800 rounded-xl shadow-lg mt-6">
                    <h2 className="text-2xl font-bold text-green-400">¡Entrenamiento completado!</h2>
                    <p className="text-gray-300 mt-2 mb-4">¡Gran trabajo! Has finalizado todos los ejercicios.</p>

                    <div className="grid grid-cols-2 gap-4 text-white my-4">
                        <div className="bg-gray-700/50 p-3 rounded-lg">
                            <p className="text-sm text-gray-400">Tiempo Total</p>
                            <p className="text-xl font-bold">{formatWorkoutTime(workoutTime)}</p>
                        </div>
                        <div className="bg-gray-700/50 p-3 rounded-lg">
                            <p className="text-sm text-gray-400">Series Completadas</p>
                            <p className="text-xl font-bold">{totalSeriesCompletadas}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleFinalizarYGuardar}
                        className="mt-4 w-full bg-green-500 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-105 text-lg"
                    >
                        Finalizar y Guardar
                    </button>
                </motion.div>
            )}
        </main>
    );
};

export default RutinaContent;