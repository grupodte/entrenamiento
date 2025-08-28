import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaForward } from 'react-icons/fa';

// Helper to format time, can be kept inside or moved to a utils file.
const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const UnifiedRestTimer = ({
    isVisible,
    timeLeft,
    duration,
    exerciseName,
    onSkip,
}) => {
    const circumference = 2 * Math.PI * 45; // Circle with radius 45

    // Calculate progress for the circular indicator.
    // This ensures the circle starts full and animates smoothly to empty.
    const progressPercentage = duration > 0 ? timeLeft / duration : 0;
    const strokeDashoffset = progressPercentage * circumference;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="unified-rest-timer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-lg flex flex-col items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="w-full max-w-sm text-center text-white bg-gray-800/50 rounded-3xl p-8 shadow-2xl"
                    >
                        <p className="font-bold text-lg text-cyan-300 tracking-wider">¡A DESCANSAR!</p>

                        <div className="relative my-8 w-48 h-48 mx-auto">
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                {/* Background circle */}
                                <circle cx="50" cy="50" r="45" stroke="#4A5568" strokeWidth="10" fill="none" />

                                {/* Progress circle */}
                                <motion.circle
                                    cx="50" cy="50" r="45"
                                    stroke="#4FD1C5" // Cyan color
                                    strokeWidth="10"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    // Animate the strokeDashoffset to show progress
                                    initial={{ strokeDashoffset: circumference }}
                                    animate={{ strokeDashoffset }}
                                    transition={{ duration: 1, ease: 'linear' }} // A linear transition for the countdown
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-5xl font-mono font-bold">{formatTime(timeLeft)}</span>
                            </div>
                        </div>

                        <p className="text-sm text-gray-300">Siguiente:</p>
                        <p className="font-semibold text-xl mt-1">{exerciseName || 'Siguiente ejercicio'}</p>

                        <motion.button
                            onClick={onSkip}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="mt-8 w-full flex items-center justify-center gap-3 bg-cyan-500/20 text-cyan-300 font-semibold py-3 px-5 rounded-full hover:bg-cyan-500/30 transition-colors"
                        >
                            <FaForward />
                            <span>Omitir Descanso</span>
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UnifiedRestTimer;
