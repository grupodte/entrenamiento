import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWidgetGuide } from '../../context/WidgetGuideContext';

const WidgetGuideOverlay = () => {
    const { 
        isGuideActive, 
        currentStep, 
        guideSteps, 
        totalSteps,
        nextStep, 
        previousStep, 
        skipGuide 
    } = useWidgetGuide();

    const [targetRect, setTargetRect] = useState(null);
    const [balloonPosition, setBalloonPosition] = useState({ top: 0, left: 0 });

    const currentStepData = guideSteps[currentStep];

    // Actualizar posición del spotlight y balloon cuando cambia el paso
    useEffect(() => {
        if (!isGuideActive || !currentStepData) return;

        const updatePositions = () => {
            const element = document.querySelector(currentStepData.target);
            if (element) {
                const rect = element.getBoundingClientRect();
                setTargetRect({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });

                // Calcular posición del globo
                calculateBalloonPosition(rect, currentStepData.position);
            }
        };

        updatePositions();
        window.addEventListener('resize', updatePositions);
        window.addEventListener('scroll', updatePositions);

        return () => {
            window.removeEventListener('resize', updatePositions);
            window.removeEventListener('scroll', updatePositions);
        };
    }, [isGuideActive, currentStep, currentStepData]);

    const calculateBalloonPosition = (targetRect, position = 'bottom') => {
        const balloonWidth = 320;
        const balloonHeight = 180;
        const offset = 16;

        let top, left;

        switch (position) {
            case 'top':
                top = targetRect.top - balloonHeight - offset;
                left = targetRect.left + (targetRect.width / 2) - (balloonWidth / 2);
                break;
            case 'bottom':
                top = targetRect.bottom + offset;
                left = targetRect.left + (targetRect.width / 2) - (balloonWidth / 2);
                break;
            case 'left':
                top = targetRect.top + (targetRect.height / 2) - (balloonHeight / 2);
                left = targetRect.left - balloonWidth - offset;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height / 2) - (balloonHeight / 2);
                left = targetRect.right + offset;
                break;
            default:
                top = targetRect.bottom + offset;
                left = targetRect.left + (targetRect.width / 2) - (balloonWidth / 2);
        }

        // Ajustar si se sale de la pantalla
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (left < 10) left = 10;
        if (left + balloonWidth > viewportWidth - 10) left = viewportWidth - balloonWidth - 10;
        if (top < 10) top = 10;
        if (top + balloonHeight > viewportHeight - 10) top = viewportHeight - balloonHeight - 10;

        setBalloonPosition({ top, left });
    };

    if (!isGuideActive || !currentStepData || !targetRect) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] pointer-events-none"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
            >
                {/* Spotlight */}
                <div
                    className="absolute pointer-events-auto"
                    style={{
                        top: targetRect.top - 8,
                        left: targetRect.left - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                        background: 'transparent',
                        border: '3px solid #06b6d4',
                        borderRadius: '8px',
                        boxShadow: `
                            0 0 0 4px rgba(6, 182, 212, 0.3),
                            0 0 0 9999px rgba(0, 0, 0, 0.7)
                        `,
                        animation: 'pulse 2s infinite'
                    }}
                />

                {/* Globo de ayuda */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ delay: 0.2 }}
                    className="absolute pointer-events-auto bg-gray-800 text-white rounded-lg shadow-xl border border-gray-600 max-w-xs"
                    style={{
                        top: balloonPosition.top,
                        left: balloonPosition.left,
                        width: '320px'
                    }}
                >
                    <div className="p-4">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-cyan-300 text-sm">
                                {currentStepData.title}
                            </h3>
                            <div className="text-xs text-gray-400">
                                {currentStep + 1}/{totalSteps}
                            </div>
                        </div>

                        {/* Contenido */}
                        <p className="text-sm text-gray-200 mb-4 leading-relaxed">
                            {currentStepData.content}
                        </p>

                        {/* Controles */}
                        <div className="flex justify-between items-center">
                            <button
                                onClick={skipGuide}
                                className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
                            >
                                Saltar tour
                            </button>

                            <div className="flex space-x-2">
                                {currentStep > 0 && (
                                    <button
                                        onClick={previousStep}
                                        className="px-3 py-1 text-xs bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors"
                                    >
                                        Anterior
                                    </button>
                                )}
                                
                                <button
                                    onClick={nextStep}
                                    className="px-3 py-1 text-xs bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
                                >
                                    {currentStep === totalSteps - 1 ? 'Finalizar' : 'Siguiente'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Flecha indicadora */}
                    <div
                        className="absolute w-0 h-0 border-l-8 border-r-8 border-transparent"
                        style={{
                            ...getArrowStyle(currentStepData.position, targetRect, balloonPosition)
                        }}
                    />
                </motion.div>

                {/* Progress dots */}
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-auto">
                    <div className="flex space-x-2 bg-gray-800/90 px-3 py-2 rounded-full">
                        {guideSteps.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                    index === currentStep 
                                        ? 'bg-cyan-400' 
                                        : index < currentStep 
                                        ? 'bg-cyan-600' 
                                        : 'bg-gray-600'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

// Función para calcular la posición de la flecha
const getArrowStyle = (position, targetRect, balloonPosition) => {
    const arrowSize = 8;
    
    switch (position) {
        case 'top':
            return {
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                borderTopColor: '#1f2937'
            };
        case 'bottom':
            return {
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                borderBottomColor: '#1f2937'
            };
        case 'left':
            return {
                right: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                borderRightColor: '#1f2937'
            };
        case 'right':
            return {
                left: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                borderLeftColor: '#1f2937'
            };
        default:
            return {
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                borderBottomColor: '#1f2937'
            };
    }
};

export default WidgetGuideOverlay;
