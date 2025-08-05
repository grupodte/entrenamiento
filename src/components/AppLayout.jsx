import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNavBar from '../components/BottomNavBar';
import PerfilDrawer from '../pages/Alumno/PerfilDrawer';
import EditarPerfilDrawer from '../pages/Alumno/EditarPerfil';

const pageVariants = {
    initial: { opacity: 0, x: 50 }, // Más desplazamiento para una entrada más notoria
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } }, // Duración ligeramente mayor, ease más rápido al final
    exit: { opacity: 0, x: -50, transition: { duration: 0.35, ease: 'easeOut' } } // Más desplazamiento para una salida más notoria
};

const AlumnoLayout = () => {
    const location = useLocation();
    const [isPerfilDrawerOpen, setIsPerfilDrawerOpen] = useState(false);
    const [isEditPerfilDrawerOpen, setIsEditPerfilDrawerOpen] = useState(false);

    const handleOpenPerfilDrawer = () => {
        setIsPerfilDrawerOpen(true);
    };

    const handleClosePerfilDrawer = () => {
        setIsPerfilDrawerOpen(false);
    };

    const handleOpenEditPerfilDrawer = () => {
        setIsPerfilDrawerOpen(false); // Cierra el drawer de perfil
        setIsEditPerfilDrawerOpen(true);
    };

    const handleCloseEditPerfilDrawer = () => {
        setIsEditPerfilDrawerOpen(false);
    };

    const handleBackToProfileDrawer = () => {
        setIsEditPerfilDrawerOpen(false);
        setIsPerfilDrawerOpen(true);
    };

    const handleProfileUpdate = () => {
        handleCloseEditPerfilDrawer();
        // Opcional: podrías querer reabrir el drawer de perfil para ver los cambios
        // handleOpenPerfilDrawer();
    };

    return (
        <div
            className="text-white font-sans flex flex-col overflow-hidden"
            style={{
                backgroundImage: `url('/assets/FOTO_FONDO.webp')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                height: '100dvh',
            }}
        >
            <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
            <AnimatePresence mode="wait" initial={false}>
                <motion.main
                    key={location.pathname}
                    className="relative z-10 flex-1 overflow-y-auto pt-safe px-4 sm:px-6 lg:px-8 overscroll-y-contain scrollbar-hide"
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                >
                    <Outlet />
                </motion.main>
            </AnimatePresence>
            <div className="relative z-20">
                <BottomNavBar onOpenPerfil={handleOpenPerfilDrawer} />
            </div>
            <PerfilDrawer isOpen={isPerfilDrawerOpen} onClose={handleClosePerfilDrawer} onEdit={handleOpenEditPerfilDrawer} />
            <EditarPerfilDrawer
                isOpen={isEditPerfilDrawerOpen}
                onClose={handleCloseEditPerfilDrawer}
                onBack={handleBackToProfileDrawer}
                onProfileUpdate={handleProfileUpdate}
            />
        </div>
    );
};

export default AlumnoLayout;
