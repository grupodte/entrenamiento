import React from 'react';
import { motion } from 'framer-motion';

const PerfilDrawerSkeleton = () => {
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
        <div className="bg-gray-800 rounded-t-2xl shadow-lg p-4 min-h-[150px]">
            {/* Header Skeleton */}
            <div className="flex items-center mb-3 space-x-3">
                <motion.div
                    variants={skeletonVariants}
                    initial="initial"
                    animate="animate"
                    className="w-12 h-12 rounded-full bg-gray-700"
                />
                <div className="flex-1">
                    <motion.div
                        variants={skeletonVariants}
                        initial="initial"
                        animate="animate"
                        className="h-4 bg-gray-700 rounded w-3/4 mb-2"
                    />
                    <motion.div
                        variants={skeletonVariants}
                        initial="initial"
                        animate="animate"
                        className="h-3 bg-gray-700 rounded w-1/2"
                    />
                </div>
                <motion.div
                    variants={skeletonVariants}
                    initial="initial"
                    animate="animate"
                    className="w-8 h-8 rounded-full bg-gray-700"
                />
                <motion.div
                    variants={skeletonVariants}
                    initial="initial"
                    animate="animate"
                    className="w-8 h-8 rounded-full bg-gray-700"
                />
            </div>

            {/* Info Rows Skeleton */}
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center">
                        <motion.div
                            variants={skeletonVariants}
                            initial="initial"
                            animate="animate"
                            className="w-4 h-4 bg-gray-700 rounded mr-2"
                        />
                        <div>
                            <motion.div
                                variants={skeletonVariants}
                                initial="initial"
                                animate="animate"
                                className="h-3 bg-gray-700 rounded w-16 mb-1"
                            />
                            <motion.div
                                variants={skeletonVariants}
                                initial="initial"
                                animate="animate"
                                className="h-4 bg-gray-700 rounded w-24"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="space-y-4">
                {/* Peso y Reps */}
                <div className="grid grid-cols-2 gap-2">
                    <motion.div
                        variants={skeletonVariants}
                        initial="initial"
                        animate="animate"
                        className="bg-gray-700 rounded-lg p-2 h-28"
                    />
                    <motion.div
                        variants={skeletonVariants}
                        initial="initial"
                        animate="animate"
                        className="bg-gray-700 rounded-lg p-2 h-28"
                    />
                </div>
                {/* Tiempo */}
                <motion.div
                    variants={skeletonVariants}
                    initial="initial"
                    animate="animate"
                    className="bg-gray-700 rounded-lg p-3 h-36"
                />
            </div>
        </div>
    );
};

export default PerfilDrawerSkeleton;
