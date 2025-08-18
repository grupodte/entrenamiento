import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebarDesktop from '../components/AdminSidebarDesktop';
import AdminSidebarMobile from '../components/AdminSidebarMobile';
import { DragStateProvider } from '../context/DragStateContext';
import { VideoProvider, useVideo } from '../context/VideoContext';
import VideoPanel from '../components/VideoPanel';
import { useViewportHeight } from '../hooks/useViewportHeight';

// ✨ Animación de página mejorada
const pageVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }
};

const AdminLayoutInternal = () => {
    const { isOpen, videoUrl, hideVideo } = useVideo();
    const location = useLocation();
    useViewportHeight(); // Hook para altura dinámica en móviles

    return (
        <div
            className="relative flex text-white bg-black"
            style={{ height: 'var(--full-vh, 100vh)' }}
        >
            {/* Fondo decorativo global */}
            <div className="absolute inset-0 -z-20 overflow-hidden">
                <img
                    src="/backgrounds/admin-blur.png"
                    alt="Fondo desenfocado"
                    className="w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-black/50" />
            </div>

            {/* Layout principal */}
            <AdminSidebarDesktop />
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.main
                            key={location.pathname}
                            className="min-h-full px-4 sm:px-6 lg:px-8 py-8 pl-safe pr-safe"
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            <Outlet />
                        </motion.main>
                    </AnimatePresence>
                </div>
            </div>
            <AdminSidebarMobile />

            {/* Panel de video flotante */}
            <VideoPanel open={isOpen} onClose={hideVideo} videoUrl={videoUrl} />
        </div>
    );
};

// Proveedores de contexto envuelven el layout
const AdminLayout = () => (
    <VideoProvider>
        <DragStateProvider>
            <AdminLayoutInternal />
        </DragStateProvider>
    </VideoProvider>
);

export default AdminLayout;
