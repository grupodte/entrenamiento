// src/components/Drawer.jsx
import { motion, AnimatePresence } from 'framer-motion';
import ReactDOM from 'react-dom';
import { useEffect, useCallback, useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import '../styles/drawer-animations.css';

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

        // Check if touch is in content area (mejorado)
        const target = e.target;
        const isInContentArea = target.closest('.drawer-content, [class*="overflow-y-auto"], input, textarea, button');
        
        // Si es un elemento interactivo, no interferir
        if (target.matches('input, textarea, button, [role="button"]')) {
            return;
        }
        
        // If in content area and scrolling vertically, allow it
        if (isInContentArea && absDeltaY > absDeltaX && absDeltaY > 15) {
            return; // Allow natural scroll with threshold
        }

        // Solo activar swipe horizontal si el movimiento es significativamente más horizontal
        if (absDeltaX > absDeltaY && absDeltaX > 15) {
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
        
        // Solo escuchar eventos en el drawer específicamente
        // touchstart y touchend pueden ser passive, solo touchmove necesita prevenir default
        drawerElement.addEventListener('touchstart', handleTouchStart, { passive: true });
        drawerElement.addEventListener('touchmove', handleTouchMove, { passive: false });
        drawerElement.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            drawerElement.removeEventListener('touchstart', handleTouchStart);
            drawerElement.removeEventListener('touchmove', handleTouchMove);
            drawerElement.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isOpen, handleTouchStart, handleTouchMove, handleTouchEnd]);

    // Detectar si es PWA instalada o navegador web
    const isPWAInstalled = () => {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone ||
               document.referrer.includes('android-app://');
    };

    const [isStandalone, setIsStandalone] = useState(isPWAInstalled());
    const [windowDimensions, setWindowDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    // Actualizar estado cuando cambie el modo de pantalla o las dimensiones
    useEffect(() => {
        const handleResize = () => {
            setWindowDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
            setIsStandalone(isPWAInstalled());
        };

        const handleOrientationChange = () => {
            // Esperar a que se complete el cambio de orientación
            setTimeout(() => {
                handleResize();
            }, 100);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleOrientationChange);
        
        // También escuchar cambios en display-mode
        const displayModeQuery = window.matchMedia('(display-mode: standalone)');
        const handleDisplayModeChange = (e) => {
            setIsStandalone(isPWAInstalled());
        };
        
        if (displayModeQuery.addEventListener) {
            displayModeQuery.addEventListener('change', handleDisplayModeChange);
        } else {
            // Fallback para navegadores que no soportan addEventListener en MediaQueryList
            displayModeQuery.addListener(handleDisplayModeChange);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleOrientationChange);
            
            if (displayModeQuery.removeEventListener) {
                displayModeQuery.removeEventListener('change', handleDisplayModeChange);
            } else {
                displayModeQuery.removeListener(handleDisplayModeChange);
            }
        };
    }, []);

    const drawerContent = (
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    {/* Overlay con blur gradual sin fondo oscuro */}
                    <motion.div
                        initial={{ 
                            backdropFilter: "blur(0px)",
                            WebkitBackdropFilter: "blur(0px)"
                        }}
                        animate={{ 
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)"
                        }}
                        exit={{ 
                            backdropFilter: "blur(0px)",
                            WebkitBackdropFilter: "blur(0px)"
                        }}
                        transition={{
                            duration: 0.5,
                            ease: [0.25, 0.46, 0.45, 0.94]
                        }}
                        className="fixed inset-0 will-change-[backdrop-filter] z-50"
                        onClick={handleOverlayClick}
                    />

                    {/* Drawer optimizado con swipe horizontal */}
                    <motion.div
                        ref={drawerRef}
                        drag="y"
                        whileDrag={{ cursor: 'grabbing' }}
                        onDragEnd={handleDragEnd}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{
                            top: 0,
                            bottom: 0.3
                        }}
                        dragMomentum={false}
                        initial={{
                            y: "100%",
                            scale: 0.95 // Solo escala, sin opacity para evitar flash
                        }}
                        animate={{
                            y: 0,
                            scale: 1,
                            x: swipeProgress > 0 ? `${swipeProgress * -30}%` : 0
                        }}
                        exit={{
                            y: "100%",
                            scale: 0.95,
                            transition: {
                                duration: 0.25,
                                ease: [0.4, 0, 0.2, 1]
                            }
                        }}
                        transition={{
                            // Animación de entrada suave sin opacity para evitar flash
                            y: {
                                type: 'tween',
                                duration: 0.35,
                                ease: [0.25, 0.46, 0.45, 0.94]
                            },
                            scale: {
                                type: 'tween',
                                duration: 0.3,
                                ease: [0.25, 0.46, 0.45, 0.94]
                            },
                            x: swipeProgress > 0 ? { 
                                type: 'tween', 
                                duration: 0.1,
                                ease: "easeOut"
                            } : {
                                type: 'tween',
                                duration: 0.3,
                                ease: [0.25, 0.46, 0.45, 0.94]
                            }
                        }}
                        className={`
                            ${isStandalone ? 'drawer-safe-positioning' : 'drawer-web-positioning'}
                            ${responsiveHeight}
                            w-full mx-auto
                            text-white 
                            bg-[#FFFFFF]
                            backdrop-blur-[15px]
                            bg-opacity-80
                            flex flex-col
                            transform-gpu
                            will-change-transform
                            fixed bottom-0 left-0 right-0
                        `}
                        style={{
                            paddingTop: isStandalone ? 'env(safe-area-inset-top)' : '0',
                            zIndex: 99999,
                            maxHeight: isStandalone ? '100vh' : `${Math.min(windowDimensions.height * 0.9, windowDimensions.height - 40)}px`,
                            // Para navegadores web, usar dimensiones dinámicas calculadas
                            ...((!isStandalone) && {
                                bottom: '0px',
                                maxHeight: `${Math.min(windowDimensions.height * 0.85, windowDimensions.height - 40)}px`,
                                height: 'auto',
                                // Asegurar que el drawer no se salga en pantallas pequeñas
                                minHeight: Math.min(200, windowDimensions.height * 0.3) + 'px'
                            })
                        }}
                    >
                        {/* Handle mejorado con animaciones suaves */}
                        <motion.div 
                            className="w-full flex justify-center cursor-grab active:cursor-grabbing relative"
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                            <motion.div
                                animate={{
                                    rotate: swipeProgress > 0 ? swipeProgress * 15 : 0,
                                    scale: 1 + (swipeProgress * 0.1)
                                }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 20
                                }}
                            >
                                <div className="relative h-[20px] w-full flex items-start justify-center pt-3">
                                    {/* handle */}
                                    <div
                                        className="w-[25px] h-[5px] bg-[#D9D9D9] rounded-full"
                                        aria-hidden="true"
                                    />
                                    
                                    {/* Invisible drag area for better UX */}
                                    <div 
                                        className="absolute inset-0 cursor-grab active:cursor-grabbing"
                                        style={{
                                            touchAction: 'pan-y'
                                        }}
                                    />
                                </div>
                            </motion.div>
                            
                            {/* Indicador visual de swipe horizontal con animación */}
                            <AnimatePresence>
                                {swipeProgress > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="absolute left-2 top-1/2 transform -translate-y-1/2"
                                    >
                                        <motion.div 
                                            className="h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" 
                                            animate={{
                                                width: `${8 + swipeProgress * 20}px`,
                                                opacity: 0.6 + (swipeProgress * 0.4)
                                            }}
                                            transition={{ type: 'tween', duration: 0.1 }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Contenido con scroll optimizado */}
                        <div
                            className="
                                flex-grow 
                                overscroll-contain
                                drawer-content
                                px-1
                            "
                            style={{
                                touchAction: 'pan-y', // Allow vertical panning only
                                overscrollBehavior: 'contain'
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