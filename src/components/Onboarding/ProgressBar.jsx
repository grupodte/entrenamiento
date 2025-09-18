import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ currentStep, totalSteps }) => {
    const progress = (currentStep / totalSteps) * 100;
    
    return (
        <div className="w-full mb-10">
            <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-white/60 font-medium">Paso {currentStep} de {totalSteps}</span>
                <span className="text-sm text-cyan-400 font-semibold">{Math.round(progress)}%</span>
            </div>
            
            <div className="w-full bg-white/[0.08] rounded-full h-3 overflow-hidden backdrop-blur-sm shadow-inner">
                <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.4)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />
            </div>
        </div>
    );
};

export default ProgressBar;
