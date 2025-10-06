import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactDOM from 'react-dom';

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

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* El confeti se renderiza detrás del modal pero sobre el contenido */}

                    {/* Contenedor principal que cubre toda la pantalla y aplica el blur */}
                    <motion.div
                        className="fixed inset-0 bg-black/85 backdrop-blur-[10px]"
                        style={{ 
                            zIndex: 99999, // Usar z-index muy alto como el Drawer
                            height: '100dvh',
                            maxHeight: '100dvh'
                        }}
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        {/* Contenedor flex para centrar el modal */}
                        <div className="w-full h-full flex items-center justify-center p-4">
                            {/* Contenido del Modal */}
                            <motion.div
                                variants={modalVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="relative text-center p-6 justify-center item-center flex flex-col  w-full max-w-md mx-auto"
                            >
                                <h2 className="text-[27px]  text-[#FF0000] leading-none mb-8">¡Entrenamiento completado!</h2>
                                <p className="text-[#FFFFFF] text-[13px] mt-2 mb-2">¡Gran trabajo! Has finalizado todos los ejercicios.</p>

                                <div className="my-4 mx-auto grid grid-flow-col auto-cols-max gap-4">
                                    <div className="bg-[#121212] p-3 rounded-[10px] h-[96px] w-[116px] flex flex-col justify-center items-center">
                                        <p className="text-[13px] text-[#626262] leading-none">Tiempo Total</p>
                                        <p className="text-[33px] font-bold text-[#FF0000]">{formatWorkoutTime(workoutTime)}</p>
                                    </div>
                                    <div className="bg-[#121212] p-3 rounded-[10px] h-[96px] w-[116px] flex flex-col justify-center items-center">
                                        <p className="text-[13px] text-[#626262] leading-none">Series Completadas</p>
                                        <p className="text-[33px] font-bold text-[#FF0000]">{seriesCompletadas}</p>
                                    </div>
                                </div>



                                <button
                                    onClick={handleFinalizarYGuardar}
                                    className="mt-4 w-[192px] bg-[#FF0000] text-[#FFFFFF] py-3 px-6 rounded-[10px] text-[13px] flex justify-center items-center mx-auto"
                                >
                                    Finalizar y Guardar
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default EntrenamientoCompletado;