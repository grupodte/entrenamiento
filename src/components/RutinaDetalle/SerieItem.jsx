import React, { useState } from 'react';
import { FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const SerieItem = React.forwardRef(({
    serieId,
    textoPrincipal,
    isCompletada,
    isActive,
    onItemClick,
    reps,
    carga,
    pausa,
    tipoElemento,
    subbloqueId,
    numSerieSupersetActual,
    lastSessionData,
    classNameExtra = '',
}, ref) => {
    const lastCarga = lastSessionData[`${serieId}`]?.carga_realizada || '';
    const [actualReps, setActualReps] = useState(reps || '');
    const [actualCarga, setActualCarga] = useState(lastCarga || carga || '');

    const variants = {
        inactive: { scale: 1 },
        active: { scale: 1.02 },
        completed: { scale: 1 },
    };

    const status = isCompletada ? 'completed' : isActive ? 'active' : 'inactive';

    const handleClick = () => {
        onItemClick(serieId, {
            tipoElemento,
            pausa,
            subbloqueId,
            numSerieSupersetActual,
            actualReps: parseInt(actualReps, 10) || 0,
            actualCarga,
        });
    };

    // Extraer el nombre del ejercicio del texto principal
    const nombreEjercicio = textoPrincipal.split(' — ')[0] || textoPrincipal.split(': ')[1] || textoPrincipal;

    return (
        <motion.div
            ref={ref}
            layout
            variants={variants}
            animate={status}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            onClick={handleClick}
            className={`
                relative w-full cursor-pointer rounded-xl p-4 transition-all duration-300
                backdrop-blur-md border
                ${isCompletada
                    ? 'bg-gray-800/60 border-gray-600/50'
                    : isActive
                        ? 'bg-gray-800/80 border-cyan-400/30 ring-1 ring-cyan-400/20'
                        : 'bg-gray-800/40 border-gray-700/30 hover:bg-gray-800/60'
                }
                ${classNameExtra}
            `}
            role="button"
            tabIndex={0}
            aria-pressed={isCompletada}
        >
            {/* Header con nombre del ejercicio y estado */}
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white/90 flex-1 min-w-0">
                    {nombreEjercicio}
                </h4>

                <AnimatePresence>
                    {isCompletada && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-700/50 border border-gray-500/50"
                        >
                            <FaCheck className="w-3 h-3 text-gray-300" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Contenedor principal con Reps y Peso */}
            <div className="flex items-center gap-4">
                {/* Sección Reps */}
                <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                        Reps
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={actualReps}
                            onChange={(e) => setActualReps(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className={`
                                w-full text-2xl font-bold text-center py-2 rounded-lg 
                                bg-gray-900/50 text-white border border-gray-600/30
                                focus:ring-2 focus:ring-cyan-400/40 focus:outline-none
                                focus:border-cyan-400/50
                                ${isCompletada ? 'opacity-70' : ''}
                            `}
                            placeholder="0"
                        />
                    </div>
                </div>

                {/* Sección Peso */}
                <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                        Peso
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={actualCarga}
                            onChange={(e) => setActualCarga(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="0kg"
                            className={`
                                w-full text-2xl font-bold text-center py-2 rounded-lg
                                bg-gray-900/50 text-white border border-gray-600/30
                                focus:ring-2 focus:ring-cyan-400/40 focus:outline-none
                                focus:border-cyan-400/50
                                ${isCompletada ? 'opacity-70' : ''}
                            `}
                        />
                    </div>
                </div>

                {/* Botón de estado (solo visible cuando no está completado) */}
                {!isCompletada && (
                    <div className="flex-shrink-0 ml-2">
                        <div className="flex items-center justify-center w-10 h-16 rounded-lg bg-gray-700/50 border border-gray-600/30">
                            <span className="text-xs font-medium text-gray-300 writing-mode-vertical transform -rotate-90">
                                Listo!
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Overlay para indicar completado */}
            {isCompletada && (
                <div className="absolute inset-0 bg-gray-600/10 rounded-xl pointer-events-none" />
            )}
        </motion.div>
    );
});

SerieItem.displayName = 'SerieItem';
export default SerieItem;