import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, SkipForward, ChevronUp, Pause } from 'lucide-react';

// Helper to format time, can be kept inside or moved to a utils file.
const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const RestTimerDock = ({
    isVisible,
    timeLeft,
    duration,
    exerciseName,
    onSkip,
}) => {
    // Calculate progress percentage
    const progressPercentage = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;
    
    if (!isVisible) return null;

    // Renderizar usando Portal para asegurar centrado perfecto
    return createPortal(
        <div className="fixed top-20 inset-x-0 z-50 pointer-events-none">
            <motion.div 
                className="mx-auto w-60 max-w-[calc(100vw-4rem)] pointer-events-auto"
                initial={{ opacity: 0, scale: 0.9, y: -30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -30 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
                <motion.div
                    className="bg-gray-950/90 backdrop-blur-xl border border-cyan-500/20 rounded-xl shadow-lg overflow-hidden"
                    style={{
                        backdropFilter: 'blur(16px) saturate(150%)',
                        WebkitBackdropFilter: 'blur(16px) saturate(150%)',
                    }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Header ultra compacto */}
                    <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-2.5">
                            {/* Progreso circular mini */}
                            <div className="relative">
                                <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
                                    <circle
                                        cx="12" cy="12" r="10"
                                        stroke="rgba(6, 182, 212, 0.2)"
                                        strokeWidth="1.5" fill="none"
                                    />
                                    <motion.circle
                                        cx="12" cy="12" r="10"
                                        stroke="#06b6d4"
                                        strokeWidth="1.5" fill="none"
                                        strokeLinecap="round"
                                        strokeDasharray={62.83}
                                        initial={{ strokeDashoffset: 62.83 }}
                                        animate={{ strokeDashoffset: 62.83 - (62.83 * progressPercentage / 100) }}
                                        transition={{ duration: 0.3, ease: 'easeOut' }}
                                        style={{ filter: 'drop-shadow(0 0 3px rgba(6, 182, 212, 0.3))' }}
                                    />
                                </svg>
                                <Pause className="absolute inset-0 w-3 h-3 m-auto text-cyan-400" />
                            </div>
                            
                            {/* Timer principal */}
                            <motion.span 
                                key={timeLeft}
                                initial={{ scale: 1.05, opacity: 0.9 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                className="text-xl font-mono font-bold text-cyan-300 tracking-wide"
                            >
                                {formatTime(timeLeft)}
                            </motion.span>
                            
                          
                        </div>

                        {/* Botón saltar super compacto */}
                        <motion.button
                            onClick={onSkip}
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(249, 115, 22, 0.25)' }}
                            whileTap={{ scale: 0.95 }}
                            className="p-1.5 bg-orange-500/15 text-orange-400 rounded-lg border border-orange-500/25 hover:border-orange-400/40 transition-all duration-200"
                            title="Saltar descanso"
                        >
                            <SkipForward className="w-3.5 h-3.5" />
                        </motion.button>
                    </div>

                   
                    
                    {/* Siguiente ejercicio (solo si hay nombre) */}
                    {exerciseName && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="px-3 pb-2 border-t border-cyan-500/10"
                        >
                            <p className="text-[10px] text-gray-400 mt-1.5 truncate">
                                <span className="text-cyan-400/60">→</span> {exerciseName}
                            </p>
                        </motion.div>
                    )}
                    
                    {/* Efecto de glow sutil */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
                </motion.div>
            </motion.div>
        </div>,
        document.body
    );
};

// Alias para mantener compatibilidad
const UnifiedRestTimer = RestTimerDock;

export default UnifiedRestTimer;
