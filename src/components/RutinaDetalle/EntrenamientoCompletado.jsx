import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Hook simple para obtener el tamaño de la ventana (necesario para el confeti)
const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        width: undefined,
        height: undefined,
    });

    useEffect(() => {
        function handleResize() {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }
        window.addEventListener('resize', handleResize);
        handleResize(); // Llama al inicio para establecer el tamaño inicial
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
};

const EntrenamientoCompletado = ({
    isOpen, // Nueva prop para controlar la visibilidad
    workoutTime,
    seriesCompletadas,
    handleFinalizarYGuardar,
    formatWorkoutTime
}) => {
    const { width, height } = useWindowSize();

    // Variante para la animación del fondo
    const backdropVariants = {
        visible: { opacity: 1 },
        hidden: { opacity: 0 },
    };

    // Variante para la animación del modal
    const modalVariants = {
        hidden: { opacity: 0, y: -50, scale: 0.9 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 120 } },
        exit: { opacity: 0, y: 50, scale: 0.9 },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* El confeti se renderiza detrás del modal pero sobre el contenido */}

                    {/* Contenedor principal que cubre toda la pantalla y aplica el blur */}
                    <motion.div
                        className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        style={{ zIndex: 'var(--z-modal)' }}
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        {/* Contenido del Modal (tu componente original adaptado) */}
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="relative text-center p-6 bg-gray-800 rounded-xl shadow-lg w-11/12 max-w-md"
                        >
                            <h2 className="text-2xl font-bold text-green-400">¡Entrenamiento completado!</h2>
                            <p className="text-gray-300 mt-2 mb-4">¡Gran trabajo! Has finalizado todos los ejercicios.</p>

                            <div className="grid grid-cols-2 gap-4 text-white my-4">
                                <div className="bg-gray-700/50 p-3 rounded-lg">
                                    <p className="text-sm text-gray-400">Tiempo Total</p>
                                    <p className="text-xl font-bold">{formatWorkoutTime(workoutTime)}</p>
                                </div>
                                <div className="bg-gray-700/50 p-3 rounded-lg">
                                    <p className="text-sm text-gray-400">Series Completadas</p>
                                    <p className="text-xl font-bold">{seriesCompletadas}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleFinalizarYGuardar}
                                className="mt-4 w-full bg-green-500 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-105 text-lg"
                            >
                                Finalizar y Guardar
                            </button>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default EntrenamientoCompletado;