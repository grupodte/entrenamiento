import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ currentStep, totalSteps }) => {
    const progress = (currentStep / totalSteps) * 100;
    
    return (
        <div className="w-[280px] mb-10 justify-center flex flex-col item-center text-center">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[14px] text-[#000000] ">Paso {currentStep} de {totalSteps}</span>
                <span className="text-[14px] text-[#000000]">{Math.round(progress)}%</span>
            </div>
            
            <div className="w-full bg-[#000000] rounded-full h-3 overflow-hidden shadow-inner">
                <motion.div
                    className="h-full bg-[#FF2222] ]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />
            </div>
        </div>
    );
};

export default ProgressBar;
