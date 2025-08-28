import React, { useState } from 'react';
import { FaCheck, FaPlayCircle } from 'react-icons/fa';
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
    nroSet,
    ejercicio,
    openVideoPanel,
    nota,
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
        if (onItemClick) {
            onItemClick(serieId, {
                tipoElemento,
                pausa,
                subbloqueId,
                numSerieSupersetActual,
                actualReps: parseInt(actualReps, 10) || 0,
                actualCarga,
            });
        }
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
            <h4 className="text-md font-medium text-white/90 flex-1 min-w-0">
                {nombreEjercicio}
            </h4>
            {/* Header con nombre del ejercicio y estado */}
            <div className="flex items-center justify-between mb-1">
                <div> 

                    {nota && (
                      <p className="text-[12px] text-white/80">{nota}</p>
                       
                    )}
              
             
                </div>
                {ejercicio?.video_url && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Evitar que el click en el botón active el onItemClick del SerieItem
                            openVideoPanel(ejercicio.video_url);
                        }}
                        className="ml-2 p-1 rounded-full text-cyan-400 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                        aria-label="Ver video del ejercicio"
                    >
                        <FaPlayCircle className="w-5 h-5" />
                    </button>
                )}

                

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

            {/* Faltaria aca agregar el link de video del ejercicio.*/}

            {/* Contenedor principal con 4 Columnas: Set, Reps, Peso, Pausa */}
            <div className="grid grid-cols-4 items-center gap-2 sm:gap-3 text-center">
                {/* Sección Set */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                        Set
                    </label>
                    <div className="text-2xl font-bold text-white bg-gray-900/50 py-2 rounded-lg border border-gray-600/30">
                        {nroSet || '0'}
                    </div>
                </div>

                {/* Sección Reps */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                        Reps
                    </label>
                    <div className="text-2xl font-bold text-white bg-gray-900/50 py-2 rounded-lg border border-gray-600/30">
                        {actualReps || '0'}
                    </div>
                </div>

                {/* Sección Peso */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                        Peso
                    </label>
                    <input
                        type="text"
                        value={actualCarga}
                        onChange={(e) => setActualCarga(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="0kg"
                        className="w-full text-2xl font-bold text-center py-2 rounded-lg bg-gray-900/50 text-white border border-gray-600/30 focus:ring-2 focus:ring-cyan-400/40 focus:outline-none focus:border-cyan-400/50"
                    />
                </div>

                {/* Sección Pausa */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                        Pausa
                    </label>
                    <div className="text-2xl font-bold text-white bg-gray-900/50 py-2 rounded-lg border border-gray-600/30">
                        {pausa ? `${pausa}s` : '-'}
                    </div>
                </div>
            </div>

            {/* Nota de la serie */}
         

            {/* Overlay para indicar completado */}
            {isCompletada && (
                <div className="absolute inset-0 bg-gray-600/10 rounded-xl pointer-events-none" />
            )}
        </motion.div>
    );
});

SerieItem.displayName = 'SerieItem';
export default SerieItem;