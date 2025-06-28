import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { VideoProvider, useVideo } from '../context/VideoContext';
import VideoPanel from './VideoPanel';

const LayoutContent = () => {
    const { isOpen, videoUrl, hideVideo } = useVideo();

    const handleRefresh = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.location.reload();
    };

    const { scrollRef } = usePullToRefresh(handleRefresh);

    useEffect(() => {
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        return () => window.removeEventListener('resize', setViewportHeight);
    }, []);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden text-white">
            {/* Fondo */}
            <div className="absolute inset-0 -z-10">
                <img
                    src="/backgrounds/admin-blur.webp"
                    alt="Background"
                    className="w-full h-full object-cover opacity-40"
                />
            </div>
            <div className="absolute inset-0 -z-10 backdrop-blur-xl bg-white/30" />

            {/* Estructura scrollable */}
            <div
                ref={scrollRef}
                data-scroll
                className="relative z-10 flex flex-col min-h-screen overflow-y-auto px-4 sm:px-6 lg:px-8 pl-safe pr-safe overscroll-contain" // Padding lateral base + safe area lateral + overscroll
            >
                {/* Barra superior fija DENTRO del flujo scrollable y del padding general */}
                <div className="h-[25px] backdrop-blur-xl bg-black border-b border-white/10 flex items-center justify-center sticky top-0 z-20 pt-safe"> {/* Sticky y pt-safe para la barra */}
                    <img
                        src="/icons/iconodte.svg"
                        alt="Icono"
                        className="h-3 opacity-80"
                    />
                </div>

                {/* Contenido real */}
                {/* El contenedor del Outlet ahora solo necesita preocuparse por el padding para la barra fija y el pb-safe. */}
                {/* Los paddings laterales y sus safe areas son manejados por el contenedor scrollable padre. */}
                <motion.div
                    className="flex-1 pt-[25px] pb-safe"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <Outlet />
                </motion.div>
            </div>

            {/* Panel global video */}
            <VideoPanel open={isOpen} onClose={hideVideo} videoUrl={videoUrl} />
        </div>
    );




};

const AppLayout = () => (
    <VideoProvider>
        <LayoutContent />
    </VideoProvider>
);

export default AppLayout;