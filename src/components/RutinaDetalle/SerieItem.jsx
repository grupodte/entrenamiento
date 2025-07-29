import React from 'react';
import { FaCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';

const SerieItem = React.forwardRef(({
    serieId,
    textoPrincipal,
    isCompletada,
    isActive,
    onItemClick,
}, ref) => {
    
    const variants = {
        inactive: { scale: 1, backgroundColor: '#374151' }, // bg-gray-700
        active: { scale: 1.03, backgroundColor: '#0891B2' }, // bg-cyan-600
        completed: { scale: 1, backgroundColor: '#166534' }, // bg-green-700
    };

    const status = isCompletada ? 'completed' : isActive ? 'active' : 'inactive';

    return (
        <motion.div 
            ref={ref}
            layout
            variants={variants}
            animate={status}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            onClick={onItemClick}
            className="flex items-center p-3 rounded-lg cursor-pointer shadow-md"
            role="button"
            tabIndex={0}
            aria-pressed={isCompletada}
        >
            <div 
                className={`w-6 h-6 rounded-full border-2 flex-shrink-0 mr-4 flex items-center justify-center transition-all duration-200 ${
                    isCompletada ? 'bg-green-500 border-green-400' : 'border-gray-400'
                }`}>
                {isCompletada && <FaCheck className="text-white w-3 h-3" />}
            </div>
            <span className="flex-1 text-sm font-medium text-white">{textoPrincipal}</span>
            {isActive && !isCompletada && (
                <motion.div 
                    className="w-3 h-3 bg-cyan-300 rounded-full ml-3"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                />
            )}
        </motion.div>
    );
});

SerieItem.displayName = 'SerieItem';
export default SerieItem;
