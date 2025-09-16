// src/components/Drawer.jsx
import { motion, AnimatePresence } from 'framer-motion';
import ReactDOM from 'react-dom';
import { useEffect, useCallback, useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Drawer = ({ isOpen, onClose, children, height = 'max-h-[85vh]' }) => {
    // Normalizar la altura para usar nuestras nuevas clases CSS
    const getResponsiveHeight = (heightProp) => {
        return heightProp;
    };
    
    const responsiveHeight = getResponsiveHeight(height);
    const [swipeProgress, setSwipeProgress] = useState(0);
    const startPosRef = useRef({ x: 0, y: 0 });
    const isSwipingRef = useRef(false);
    const drawerRef = useRef(null);

    // Optimización: Prevenir scroll del body cuando está abierto, pero permitir interacción en drawer
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'pan-y'; // Permitir scroll vertical
            document.body.classList.add('drawer-active');
            document.documentElement.classList.add('drawer-active');
        } else {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            document.body.classList.remove('drawer-active');
            document.documentElement.classList.remove('drawer-active');
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            document.body.classList.remove('drawer-active');
            document.documentElement.classList.remove('drawer-active');
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

    // Manejo de swipe horizontal para cerrar drawer
    const handleTouchStart = useCallback((e) => {
        if (!isOpen) return;
        
        const touch = e.touches[0];
        startPosRef.current = { x: touch.clientX, y: touch.clientY };
        isSwipingRef.current = false;
        setSwipeProgress(0);
    }, [isOpen]);

    const handleTouchMove = useCallback((e) => {
        if (!isOpen) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - startPosRef.current.x;
        const deltaY = touch.clientY - startPosRef.current.y;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // Solo activar swipe horizontal si el movimiento es más horizontal que vertical
        if (absDeltaX > absDeltaY && absDeltaX > 10) {
            isSwipingRef.current = true;
            
            // Solo permitir swipe hacia la derecha (cerrar) desde el borde izquierdo
            if (deltaX > 0 && startPosRef.current.x < 50) {
                const progress = Math.min(deltaX / 200, 1); // Max 200px para cerrar completamente
                setSwipeProgress(progress);
                e.preventDefault(); // Prevenir swipe back del browser
            }
        }
    }, [isOpen]);

    const handleTouchEnd = useCallback((e) => {
        if (!isOpen || !isSwipingRef.current) return;
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - startPosRef.current.x;
        const threshold = 100; // 100px para cerrar

        // Si swipe hacia la derecha supera threshold, cerrar drawer
        if (deltaX > threshold && startPosRef.current.x < 50) {
            onClose();
        }
        
        // Reset
        setSwipeProgress(0);
        isSwipingRef.current = false;
    }, [isOpen, onClose]);

    // Agregar listeners de touch events solo en el drawer
    useEffect(() => {
        if (!isOpen || !drawerRef.current) return;

        const drawerElement = drawerRef.current;
        const options = { passive: false };
        
        // Solo escuchar eventos en el drawer específicamente
        drawerElement.addEventListener('touchstart', handleTouchStart, options);
        drawerElement.addEventListener('touchmove', handleTouchMove, options);
        drawerElement.addEventListener('touchend', handleTouchEnd, options);

        return () => {
            drawerElement.removeEventListener('touchstart', handleTouchStart);
            drawerElement.removeEventListener('touchmove', handleTouchMove);
            drawerElement.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isOpen, handleTouchStart, handleTouchMove, handleTouchEnd]);

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
                        className="fixed inset-0 bg-black/50 will-change-[opacity]"
                        onClick={handleOverlayClick}
                        style={{
                            zIndex: 'var(--z-overlay)',
                            WebkitBackdropFilter: 'blur(4px)',
                            backdropFilter: 'blur(4px)'
                        }}
                    />

                    {/* Drawer optimizado con swipe horizontal */}
                    <motion.div
                        ref={drawerRef}
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
                            opacity: 1,
                            x: swipeProgress > 0 ? `${swipeProgress * -30}%` : 0 // Ligero desplazamiento visual
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
                            },
                            x: swipeProgress > 0 ? { type: 'tween', duration: 0 } : {
                                type: 'spring',
                                stiffness: 400,
                                damping: 25,
                            }
                        }}
                        className={`
                            drawer-safe-positioning
                            ${responsiveHeight}
                            w-full md:w-[95%] lg:w-[95%] mx-auto
                            bg-gray-900/98
                            text-white 
                            shadow-2xl 
                            rounded-t-3xl 
                            overflow-hidden
                            pb-safe
                            will-change-transform
                            transform-gpu
                            flex flex-col
                        `}
                        style={{
                            paddingTop: 'env(safe-area-inset-top)',
                            zIndex: 99999,
                            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
                            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
                            backdropFilter: 'blur(20px) saturate(150%)',
                            opacity: swipeProgress > 0 ? 1 - (swipeProgress * 0.3) : 1 // Fade out durante swipe
                        }}
                    >
                        {/* Handle mejorado con indicador de swipe */}
                        <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing relative">
                            <ChevronDown className="text-gray-400" />
                            {/* Indicador visual de swipe horizontal */}
                            {swipeProgress > 0 && (
                                <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                                    <div className="w-8 h-0.5 bg-cyan-400/60 rounded-full" 
                                         style={{ width: `${8 + swipeProgress * 20}px` }} />
                                </div>
                            )}
                        </div>

                        {/* Contenido con scroll optimizado */}
                        <div
                            className="
                                px-4 pb-6 flex-grow 
                                overflow-y-auto 
                                overscroll-contain
                                scrollbar-hide
                                will-change-scroll
                                drawer-content
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