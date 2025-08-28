// src/components/Drawer.jsx
import { motion, AnimatePresence } from 'framer-motion';
import ReactDOM from 'react-dom';
import { useEffect, useCallback } from 'react';

const Drawer = ({ isOpen, onClose, children }) => {
    // Optimización: Prevenir scroll del body cuando está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        } else {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
        };
    }, [isOpen]);

    // Optimización: Memoizar el handler de drag
    const handleDragEnd = useCallback((e, info) => {
        const threshold = 120;
        const velocity = info.velocity.y;

        // Si arrastra hacia abajo más del threshold O tiene velocidad alta hacia abajo
        if (info.offset.y > threshold || velocity > 500) {
            onClose();
        }
    }, [onClose]);

    // Optimización: Memoizar el handler de overlay
    const handleOverlayClick = useCallback((e) => {
        e.stopPropagation();
        onClose();
    }, [onClose]);

    const drawerContent = (
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    {/* Overlay optimizado */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.2,
                            ease: "easeOut"
                        }}
                        className="fixed inset-0 bg-black/50 z-70 will-change-[opacity]"
                        onClick={handleOverlayClick}
                        style={{
                            WebkitBackdropFilter: 'blur(4px)',
                            backdropFilter: 'blur(4px)'
                        }}
                    />

                    {/* Drawer optimizado */}
                    <motion.div
                        drag="y"
                        onDragEnd={handleDragEnd}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{
                            top: 0,
                            bottom: 0.3
                        }}
                        dragMomentum={false}
                        initial={{
                            y: "100%",
                            opacity: 0
                        }}
                        animate={{
                            y: 0,
                            opacity: 1
                        }}
                        exit={{
                            y: "100%",
                            opacity: 0
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 350,
                            damping: 30,
                            mass: 0.8,
                            y: {
                                type: 'spring',
                                stiffness: 400,
                                damping: 25,
                            },
                            opacity: {
                                type: 'spring',
                                stiffness: 400,
                                damping: 25,
                            }
                        }}
                        className="
                            fixed bottom-0 left-0 right-0 
                            max-h-[85vh] 
                            bg-gray-900/98
                            text-white 
                            shadow-2xl 
                            z-70
                            rounded-t-3xl 
                            overflow-hidden
                            pb-safe
                            will-change-transform
                            transform-gpu
                            flex flex-col
                        "
                        style={{
                            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
                            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                            backdropFilter: 'blur(20px) saturate(150%)'
                        }}
                    >
                        {/* Handle mejorado */}
                        <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing">
                            <motion.div
                                className="w-10 h-1.5 bg-gray-400 rounded-full"
                                whileHover={{ scale: 1.1, backgroundColor: '#9CA3AF' }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                            />
                        </div>

                        {/* Contenido con scroll optimizado */}
                        <div
                            className="
                                px-4 pb-6 flex-grow 
                                overflow-y-auto 
                                overscroll-contain
                                scrollbar-hide
                                will-change-scroll
                            "
                            style={{
                                WebkitOverflowScrolling: 'touch',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none'
                            }}
                        >
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    // Solo renderizar el portal si está abierto o cerrándose
    

    return ReactDOM.createPortal(drawerContent, document.body);
};

export default Drawer;