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
            className="flex items-center p-2.5 rounded-md cursor-pointer shadow-md"
            role="button"
            tabIndex={0}
            aria-pressed={isCompletada}
        >
            <span className="flex-1 text-sm font-normal text-white">{textoPrincipal}</span>
        </motion.div>
    );
});

SerieItem.displayName = 'SerieItem';
export default SerieItem;
