import React from 'react';
import { motion } from 'framer-motion';
import { FaCalendarAlt } from 'react-icons/fa';

const DrawerLoader = () => {
    const skeletonVariants = {
        initial: { opacity: 0.6 },
        animate: { 
            opacity: [0.6, 1, 0.6],
            transition: {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <div className="bg-gray-800 text-white font-sans p-4">
            {/* Header skeleton */}
            <div className="mb-4">
                <motion.div 
                    variants={skeletonVariants}
                    initial="initial"
                    animate="animate"
                    className="h-6 bg-gray-600 rounded w-3/4 mb-2"
                />
                <motion.div 
                    variants={skeletonVariants}
                    initial="initial"
                    animate="animate"
                    className="h-4 bg-gray-700 rounded w-1/2 mb-1"
                />
                <motion.div 
                    variants={skeletonVariants}
                    initial="initial"
                    animate="animate"
                    className="h-3 bg-gray-700 rounded w-2/3"
                />
            </div>

            {/* Bloques skeleton */}
            <div className="space-y-3">
                {[1, 2, 3].map((index) => (
                    <motion.div 
                        key={index}
                        variants={skeletonVariants}
                        initial="initial"
                        animate="animate"
                        style={{ animationDelay: `${index * 0.2}s` }}
                        className="flex justify-between items-center bg-gray-700 shadow-lg rounded-xl p-4 border border-gray-600"
                    >
                        <div className="flex items-center gap-3">
                            <FaCalendarAlt className="text-gray-500 text-lg animate-pulse"/>
                            <div className="h-4 bg-gray-600 rounded w-32" />
                        </div>
                        <div className="h-8 bg-gray-600 rounded-lg w-20" />
                    </motion.div>
                ))}
            </div>

            {/* Loading text */}
            <motion.div 
                className="text-center mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <p className="text-sm text-gray-400">Cargando rutina...</p>
            </motion.div>
        </div>
    );
};

export default DrawerLoader;
