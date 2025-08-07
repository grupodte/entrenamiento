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

    return (
        <motion.div
            ref={ref}
            layout
            variants={variants}
            animate={status}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            onClick={handleClick} glass
            className={`
                flex flex-col w-full cursor-pointer rounded-dashboard p-3 transition-all duration-300
                shadow-dashboard backdrop-blur-md
                ${isCompletada
                    ? 'bg-green-500/5 border border-green-400/20'
                    : isActive
                        ? 'bg-cyan-400/10 border border-cyan-300/20'
                        : 'backdrop-blur-lg border border-white/5'
                }
            `}
            role="button"
            tabIndex={0}
            aria-pressed={isCompletada}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{textoPrincipal}</span>
                <AnimatePresence>
                    {isCompletada && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="ml-2 text-green-400"
                        >
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex gap-2 mt-1">
                <input
                    type="number"
                    value={actualReps}
                    onChange={(e) => setActualReps(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Reps"
                    className="w-1/2 text-sm px-3 py-2 rounded-lg bg-white/5 text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-400/40 focus:outline-none"
                />
                <input
                    type="text"
                    value={actualCarga}
                    onChange={(e) => setActualCarga(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Carga"
                    className="w-1/2 text-sm px-3 py-2 rounded-lg bg-white/5 text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-400/40 focus:outline-none"
                />
            </div>
        </motion.div>
    );
});

SerieItem.displayName = 'SerieItem';
export default SerieItem;
