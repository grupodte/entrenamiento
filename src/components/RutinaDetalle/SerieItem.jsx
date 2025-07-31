import React, { useState } from 'react';
import { FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const SerieItem = React.forwardRef(({
    serieId,
    textoPrincipal,
    isCompletada,
    isActive,
    onItemClick,
    reps, // Planned reps
    carga, // Planned carga
    pausa, // Planned pausa (for passing back)
    tipoElemento, // For passing back
    subbloqueId, // For passing back (superset context)
    numSerieSupersetActual, // For passing back (superset context)
    lastSessionData,
}, ref) => {
    const lastCarga = lastSessionData[`${serieId}`]?.carga_realizada || '';
    const [actualReps, setActualReps] = useState(reps || '');
    const [actualCarga, setActualCarga] = useState(lastCarga || carga || '');
    
    const variants = {
        inactive: { scale: 1, backgroundColor: '#374151' }, // bg-gray-700
        active: { scale: 1.03, backgroundColor: '#0891B2' }, // bg-cyan-600
        completed: { scale: 1, backgroundColor: '#166534' }, // bg-green-700
    };

    const status = isCompletada ? 'completed' : isActive ? 'active' : 'inactive';

    const handleClick = () => {
        onItemClick(serieId, {
            tipoElemento,
            pausa,
            subbloqueId, // Pass for superset context
            numSerieSupersetActual, // Pass for superset context
            actualReps: parseInt(actualReps, 10) || 0, // Ensure number
            actualCarga: actualCarga, // Keep as string for now, can parse later if needed
        });
    };

    return (
        <motion.div 
            ref={ref}
            layout
            variants={variants}
            animate={status}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            onClick={handleClick}
            className="flex flex-col p-2.5 rounded-md cursor-pointer shadow-md w-full"
            role="button"
            tabIndex={0}
            aria-pressed={isCompletada}
        >
            <div className="flex items-center justify-between mb-2"> {/* Added for text and checkmark */}
                <span className="flex-1 text-sm font-normal text-white">{textoPrincipal}</span>
                <AnimatePresence>
                    {isCompletada && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="ml-2 text-white"
                        >
                            <FaCheck />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input fields for actual reps and carga */}
            <div className="flex gap-2 mt-2">
                <input
                    type="number"
                    value={actualReps}
                    onChange={(e) => setActualReps(e.target.value)}
                    onClick={(e) => e.stopPropagation()} // Prevent click from triggering itemClick
                    placeholder="Reps"
                    className="w-1/2 p-1.5 text-sm rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-cyan-400"
                />
                <input
                    type="text" // Use text for carga as it can be 'kg', 'lbs', etc.
                    value={actualCarga}
                    onChange={(e) => setActualCarga(e.target.value)}
                    onClick={(e) => e.stopPropagation()} // Prevent click from triggering itemClick
                    placeholder="Carga"
                    className="w-1/2 p-1.5 text-sm rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-cyan-400"
                />
            </div>
        </motion.div>
    );
});

SerieItem.displayName = 'SerieItem';
export default SerieItem;
