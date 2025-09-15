import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ currentStep, totalSteps }) => {
    const progress = (currentStep / totalSteps) * 100;
    
    return (
        <div className="w-full mb-8">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Paso {currentStep} de {totalSteps}</span>
                <span className="text-sm text-cyan-400 font-medium">{Math.round(progress)}%</span>
            </div>
            
            <div className="w-full  rounded-full h-2 overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>
        </div>
    );
};

export default ProgressBar;
