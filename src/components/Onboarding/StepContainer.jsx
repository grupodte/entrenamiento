import React from 'react';
import { motion } from 'framer-motion';

const StepContainer = ({ 
    children, 
    title, 
    description, 
    currentStep, 
    onNext, 
    onPrevious, 
    canContinue = true, 
    isLastStep = false,
    isLoading = false,
    isFeatureStep = false // New prop
}) => {
    const isVideoStep = currentStep === 1;
    const slideVariants = {
        enter: (direction) => ({
            y: direction > 0 ? '50px' : '-50px',
            opacity: 0
        }),
        center: {
            y: 0,
            opacity: 1
        },
        exit: (direction) => ({
            y: direction < 0 ? '50px' : '-50px',
            opacity: 0
        })
    };

    return (
        <motion.div
            key={currentStep}
            custom={1}
            variants={isVideoStep ? {} : slideVariants}
            initial={isVideoStep ? false : "enter"}
            animate={isVideoStep ? false : "center"}
            exit={isVideoStep ? false : "exit"}
            transition={isVideoStep ? {} : {
                y: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
            }}
            className="flex-1 flex flex-col justify-center"
        >
            {/* Header: Only show for non-feature steps */}
            {!isFeatureStep && (
                <div className="mb-8">
                    <h2 className="text-[35px] leading-none text-[#000000] mb-2 ">{title}</h2>
                    {description && (
                        <p className="text-[#000000] leading-none">{description}</p>
                    )}
                </div>
            )}

            {/* Content */}
            <div className={`${isFeatureStep ? 'flex-1 flex flex-col justify-center' : 'overflow-y-auto mb-6'}`}>
                {children}
            </div>

            {/* Navigation */}
            <div className={`flex justify-between items-center pt-6 ${isFeatureStep ? 'mt-8' : ''}`}>
                <button
                    onClick={onPrevious}
                    disabled={currentStep === 1}
                    className={`rounded-[10px] w-[110px] h-[50px] text-[15px] text-[#686868] transition-all duration-200 ${ 
                        currentStep === 1
                            ? 'bg-black'
                        : 'bg-[#191919]'
                    }`}
                >
                    Volver
                </button>

                <button
                    onClick={onNext}
                    disabled={!canContinue || isLoading}
                    className={`rounded-[10px] w-[123px] h-[50px] transition-all duration-200 text-[#000000]  ${ 
                        canContinue && !isLoading
                        ? 'bg-[#FF0000]'
                        : 'bg-[#FF0000]'
                    }`}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
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
                        </div>
                    ) : (
                        <span>{isLastStep ? 'Finalizar' : 'Continuar'}</span>
                    )}
                </button>
            </div>
        </motion.div>
    );
};

export default StepContainer;
