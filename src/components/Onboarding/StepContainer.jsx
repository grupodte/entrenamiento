import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StepContainer = ({ 
    children, 
    title, 
    description, 
    currentStep, 
    onNext, 
    onPrevious, 
    canContinue = true, 
    isLastStep = false,
    isLoading = false 
}) => {
    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0
        })
    };

    return (
        <motion.div
            key={currentStep}
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
            }}
            className="flex-1 flex flex-col"
        >
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                {description && (
                    <p className="text-gray-300 text-base">{description}</p>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto mb-6">
                {children}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                <button
                    onClick={onPrevious}
                    disabled={currentStep === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        currentStep === 1
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-600 text-white hover:bg-gray-500'
                    }`}
                >
                    Volver
                </button>

                <button
                    onClick={onNext}
                    disabled={!canContinue || isLoading}
                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                        canContinue && !isLoading
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            <span>Guardando...</span>
                        </>
                    ) : (
                        <span>{isLastStep ? 'Finalizar' : 'Continuar'}</span>
                    )}
                </button>
            </div>
        </motion.div>
    );
};

export default StepContainer;
